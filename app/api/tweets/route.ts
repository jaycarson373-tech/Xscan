import { NextResponse } from "next/server"
import type { Tweet } from "@/lib/types"

// ── Category map ──
const CATEGORY_MAP: Record<string, string> = {
  WhiteHouse: "politics", POTUS: "politics", realDonaldTrump: "politics", JoeBiden: "politics",
  VP: "politics", AOC: "politics", SpeakerJohnson: "politics", GovRonDeSantis: "politics",
  RFKJr: "politics", VivekGRamaswamy: "politics", BernieSanders: "politics", SenTedCruz: "politics",
  RepMTG: "politics", SenSchumer: "politics", LindseyGrahamSC: "politics", RandPaul: "politics",
  TulsiGabbard: "politics", PressSec: "politics", SecDef: "politics", StateDept: "politics",
  EndWokeness: "politics", libsoftiktok: "politics", CollinRugg: "politics", catturd2: "politics",
  dom_lucre: "politics", LeadingReport: "politics", stillgray: "politics",

  Reuters: "world_news", AP: "world_news", CNN: "world_news", BBCBreaking: "world_news",
  FoxNews: "world_news", nytimes: "world_news", WSJ: "world_news", washingtonpost: "world_news",
  BNONews: "world_news", NBCNews: "world_news", CBSNews: "world_news", MSNBC: "world_news",
  ABC: "world_news", Bloomberg: "world_news", CNBC: "world_news", nypost: "world_news",
  DailyMail: "world_news", Axios: "world_news", politico: "world_news", thehill: "world_news",
  TheEconomist: "world_news", business: "world_news", TMZ: "world_news",
  MarioNawfal: "world_news", Figen_: "world_news",

  McDonalds: "food", Wendys: "food", tacobell: "food", ChipotleTweets: "food",
  Arbys: "food", Duolingo: "food",

  NBA: "sports", NFL: "sports", espn: "sports", SportsCenter: "sports", BleacherReport: "sports",
  FabrizioRomano: "sports", ShamsCharania: "sports", AdamSchefter: "sports",
  PatMcAfeeShow: "sports", UFC: "sports", PremierLeague: "sports", ChampionsLeague: "sports",
  Cristiano: "sports", KingJames: "sports",

  elonmusk: "ai_tech", SamAltman: "ai_tech", OpenAI: "ai_tech", Google: "ai_tech",
  Apple: "ai_tech", Microsoft: "ai_tech", timcook: "ai_tech", BillGates: "ai_tech",
  JeffBezos: "ai_tech", naval: "ai_tech", pmarca: "ai_tech", ylecun: "ai_tech",
  Xbox: "ai_tech", PlayStation: "ai_tech", NintendoAmerica: "ai_tech", Netflix: "ai_tech",
  Spotify: "ai_tech",

  WatcherGuru: "crypto", unusual_whales: "crypto", whale_alert: "crypto",
  DeItaone: "crypto", WallStreetSilv: "crypto", WallStreetMemes: "crypto",
  DrEliDavid: "crypto",

  NASA: "science", SpaceX: "science", WHO: "science", CDCgov: "science",

  PopBase: "culture", PopCrave: "culture", DiscussingFilm: "culture", InternetH0F: "culture",
  NoContextBrits: "culture", NoContextHumans: "culture", historyinmemes: "culture",
  MrBeast: "culture", KimKardashian: "culture", Drake: "culture", taylorswift13: "culture",
  KylieJenner: "culture", TheRock: "culture", BarackObama: "culture", selenagomez: "culture",
  justinbieber: "culture", Eminem: "culture", katyperry: "culture", ladygaga: "culture",
  BrunoMars: "culture", rihanna: "culture", LilNasX: "culture",
  LoganPaul: "culture", jakepaul: "culture", KSI: "culture", markrober: "culture",
  tomholland1996: "culture", Zendaya: "culture",
}

const SCAN_ACCOUNTS = [
  "WhiteHouse", "POTUS", "realDonaldTrump", "elonmusk",
  "McDonalds", "PopBase", "PopCrave", "MrBeast",
  "NBA", "NFL", "Reuters", "BBCBreaking", "CNN",
  "InternetH0F", "CollinRugg", "MarioNawfal",
  "JoeBiden", "VP", "AOC", "BernieSanders", "RepMTG",
  "SenTedCruz", "GovRonDeSantis", "RFKJr", "VivekGRamaswamy",
  "BillGates", "SamAltman", "JeffBezos",
  "FoxNews", "nytimes", "washingtonpost", "AP", "WSJ",
  "BNONews", "nypost", "DailyMail", "TMZ", "Axios",
  "DiscussingFilm", "NoContextBrits", "historyinmemes",
  "EndWokeness", "libsoftiktok", "LeadingReport",
  "dom_lucre", "catturd2", "DrEliDavid", "WallStreetSilv",
  "Figen_", "stillgray", "WatcherGuru",
  "espn", "SportsCenter", "BleacherReport",
  "Netflix", "Xbox", "PlayStation",
  "NASA", "SpaceX", "Google", "Apple", "OpenAI",
]

