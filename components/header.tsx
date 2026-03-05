"use client"

import { useState } from "react"
import { Flame, Search, RefreshCw } from "lucide-react"

interface HeaderProps {
  onLookup: (url: string) => void
  onRefresh: () => void
  isLoading: boolean
}

export function Header({ onLookup, onRefresh, isLoading }: HeaderProps) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onLookup(url.trim())
      setUrl("")
    }
  }

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold">
          <span className="text-foreground">Viral</span>{" "}
          <span className="text-primary">Tweets</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <form onSubmit={handleSubmit} className="flex-1 md:flex-none flex items-center">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any tweet URL to analyze..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-l-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-r-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Lookup
          </button>
        </form>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    </header>
  )
}
