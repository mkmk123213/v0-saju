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
  resultSummary,
  resultDetail,
  onUnlockDetail,
  onOpenCoinPurchase,
  onBack,
}: DailyFortuneResultScreenProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  const scoreToBars = (score: number | undefined) => {
    const s = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0
    return Math.max(1, Math.ceil(s / 20))
  }

  const bars = {
    overall: scoreToBars(resultSummary?.scores?.overall),
    money: scoreToBars(resultSummary?.scores?.money),
    love: scoreToBars(resultSummary?.scores?.love),
    health: scoreToBars(resultSummary?.scores?.health),
  }

  const title = resultSummary?.title ?? `${sajuInput.name}님의 오늘의 운세`
  const subtitle = resultSummary?.subtitle ?? formatDate(date)

  const summaryText =
    (typeof resultSummary?.summary_text === "string" && resultSummary.summary_text) ||
    (typeof resultSummary?.text === "string" && resultSummary.text) ||
    "운세 요약을 불러오지 못했어요. 다시 시도해주세요."

  return (
    <div className="flex min-h-screen flex-col starfield">
      {/* background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-500/15 blur-[100px]" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-orange-500/10 blur-[80px]" />
      </div>

      <header className="relative z-10 p-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <h1 className="font-medium text-foreground">오늘의 운세 결과</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="relative z-10 flex-1 px-6 pb-6 space-y-4">
        {/* Summary */}
        <Card className="border-none glass shadow-lg">
          <CardContent className="p-5">
            <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">총운</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-2 w-6 rounded-full ${i <= bars.overall ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"}`}
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
                      className={`h-2 w-6 rounded-full ${i <= bars.money ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"}`}
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
                      className={`h-2 w-6 rounded-full ${i <= bars.love ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">건강운</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-2 w-6 rounded-full ${i <= bars.health ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{summaryText}</p>

            {resultSummary?.rokIt && (
              <div className="pt-3 space-y-1 text-xs text-muted-foreground">
                <p>사주 힌트: {resultSummary.rokIt.saju_hint}</p>
                <p>점성술 힌트: {resultSummary.rokIt.astro_hint}</p>
                <p>조합 힌트: {resultSummary.rokIt.combined_hint}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail */}
        {isDetailUnlocked && resultDetail ? (
          <Card className="border-none glass shadow-lg">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-card-foreground">상세 운세 풀이</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{resultDetail.overall ?? ""}</p>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">핵심 테마</h4>
                  <p>{resultDetail?.combined?.core_theme}</p>
                </div>

                {Array.isArray(resultDetail?.combined?.advice) && resultDetail.combined.advice.length > 0 && (
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">오늘의 행동 계획</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultDetail.combined.advice.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-card-foreground mb-2">연애/관계</h4>
                  <p>{resultDetail?.love ?? resultDetail?.sections?.love?.text}</p>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2">커리어/성과</h4>
                  <p>{resultDetail?.career ?? resultDetail?.sections?.career?.text}</p>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2">재물/소비</h4>
                  <p>{resultDetail?.money ?? resultDetail?.sections?.money?.text}</p>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2">건강/컨디션</h4>
                  <p>{resultDetail?.health ?? resultDetail?.sections?.health?.text}</p>
                </div>

                {resultDetail?.lucky && (
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">행운 키트</h4>
                    <p>색: {(resultDetail.lucky?.colors ?? []).join(", ")}</p>
                    <p>숫자: {(resultDetail.lucky?.numbers ?? []).join(", ")}</p>
                    <p>시간대: {(resultDetail.lucky?.times ?? []).join(", ")}</p>
                    <p>피하면 좋은 것: {(resultDetail.lucky?.avoid ?? []).join(", ")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none glass shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-card-foreground">상세 운세 풀이</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{resultDetail.overall ?? ""}</p>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                더 자세한 사주+점성술 해석과 오늘의 행동 가이드를 확인할 수 있어요.
              </p>

              <div className="glass rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>핵심 테마 & 실행 가이드</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>연애/커리어/재물/건강 종합</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>행운 키트 (색/숫자/시간대)</span>
                </div>
              </div>

              <div className="pt-4">
                {coins >= 1 ? (
                  <Button
                    onClick={() => onUnlockDetail(resultId)}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                  >
                    <span className="animate-shimmer absolute inset-0 rounded-2xl" />
                    <div className="relative flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5" />
                      <span>엽전 1냥으로 운세보기 🔥</span>
                    </div>
                  </Button>
                ) : (
                  <Button
                    onClick={onOpenCoinPurchase}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-base shadow-xl"
                  >
                    <Coins className="h-5 w-5 mr-2" />
                    엽전 충전하기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
