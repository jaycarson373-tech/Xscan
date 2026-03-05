const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3420;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── Persistent cache — survives restarts ──
const CACHE_FILE = path.join(__dirname, 'tweet-cache.json');
let tweetCache = { data: [], lastFetch: 0 };
const CACHE_TTL = 30 * 60 * 1000;

// Load cache from disk
try {
  if (fs.existsSync(CACHE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (saved.data?.length > 0 && Date.now() - saved.lastFetch < CACHE_TTL) {
      tweetCache = saved;
      console.log(`[CACHE] Loaded ${saved.data.length} tweets from disk cache`);
    }
  }
} catch (e) {}

function saveCache() {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(tweetCache)); } catch (e) {}
}

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];
function randUA() { return UA_LIST[Math.floor(Math.random() * UA_LIST.length)]; }

// ══ CATEGORY MAP — auto-categorize by username ══
const CATEGORY_MAP = {
  // Politics
  WhiteHouse:'politics', POTUS:'politics', realDonaldTrump:'politics', JoeBiden:'politics',
  VP:'politics', AOC:'politics', SpeakerJohnson:'politics', GovRonDeSantis:'politics',
  RFKJr:'politics', VivekGRamaswamy:'politics', BernieSanders:'politics', SenTedCruz:'politics',
  RepMTG:'politics', SenSchumer:'politics', LindseyGrahamSC:'politics', RandPaul:'politics',
  TulsiGabbard:'politics', PressSec:'politics', SecDef:'politics', StateDept:'politics',
  EndWokeness:'politics', libsoftiktok:'politics', CollinRugg:'politics', catturd2:'politics',
  dom_lucre:'politics', LeadingReport:'politics', stillgray:'politics',

  // World News
  Reuters:'world_news', AP:'world_news', CNN:'world_news', BBCBreaking:'world_news',
  FoxNews:'world_news', nytimes:'world_news', WSJ:'world_news', washingtonpost:'world_news',
  BNONews:'world_news', NBCNews:'world_news', CBSNews:'world_news', MSNBC:'world_news',
  ABC:'world_news', Bloomberg:'world_news', CNBC:'world_news', nypost:'world_news',
  DailyMail:'world_news', Axios:'world_news', politico:'world_news', thehill:'world_news',
  TheEconomist:'world_news', business:'world_news', TMZ:'world_news',
  MarioNawfal:'world_news', Figen_:'world_news',

  // Food
  McDonalds:'food', Wendys:'food', tacobell:'food', ChipotleTweets:'food',
  Arbys:'food', Duolingo:'food',

  // Sports
  NBA:'sports', NFL:'sports', espn:'sports', SportsCenter:'sports', BleacherReport:'sports',
  FabrizioRomano:'sports', ShamsCharania:'sports', AdamSchefter:'sports',
  PatMcAfeeShow:'sports', UFC:'sports', PremierLeague:'sports', ChampionsLeague:'sports',
  Cristiano:'sports', KingJames:'sports',

  // AI & Tech
  elonmusk:'ai_tech', SamAltman:'ai_tech', OpenAI:'ai_tech', Google:'ai_tech',
  Apple:'ai_tech', Microsoft:'ai_tech', timcook:'ai_tech', BillGates:'ai_tech',
  JeffBezos:'ai_tech', naval:'ai_tech', pmarca:'ai_tech', ylecun:'ai_tech',
  Xbox:'ai_tech', PlayStation:'ai_tech', NintendoAmerica:'ai_tech', Netflix:'ai_tech',
  Spotify:'ai_tech',

  // Crypto & Finance
  WatcherGuru:'crypto', unusual_whales:'crypto', whale_alert:'crypto',
  DeItaone:'crypto', WallStreetSilv:'crypto', WallStreetMemes:'crypto',
  DrEliDavid:'crypto',

  // Science & Health
  NASA:'science', SpaceX:'science', WHO:'science', CDCgov:'science',

  // Culture & Entertainment
  PopBase:'culture', PopCrave:'culture', DiscussingFilm:'culture', InternetH0F:'culture',
  NoContextBrits:'culture', NoContextHumans:'culture', historyinmemes:'culture',
  MrBeast:'culture', KimKardashian:'culture', Drake:'culture', taylorswift13:'culture',
  KylieJenner:'culture', TheRock:'culture', BarackObama:'culture', selenagomez:'culture',
  justinbieber:'culture', Eminem:'culture', katyperry:'culture', ladygaga:'culture',
  BrunoMars:'culture', rihanna:'culture', LilNasX:'culture',
  LoganPaul:'culture', jakepaul:'culture', KSI:'culture', markrober:'culture',
  tomholland1996:'culture', Zendaya:'culture',
};

function getCategory(username) {
  return CATEGORY_MAP[username] || 'other';
}

// ══ ENRICHMENT — FxTwitter (free, full data + views) ══
async function enrichWithFxTwitter(username, tweetId) {
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
      category: getCategory(t.author?.screen_name || username),
    };
  } catch (e) {
    return null;
  }
}

