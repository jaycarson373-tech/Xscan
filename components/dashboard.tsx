"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "./header"
import { CategoryFilter } from "./category-filter"
import { StatsBar } from "./stats-bar"
import { SortTabs } from "./sort-tabs"
import { TweetCard } from "./tweet-card"
import type { Tweet, SortOption, Category } from "@/lib/types"
import { Loader2 } from "lucide-react"

export function Dashboard() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("engagement")
  const [category, setCategory] = useState<Category>("all")

  const fetchTweets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tweets?sort=${sortBy}`)
      const data = await res.json()
      if (data.success) {
        setTweets(data.tweets)
      } else {
        setError(data.error || "Failed to fetch tweets")
      }
    } catch (err) {
      setError("Failed to connect to server")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy])

  useEffect(() => {
    fetchTweets()
  }, [fetchTweets])

  const handleLookup = async (url: string) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.success && data.tweet) {
        setTweets((prev) => {
          const filtered = prev.filter((t) => t.id !== data.tweet.id)
          return [data.tweet, ...filtered]
        })
      }
    } catch (err) {
      console.error("Lookup failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/refresh", { method: "POST" })
      await fetchTweets()
    } catch (err) {
      console.error("Refresh failed:", err)
      setIsLoading(false)
    }
  }

  // Filter tweets by category
  const filteredTweets =
    category === "all" ? tweets : tweets.filter((t) => t.category === category)

  // Sort tweets
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

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 mb-6">
            {error}
          </div>
        ) : null}

        <div className="space-y-6">
          {/* Category Filter */}
          <CategoryFilter tweets={tweets} selected={category} onSelect={setCategory} />

          {/* Stats */}
          <StatsBar tweets={tweets} />

          {/* Sort Tabs */}
          <SortTabs selected={sortBy} onSelect={setSortBy} tweetCount={sortedTweets.length} />

          {/* Tweet Grid */}
          {isLoading && tweets.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Scanning for viral tweets...</span>
            </div>
          ) : sortedTweets.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No tweets found in this category
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTweets.map((tweet, index) => (
                <TweetCard key={tweet.id} tweet={tweet} rank={index + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
