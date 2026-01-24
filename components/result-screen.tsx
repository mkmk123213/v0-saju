"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Share2, Coins, Lock, Sparkles, Moon } from "lucide-react"
import type { SajuInput } from "@/app/page"

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
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }

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
          {/* User Info Summary */}
          <div className="text-center space-y-1 pt-2">
            <p className="font-bold text-lg text-foreground">{sajuInput.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(sajuInput.birthDate)} · {sajuInput.gender === "male" ? "남성" : "여성"} ·{" "}
              {sajuInput.calendarType === "solar" ? "양력" : "음력"}
            </p>
          </div>

          {/* Four Pillars */}
          <Card className="border-none glass shadow-lg overflow-hidden">
            <div className="gradient-cosmic px-5 py-3">
              <h3 className="font-bold text-white text-center">사주팔자</h3>
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
          <Card className="border-none glass shadow-lg">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-bold text-foreground">운세 요약</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{resultSummary?.summary_text ?? "요약을 생성 중이에요..."}</p>
            </CardContent>
          </Card>

          {isDetailUnlocked ? (
            <Card className="border-none glass shadow-lg">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-foreground">상세 운명 풀이</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground">성격과 적성</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {(resultDetail?.combined?.strengths?.length ? resultDetail.combined.strengths.join(" · ") : resultDetail?.combined?.core_theme) ?? "상세 풀이를 불러왔어요. 아래 내용을 확인해보세요."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground">재물운</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {resultDetail?.sections?.money?.text ?? "재물운 상세를 불러오지 못했어요."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground">건강운</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {resultDetail?.sections?.health?.text ?? "건강운 상세를 불러오지 못했어요."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground">{year}년 운세</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {resultDetail?.sections?.career?.text ?? "올해 운세 상세를 불러오지 못했어요."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none overflow-hidden shadow-xl relative">
              <div className="absolute inset-0 gradient-cosmic opacity-10" />
              <CardContent className="p-6 space-y-5 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-cosmic flex items-center justify-center shadow-lg animate-pulse-glow">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">상세 운명 풀이</h3>
                    <p className="text-xs text-muted-foreground">나만의 운명 지도를 확인하세요</p>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>성격과 적성 분석</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>재물운 & 건강운</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{year}년 상세 운세</span>
                  </div>
                </div>

                {coins >= 9 ? (
                  <Button
                    onClick={() => onUnlockDetail(resultId)}
                    className="w-full h-14 rounded-2xl gradient-cosmic text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                  >
                    <span className="animate-shimmer absolute inset-0 rounded-2xl" />
                    <span className="relative flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5" />
                      엽전 9닢으로 운명보기 🔥
                    </span>
                  </Button>
                ) : (
                  <Button
                    onClick={onOpenCoinPurchase}
                    className="w-full h-14 rounded-2xl gradient-cosmic text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow relative overflow-hidden"
                  >
                    <span className="animate-shimmer absolute inset-0 rounded-2xl" />
                    <span className="relative flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5" />
                      엽전 환전하기 (900원) 🔥
                    </span>
                  </Button>
                )}

                <p className="text-center text-xs text-muted-foreground">9개의 엽전으로 상세 풀이를 확인하세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
