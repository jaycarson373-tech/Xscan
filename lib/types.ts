export interface Tweet {
  id: string
  text: string
  author: string
  username: string
  avatar: string
  views: number
  likes: number
  retweets: number
  replies: number
  timestamp: string
  url: string
  media?: string | null
  engagement: number
  category: string
}

export type SortOption = "engagement" | "views" | "likes" | "retweets"

export type Category = "all" | "politics" | "world_news" | "ai_tech" | "culture" | "sports" | "crypto" | "food" | "science" | "other"

export const CATEGORY_LABELS: Record<Category, string> = {
  all: "All",
  politics: "Politics",
  world_news: "World News",
  ai_tech: "AI & Tech",
  culture: "Culture",
  sports: "Sports",
  crypto: "Crypto",
  food: "Food",
  science: "Science",
  other: "Other",
}
