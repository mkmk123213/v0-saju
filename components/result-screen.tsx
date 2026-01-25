"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Share2, Sparkles, Moon, Calendar, User, Stars } from "lucide-react"
import type { SajuInput } from "@/app/page"
import { getSunSignFromBirthDate } from "@/lib/astro"
import { getZodiacAnimal } from "@/lib/saju-lite"

interface ResultScreenProps {
  sajuInput: SajuInput
  year: number
  resultSummary?: any
  onBack: () => void
}

export default function ResultScreen({
  sajuInput,
  year,
  resultSummary,
  onBack,
}: ResultScreenProps) {
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
          {/* Hero */}
          <Card className="border-none overflow-hidden shadow-xl glass">
            <div className="relative px-5 py-5 gradient-cosmic">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-3 right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 left-8 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
              </div>

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Stars className="h-4 w-4 text-white/90" />
                  <span className="text-sm font-medium text-white/90">{year}년 운명 보기</span>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                  요약 보기
                </span>
              </div>

              <div className="relative mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold text-white">{sajuInput.name?.trim() ? sajuInput.name : "이름 없음"}</p>
                  <p className="mt-0.5 text-xs text-white/80">선택한 프로필의 사주 결과</p>
                </div>
              </div>
            </div>

            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>생년월일</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(sajuInput.birthDate)}</p>
                </div>

                <div className="rounded-xl bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>성별</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{sajuInput.gender === "male" ? "남성" : "여성"}</p>
                </div>

                <div className="rounded-xl bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Moon className="h-3.5 w-3.5" />
                    <span>달력</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{sajuInput.calendarType === "solar" ? "양력" : "음력"}</p>
                </div>
              { (zodiacAnimal || sunSign) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {zodiacAnimal && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      <Stars className="h-3.5 w-3.5 text-primary" />
                      {zodiacAnimal}
                    </span>
                  )}
                  {sunSign && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {sunSign}
                    </span>
                  )}
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Four Pillars */}
          <Card className="border-none glass shadow-lg overflow-hidden">
            <div className="gradient-cosmic px-5 py-3">
              <div className="flex items-center justify-center gap-2"><h3 className="font-bold text-white text-center">사주팔자</h3><span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white/90">예시</span></div>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">시주</p>
                  <div className="space-y-1">
                    <div className="h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <span className="font-serif text-xl text-foreground">甲</span>
                    </div>
                    <div className="h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <span className="font-serif text-xl text-foreground">子</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">일주</p>
                  <div className="space-y-1">
                    <div className="h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                      <span className="font-serif text-xl text-white">乙</span>
                    </div>
                    <div className="h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                      <span className="font-serif text-xl text-white">丑</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">월주</p>
                  <div className="space-y-1">
                    <div className="h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <span className="font-serif text-xl text-foreground">丙</span>
                    </div>
                    <div className="h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <span className="font-serif text-xl text-foreground">寅</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">연주</p>
                  <div className="space-y-1">
                    <div className="h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <span className="font-serif text-xl text-foreground">丁</span>
                    </div>
                    <div className="h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <span className="font-serif text-xl text-foreground">卯</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-none glass shadow-lg overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">운세 요약</h3>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">무료</span>
              </div>
            </div>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {resultSummary?.summary_text ?? "요약을 생성 중이에요..."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
