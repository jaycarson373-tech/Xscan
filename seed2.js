const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Category map
const CAT = {
  // Culture/Entertainment
  KimKardashian:'culture', Drake:'culture', selenagomez:'culture', Cristiano:'sports',
  KingJames:'sports', TheRock:'culture', Eminem:'culture', taylorswift13:'culture',
  justinbieber:'culture', katyperry:'culture', ladygaga:'culture', rihanna:'culture',
  Oprah:'culture', LilNasX:'culture', MrBeast:'culture', LoganPaul:'culture',
  jakepaul:'culture', KSI:'culture', markrober:'culture', Ninja:'culture',
  // Viral aggregators — reclassify properly
  PopBase:'culture', PopCrave:'culture', InternetH0F:'culture',
  CollinRugg:'politics', MarioNawfal:'world_news', dom_lucre:'politics',
  EndWokeness:'politics', libsoftiktok:'politics', catturd2:'politics',
  stillgray:'politics', Figen_:'world_news', LeadingReport:'politics',
  historyinmemes:'culture', NoContextBrits:'culture', DrEliDavid:'ai_tech',
  // Politics
  SenTedCruz:'politics', GovRonDeSantis:'politics', RFKJr:'politics',
  VivekGRamaswamy:'politics', TulsiGabbard:'politics', LindseyGrahamSC:'politics',
  RepMTG:'politics', SenSchumer:'politics', SecDef:'politics',
  WhiteHouse:'politics', POTUS:'politics', realDonaldTrump:'politics',
  // Food
  McDonalds:'food', Wendys:'food', tacobell:'food', ChipotleTweets:'food',
  Duolingo:'culture', Starbucks:'food', burgerking:'food',
  // Sports
  FabrizioRomano:'sports', ShamsCharania:'sports', AdamSchefter:'sports',
  PatMcAfeeShow:'sports', NBA:'sports', NFL:'sports', espn:'sports', UFC:'sports',
  // Tech
  SamAltman:'ai_tech', OpenAI:'ai_tech', Google:'ai_tech', Apple:'ai_tech',
  Microsoft:'ai_tech', Xbox:'ai_tech', PlayStation:'ai_tech', Netflix:'culture',
  // Crypto
  WatcherGuru:'crypto', unusual_whales:'crypto', whale_alert:'crypto',
  WallStreetSilv:'crypto', DeItaone:'crypto',
  // Science
  NASA:'science', SpaceX:'science',
  // News
  BBCBreaking:'world_news', CNN:'world_news', Reuters:'world_news', AP:'world_news',
};

async function enrich(username, tweetId) {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${username}/status/${tweetId}`, {
      headers: { 'User-Agent': 'ViralDash/1.0' }, timeout: 10000,
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.tweet) return null;
    const t = d.tweet;
    const actualUser = t.author?.screen_name || username;
    return {
      id: t.id, text: t.text||'',
      author: t.author?.name||username, username: actualUser,
      avatar: t.author?.avatar_url||'', verified: t.author?.verified||false,
      views: t.views||0, likes: t.likes||0, retweets: t.retweets||0,
      replies: t.replies||0, quotes: t.quotes||0,
      created: t.created_at,
      timestamp: t.created_timestamp ? t.created_timestamp*1000 : Date.now(),
      url: t.url||`https://x.com/${username}/status/${tweetId}`,
      media: t.media?.photos?.[0]?.url || t.media?.videos?.[0]?.thumbnail_url || null,
      engagement: (t.views||0) + (t.likes||0)*10 + (t.retweets||0)*20 + (t.replies||0)*5,
      category: CAT[actualUser] || CAT[username] || 'other',
    };
  } catch(e) { return null; }
}

async function main() {
  // Read scraped IDs
  const raw = fs.readFileSync(path.join(__dirname,'new_ids.txt'),'utf8').trim().split('\n');
  const pairs = raw.map(l => { const [u,id] = l.trim().split(' '); return {u,id}; }).filter(p => p.id?.length > 5);

  console.log(`Enriching ${pairs.length} tweets via FxTwitter...\n`);

  const results = [];
  const batch = 10;
  for (let i = 0; i < pairs.length; i += batch) {
    const b = pairs.slice(i, i+batch);
    const r = await Promise.allSettled(b.map(p => enrich(p.u, p.id)));
    for (const x of r) {
      if (x.status === 'fulfilled' && x.value) {
        const t = x.value;
        if (t.views > 0 || t.likes > 100) { // only keep tweets with real engagement
          results.push(t);
          console.log(`  ✓ @${t.username.padEnd(20)} ${String(t.views.toLocaleString()).padStart(15)} views  [${t.category}]  ${t.text?.substring(0,50)}`);
        }
      }
    }
    if (i+batch < pairs.length) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\nEnriched ${results.length} new tweets.`);

  // Load existing cache and merge
  let existing = [];
  try {
    const cache = JSON.parse(fs.readFileSync(path.join(__dirname,'tweet-cache.json'),'utf8'));
    existing = cache.data || [];
    console.log(`Existing cache: ${existing.length} tweets`);
  } catch(e) {}

  // Merge — new overwrites old for same ID
  const map = new Map();
  existing.forEach(t => map.set(t.id, t));
  results.forEach(t => map.set(t.id, t));

  let merged = [...map.values()];
  // Keep last 14 days
  const cutoff = Date.now() - 14*24*60*60*1000;
  merged = merged.filter(t => t.timestamp > cutoff);
  merged.sort((a,b) => b.engagement - a.engagement);

  // Category breakdown
  const cats = {};
  merged.forEach(t => { cats[t.category] = (cats[t.category]||0)+1; });
  console.log(`\nFinal: ${merged.length} tweets`);
  console.log('Categories:', JSON.stringify(cats));

  fs.writeFileSync(path.join(__dirname,'tweet-cache.json'), JSON.stringify({ data: merged, lastFetch: Date.now() }));
  console.log('Cache saved!');
}

main().catch(console.error);
