"use client"

import { useEffect, useState } from "react"
import LoginScreen from "../components/login-screen" // 경로가 다르면 맞춰줘
import MainScreen from "../components/main-screen"   // 너 메인 컴포넌트가 있으면 사용
import { supabase } from "../lib/supabaseClient"

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    // 1) 최초 접속 시 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
      setLoading(false)
    })

    // 2) 로그인/로그아웃 상태 변화 실시간 반영
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
      setLoading(false)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>

  // ✅ 로그인 되었으면 메인, 아니면 로그인 화면
  if (isAuthed) {
    return <MainScreen />
  }

  // ✅ LoginScreen은 이제 onLogin 필요 없어도 되는데,
  // 너 파일이 onLogin props를 요구하니까 임시로 빈 함수 전달
  return <LoginScreen onLogin={() => {}} />
}
