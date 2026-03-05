"use client"

import { cn } from "@/lib/utils"
import type { SortOption } from "@/lib/types"

interface SortTabsProps {
  selected: SortOption
  onSelect: (sort: SortOption) => void
  tweetCount: number
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "engagement", label: "Engagement" },
  { value: "views", label: "Views" },
  { value: "likes", label: "Likes" },
  { value: "retweets", label: "Retweets" },
]

export function SortTabs({ selected, onSelect, tweetCount }: SortTabsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              selected === option.value
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <span className="text-muted-foreground text-sm">{tweetCount} tweets</span>
    </div>
  )
}
