"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Star, Sparkles } from "lucide-react"
import type { SajuInput } from "@/app/page"
import { getSunSignFromBirthDate } from "@/lib/astro"
import { getZodiacAnimal } from "@/lib/saju-lite"

interface YearlyFortuneResultScreenProps {
  sajuInput: SajuInput
  year: number
  resultSummary?: any
  onBack: () => void
}

export default function YearlyFortuneResultScreen({
  sajuInput,
  year,
  resultSummary,
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

        </div>
      </div>
    </div>
  )
}
