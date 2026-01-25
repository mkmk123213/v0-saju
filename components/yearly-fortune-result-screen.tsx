"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Star, Lock, Coins, Sparkles } from "lucide-react"
import type { SajuInput } from "@/app/page"
import { getSunSignFromBirthDate } from "@/lib/astro"
import { getZodiacAnimal } from "@/lib/saju-lite"

interface YearlyFortuneResultScreenProps {
  sajuInput: SajuInput
  year: number
  isDetailUnlocked: boolean
  coins: number
  resultId: string
  resultSummary?: any
  resultDetail?: any | null
  onUnlockDetail: (resultId: string) => void
  onOpenCoinPurchase: () => void
  onBack: () => void
}

export default function YearlyFortuneResultScreen({
  sajuInput,
  year,
  isDetailUnlocked,
  coins,
  resultId,
  resultSummary,
  resultDetail,
  onUnlockDetail,
  onOpenCoinPurchase,
  onBack,
}: YearlyFortuneResultScreenProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  const scoreToPills = (score?: number) => {
    const s = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0
    return Math.min(5, Math.max(0, Math.ceil(s / 20)))
  }


  const zodiacAnimal = getZodiacAnimal(sajuInput?.birthDate ?? "")
  const sunSign = getSunSignFromBirthDate(sajuInput?.birthDate ?? "")
  return (
    <div className="flex min-h-screen flex-col starfield">
      {/* Cosmic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-sky-500/15 blur-[100px]" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-sky-400" />
          <h1 className="font-medium text-foreground">운세 결과</h1>
          <span className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 px-2 py-0.5 text-xs font-medium text-white">
            {year}년
          </span>
        </div>
      </header>

      {/* Result Content */}
      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-6">
          {/* User Info */}
          <Card className="border-none bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-400 shadow-xl overflow-hidden">
            <CardContent className="p-5 text-white relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                  <Star className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{(sajuInput.name?.trim() ? sajuInput.name : "이름 없음")}님</h2>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">{year}년 운세</span>
                  </div>
                  <p className="text-sm text-white/80">
                    {formatDate(sajuInput.birthDate)} · {sajuInput.gender === "male" ? "남성" : sajuInput.gender === "female" ? "여성" : "미지정"}
                  </p>
                  {(zodiacAnimal || sunSign) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {zodiacAnimal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/90">
                          <Sparkles className="h-3 w-3" />
                          {zodiacAnimal}
                        </span>
                      )}
                      {sunSign && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/90">
                          <Sparkles className="h-3 w-3" />
                          {sunSign}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Free Fortune Summary */}
          <Card className="border-none glass shadow-lg">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-card-foreground">{year}년 운세 요약</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">총운</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-full ${i <= scoreToPills(resultSummary?.scores?.overall) ? "bg-gradient-to-r from-sky-400 to-cyan-500" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">재물운</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-full ${i <= scoreToPills(resultSummary?.scores?.money) ? "bg-gradient-to-r from-sky-400 to-cyan-500" : "bg-muted"}`}
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
                        className={`h-2 w-6 rounded-full ${i <= scoreToPills(resultSummary?.scores?.health) ? "bg-gradient-to-r from-sky-400 to-cyan-500" : "bg-muted"}`}
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
                        className={`h-2 w-6 rounded-full ${i <= scoreToPills(resultSummary?.scores?.love) ? "bg-gradient-to-r from-sky-400 to-cyan-500" : "bg-muted"}`}
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
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-400" />
                  <h3 className="font-bold text-card-foreground">상세 운세 풀이</h3>
                </div>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {resultDetail?.combined?.core_theme && (
                    <div>
                      <h4 className="font-medium text-card-foreground mb-2">올해의 핵심 테마</h4>
                      <p>{resultDetail.combined.core_theme}</p>
                    </div>
                  )}
                  {resultDetail?.sections?.career?.text && (
                    <div>
                      <h4 className="font-medium text-card-foreground mb-2">일/커리어</h4>
                      <p>{resultDetail.sections.career.text}</p>
                    </div>
                  )}
                  {resultDetail?.sections?.money?.text && (
                    <div>
                      <h4 className="font-medium text-card-foreground mb-2">재물운</h4>
                      <p>{resultDetail.sections.money.text}</p>
                    </div>
                  )}
                  {resultDetail?.sections?.love?.text && (
                    <div>
                      <h4 className="font-medium text-card-foreground mb-2">애정운</h4>
                      <p>{resultDetail.sections.love.text}</p>
                    </div>
                  )}
                  {resultDetail?.sections?.health?.text && (
                    <div>
                      <h4 className="font-medium text-card-foreground mb-2">건강운</h4>
                      <p>{resultDetail.sections.health.text}</p>
                    </div>
                  )}
                  {resultDetail && (
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(resultDetail, null, 2)}</pre>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none overflow-hidden shadow-xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-cyan-500/10" />
              <CardContent className="p-6 space-y-5 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">상세 운세 풀이</h3>
                    <p className="text-xs text-muted-foreground">{year}년 분기별 상세 운세를 확인하세요</p>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <span>분기별 상세 운세</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <span>월별 행운의 날</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <span>주의해야 할 시기</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3">
                  <div className="text-sm text-muted-foreground">필요 엽전</div>
                  <div className="font-semibold text-foreground">9닢</div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3">
                  <div className="text-sm text-muted-foreground">보유 엽전</div>
                  <div className="font-semibold text-foreground">{coins}닢</div>
                </div>

                {coins >= 9 ? (
                  <Button
                    onClick={() => onUnlockDetail(resultId)}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-500 to-teal-400 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                  >
                    <span className="animate-shimmer absolute inset-0 rounded-2xl" />
                    <span className="relative flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5" />
                      엽전 9닢으로 운세보기 🔥
                    </span>
                  </Button>
                ) : (
                  <Button
                    onClick={onOpenCoinPurchase}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-500 to-teal-400 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                  >
                    <span className="animate-shimmer absolute inset-0 rounded-2xl" />
                    <span className="relative flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5" />
                      엽전 환전하기 (900원) 🔥
                    </span>
                  </Button>
                )}

                <p className="text-center text-xs text-muted-foreground">9개의 엽전으로 상세 운세를 확인하세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
