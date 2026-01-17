"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, Sparkles } from "lucide-react"

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 relative overflow-hidden starfield">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-accent/12 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-primary/12 to-accent/8 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm space-y-12 text-center relative z-10">
        {/* Logo & Title */}
        <div className="space-y-8">
          <div className="mx-auto relative w-28 h-28 flex items-center justify-center">
            {/* Outer zodiac ring */}
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_30s_linear_infinite]">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/60" />
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent/50" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/40" />
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-accent/60" />
            </div>
            {/* Inner logo */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-cosmic shadow-xl animate-float relative">
              <div className="absolute inset-0 rounded-full animate-pulse-glow" />
              <span className="font-serif text-3xl text-white drop-shadow-md">命</span>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight gradient-text">너의 운명은</h1>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary/70 animate-twinkle" />
              <p className="text-muted-foreground text-sm">사주와 별자리가 만나는 곳</p>
              <Sparkles className="h-3.5 w-3.5 text-accent/70 animate-twinkle" style={{ animationDelay: "1s" }} />
            </div>
          </div>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <Button
            onClick={onLogin}
            className="h-14 w-full gap-3 rounded-2xl bg-kakao text-kakao-foreground hover:bg-kakao/90 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" />
            카카오톡으로 시작하기
          </Button>
          <Button
            onClick={onLogin}
            className="h-14 w-full gap-3 rounded-2xl bg-white text-gray-700 hover:bg-gray-50 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border border-gray-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 시작하기
          </Button>
          <p className="text-xs text-muted-foreground/50 mt-4">
            로그인 시 서비스 이용약관에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
