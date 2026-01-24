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
  isLoading?: boolean
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
  isLoading,
  onUnlockDetail,
  onOpenCoinPurchase,
  onBack,
}: DailyFortuneResultScreenProps) {
  const scoreToPills = (score?: number) => {
    const s = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0
    return Math.min(5, Math.max(0, Math.ceil(s / 20)))
  }

  const scores = resultSummary?.scores ?? {}
  const sections = resultSummary?.sections
  const spine = resultSummary?.spine_chill
  const keys = resultSummary?.today_keys
  const keyItems = keys
    ? ([
        ["색깔", keys.color],
        ["금기", keys.taboo],
        ["부적", keys.talisman],
        ["스팟", keys.lucky_spot],
        ["숫자", keys.number],
        ["음식", keys.food],
        ["소지품", keys.item],
        ["실천", keys.action],
        ["귀인", keys.helper],
      ] as const)
    : ([] as const)

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
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-[40px]" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 blur-[50px]" />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{sajuInput.name}</h2>
                    <p className="text-sm text-white/80">
                      {sajuInput.birthDate} · {sajuInput.gender === "male" ? "남" : "여"}
                      {sajuInput.birthTime && sajuInput.birthTime !== "unknown" ? ` · ${sajuInput.birthTime}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/80">보유 엽전</p>
                    <p className="text-lg font-bold">{coins}닢</p>
                  </div>
                </div>

                {/* Score pills */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    ["총운", scores.overall],
                    ["금전", scores.money],
                    ["애정", scores.love],
                    ["건강", scores.health],
                  ].map(([label, score]) => {
                    const pills = scoreToPills(score as number)
                    return (
                      <div key={label} className="rounded-xl bg-white/10 p-2 text-center">
                        <div className="text-[11px] text-white/80">{label}</div>
                        <div className="mt-1 flex justify-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full ${i < pills ? "bg-white" : "bg-white/25"}`}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <div className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <div>
                  <div className="text-sm font-medium">오늘 운세 뽑는 중이야…</div>
                  <div className="text-xs text-muted-foreground">조금만! 소름 포인트까지 같이 정리 중 👀</div>
                </div>
              </div>
            </div>
          )}

          {/* Sections */}
          {sections ? (
            <div className="grid gap-3">
              {[
                ["총운", sections.overall],
                ["금전운", sections.money],
                ["애정운", sections.love],
                ["건강운", sections.health],
              ].map(([title, text]) => (
                <div key={title as string} className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold">{title as string}</div>
                  <div className="mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {text ?? ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-none glass shadow-sm card-mystical">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="font-medium text-card-foreground">요약</h3>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {resultSummary?.daily_summary ?? resultSummary?.summary_text ?? ""}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Spine chill */}
          {spine?.prediction && (
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold">오늘의 소름 포인트</div>
              <div className="mt-2 text-sm whitespace-pre-line leading-relaxed">
                <span className="font-medium">{spine.time_window ?? ""}</span>
                {spine.time_window ? "에 " : ""}
                {spine.prediction}
              </div>
              {spine.verification && <div className="mt-2 text-xs text-muted-foreground">체크: {spine.verification}</div>}
            </div>
          )}

          {/* Today keys (compact grid) */}
          {keyItems.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-2">오늘의 키워드</div>
              <div className="grid grid-cols-2 gap-3">
                {keyItems.map(([label, obj]) => (
                  <div key={label} className="rounded-2xl border p-3">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="mt-1 text-sm font-semibold truncate">{obj?.value ?? "-"}</div>
                    {obj?.why && <div className="mt-1 text-[11px] text-muted-foreground truncate">{obj.why}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence briefs */}
          {(resultSummary?.saju_brief || resultSummary?.astro_brief) && (
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold">근거 요약</div>

              {resultSummary?.saju_brief && (
                <div className="mt-3">
                  <div className="text-xs font-medium">사주</div>
                  <div className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{resultSummary.saju_brief}</div>
                </div>
              )}

              {resultSummary?.astro_brief && (
                <div className="mt-3">
                  <div className="text-xs font-medium">별자리</div>
                  <div className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{resultSummary.astro_brief}</div>
                </div>
              )}
            </div>
          )}

          {/* Detail (locked/unlocked) */}
          {!isDetailUnlocked ? (
            <Card className="border-none glass shadow-sm card-mystical">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20">
                    <Lock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-card-foreground">상세 운세</h3>
                    <p className="text-xs text-muted-foreground">엽전 1닢으로 열어볼 수 있어</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 mb-4">
                  <span className="text-sm text-muted-foreground">필요 엽전</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-card-foreground">1닢</span>
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
                        엽전 1닢으로 상세 보기 🔥
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

                <p className="text-center text-xs text-muted-foreground mt-3">1개의 엽전으로 상세 운세를 확인할 수 있어</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none glass shadow-sm card-mystical">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="font-medium text-card-foreground">상세 운세</h3>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {resultDetail?.detail_text ?? resultDetail?.detail ?? ""}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
