"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Sun, Lock, Coins, Sparkles, TrendingUp, Heart, Activity, Zap, Star, Clock, Palette, Ban, Shield, MapPin, Hash, Utensils, Briefcase, Target, Users, Moon } from "lucide-react"
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

  const getScoreColor = (score?: number) => {
    const s = typeof score === "number" ? score : 0
    if (s >= 80) return "from-emerald-400 to-green-500"
    if (s >= 60) return "from-amber-400 to-orange-500"
    if (s >= 40) return "from-yellow-400 to-amber-500"
    return "from-rose-400 to-red-500"
  }

  const scores = resultSummary?.scores ?? {}
  const sections = resultSummary?.sections
  const spine = resultSummary?.spine_chill
  const keys = resultSummary?.today_keys
  const keyItems = keys
    ? ([
        ["색깔", keys.color, Palette, "from-pink-400 to-rose-500"],
        ["금기", keys.taboo, Ban, "from-red-400 to-rose-600"],
        ["부적", keys.talisman, Shield, "from-violet-400 to-purple-500"],
        ["스팟", keys.lucky_spot, MapPin, "from-emerald-400 to-green-500"],
        ["숫자", keys.number, Hash, "from-blue-400 to-indigo-500"],
        ["음식", keys.food, Utensils, "from-orange-400 to-amber-500"],
        ["소지품", keys.item, Briefcase, "from-cyan-400 to-teal-500"],
        ["실천", keys.action, Target, "from-fuchsia-400 to-pink-500"],
        ["귀인", keys.helper, Users, "from-sky-400 to-blue-500"],
      ] as const)
    : ([] as const)

  const sectionIcons = {
    "총운": { icon: Star, gradient: "from-amber-400 to-orange-500" },
    "금전운": { icon: Coins, gradient: "from-emerald-400 to-green-500" },
    "애정운": { icon: Heart, gradient: "from-pink-400 to-rose-500" },
    "건강운": { icon: Activity, gradient: "from-cyan-400 to-teal-500" },
  }

  return (
    <div className="flex min-h-screen flex-col starfield">
      {/* Cosmic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-40 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-orange-500/15 to-rose-500/10 blur-[100px]" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-yellow-500/10 to-amber-500/5 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 relative z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted glass">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sun className="h-5 w-5 text-amber-500" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 animate-twinkle" />
            </div>
            <h1 className="font-bold text-foreground">오늘의 운세</h1>
          </div>
        </div>
        <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          {date}
        </span>
      </header>

      {/* Result Content */}
      <div className="flex-1 px-5 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-5">
          {/* User Info Card */}
          <Card className="border-none bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-2xl overflow-hidden">
            <CardContent className="p-0 text-white relative">
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 blur-[50px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 blur-[60px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-yellow-300/10 blur-[40px]" />
                {/* Constellation pattern */}
                <svg className="absolute top-2 right-2 w-20 h-20 opacity-20" viewBox="0 0 80 80">
                  <circle cx="20" cy="15" r="2" fill="white" />
                  <circle cx="60" cy="25" r="1.5" fill="white" />
                  <circle cx="40" cy="50" r="2" fill="white" />
                  <circle cx="15" cy="60" r="1.5" fill="white" />
                  <line x1="20" y1="15" x2="60" y2="25" stroke="white" strokeWidth="0.5" opacity="0.5" />
                  <line x1="60" y1="25" x2="40" y2="50" stroke="white" strokeWidth="0.5" opacity="0.5" />
                  <line x1="40" y1="50" x2="15" y2="60" stroke="white" strokeWidth="0.5" opacity="0.5" />
                </svg>
              </div>

              <div className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Sun className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{sajuInput.name}</h2>
                      <p className="text-sm text-white/80">
                        {sajuInput.birthDate} · {sajuInput.gender === "male" ? "남" : "여"}
                        {sajuInput.birthTime && sajuInput.birthTime !== "unknown" ? ` · ${sajuInput.birthTime}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right glass rounded-xl px-3 py-2 bg-white/10">
                    <p className="text-[10px] text-white/70 font-medium">보유 엽전</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Coins className="h-3.5 w-3.5 text-yellow-200" />
                      <p className="text-lg font-bold">{coins}</p>
                    </div>
                  </div>
                </div>

                {/* Score pills - Enhanced */}
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[
                    ["총운", scores.overall, Star],
                    ["금전", scores.money, Coins],
                    ["애정", scores.love, Heart],
                    ["건강", scores.health, Activity],
                  ].map(([label, score, Icon]) => {
                    const pills = scoreToPills(score as number)
                    const IconComponent = Icon as React.ElementType
                    return (
                      <div key={label as string} className="rounded-2xl bg-white/15 backdrop-blur-sm p-3 text-center">
                        <IconComponent className="h-4 w-4 mx-auto text-white/90 mb-1" />
                        <div className="text-[11px] text-white/80 font-medium">{label as string}</div>
                        <div className="mt-1.5 flex justify-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`h-2 w-2 rounded-full transition-all ${i < pills ? "bg-white shadow-sm shadow-white/50" : "bg-white/25"}`}
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
            <Card className="border-none glass shadow-lg overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-foreground">운세를 분석하고 있어요</div>
                    <div className="text-xs text-muted-foreground mt-0.5">소름 포인트까지 정리 중...</div>
                    <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {sections ? (
            <div className="space-y-3">
              {[
                ["총운", sections.overall],
                ["금전운", sections.money],
                ["애정운", sections.love],
                ["건강운", sections.health],
              ].map(([title, text]) => {
                const config = sectionIcons[title as keyof typeof sectionIcons]
                const IconComponent = config?.icon || Star
                const gradient = config?.gradient || "from-amber-400 to-orange-500"
                return (
                  <Card key={title as string} className="border-none glass shadow-md card-mystical overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4 p-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-card-foreground">{title as string}</h3>
                            <div className={`h-1 flex-1 rounded-full bg-gradient-to-r ${gradient} opacity-30`} />
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {text ?? ""}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-none glass shadow-md card-mystical overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-card-foreground">오늘의 요약</h3>
                      <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-30" />
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {resultSummary?.daily_summary ?? resultSummary?.summary_text ?? ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spine chill */}
          {spine?.prediction && (
            <Card className="border-none overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-0.5">
                <CardContent className="bg-card rounded-[calc(var(--radius)-2px)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-md">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-card-foreground">소름 포인트</h3>
                        <span className="rounded-full bg-gradient-to-r from-violet-400 to-purple-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                          HOT
                        </span>
                      </div>
                      {spine.time_window && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 mb-2">
                          <Clock className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{spine.time_window}</span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {spine.prediction}
                      </p>
                      {spine.verification && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                          <Target className="h-3.5 w-3.5 text-violet-500" />
                          <span className="text-xs text-muted-foreground">{spine.verification}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          )}

          {/* Today keys (compact grid) */}
          {keyItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 shadow-md">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-foreground">오늘의 키워드</h3>
                <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 opacity-30" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {keyItems.map(([label, obj, IconComponent, gradient]) => (
                  <Card key={label} className="border-none glass shadow-sm card-mystical overflow-hidden">
                    <CardContent className="p-3 text-center">
                      <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-sm mb-2`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium mb-0.5">{label}</div>
                      <div className="text-xs font-bold text-card-foreground truncate">{obj?.value ?? "-"}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Evidence briefs */}
          {(resultSummary?.saju_brief || resultSummary?.astro_brief) && (
            <Card className="border-none glass shadow-md card-mystical overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 shadow-md">
                    <Moon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-card-foreground">분석 근거</h3>
                  <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 opacity-30" />
                </div>

                <div className="space-y-3">
                  {resultSummary?.saju_brief && (
                    <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                        <span className="text-xs font-bold text-violet-700 dark:text-violet-300">사주 분석</span>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{resultSummary.saju_brief}</p>
                    </div>
                  )}

                  {resultSummary?.astro_brief && (
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Star className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">별자리 분석</span>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{resultSummary.astro_brief}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detail (locked/unlocked) */}
          {!isDetailUnlocked ? (
            <Card className="border-none overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 p-0.5">
                <CardContent className="bg-card rounded-[calc(var(--radius)-2px)] p-5">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-card-foreground">프리미엄 상세 운세</h3>
                      <p className="text-sm text-muted-foreground">더 깊고 구체적인 운세 분석</p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {[
                      { icon: TrendingUp, text: "구체적 조언" },
                      { icon: Clock, text: "시간대별 운세" },
                      { icon: Target, text: "맞춤 행동지침" },
                      { icon: Shield, text: "주의사항 안내" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-2.5">
                        <item.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-medium text-amber-800 dark:text-amber-200">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 p-4 mb-5">
                    <div>
                      <span className="text-xs text-muted-foreground">필요 엽전</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Coins className="h-5 w-5 text-amber-500" />
                        <span className="text-xl font-bold text-card-foreground">1닢</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">보유 엽전</span>
                      <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                        <span className={`text-xl font-bold ${coins >= 1 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {coins}닢
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  {coins >= 1 ? (
                    <Button
                      onClick={() => onUnlockDetail(resultId)}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                    >
                      <span className="animate-shimmer absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        상세 운세 열어보기
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={onOpenCoinPurchase}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                    >
                      <span className="animate-shimmer absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Coins className="h-5 w-5" />
                        엽전 충전하기
                      </span>
                    </Button>
                  )}
                </CardContent>
              </div>
            </Card>
          ) : (
            <Card className="border-none overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-500 p-0.5">
                <CardContent className="bg-card rounded-[calc(var(--radius)-2px)] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-card-foreground">프리미엄 상세 운세</h3>
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">UNLOCKED</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4">
                    <p className="text-sm text-card-foreground whitespace-pre-line leading-relaxed">
                      {resultDetail?.detail_text ?? resultDetail?.detail ?? ""}
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
