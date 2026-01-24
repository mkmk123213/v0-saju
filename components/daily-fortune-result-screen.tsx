"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Sun, Lock, Coins, Sparkles } from "lucide-react"
import type { SajuInput } from "@/app/page"

interface DailyFortuneResultScreenProps {
  sajuInput: SajuInput
  date: string
  isDetailUnlocked: boolean
  coins: number
  resultId: string
  resultSummary?: any
  resultDetail?: any | null
  onUnlockDetail: (resultId: string) => void
  onOpenCoinPurchase: () => void
  onBack: () => void
}

export default function DailyFortuneResultScreen({
  sajuInput,
  date,
  isDetailUnlocked,
  coins,
  resultId,
  onUnlockDetail,
  onOpenCoinPurchase,
  onBack,
}: DailyFortuneResultScreenProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  const scoreToPills = (score?: number) => {
    const s = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0
    return Math.min(5, Math.max(0, Math.ceil(s / 20)))
  }

  return (
    <div className="flex min-h-screen flex-col starfield">
      {/* Cosmic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-500/15 blur-[100px]" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-orange-500/10 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <h1 className="font-medium text-foreground">오늘의 운세 결과</h1>
          <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-xs font-medium text-white">
            {date}
          </span>
        </div>
      </header>

      {/* Result Content */}
      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-6">
          {/* User Info */}
          <Card className="border-none bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl overflow-hidden">
            <CardContent className="p-5 text-white relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                  <Sun className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{sajuInput.name}님의 오늘의 운세</h2>
                  <p className="text-sm text-white/80">
                    {formatDate(sajuInput.birthDate)} · {sajuInput.gender === "male" ? "남성" : "여성"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Free Fortune Summary */}
          <Card className="border-none glass shadow-lg">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-card-foreground">오늘의 운세 요약</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">총운</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-full ${i <= scoreToPills(resultSummary?.scores?.overall) ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">금전운</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-full ${i <= scoreToPills(resultSummary?.scores?.money) ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">애정운</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-full ${i <= scoreToPills(resultSummary?.scores?.love) ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {resultSummary?.summary_text ?? "요약을 생성 중이에요..."}
              </p>
            </CardContent>
          </Card>

          {/* Detail Section */}
          {isDetailUnlocked ? (
            <Card className="border-none glass shadow-lg">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-card-foreground">상세 운세 풀이</h3>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">오전 운세</h4>
                    <p>
                      오전에는 집중력이 높아지는 시간입니다. 중요한 업무나 결정은 이 시간대에 처리하는 것이 좋습니다.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">오후 운세</h4>
                    <p>오후에는 사람들과의 만남이 길할 수 있습니다. 비즈니스 미팅이나 중요한 약속을 잡아보세요.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">행운의 색상</h4>
                    <p>노란색, 주황색 계열의 색상이 오늘 행운을 가져다 줄 수 있습니다.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">오늘의 조언</h4>
                    <p>
                      긍정적인 마음가짐으로 하루를 시작하세요. 작은 것에도 감사하는 마음을 가지면 더 큰 행운이 찾아올
                      것입니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none overflow-hidden shadow-xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
              <CardContent className="p-5 space-y-4 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-card-foreground text-lg">상세 운세 풀이</h3>
                    <p className="text-xs text-muted-foreground">오늘 하루의 상세한 운세를 확인하세요</p>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>오전/오후 운세</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>행운의 색상 & 숫자</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>오늘의 조언</span>
                  </div>
                </div>

                <div className="pt-2">
                  {coins >= 1 ? (
                    <Button
                      onClick={() => onUnlockDetail(resultId)}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                    >
                      <span className="animate-shimmer absolute inset-0 rounded-2xl" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Coins className="h-5 w-5" />
                        엽전 1닢으로 운세보기 🔥
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={onOpenCoinPurchase}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                    >
                      <span className="animate-shimmer absolute inset-0 rounded-2xl" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Coins className="h-5 w-5" />
                        엽전 환전하기 (100원) 🔥
                      </span>
                    </Button>
                  )}
                </div>

                <p className="text-center text-xs text-muted-foreground">1개의 엽전으로 상세 운세를 확인하세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
