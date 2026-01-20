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

  const summaryText =
    (typeof resultSummary?.summary_text === "string" && resultSummary.summary_text) ||
    (typeof resultSummary?.text === "string" && resultSummary.text) ||
    "운세 요약을 불러오지 못했어요. 다시 시도해주세요."

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
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{summaryText}</p>
              {resultSummary?.rokIt && (
                <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                  <p>사주 힌트: {resultSummary.rokIt.saju_hint}</p>
                  <p>점성술 힌트: {resultSummary.rokIt.astro_hint}</p>
                  <p>조합 힌트: {resultSummary.rokIt.combined_hint}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail Section */}
          {isDetailUnlocked && resultDetail ? (
            <Card className="border-none glass shadow-lg">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-card-foreground">상세 운세 풀이</h3>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">핵심 테마</h4>
                    <p>{resultDetail.combined?.core_theme}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">오늘의 행동 계획</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {(resultDetail.combined?.action_steps ?? []).map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">연애/관계</h4>
                    <p>{resultDetail.sections?.love?.text}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {(resultDetail.sections?.love?.tips ?? []).map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">커리어/성과</h4>
                    <p>{resultDetail.sections?.career?.text}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {(resultDetail.sections?.career?.tips ?? []).map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">재물/소비</h4>
                    <p>{resultDetail.sections?.money?.text}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {(resultDetail.sections?.money?.tips ?? []).map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">건강/컨디션</h4>
                    <p>{resultDetail.sections?.health?.text}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {(resultDetail.sections?.health?.tips ?? []).map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">행운 키트</h4>
                    <p>색: {(resultDetail.lucky?.colors ?? []).join(", ")}</p>
                    <p>숫자: {(resultDetail.lucky?.numbers ?? []).join(", ")}</p>
                    <p>시간대: {(resultDetail.lucky?.times ?? []).join(", ")}</p>
                    <p>피하면 좋은 것: {(resultDetail.lucky?.avoid ?? []).join(", ")}</p>
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
                    <span>핵심 테마 & 오늘의 행동 계획</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>연애/커리어/재물/건강 섹션</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>행운 키트 (색/숫자/시간대)</span>
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
