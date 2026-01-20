"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Star, Lock, Coins, Sparkles } from "lucide-react"
import type { SajuInput } from "@/app/page"

interface YearlyFortuneResultScreenProps {
  sajuInput: SajuInput
  year: number
  isDetailUnlocked: boolean
  coins: number
  resultId: string
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
  onUnlockDetail,
  onOpenCoinPurchase,
  onBack,
}: YearlyFortuneResultScreenProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }

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
                    <h2 className="text-xl font-bold">{sajuInput.name}님</h2>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">{year}년 운세</span>
                  </div>
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
              <h3 className="font-bold text-card-foreground">{year}년 운세 요약</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">총운</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-full ${i <= 4 ? "bg-gradient-to-r from-sky-400 to-cyan-500" : "bg-muted"}`}
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
                        className={`h-2 w-6 rounded-full ${i <= 3 ? "bg-gradient-to-r from-sky-400 to-cyan-500" : "bg-muted"}`}
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
                        className={`h-2 w-6 rounded-full ${i <= 4 ? "bg-gradient-to-r from-sky-400 to-cyan-500" : "bg-muted"}`}
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
                        className={`h-2 w-6 rounded-full ${i <= 5 ? "bg-gradient-to-r from-sky-400 to-cyan-500" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {year}년은 새로운 도전과 성장의 해입니다. 상반기에는 안정을 추구하고, 하반기에는 적극적으로 기회를
                잡아보세요.
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
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">1분기 (1-3월)</h4>
                    <p>
                      새해의 시작과 함께 새로운 계획을 세우기 좋은 시기입니다. 건강 관리에 신경 쓰고 무리하지 마세요.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">2분기 (4-6월)</h4>
                    <p>재물운이 상승하는 시기입니다. 투자나 새로운 사업 기회가 찾아올 수 있으니 신중하게 판단하세요.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">3분기 (7-9월)</h4>
                    <p>인간관계가 활발해지는 시기입니다. 좋은 인연을 만날 수 있으니 적극적으로 나서보세요.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">4분기 (10-12월)</h4>
                    <p>한 해를 마무리하며 성과를 정리하는 시기입니다. 다음 해를 위한 준비도 함께 시작해보세요.</p>
                  </div>
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
