"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"
import type { Tweet } from "@/lib/types"
import { formatNumber, timeAgo } from "@/lib/utils"
import { CATEGORY_LABELS, type Category } from "@/lib/types"

interface TweetCardProps {
  tweet: Tweet
  rank: number
}

const CATEGORY_COLORS: Record<string, string> = {
  politics: "bg-red-500/20 text-red-400",
  world_news: "bg-blue-500/20 text-blue-400",
  ai_tech: "bg-emerald-500/20 text-emerald-400",
  culture: "bg-pink-500/20 text-pink-400",
  sports: "bg-orange-500/20 text-orange-400",
  crypto: "bg-yellow-500/20 text-yellow-400",
  food: "bg-amber-500/20 text-amber-400",
  science: "bg-purple-500/20 text-purple-400",
  other: "bg-gray-500/20 text-gray-400",
}

export function TweetCard({ tweet, rank }: TweetCardProps) {
  const categoryColor = CATEGORY_COLORS[tweet.category] || CATEGORY_COLORS.other
  const categoryLabel = CATEGORY_LABELS[tweet.category as Category] || "Other"

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {tweet.avatar ? (
            <Image
              src={tweet.avatar}
              alt={tweet.author}
              width={44}
              height={44}
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{tweet.author}</p>
            <p className="text-sm text-muted-foreground truncate">@{tweet.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full uppercase ${categoryColor}`}>
            {categoryLabel}
          </span>
          <span className="text-muted-foreground text-sm font-medium">#{rank}</span>
        </div>
      </div>

      {/* Content */}
      {tweet.media ? (
        <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
          <Image
            src={tweet.media}
            alt="Tweet media"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      ) : tweet.text ? (
        <p className="text-foreground text-sm leading-relaxed mb-3 line-clamp-4 flex-grow">
          {tweet.text}
        </p>
      ) : null}

      {/* Stats */}
      <div className="flex items-center gap-2 mb-3">
        <StatBox value={tweet.views} label="VIEWS" />
        <StatBox value={tweet.likes} label="LIKES" />
        <StatBox value={tweet.retweets} label="RETWEETS" />
        <StatBox value={tweet.replies} label="REPLIES" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
        <span className="text-xs text-muted-foreground">{timeAgo(tweet.timestamp)}</span>
        <a
          href={tweet.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
        >
          View on X
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 text-center py-2 px-1 rounded-lg border border-border bg-background">
      <p className="text-primary font-semibold text-sm">{formatNumber(value)}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  )
}
