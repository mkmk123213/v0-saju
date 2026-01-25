"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Share2, Coins, Lock, Sparkles, Moon, Calendar, User, Stars } from "lucide-react"
import type { SajuInput } from "@/app/page"
import { getSunSignFromBirthDate } from "@/lib/astro"
import { getZodiacAnimal } from "@/lib/saju-lite"

interface ResultScreenProps {
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

export default function ResultScreen({
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
}: ResultScreenProps) {
  const safeText = (v: any) => {
    if (v == null) return ""
    if (typeof v === "string") return v
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }

  const pickSummaryText = (obj: any) => {
    if (!obj) return ""
    // create-summary 기본 포맷
    if (typeof obj.summary_text === "string" && obj.summary_text.trim()) return obj.summary_text
    // 혹시 다른 키로 내려오는 경우(호환)
    if (typeof obj.summary === "string" && obj.summary.trim()) return obj.summary
    if (typeof obj.text === "string" && obj.text.trim()) return obj.text
    // sections 기반이면 overall부터 합치기
    const sec = obj.sections
    if (sec && (sec.overall?.text || sec.money?.text || sec.love?.text || sec.health?.text)) {
      const parts = [
        sec.overall?.text ? `총운: ${sec.overall.text}` : "",
        sec.money?.text ? `금전운: ${sec.money.text}` : "",
        sec.love?.text ? `애정운: ${sec.love.text}` : "",
        sec.health?.text ? `건강운: ${sec.health.text}` : "",
      ].filter(Boolean)
      return parts.join("\n\n")
    }
    return ""
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "생년월일 없음"
    // birthDate는 보통 YYYY-MM-DD 형태라서 안전하게 split
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, mo, da] = dateStr.split("-")
      return `${y}년 ${Number(mo)}월 ${Number(da)}일`
    }
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return String(dateStr)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  const zodiacAnimal = getZodiacAnimal(sajuInput?.birthDate ?? "")
  const sunSign = getSunSignFromBirthDate(sajuInput?.birthDate ?? "")
  const summaryText = pickSummaryText(resultSummary) || "요약을 불러오는 중이야…"
  const scores = resultSummary?.scores
  const overall = Number.isFinite(Number(scores?.overall)) ? Number(scores.overall) : null
  const money = Number.isFinite(Number(scores?.money)) ? Number(scores.money) : null
  const love = Number.isFinite(Number(scores?.love)) ? Number(scores.love) : null
  const health = Number.isFinite(Number(scores?.health)) ? Number(scores.health) : null

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden starfield">
      {/* Cosmic background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-accent/15 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-primary" />
          <h1 className="font-bold text-foreground">운명 결과</h1>
          <span className="rounded-full gradient-primary px-2.5 py-0.5 text-xs font-bold text-white">{year}년</span>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
          <Share2 className="h-5 w-5" />
        </Button>
      </header>

      {/* Result Content */}
      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-6">
          {/* Profile Card (예전 카드 톤으로 복구) */}
          <Card className="border-none glass shadow-sm card-mystical">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-card-foreground truncate">{sajuInput.name?.trim() ? sajuInput.name : "이름 없음"}</p>
                    <span className="shrink-0 rounded-full gradient-primary px-2 py-0.5 text-xs font-medium text-white">{year}년</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {isDetailUnlocked ? "상세 해금됨" : "요약"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(sajuInput.birthDate)} · {sajuInput.gender === "male" ? "남성" : "여성"} · {sajuInput.calendarType === "solar" ? "양력" : "음력"}
                  </p>
                </div>
              </div>

              {(zodiacAnimal || sunSign) && (
                <div className="flex flex-wrap items-center gap-2">
                  {zodiacAnimal && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Stars className="h-3 w-3 text-primary" />
                      {zodiacAnimal}
                    </span>
                  )}
                  {sunSign && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />
                      {sunSign}
                    </span>
                  )}
                </div>
              )}

              {(overall != null || money != null || love != null || health != null) && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
                    <div className="text-[11px] text-muted-foreground">총운</div>
                    <div className="mt-0.5 text-sm font-semibold text-card-foreground">{overall ?? "-"}</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
                    <div className="text-[11px] text-muted-foreground">금전</div>
                    <div className="mt-0.5 text-sm font-semibold text-card-foreground">{money ?? "-"}</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
                    <div className="text-[11px] text-muted-foreground">애정</div>
                    <div className="mt-0.5 text-sm font-semibold text-card-foreground">{love ?? "-"}</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
                    <div className="text-[11px] text-muted-foreground">건강</div>
                    <div className="mt-0.5 text-sm font-semibold text-card-foreground">{health ?? "-"}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-none glass shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-card-foreground">운세 요약</h3>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">결과</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {summaryText}
              </p>
            </CardContent>
          </Card>

          {isDetailUnlocked ? (
            <Card className="border-none glass shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-card-foreground">상세 운명 풀이</h3>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">해금</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-card-foreground">성격과 적성</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {safeText(
                        (resultDetail?.combined?.strengths?.length ? resultDetail.combined.strengths.join(" · ") : resultDetail?.combined?.core_theme) ??
                          resultDetail?.sections?.overall?.text ??
                          "상세 풀이를 불러오는 중이야…"
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-card-foreground">재물운</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{safeText(resultDetail?.sections?.money?.text ?? "") || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-card-foreground">건강운</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{safeText(resultDetail?.sections?.health?.text ?? "") || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-card-foreground">{year}년 운세</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{safeText(resultDetail?.sections?.career?.text ?? "") || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none glass shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary/20">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-card-foreground">상세 운명 풀이</h3>
                    <p className="text-xs text-muted-foreground">엽전 9닢으로 상세 풀이를 확인할 수 있어</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-3">
                    <div className="text-sm text-muted-foreground">필요 엽전</div>
                    <div className="font-semibold text-card-foreground">9닢</div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-3">
                    <div className="text-sm text-muted-foreground">보유 엽전</div>
                    <div className="font-semibold text-card-foreground">{coins}닢</div>
                  </div>
                </div>

                {coins >= 9 ? (
                  <Button onClick={() => onUnlockDetail(resultId)} className="w-full h-12 rounded-xl gradient-cosmic text-white font-medium shadow-lg">
                    <span className="flex items-center justify-center gap-2">
                      <Coins className="h-4 w-4" />
                      엽전 9닢으로 상세 보기
                    </span>
                  </Button>
                ) : (
                  <Button onClick={onOpenCoinPurchase} className="w-full h-12 rounded-xl gradient-cosmic text-white font-medium shadow-lg">
                    <span className="flex items-center justify-center gap-2">
                      <Coins className="h-4 w-4" />
                      엽전 환전하기
                    </span>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
