"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, Sun, ChevronRight, User } from "lucide-react"
import type { DailyFortuneResult } from "@/app/page"

interface DailyFortuneListScreenProps {
  results: DailyFortuneResult[]
  onNewFortune: () => void
  onViewResult: (result: DailyFortuneResult) => void
  onBack: () => void
}

export default function DailyFortuneListScreen({
  results,
  onNewFortune,
  onViewResult,
  onBack,
}: DailyFortuneListScreenProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return String(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  }

}

  const formatBirthDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    // birthDate는 보통 YYYY-MM-DD 형태라서 Date 파싱 대신 안전하게 split
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, mo, da] = dateStr.split("-")
      return `${y}.${mo}.${da}`
    }
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return String(dateStr)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
  }

}

  return (
    <div className="flex min-h-screen flex-col starfield">
      {/* Cosmic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-amber-500/10 blur-[80px]" />
        <div className="absolute bottom-40 -left-20 w-48 h-48 rounded-full bg-orange-500/10 blur-[60px]" />
      </div>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <h1 className="font-medium text-foreground">오늘의 운세</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-6">
          {/* New Fortune Button */}
          <Button
            onClick={onNewFortune}
            className="h-14 w-full gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-base font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            오늘의 운세 보기
          </Button>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">이전 결과</h2>
              <div className="space-y-3">
                {results.map((result) => (
                  <Card
                    key={result.id}
                    className="cursor-pointer border-none glass shadow-sm transition-all card-mystical"
                    onClick={() => onViewResult(result)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20">
                        <User className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-card-foreground truncate">{result.sajuInput.name}</p>
                          <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                            {result.date}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatBirthDate(result.sajuInput.birthDate)} ·{" "}
                          {result.sajuInput.gender === "male" ? "남성" : "여성"} · {formatDate(result.createdAt)} 조회
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full glass">
                <Sun className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-muted-foreground">아직 조회한 운세가 없습니다</p>
              <p className="mt-1 text-sm text-muted-foreground/70">오늘의 운세를 확인해보세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
