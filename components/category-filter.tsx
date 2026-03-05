"use client"

import { cn } from "@/lib/utils"
import { type Category, CATEGORY_LABELS } from "@/lib/types"
import type { Tweet } from "@/lib/types"
import {
  Flame,
  Landmark,
  Globe,
  Cpu,
  Sparkles,
  Trophy,
  Bitcoin,
  UtensilsCrossed,
  Microscope,
  MessageCircle,
} from "lucide-react"

interface CategoryFilterProps {
  tweets: Tweet[]
  selected: Category
  onSelect: (category: Category) => void
}

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  all: <Flame className="w-4 h-4" />,
  politics: <Landmark className="w-4 h-4" />,
  world_news: <Globe className="w-4 h-4" />,
  ai_tech: <Cpu className="w-4 h-4" />,
  culture: <Sparkles className="w-4 h-4" />,
  sports: <Trophy className="w-4 h-4" />,
  crypto: <Bitcoin className="w-4 h-4" />,
  food: <UtensilsCrossed className="w-4 h-4" />,
  science: <Microscope className="w-4 h-4" />,
  other: <MessageCircle className="w-4 h-4" />,
}

export function CategoryFilter({ tweets, selected, onSelect }: CategoryFilterProps) {
  const categoryCounts = tweets.reduce(
    (acc, tweet) => {
      acc[tweet.category] = (acc[tweet.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const categories: Category[] = [
    "all",
    "politics",
    "world_news",
    "ai_tech",
    "culture",
    "sports",
    "crypto",
    "science",
    "other",
  ]

  // Only show categories that have tweets
  const visibleCategories = categories.filter(
    (cat) => cat === "all" || (categoryCounts[cat] && categoryCounts[cat] > 0)
  )

  return (
    <div className="flex flex-wrap gap-2">
      {visibleCategories.map((category) => {
        const count = category === "all" ? tweets.length : categoryCounts[category] || 0
        const isSelected = selected === category
        const isAll = category === "all"

        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              isSelected
                ? isAll
                  ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent"
                  : "bg-primary text-primary-foreground border-transparent"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {CATEGORY_ICONS[category]}
            <span>{CATEGORY_LABELS[category]}</span>
            <span
              className={cn(
                "text-xs",
                isSelected ? "opacity-80" : "text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