function getCategory(username: string): string {
  return CATEGORY_MAP[username] || "other"
}

const UA_LIST = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
]

function randUA() {
  return UA_LIST[Math.floor(Math.random() * UA_LIST.length)]
}

// In-memory cache
let tweetCache: { data: Tweet[]; lastFetch: number } = { data: [], lastFetch: 0 }
const CACHE_TTL = 30 * 60 * 1000

async function enrichWithFxTwitter(username: string, tweetId: string): Promise<Tweet | null> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${username}/status/${tweetId}`, {
      headers: { "User-Agent": "ViralTweetDashboard/1.0" },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.tweet) return null
    const t = data.tweet
    return {
      id: t.id,
      text: t.text || "",
      author: t.author?.name || username,
      username: t.author?.screen_name || username,
      avatar: t.author?.avatar_url || "",
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
    }
  } catch {
    return null
  }
}

async function getTweetIdsFromSyndication(username: string): Promise<string[]> {
  try {
    const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`
    const res = await fetch(url, {
      headers: { "User-Agent": randUA() },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const html = await res.text()
    const matches = html.match(/status\/(\d+)/g) || []
    const ids = [...new Set(matches.map((m) => m.replace("status/", "")))]
    return ids.slice(0, 6)
  } catch {
    return []
  }
}

async function scanViralTweets(): Promise<Tweet[]> {
  if (Date.now() - tweetCache.lastFetch < CACHE_TTL && tweetCache.data.length > 0) {
    return tweetCache.data
  }

  console.log(`[SCAN] Starting scan of ${SCAN_ACCOUNTS.length} accounts...`)
  const startTime = Date.now()
  const allRawTweets: { username: string; tweetId: string }[] = []
  let successCount = 0

  // Phase 1: Discovery via syndication (batches of 3)
  const batchSize = 3
  for (let i = 0; i < SCAN_ACCOUNTS.length; i += batchSize) {
    const batch = SCAN_ACCOUNTS.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(async (username) => {
        const ids = await getTweetIdsFromSyndication(username)
        return { username, ids }
      })
    )

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.ids.length > 0) {
        const { username, ids } = result.value
        successCount++
        for (const id of ids) {
          allRawTweets.push({ username, tweetId: id })
        }
      }
    }

    if (i + batchSize < SCAN_ACCOUNTS.length) {
      await new Promise((r) => setTimeout(r, 800))
    }

    // Stop early if we have enough
    if (allRawTweets.length >= 100) break
  }

  console.log(`[SYN] ${successCount} accounts, ${allRawTweets.length} tweet IDs`)

  // Phase 2: Enrich with FxTwitter
  const enriched: Tweet[] = []
  const enrichBatch = 6

  for (let i = 0; i < allRawTweets.length && i < 80; i += enrichBatch) {
    const batch = allRawTweets.slice(i, i + enrichBatch)
    const results = await Promise.allSettled(
      batch.map(({ username, tweetId }) => enrichWithFxTwitter(username, tweetId))
    )

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        enriched.push(result.value)
      }
    }

    if (i + enrichBatch < allRawTweets.length) {
      await new Promise((r) => setTimeout(r, 150))
    }
  }

  // Phase 3: Filter, dedupe, sort
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  let filtered = enriched.filter((t) => t.timestamp > weekAgo)

  const seen = new Set<string>()
  filtered = filtered.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  filtered.sort((a, b) => b.engagement - a.engagement)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[DONE] ${filtered.length} viral tweets in ${elapsed}s`)

  tweetCache = { data: filtered, lastFetch: Date.now() }
  return filtered
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get("sort") || "engagement"
    const limit = parseInt(searchParams.get("limit") || "100")

    let tweets = await scanViralTweets()

    const sorted = [...tweets]
    if (sort === "views") sorted.sort((a, b) => (b.views || 0) - (a.views || 0))
    else if (sort === "likes") sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0))
    else if (sort === "retweets") sorted.sort((a, b) => (b.retweets || 0) - (a.retweets || 0))

    return NextResponse.json({
      success: true,
      count: sorted.length,
      cached: Date.now() - tweetCache.lastFetch > 5000,
      tweets: sorted.slice(0, limit),
    })
  } catch (e) {
    console.error("[ERROR]", e)
    return NextResponse.json({ success: false, error: "Failed to fetch tweets" }, { status: 500 })
  }
}
