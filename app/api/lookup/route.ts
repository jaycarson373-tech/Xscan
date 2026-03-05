import { NextResponse } from "next/server"

const CATEGORY_MAP: Record<string, string> = {
  WhiteHouse: "politics", POTUS: "politics", realDonaldTrump: "politics", JoeBiden: "politics",
  elonmusk: "ai_tech", SamAltman: "ai_tech", OpenAI: "ai_tech", Google: "ai_tech",
  Reuters: "world_news", AP: "world_news", CNN: "world_news", BBCBreaking: "world_news",
  PopBase: "culture", PopCrave: "culture", MrBeast: "culture",
  NBA: "sports", NFL: "sports", espn: "sports",
}

function getCategory(username: string): string {
  return CATEGORY_MAP[username] || "other"
}

async function enrichWithFxTwitter(username: string, tweetId: string) {
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

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 })
    }

    const match = url.match(/(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/)
    if (!match) {
      return NextResponse.json({ error: "Invalid tweet URL" }, { status: 400 })
    }

    const [, username, tweetId] = match
    const tweet = await enrichWithFxTwitter(username, tweetId)
    if (!tweet) {
      return NextResponse.json({ error: "Could not fetch tweet" }, { status: 404 })
    }

    return NextResponse.json({ success: true, tweet })
  } catch (e) {
    console.error("[LOOKUP ERROR]", e)
    return NextResponse.json({ error: "Failed to lookup tweet" }, { status: 500 })
  }
}