// ══ DISCOVERY 1 — Twitter syndication timeline ══
async function getTweetIdsFromSyndication(username) {
  try {
    const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`;
    const res = await fetch(url, { headers: { 'User-Agent': randUA() }, timeout: 12000 });
    if (!res.ok) return [];
    const html = await res.text();
    const matches = html.match(/status\/(\d+)/g) || [];
    const ids = [...new Set(matches.map(m => m.replace('status/', '')))];
    return ids.slice(0, 6);
  } catch (e) {
    return [];
  }
}

// ══ ACCOUNTS — prioritized by viral frequency ══
const SCAN_ACCOUNTS = [
  // Tier 1 — biggest viral accounts (always scan these)
  'WhiteHouse', 'POTUS', 'realDonaldTrump', 'elonmusk',
  'McDonalds', 'PopBase', 'PopCrave', 'MrBeast',
  'NBA', 'NFL', 'Reuters', 'BBCBreaking', 'CNN',
  'InternetH0F', 'CollinRugg', 'MarioNawfal',

  // Tier 2 — high viral
  'JoeBiden', 'VP', 'AOC', 'BernieSanders', 'RepMTG',
  'SenTedCruz', 'GovRonDeSantis', 'RFKJr', 'VivekGRamaswamy',
  'TulsiGabbard', 'RandPaul', 'SpeakerJohnson', 'PressSec',
  'BillGates', 'SamAltman', 'JeffBezos',
  'FoxNews', 'nytimes', 'washingtonpost', 'AP', 'WSJ',
  'BNONews', 'nypost', 'DailyMail', 'TMZ', 'Axios',
  'DiscussingFilm', 'NoContextBrits', 'historyinmemes',
  'EndWokeness', 'libsoftiktok', 'LeadingReport',
  'dom_lucre', 'catturd2', 'DrEliDavid', 'WallStreetSilv',
  'Figen_', 'stillgray', 'WatcherGuru',

  // Tier 3 — celebrities / sports / brands
  'KimKardashian', 'Cristiano', 'KingJames', 'Drake',
  'taylorswift13', 'KylieJenner', 'TheRock', 'BarackObama',
  'selenagomez', 'justinbieber', 'Eminem',
  'espn', 'SportsCenter', 'BleacherReport', 'FabrizioRomano',
  'ShamsCharania', 'AdamSchefter', 'PatMcAfeeShow', 'UFC',
  'Wendys', 'tacobell', 'ChipotleTweets', 'Duolingo',
  'Netflix', 'Xbox', 'PlayStation',
  'NASA', 'SpaceX', 'Google', 'Apple', 'OpenAI',
  'unusual_whales', 'DeItaone',

  // Tier 4 — more news/politics/culture
  'NBCNews', 'CBSNews', 'MSNBC', 'ABC', 'Bloomberg', 'CNBC',
  'politico', 'thehill', 'TheEconomist', 'business',
  'SecDef', 'StateDept', 'DeptofDefense', 'CIA', 'FBI',
  'LindseyGrahamSC', 'SenSchumer',
  'LoganPaul', 'jakepaul', 'KSI', 'markrober', 'Ninja',
  'rihanna', 'katyperry', 'ladygaga', 'BrunoMars',
  'tomholland1996', 'Zendaya',
  'PremierLeague', 'ChampionsLeague',
  'NintendoAmerica', 'Spotify',
  'Microsoft', 'timcook',
  'whale_alert', 'WallStreetMemes',
];

// ══ MAIN SCAN — batched with smart rate limit handling ══
async function scanViralTweets() {
  if (Date.now() - tweetCache.lastFetch < CACHE_TTL && tweetCache.data.length > 0) {
    return tweetCache.data;
  }

  console.log(`\n[SCAN] Starting scan of ${SCAN_ACCOUNTS.length} accounts...`);
  const startTime = Date.now();
  let allRawTweets = [];
  let successCount = 0;
  let failCount = 0;

  // Phase 1: Discovery via syndication (batches of 2, generous delays)
  const batchSize = 2;
  for (let i = 0; i < SCAN_ACCOUNTS.length; i += batchSize) {
    const batch = SCAN_ACCOUNTS.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (username) => {
        const ids = await getTweetIdsFromSyndication(username);
        return { username, ids };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.ids.length > 0) {
        const { username, ids } = result.value;
        successCount++;
        console.log(`  [OK] ${username}: ${ids.length} tweets`);
        for (const id of ids) {
          allRawTweets.push({ username, tweetId: id });
        }
      } else {
        failCount++;
      }
    }

    // If we're getting heavily rate limited, slow way down
    let delay;
    const failRate = failCount / (successCount + failCount || 1);
    if (failRate > 0.8) delay = 3000;      // very throttled
    else if (failRate > 0.5) delay = 2000;  // moderate
    else delay = 1200;                       // healthy

    if (i + batchSize < SCAN_ACCOUNTS.length) {
      await new Promise(r => setTimeout(r, delay));
    }

    // If we already have a good amount, we can stop early
    if (allRawTweets.length >= 150 && failRate > 0.7) {
      console.log(`  [SYN] Stopping early — ${allRawTweets.length} IDs collected, rate limit hit`);
      break;
    }
  }

  console.log(`[SYN] ${successCount} accounts scanned, ${allRawTweets.length} tweet IDs found (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);

  // Phase 2: Enrich with FxTwitter (fast, rarely rate limited)
  console.log(`[FX] Enriching with FxTwitter...`);
  const enriched = [];
  const enrichBatch = 8;

  for (let i = 0; i < allRawTweets.length; i += enrichBatch) {
    const batch = allRawTweets.slice(i, i + enrichBatch);
    const results = await Promise.allSettled(
      batch.map(({ username, tweetId }) => enrichWithFxTwitter(username, tweetId))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        enriched.push(result.value);
      }
    }

    if (i + enrichBatch < allRawTweets.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`[FX] Enriched ${enriched.length} tweets`);

  // Phase 3: Filter, dedupe, sort
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let filtered = enriched.filter(t => t.timestamp > weekAgo);

  const seen = new Set();
  filtered = filtered.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  filtered.sort((a, b) => b.engagement - a.engagement);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[DONE] ${filtered.length} viral tweets from this week in ${elapsed}s\n`);

  // Merge with existing cache (keep old tweets if new scan was small)
  if (filtered.length < 10 && tweetCache.data.length > 10) {
    console.log(`[MERGE] New scan small (${filtered.length}), merging with cached (${tweetCache.data.length})`);
    const mergedMap = new Map();
    tweetCache.data.forEach(t => mergedMap.set(t.id, t));
    filtered.forEach(t => mergedMap.set(t.id, t)); // new data overwrites old
    filtered = [...mergedMap.values()].sort((a, b) => b.engagement - a.engagement);
  }

  tweetCache = { data: filtered, lastFetch: Date.now() };
  saveCache();
  return filtered;
}

// ══ ROUTES ══

app.get('/api/tweets', async (req, res) => {
  try {
    let tweets = await scanViralTweets();
    const sort = req.query.sort || 'engagement';
    const limit = parseInt(req.query.limit) || 100;

    let sorted = [...tweets];
    if (sort === 'views') sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sort === 'likes') sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    else if (sort === 'retweets') sorted.sort((a, b) => (b.retweets || 0) - (a.retweets || 0));

    res.json({
      success: true,
      count: sorted.length,
      cached: Date.now() - tweetCache.lastFetch > 5000,
      tweets: sorted.slice(0, limit),
    });
  } catch (e) {
    console.error('[ERROR]', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Lookup single tweet URL
app.post('/api/lookup', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });

    const match = url.match(/(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/);
    if (!match) return res.status(400).json({ error: 'Invalid tweet URL' });

    const [, username, tweetId] = match;
    const tweet = await enrichWithFxTwitter(username, tweetId);
    if (!tweet) return res.status(404).json({ error: 'Could not fetch tweet' });

    tweetCache.data = [tweet, ...tweetCache.data.filter(t => t.id !== tweet.id)];
    tweetCache.data.sort((a, b) => b.engagement - a.engagement);
    saveCache();

    res.json({ success: true, tweet });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk lookup multiple tweet URLs
app.post('/api/bulk-lookup', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) return res.status(400).json({ error: 'urls array required' });

    const results = await Promise.allSettled(
      urls.slice(0, 20).map(async (url) => {
        const match = url.match(/(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/);
        if (!match) return null;
        return enrichWithFxTwitter(match[1], match[2]);
      })
    );

    const tweets = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);

    // Add to cache
    tweets.forEach(t => {
      tweetCache.data = tweetCache.data.filter(c => c.id !== t.id);
      tweetCache.data.push(t);
    });
    tweetCache.data.sort((a, b) => b.engagement - a.engagement);
    saveCache();

    res.json({ success: true, count: tweets.length, tweets });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Force refresh
app.post('/api/refresh', async (req, res) => {
  tweetCache = { data: [], lastFetch: 0 };
  try { fs.unlinkSync(CACHE_FILE); } catch (e) {}
  const tweets = await scanViralTweets();
  res.json({ success: true, count: tweets.length });
});

app.listen(PORT, () => {
  console.log(`\n  ⚡ Viral Tweets Dashboard`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → ${SCAN_ACCOUNTS.length} accounts in rotation\n`);

  // Pre-scan on boot (only if no cached data)
  if (tweetCache.data.length === 0) {
    console.log('[STARTUP] No cache — scanning now...');
    scanViralTweets().then(tweets => {
      console.log(`[STARTUP] Ready with ${tweets.length} tweets.\n`);
    }).catch(e => {
      console.log(`[STARTUP] Scan error: ${e.message}`);
    });
  } else {
    console.log(`[STARTUP] Loaded ${tweetCache.data.length} tweets from cache. Ready.\n`);
  }
});
