"use client"

import { formatNumber } from "@/lib/utils"
import type { Tweet } from "@/lib/types"

interface StatsBarProps {
  tweets: Tweet[]
}

export function StatsBar({ tweets }: StatsBarProps) {
  const topViews = tweets.length > 0 ? Math.max(...tweets.map((t) => t.views)) : 0
  const topLikes = tweets.length > 0 ? Math.max(...tweets.map((t) => t.likes)) : 0
  const categories = new Set(tweets.map((t) => t.category)).size

  const stats = [
    { label: "TWEETS", value: tweets.length.toString(), color: "bg-primary" },
    { label: "TOP VIEWS", value: formatNumber(topViews), color: "bg-emerald-500" },
    { label: "TOP LIKES", value: formatNumber(topLikes), color: "bg-pink-500" },
    { label: "CATEGORIES", value: categories.toString(), color: "bg-muted-foreground" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${stat.color}`} />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
