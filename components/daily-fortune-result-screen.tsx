"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  ArrowLeft,
  Sun,
  Lock,
  Coins,
  Sparkles,
  TrendingUp,
  Heart,
  Activity,
  Zap,
  Star,
  Clock,
  Palette,
  Ban,
  Shield,
  MapPin,
  Hash,
  Utensils,
  Briefcase,
  Target,
  Users,
  Moon,
  KeyRound,
  Brain,
  Film,
  Map,
  Lightbulb,
} from "lucide-react"
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

  const sectionMeta = {
    overall: { title: "오늘의 바이브 ☁️", icon: Star, gradient: "from-amber-400 to-orange-500" },
    money: { title: "머니 컨디션 💸", icon: Coins, gradient: "from-emerald-400 to-green-500" },
    love: { title: "심쿵 시그널 ❤️", icon: Heart, gradient: "from-pink-400 to-rose-500" },
    health: { title: "에너지 수치 🔋", icon: Activity, gradient: "from-cyan-400 to-teal-500" },
  } as const

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
  const todayLuckChart = resultSummary?.today_luck_chart?.pillars ? resultSummary.today_luck_chart : null

  const renderTodayFlow = () => {
    if (!todayLuckChart) return null
    const p = todayLuckChart.pillars
    const cols = [
      { key: "daewoon", label: "대운", v: p.daewoon, shinsal: todayLuckChart.labels?.daewoon },
      { key: "year", label: "연운", v: p.year, shinsal: todayLuckChart.labels?.year },
      { key: "month", label: "월운", v: p.month, shinsal: todayLuckChart.labels?.month },
      { key: "day", label: "일운", v: p.day, shinsal: todayLuckChart.labels?.day },
    ] as const

    const stemBg = (el?: string) => {
      switch (el) {
        case "목":
          return "bg-emerald-500/15"
        case "화":
          return "bg-rose-500/20"
        case "토":
          return "bg-amber-400/35"
        case "금":
          return "bg-slate-400/25"
        case "수":
          return "bg-sky-500/20"
        default:
          return "bg-muted/30"
      }
    }

    const branchBg = (el?: string) => {
      switch (el) {
        case "목":
          return "bg-emerald-500/10"
        case "화":
          return "bg-rose-500/10"
        case "토":
          return "bg-amber-400/20"
        case "금":
          return "bg-slate-400/15"
        case "수":
          return "bg-sky-500/12"
        default:
          return "bg-muted/20"
      }
    }

    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-card-foreground">오늘의 흐름</h4>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60">
          <div className="grid grid-cols-4">
            {cols.map((c) => (
              <div
                key={c.key}
                className="border-r border-border/60 last:border-r-0 bg-muted/10 px-2 py-2 text-center"
              >
                <div className="text-[11px] font-semibold text-muted-foreground">{c.label}</div>
              </div>
            ))}

            {cols.map((c) => (
              <div
                key={`${c.key}-stem`}
                className={`border-r border-border/60 last:border-r-0 px-2 py-3 text-center ${stemBg(
                  c.v?.stem_element,
                )}`}
              >
                <div className="text-xl font-extrabold tracking-wide text-card-foreground">
                  {c.v ? c.v.stem_hanja : "—"}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{c.v ? c.v.stem_kor : ""}</div>
              </div>
            ))}

            {cols.map((c) => (
              <div
                key={`${c.key}-branch`}
                className={`border-r border-border/60 last:border-r-0 px-2 py-3 text-center ${branchBg(
                  c.v?.branch_element,
                )}`}
              >
                <div className="text-xl font-extrabold tracking-wide text-card-foreground">
                  {c.v ? c.v.branch_hanja : "—"}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{c.v ? c.v.branch_kor : ""}</div>
              </div>
            ))}

            {cols.map((c) => (
              <div
                key={`${c.key}-shinsal`}
                className="border-r border-border/60 last:border-r-0 bg-background px-2 py-2 text-center"
              >
                <div className="text-[11px] font-semibold text-muted-foreground">{c.shinsal ? String(c.shinsal) : ""}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
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

          {/* (요청사항) 사주 표는 제거. 오늘의 흐름은 '분석 근거' 하단에서 노출 */}

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
          <Card className="border-none glass shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <Accordion type="single" collapsible defaultValue="summary" className="w-full">
                {/* 갓생 운세 요약 */}
                <AccordionItem value="summary" className="px-0">
                  <AccordionTrigger className="px-4 py-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-white/10 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                        <Sparkles className="h-4.5 w-4.5 text-white" />
                      </div>
                      <span className="text-base font-black tracking-tight text-card-foreground">갓생 운세 요약 📌</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-2">
                    <Accordion type="single" collapsible defaultValue="overall" className="w-full">
                      {(
                        [
                          { key: "overall", text: sections?.overall, score: scores.overall, meta: sectionMeta.overall },
                          { key: "money", text: sections?.money, score: scores.money, meta: sectionMeta.money },
                          { key: "love", text: sections?.love, score: scores.love, meta: sectionMeta.love },
                          { key: "health", text: sections?.health, score: scores.health, meta: sectionMeta.health },
                        ] as const
                      ).map(({ key, text, score, meta }) => {
                        const IconComponent = meta.icon
                        const gradient = meta.gradient
                        const scoreNum = typeof score === "number" ? score : 0
                        const pills = scoreToPills(scoreNum)

                        const ev = (() => {
                          // @ts-ignore
                          const arr = sectionEvidence?.[key]
                          return Array.isArray(arr) ? arr.slice(0, 2) : []
                        })()

                        const t = typeof text === "string" ? text.trim() : ""
                        const raw = typeof resultSummary?.raw === "string" ? resultSummary.raw.trim() : ""
                        const fallback = t || raw || "요약을 불러오는 중이야. 잠깐만 기다려줘."

                        return (
                          <AccordionItem key={key} value={key} className="px-4">
                            <AccordionTrigger className="py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}
                                >
                                  <IconComponent className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-card-foreground">{meta.title}</span>
                                  <span className="text-xs text-muted-foreground">{scoreNum}점</span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0">
                              <div className="rounded-2xl bg-muted/15 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-3xl font-extrabold tracking-tight text-foreground">{scoreNum}</div>
                                  <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span
                                        key={i}
                                        className={`h-2 w-2 rounded-full transition-all ${
                                          i < pills ? `bg-gradient-to-br ${gradient}` : "bg-muted"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{fallback}</p>
                                {ev.length > 0 && (
                                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground/90">
                                    {ev.map((e: any, idx: number) => (
                                      <li key={idx} className="flex gap-2 leading-relaxed">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500/60 shrink-0" />
                                        <span className="whitespace-pre-line">{String(e)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}

                      {/* Spine chill */}
                      {spine?.prediction && (
                        <AccordionItem value="spine" className="px-4">
                          <AccordionTrigger className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-sm">
                                <Zap className="h-4.5 w-4.5 text-white" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-card-foreground">소름포인트 ⚡️</span>
                                <span className="text-xs text-muted-foreground">{spine.time_window ?? ""}</span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4">
                              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{spine.prediction}</p>
                              {spine.verification && (
                                <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                                  <Target className="h-3.5 w-3.5 text-violet-500" />
                                  <span className="text-xs text-muted-foreground">{spine.verification}</span>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* 오늘의 키워드 (해시태그) */}
                      <AccordionItem value="today_keywords" className="px-4">
                        <AccordionTrigger className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-sm">
                              <KeyRound className="h-4.5 w-4.5 text-white" />
                            </div>
                            <span className="text-sm font-bold text-card-foreground">오늘의 키워드 🗝️</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <div className="rounded-2xl bg-muted/15 p-4">
                              {todayKeywords.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {todayKeywords.map((k) => (
                                    <span
                                      key={k}
                                      className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200"
                                    >
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">오늘의 키워드를 불러오는 중이야.</p>
                              )}
                            </div>

                            <div className="rounded-2xl bg-muted/10 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-card-foreground">오늘의 치트키 9</span>
                                <span className="text-[11px] text-muted-foreground">한눈에 보기</span>
                              </div>

                              {keyItems.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                  {keyItems.map(([label, obj, IconComponent, gradient]) => (
                                    <Card key={label} className="border-none glass shadow-sm card-mystical overflow-hidden">
                                      <CardContent className="p-3 text-center">
                                        <div
                                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-sm mb-2`}
                                        >
                                          <IconComponent className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-medium mb-0.5">{label}</div>
                                        <div className="text-xs font-bold text-card-foreground truncate">{obj?.value ?? "-"}</div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">오늘의 치트키를 불러오는 중이야.</p>
                              )}
                            </div>
                          </div>
</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>

                {/* 프리미엄 퍼스널 알고리즘 */}
                <AccordionItem value="premium_algo" className="px-0">
                  <AccordionTrigger className="px-4 py-5 bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-transparent border-b border-white/10 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-sm">
                        <Lightbulb className="h-4.5 w-4.5 text-white" />
                      </div>
                      <span className="text-base font-black tracking-tight text-card-foreground">프리미엄 퍼스널 알고리즘 💡</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-muted/15 p-4">
                        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                          차원이 다른 깊이로, 동양의 사주 명리학과 서양의 점성술 데이터를 교차 분석하여 도출된, 퍼스널 알고리즘 솔루션입니다.
                        </p>
                      </div>

                      {/* 엽전 / 열어보기 */}
                      {!isDetailUnlocked ? (
                        <div className="space-y-3">
                          <div className="rounded-2xl bg-muted/15 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground">필요 엽전</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Coins className="h-5 w-5 text-amber-500" />
                                  <span className="text-xl font-bold text-card-foreground">1닢</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">보유 엽전</div>
                                <div className="mt-0.5">
                                  <span
                                    className={`text-xl font-bold ${
                                      coins >= 1
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400"
                                    }`}
                                  >
                                    {coins}닢
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {coins >= 1 ? (
                            <Button
                              onClick={() => onUnlockDetail(resultId)}
                              className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold shadow-xl hover:shadow-2xl transition-all"
                            >
                              <span className="relative flex items-center justify-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                열어보기
                              </span>
                            </Button>
                          ) : (
                            <Button
                              onClick={onOpenCoinPurchase}
                              className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold shadow-xl hover:shadow-2xl transition-all"
                            >
                              <span className="relative flex items-center justify-center gap-2">
                                <Coins className="h-5 w-5" />
                                엽전 충전하기
                              </span>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-emerald-500/10 p-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">프리미엄이 열렸어요</span>
                          </div>
                        </div>
                      )}

                      {/* Premium accordion list (locked by default) */}
                      <div className="overflow-hidden rounded-xl border border-border/60">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="p_keys" disabled={!isDetailUnlocked} className="px-4">
                            <AccordionTrigger className={`py-4 ${!isDetailUnlocked ? "pointer-events-none opacity-70" : ""}`}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-sm">
                                  <KeyRound className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-card-foreground">🔑 오늘의 운빨 치트키</span>
                                  {!isDetailUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-3 gap-2">
                                {keyItems.map(([label, obj, IconComponent, gradient]) => (
                                  <Card key={label} className="border-none glass shadow-sm card-mystical overflow-hidden">
                                    <CardContent className="p-3 text-center">
                                      <div
                                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-sm mb-2`}
                                      >
                                        <IconComponent className="h-4 w-4 text-white" />
                                      </div>
                                      <div className="text-[10px] text-muted-foreground font-medium mb-0.5">{label}</div>
                                      <div className="text-xs font-bold text-card-foreground truncate">{obj?.value ?? "-"}</div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="p_mind" disabled={!isDetailUnlocked} className="px-4">
                            <AccordionTrigger className={`py-4 ${!isDetailUnlocked ? "pointer-events-none opacity-70" : ""}`}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-sm">
                                  <Brain className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-card-foreground">🧠 나만 몰랐던 내 마음</span>
                                  {!isDetailUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="rounded-2xl bg-muted/15 p-4">
                                <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                                  {resultDetail?.mind_text ?? "프리미엄 결제 후, 이 항목의 상세 분석이 제공돼요."}
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="p_highlight" disabled={!isDetailUnlocked} className="px-4">
                            <AccordionTrigger className={`py-4 ${!isDetailUnlocked ? "pointer-events-none opacity-70" : ""}`}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                                  <Film className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-card-foreground">🎬 미리 보는 하이라이트</span>
                                  {!isDetailUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="rounded-2xl bg-muted/15 p-4">
                                <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                                  {resultDetail?.detail_text ?? resultDetail?.detail ?? "프리미엄 결제 후, 이 항목의 상세 분석이 제공돼요."}
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="p_mood" disabled={!isDetailUnlocked} className="px-4">
                            <AccordionTrigger className={`py-4 ${!isDetailUnlocked ? "pointer-events-none opacity-70" : ""}`}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 shadow-sm">
                                  <Map className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-card-foreground">🗺️ 시간대별 무드 세팅</span>
                                  {!isDetailUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="rounded-2xl bg-muted/15 p-4">
                                <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                                  {resultDetail?.mood_text ?? "프리미엄 결제 후, 이 항목의 상세 분석이 제공돼요."}
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="p_evidence" disabled={!isDetailUnlocked} className="px-4">
                            <AccordionTrigger className={`py-4 ${!isDetailUnlocked ? "pointer-events-none opacity-70" : ""}`}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-sm">
                                  <Moon className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-card-foreground">🌙 분석근거</span>
                                  {!isDetailUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                {resultSummary?.saju_brief && (
                                  <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                                      <span className="text-xs font-bold text-violet-700 dark:text-violet-300">사주 분석</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                      {resultSummary.saju_brief}
                                    </p>
                                  </div>
                                )}

                                {resultSummary?.astro_brief && (
                                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <Star className="h-3.5 w-3.5 text-blue-500" />
                                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">별자리 분석</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                      {resultSummary.astro_brief}
                                    </p>
                                  </div>
                                )}

                                {/* 오늘의 흐름은 분석근거 하단 */}
                                {renderTodayFlow()}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
