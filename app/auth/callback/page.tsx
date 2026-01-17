"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // 세션 확인 후 홈으로 이동
    supabase.auth.getSession().finally(() => {
      router.replace("/")
    })
  }, [router])

  return <div style={{ padding: 24 }}>로그인 처리 중...</div>
}
