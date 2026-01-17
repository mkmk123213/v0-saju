"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // 로그인 성공 후 이 페이지로 돌아오면 홈으로 보내기
    router.replace("/")
  }, [router])

  return <div style={{ padding: 24 }}>로그인 처리 중...</div>
}
