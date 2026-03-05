"use client"

import { useState } from "react"
import { Header } from "./header"
import { CategoryFilter } from "./category-filter"
import { StatsBar } from "./stats-bar"
import { SortTabs } from "./sort-tabs"
import { TweetCard } from "./tweet-card"
import type { Tweet, SortOption, Category } from "@/lib/types"

const MOCK_TWEETS: Tweet[] = [
  {
    id: "1",
    text: "",
    author: "Donald J. Trump",
    username: "realDonaldTrump",
    avatar: "https://pbs.twimg.com/profile_images/1881421751519920128/NzAByY5__400x400.jpg",
    category: "politics",
    views: 168900000,
    likes: 1000000,
    retweets: 158000,
    replies: 133000,
    engagement: 169000000,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    media: "https://pbs.twimg.com/media/GkYHsZCXQAAJVhD?format=jpg&name=medium",
    url: "https://x.com/realDonaldTrump/status/1"
  },
  {
    id: "2",
    text: "",
    author: "Donald J. Trump",
    username: "realDonaldTrump",
    avatar: "https://pbs.twimg.com/profile_images/1881421751519920128/NzAByY5__400x400.jpg",
    category: "politics",
    views: 98500000,
    likes: 578600,
    retweets: 76100,
    replies: 74200,
    engagement: 99000000,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    media: "https://pbs.twimg.com/media/GkdRJZsXoAAvxWe?format=jpg&name=medium",
    url: "https://x.com/realDonaldTrump/status/2"
  },
  {
    id: "3",
    text: "Expanding to the stars avoids risk of a mouse utopian behavioral sink",
    author: "Elon Musk",
    username: "elonmusk",
    avatar: "https://pbs.twimg.com/profile_images/1893803697185910784/Na5lOWi5_400x400.jpg",
    category: "ai_tech",
    views: 62700000,
    likes: 118700,
    retweets: 11500,
    replies: 13200,
    engagement: 63000000,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://x.com/elonmusk/status/3"
  },
  {
    id: "4",
    text: "",
    author: "The White House",
    username: "WhiteHouse",
    avatar: "https://pbs.twimg.com/profile_images/1881445702598234112/pe93cmIj_400x400.jpg",
    category: "politics",
    views: 45000000,
    likes: 320000,
    retweets: 45000,
    replies: 28000,
    engagement: 45500000,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    media: "https://pbs.twimg.com/media/GkgQZJfXcAA7Qx5?format=jpg&name=medium",
    url: "https://x.com/WhiteHouse/status/4"
  },
  {
    id: "5",
    text: "Iran launched a wave of missiles at Israel early on March 5, sending millions of residents into bomb shelters as the US-Israel war with Iran entered its sixth day and just hours after moves to...",
    author: "Reuters",
    username: "Reuters",
    avatar: "https://pbs.twimg.com/profile_images/1194751949821939712/3VBu4_Sa_400x400.jpg",
    category: "world_news",
    views: 1100000,
    likes: 2400,
    retweets: 732,
    replies: 177,
    engagement: 1200000,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://x.com/Reuters/status/5"
  },
  {
    id: "6",
    text: "Three men arrested on suspicion of spying for China in London and Wales https://bbc.in/4rt9dRn",
    author: "BBC Breaking News",
    username: "BBCBreaking",
    avatar: "https://pbs.twimg.com/profile_images/1354900998768525314/GJ5XGTI5_400x400.jpg",
    category: "world_news",
    views: 611400,
    likes: 2700,
    retweets: 873,
    replies: 19,
    engagement: 615000,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://x.com/BBCBreaking/status/6"
  },
]

export function Dashboard() {
  const [tweets] = useState<Tweet[]>(MOCK_TWEETS)
  const [isLoading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("engagement")
  const [category, setCategory] = useState<Category>("all")

  const handleLookup = async (url: string) => {
    console.log("Looking up:", url)
  }

  const handleRefresh = async () => {
    console.log("Refreshing...")
  }

  const filteredTweets =
    category === "all" ? tweets : tweets.filter((t) => t.category === category)

  const sortedTweets = [...filteredTweets].sort((a, b) => {
    switch (sortBy) {
      case "views":
        return (b.views || 0) - (a.views || 0)
      case "likes":
        return (b.likes || 0) - (a.likes || 0)
      case "retweets":
        return (b.retweets || 0) - (a.retweets || 0)
      default:
        return (b.engagement || 0) - (a.engagement || 0)
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Header onLookup={handleLookup} onRefresh={handleRefresh} isLoading={isLoading} />

        <div className="space-y-6">
          <CategoryFilter tweets={tweets} selected={category} onSelect={setCategory} />
          <StatsBar tweets={tweets} />
          <SortTabs selected={sortBy} onSelect={setSortBy} tweetCount={sortedTweets.length} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTweets.map((tweet, index) => (
              <TweetCard key={tweet.id} tweet={tweet} rank={index + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
