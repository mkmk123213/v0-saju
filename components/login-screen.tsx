"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface LoginScreenProps {
  // 기존 구조 유지 (필요 없으면 나중에 제거 가능)
  onLogin?: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  async function loginWithKakao() {
    // (선택) 기존 onLogin 훅이 있으면 같이 호출
    onLogin?.()

    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  async function loginWithGoogle() {
    onLogin?.()

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

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
              <Sparkles
                className="h-3.5 w-3.5 text-accent/70 animate-twinkle"
                style={{ animationDelay: "1s" }}
              />
            </div>
          </div>
        </div>

        {/* Login Buttons */}
        <div className="space-y-4">
          {/* ✅ 카카오 */}
          <Button
            onClick={loginWithKakao}
            className="h-14 w-full gap-3 rounded-2xl bg-kakao text-kakao-foreground hover:bg-kakao/90 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" />
            카카오톡으로 시작하기
          </Button>

          {/* ✅ 구글 (추가) */}
          <Button
            onClick={loginWithGoogle}
            variant="outline"
            className="h-14 w-full gap-3 rounded-2xl text-base font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Google로 시작하기
          </Button>

          <p className="text-xs text-muted-foreground/50">
            로그인 시 서비스 이용약관에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
