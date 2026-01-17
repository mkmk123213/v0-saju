'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      router.replace('/') // 로그인 후 보낼 곳 (원하면 변경)
    })
  }, [router])

  return <div style={{ padding: 24 }}>로그인 처리 중...</div>
}
