// Seed script — fetches all discovered tweets and builds initial cache
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const CATEGORY_MAP = {
  WhiteHouse:'politics', POTUS:'politics', realDonaldTrump:'politics', JoeBiden:'politics',
  VP:'politics', AOC:'politics', BernieSanders:'politics', PressSec:'politics',
  Reuters:'world_news', AP:'world_news', BBCBreaking:'world_news', CNN:'world_news',
  BNONews:'world_news', nytimes:'world_news',
  McDonalds:'food', Wendys:'food', tacobell:'food', ChipotleTweets:'food',
  NBA:'sports', NFL:'sports', espn:'sports', SportsCenter:'sports', UFC:'sports', BleacherReport:'sports',
  OpenAI:'ai_tech', SamAltman:'ai_tech', elonmusk:'ai_tech', Google:'ai_tech', Apple:'ai_tech', Microsoft:'ai_tech',
  WatcherGuru:'crypto', unusual_whales:'crypto', whale_alert:'crypto',
  NASA:'science', SpaceX:'science', WHO:'science', CDCgov:'science',
  PopBase:'culture', PopCrave:'culture', MrBeast:'culture', InternetH0F:'culture',
  CollinRugg:'culture', MarioNawfal:'culture',
};

const RAW = `WhiteHouse 2029220802944455090 politics
WhiteHouse 2029277356213584273 politics
WhiteHouse 2029287456479043748 politics
POTUS 2028962366826631584 politics
POTUS 2028964096981209401 politics
POTUS 2029198115660591215 politics
realDonaldTrump 1993469230528790869 politics
realDonaldTrump 1993801758326616561 politics
realDonaldTrump 1994272683387687053 politics
realDonaldTrump 1994438342403141889 politics
AOC 2024298250203750567 politics
AOC 2024347429106053530 politics
AOC 2024462348191514914 politics
BernieSanders 2025641013885223134 politics
BernieSanders 2025693492555534838 politics
BernieSanders 2025737544797929868 politics
BernieSanders 2025933734864703834 politics
VP 2027437560201351205 politics
VP 2027498134050320887 politics
VP 2027500013153030225 politics
PressSec 2029266462355964384 politics
PressSec 2029402698534031688 politics
PressSec 2029543711407837528 politics
PressSec 2029548070128738314 politics
AP 2029168579598286960 world_news
AP 2029189702935286250 world_news
AP 2029197395351818727 world_news
AP 2029237805474287877 world_news
BBCBreaking 2027927431709864092 world_news
BBCBreaking 2028032541660209613 world_news
BBCBreaking 2028222738876322098 world_news
BBCBreaking 2028236907818184880 world_news
CNN 2029338783724757233 world_news
CNN 2029344924894703851 world_news
CNN 2029362513423286684 world_news
CNN 2029369053567922473 world_news
McDonalds 2019510226441978326 food
McDonalds 2019631665174466576 food
McDonalds 2019858641021550752 food
Wendys 1993735456609972272 food
Wendys 1996272892787778047 food
Wendys 2001787068914225487 food
tacobell 2007135443448672275 food
tacobell 2010803989936546145 food
tacobell 2011113552531304957 food
ChipotleTweets 2014398357427585232 food
ChipotleTweets 2014773371641483268 food
ChipotleTweets 2016685032338018627 food
NBA 2029403157160210572 sports
NBA 2029410868123816014 sports
NBA 2029415673730871418 sports
NFL 2029239733834932263 sports
NFL 2029240689251291641 sports
NFL 2029241320183611604 sports
espn 2029299342121529662 sports
espn 2029309443381383573 sports
espn 2029312221960888673 sports
espn 2029328675410260154 sports
UFC 2029299869186433385 sports
UFC 2029301355102323118 sports
UFC 2029304317073867147 sports
UFC 2029316203014177086 sports
BleacherReport 2029267029358731483 sports
BleacherReport 2029293139488321779 sports
OpenAI 2022390104237707667 ai_tech
OpenAI 2022517085193277874 ai_tech
OpenAI 2023150230905159801 ai_tech
elonmusk 1479236333516165121 ai_tech
elonmusk 1503287788652871680 ai_tech
Google 2027051657163391104 ai_tech
Google 2027052205300470005 ai_tech
Google 2027094912357761319 ai_tech
Apple 2029256730127761640 ai_tech
Microsoft 2000929311424176564 ai_tech
Microsoft 2000976314715484341 ai_tech`;

async function enrichWithFxTwitter(username, tweetId, category) {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${username}/status/${tweetId}`, {
      headers: { 'User-Agent': 'ViralTweetDashboard/1.0' },
      timeout: 10000,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.tweet) return null;
    const t = data.tweet;
    return {
      id: t.id,
      text: t.text || '',
      author: t.author?.name || username,
      username: t.author?.screen_name || username,
      avatar: t.author?.avatar_url || '',
      verified: t.author?.verified || false,
      views: t.views || 0,
      likes: t.likes || 0,
      retweets: t.retweets || 0,
      replies: t.replies || 0,
      quotes: t.quotes || 0,
      created: t.created_at,
      timestamp: t.created_timestamp ? t.created_timestamp * 1000 : Date.now(),
      url: t.url || `https://x.com/${username}/status/${tweetId}`,
      media: t.media?.photos?.[0]?.url || t.media?.videos?.[0]?.thumbnail_url || null,
      engagement: (t.views || 0) + (t.likes || 0) * 10 + (t.retweets || 0) * 20 + (t.replies || 0) * 5,
      category: category,
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  const lines = RAW.trim().split('\n').map(l => {
    const [username, tweetId, category] = l.trim().split(' ');
    return { username, tweetId, category };
  }).filter(l => l.tweetId && l.tweetId.length > 5);

  console.log(`Enriching ${lines.length} tweets...\n`);

  const allTweets = [];
  const batchSize = 8;

  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(({ username, tweetId, category }) => enrichWithFxTwitter(username, tweetId, category))
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        const t = r.value;
        console.log(`  ✓ @${t.username} — ${(t.views||0).toLocaleString()} views [${t.category}]`);
        allTweets.push(t);
      }
    }

    if (i + batchSize < lines.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Also add the WhiteHouse tweet the user wanted
  const wh = await enrichWithFxTwitter('WhiteHouse', '2029307088808055083', 'politics');
  if (wh) { allTweets.push(wh); console.log(`  ✓ @WhiteHouse — ${(wh.views||0).toLocaleString()} views [politics]`); }

  // Filter to past 14 days, dedupe, sort
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  let filtered = allTweets.filter(t => t.timestamp > twoWeeksAgo);
  const seen = new Set();
  filtered = filtered.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  filtered.sort((a, b) => b.engagement - a.engagement);

  console.log(`\n${filtered.length} tweets enriched and cached.`);

  // Category breakdown
  const cats = {};
  filtered.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
  console.log('Categories:', cats);

  // Save cache
  const cache = { data: filtered, lastFetch: Date.now() };
  fs.writeFileSync(path.join(__dirname, 'tweet-cache.json'), JSON.stringify(cache));
  console.log('Cache saved to tweet-cache.json');
}

main().catch(console.error);
