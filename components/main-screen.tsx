"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, Sparkles, Heart, Coins, Sun, Star, Moon } from "lucide-react"

interface MainScreenProps {
  coins: number
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onStartSaju: () => void
  onStartDailyFortune: () => void
  onStartYearlyFortune: () => void
  onLogout: () => void
  onOpenCoinPurchase: () => void
  userName: string
}

export default function MainScreen({
  userName,
  coins,
  isDarkMode,
  onToggleDarkMode,
  onStartSaju,
  onStartDailyFortune,
  onStartYearlyFortune,
  onLogout,
  onOpenCoinPurchase,
}: MainScreenProps) {
  const today = new Date()
  const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}`

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden starfield">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-0 w-64 h-64 rounded-full bg-primary/12 blur-[80px]" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-accent/10 blur-[80px]" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-violet-500/8 to-cyan-500/5 blur-[60px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Moon className="h-4 w-4 text-primary/80" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent/60 animate-twinkle" />
          </div>
          <h1 className="text-lg font-bold gradient-text">너의 운명은</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark/Light Mode Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            className="rounded-full h-8 w-8 hover:bg-muted glass"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
          </Button>
          <Button
            variant="ghost"
            className="flex items-center gap-1.5 rounded-full glass px-3 py-2 h-auto hover:bg-primary/10"
            onClick={onOpenCoinPurchase}
          >
            <div className="w-4 h-4 rounded-full gradient-gold flex items-center justify-center">
              <Coins className="h-2.5 w-2.5 text-amber-900" />
            </div>
            <span className="font-semibold text-sm text-foreground">{coins}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-full h-8 w-8 hover:bg-muted">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-5 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-6">
          {/* Welcome Message */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary/60 animate-twinkle" />
              <p className="text-xs text-muted-foreground font-medium">
                {userName ? `${userName}님 환영합니다` : "환영합니다"}
              </p>
            </div>
            <h2 className="text-xl font-bold text-foreground leading-tight">
              당신의 <span className="gradient-text"> 운명</span>을 확인해보세요 🔥
            </h2>
          </div>

          {/* Service Cards */}
          <div className="space-y-3">
            {/* 오늘의 운세 */}
            <Card
              className="cursor-pointer border-none glass shadow-md transition-all card-mystical overflow-hidden"
              onClick={onStartDailyFortune}
            >
              <CardContent className="flex items-center gap-4 p-4 relative">
                <div className="absolute top-2 right-2 opacity-20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="4" cy="4" r="1.5" fill="currentColor" className="text-amber-300" />
                    <circle cx="20" cy="8" r="1" fill="currentColor" className="text-amber-300" />
                    <circle cx="12" cy="20" r="1.5" fill="currentColor" className="text-amber-300" />
                    <line
                      x1="4"
                      y1="4"
                      x2="20"
                      y2="8"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-amber-300/50"
                    />
                    <line
                      x1="20"
                      y1="8"
                      x2="12"
                      y2="20"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-amber-300/50"
                    />
                  </svg>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                  <Sun className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-card-foreground text-sm">오늘의 운세보기</h3>
                    <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {todayFormatted}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">오늘 하루의 운세를 확인하세요</p>
                </div>
              </CardContent>
            </Card>

            {/* 운명 보기 */}
            <Card
              className="cursor-pointer border-none glass shadow-md transition-all card-mystical overflow-hidden"
              onClick={onStartSaju}
            >
              <CardContent className="flex items-center gap-4 p-4 relative">
                <div className="absolute top-2 right-2 opacity-20">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="0.5" className="text-violet-300" />
                    <circle cx="6" cy="8" r="1.5" fill="currentColor" className="text-violet-300" />
                    <circle cx="22" cy="10" r="1" fill="currentColor" className="text-violet-300" />
                    <circle cx="14" cy="24" r="1.5" fill="currentColor" className="text-violet-300" />
                    <circle cx="8" cy="20" r="1" fill="currentColor" className="text-violet-300" />
                    <line x1="6" y1="8" x2="22" y2="10" stroke="currentColor" strokeWidth="0.5" className="text-violet-300/50" />
                    <line x1="22" y1="10" x2="14" y2="24" stroke="currentColor" strokeWidth="0.5" className="text-violet-300/50" />
                    <line x1="14" y1="24" x2="8" y2="20" stroke="currentColor" strokeWidth="0.5" className="text-violet-300/50" />
                    <line x1="8" y1="20" x2="6" y2="8" stroke="currentColor" strokeWidth="0.5" className="text-violet-300/50" />
                  </svg>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-cosmic shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-card-foreground text-sm">운명 보기</h3>
                    <span className="rounded-full gradient-primary px-2 py-0.5 text-[10px] font-bold text-white">2026년</span>
                  </div>
                  <p className="text-xs text-muted-foreground">생년월일로 알아보는 나의 운명</p>
                </div>
              </CardContent>
            </Card>

            {/* 운세 보기 */}
            <Card
              className="cursor-pointer border-none glass shadow-md transition-all card-mystical overflow-hidden"
              onClick={onStartYearlyFortune}
            >
              <CardContent className="flex items-center gap-4 p-4 relative">
                <div className="absolute top-2 right-2 opacity-20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="4" r="1.5" fill="currentColor" className="text-cyan-300" />
                    <circle cx="4" cy="16" r="1" fill="currentColor" className="text-cyan-300" />
                    <circle cx="20" cy="18" r="1.5" fill="currentColor" className="text-cyan-300" />
                    <line x1="12" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="0.5" className="text-cyan-300/50" />
                    <line x1="12" y1="4" x2="20" y2="18" stroke="currentColor" strokeWidth="0.5" className="text-cyan-300/50" />
                  </svg>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-400 shadow-md">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-card-foreground text-sm">운세 보기</h3>
                    <span className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white">2026년</span>
                  </div>
                  <p className="text-xs text-muted-foreground">2026년 한 해 운세를 알아보세요</p>
                </div>
              </CardContent>
            </Card>

            {/* 궁합 보기 (준비중) */}
            <Card className="cursor-not-allowed border-none glass shadow-sm opacity-40">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/30">
                  <Heart className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-card-foreground/50 text-sm">궁합 보기</h3>
                    <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60">준비중</span>
                  </div>
                  <p className="text-xs text-muted-foreground/50">두 사람의 운명적 궁합 분석</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
