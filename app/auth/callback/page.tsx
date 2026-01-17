"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        const error = params.get("error")
        const errorDescription = params.get("error_description")

        if (error) {
          console.error("OAuth error:", error, errorDescription)
          alert(errorDescription || "로그인 중 오류가 발생했어요.")
          router.replace("/")
          return
        }

        // ✅ 핵심: code -> session 교환
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error("exchangeCodeForSession error:", exchangeError)
            alert("로그인 세션 생성에 실패했어요. 다시 시도해 주세요.")
          }
        }

        // ✅ 홈으로 이동 (여기서 page.tsx의 getSession/onAuthStateChange가 main으로 보내줌)
        router.replace("/")
      } catch (e) {
        console.error(e)
        router.replace("/")
      }
    }

    run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">로그인 처리 중...</p>
    </div>
  )
}
