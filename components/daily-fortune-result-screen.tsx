"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Sun, Lock, Coins, Sparkles, TrendingUp, Heart, Activity, Zap, Star, Clock, Palette, Ban, Shield, MapPin, Hash, Utensils, Briefcase, Target, Users, Moon } from "lucide-react"
import type { SajuInput } from "@/app/page"
import { getSunSignFromBirthDate } from "@/lib/astro"
import { getZodiacAnimal } from "@/lib/saju-lite"

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
  const sectionEvidence = resultSummary?.section_evidence ?? {}
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


  const displayName = sajuInput?.name?.trim() ? sajuInput.name.trim() : "이름 없음"

  const displayBirthDate = (() => {
    const bd = sajuInput?.birthDate?.trim()
    if (!bd) return "생년월일 없음"
    if (/^\d{4}-\d{2}-\d{2}$/.test(bd)) {
      const [y, mo, da] = bd.split("-")
      return `${y}.${mo}.${da}`
    }
    return bd
  })()

  const displayGender =
    sajuInput?.gender === "male" ? "남성" : sajuInput?.gender === "female" ? "여성" : "미지정"

  const zodiacAnimal = resultSummary?.profile_badges?.zodiac_animal ?? getZodiacAnimal(sajuInput?.birthDate ?? "") ?? null
  const sunSign = resultSummary?.profile_badges?.sun_sign ?? getSunSignFromBirthDate(sajuInput?.birthDate ?? "") ?? null
  const todayKeywords: string[] = Array.isArray(resultSummary?.today_keywords) ? resultSummary.today_keywords.slice(0, 3) : []
  const todayOneLiner: string | null = typeof resultSummary?.today_one_liner === "string" ? resultSummary.today_one_liner : null
  const sajuChart = resultSummary?.saju_chart?.pillars ? resultSummary.saju_chart : null
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
          {/* User Info Card - Premium Design */}
          <Card className="border-none overflow-hidden shadow-2xl">
            {/* Gradient border effect */}
            <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-[2px] rounded-[var(--radius)]">
              <CardContent className="p-0 bg-card rounded-[calc(var(--radius)-2px)] relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/5 blur-[40px]" />
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/5 blur-[50px]" />
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                  }} />
                </div>

                <div className="relative p-5">
                  {/* Top section with date badge */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 shadow-lg">
                      <Sun className="h-4 w-4 text-white" />
                      <span className="text-sm font-bold text-white">{date}의 운세</span>
                    </div>
                  </div>

                  {/* Profile info */}
                  <div className="flex items-center gap-4">
                    {/* Avatar with gradient ring */}
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-2xl blur-sm opacity-60" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {displayName ? displayName.charAt(0) : "?"}
                        </span>
                      </div>
                    </div>

                    {/* Name and details */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-card-foreground truncate">
                        {displayName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {displayBirthDate}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          {displayGender}
                        </span>
                        {zodiacAnimal && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            <Star className="h-3 w-3 text-amber-500" />
                            {zodiacAnimal}
                          </span>
                        )}
                        {sunSign && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            {sunSign}
                          </span>
                        )}
                        {sajuInput.birthTime && sajuInput.birthTime !== "unknown" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {sajuInput.birthTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {todayKeywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {todayKeywords.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400/15 to-orange-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}

                  {todayOneLiner && (
                    <div className="mt-3 rounded-2xl bg-gradient-to-r from-amber-400/10 to-orange-500/10 px-4 py-3 text-center">
                      <p className="text-sm font-medium leading-relaxed text-foreground/90">
                        {todayOneLiner}
                      </p>
                    </div>
                  )}

                  {/* Decorative divider */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          {sajuChart && (
            <Card className="border-none glass shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-card-foreground">사주 정보</h3>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    연·월·일·시
                  </span>
                </div>

                {(() => {
                  const p = sajuChart.pillars
                  const cols = [
                    { label: "연주", v: p.year },
                    { label: "월주", v: p.month },
                    { label: "일주", v: p.day },
                    { label: "시주", v: p.hour },
                  ] as const

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {cols.map((c) => (
                          <div key={c.label} className="space-y-1">
                            <div className="text-[11px] font-medium text-muted-foreground">{c.label}</div>
                            <div className="rounded-xl overflow-hidden border border-border/60">
                              <div className="bg-gradient-to-b from-amber-400/15 to-orange-500/10 px-2 py-2">
                                <div className="text-lg font-bold text-card-foreground">
                                  {c.v ? c.v.stem_hanja : "—"}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {c.v ? `${c.v.stem_yinyang}${c.v.stem_element}` : "정보 없음"}
                                </div>
                              </div>
                              <div className="bg-muted/40 px-2 py-2">
                                <div className="text-lg font-bold text-card-foreground">
                                  {c.v ? c.v.branch_hanja : "—"}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {c.v ? `${c.v.branch_animal} · ${c.v.branch_element}` : "정보 없음"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {Array.isArray(sajuChart.notes) && sajuChart.notes.length > 0 && (
                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {sajuChart.notes[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

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
                ["총운", sections.overall, scores.overall],
                ["금전운", sections.money, scores.money],
                ["애정운", sections.love, scores.love],
                ["건강운", sections.health, scores.health],
              ].map(([title, text, score]) => {
                const config = sectionIcons[title as keyof typeof sectionIcons]
                const IconComponent = config?.icon || Star
                const gradient = config?.gradient || "from-amber-400 to-orange-500"
                const pills = scoreToPills(score as number)
                const scoreNum = typeof score === "number" ? score : 0
                return (
                  <Card key={title as string} className="border-none glass shadow-md card-mystical overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4 p-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-card-foreground">{title as string}</h3>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`h-2 w-2 rounded-full transition-all ${i < pills ? `bg-gradient-to-br ${gradient}` : "bg-muted"}`}
                                  />
                                ))}
                              </div>
                              <span className={`text-xs font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                                {scoreNum}점
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {text ?? ""}
                          </p>
                          {Array.isArray((() => {
                            const t = title as string
                            const k =
                              t === "총운" ? "overall" :
                              t === "금전운" ? "money" :
                              t === "애정운" ? "love" :
                              t === "건강운" ? "health" : null
                            // @ts-ignore
                            return k ? sectionEvidence?.[k] : null
                          })()) && (
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground/90">
                              {((() => {
                                const t = title as string
                                const k =
                                  t === "총운" ? "overall" :
                                  t === "금전운" ? "money" :
                                  t === "애정운" ? "love" :
                                  t === "건강운" ? "health" : null
                                // @ts-ignore
                                const ev = k ? sectionEvidence?.[k] : []
                                return Array.isArray(ev) ? ev.slice(0, 2) : []
                              })()).map((e: any, idx: number) => (
                                <li key={idx} className="flex gap-2 leading-relaxed">
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500/60 shrink-0" />
                                  <span className="whitespace-pre-line">{String(e)}</span>
                                </li>
                              ))}
                            </ul>
                          )}

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
