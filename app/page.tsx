"use client"

import { supabase } from "@/lib/supabaseClient"
import { useEffect, useMemo, useState } from "react"

import LoginScreen from "@/components/login-screen"
import MainScreen from "@/components/main-screen"
import SajuInputScreen from "@/components/saju-input-screen"
import ResultScreen from "@/components/result-screen"
import ResultListScreen from "@/components/result-list-screen"
import CoinPurchaseScreen from "@/components/coin-purchase-screen"

import DailyFortuneInputScreen from "@/components/daily-fortune-input-screen"
import DailyFortuneResultScreen from "@/components/daily-fortune-result-screen"
import DailyFortuneListScreen from "@/components/daily-fortune-list-screen"

import YearlyFortuneInputScreen from "@/components/yearly-fortune-input-screen"
import YearlyFortuneResultScreen from "@/components/yearly-fortune-result-screen"
import YearlyFortuneListScreen from "@/components/yearly-fortune-list-screen"

type Screen =
  | "login"
  | "main"
  | "saju-input"
  | "result"
  | "result-list"
  | "coin-purchase"
  | "daily-fortune-list"
  | "daily-fortune-input"
  | "daily-fortune-result"
  | "yearly-fortune-list"
  | "yearly-fortune-input"
  | "yearly-fortune-result"

export interface SajuInput {
  name: string
  birthDate: string
  birthTime: string // 'unknown' | '23-01' ...
  gender: "male" | "female"
  calendarType: "solar" | "lunar"
}

export interface SavedProfile {
  id: string
  name: string
  birthDate: string
  birthTime: string
  gender: "male" | "female"
  calendarType: "solar" | "lunar"
}

export interface SajuResult {
  id: string // = readings.id (uuid)
  sajuInput: SajuInput
  createdAt: string
  year: number
  isDetailUnlocked: boolean
}

export interface DailyFortuneResult {
  id: string
  sajuInput: SajuInput
  createdAt: string
  date: string
  isDetailUnlocked: boolean
}

export interface YearlyFortuneResult {
  id: string
  sajuInput: SajuInput
  createdAt: string
  year: number
  isDetailUnlocked: boolean
}

type ReadingPublicRow = {
  id: string
  user_id: string
  profile_id: string | null
  type: "saju" | "daily" | "yearly"
  target_date: string | null
  target_year: number | null
  input_snapshot: any
  result_summary: any
  result_detail: any | null
  created_at: string
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [previousScreen, setPreviousScreen] = useState<Screen>("main")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([])

  const [savedResults, setSavedResults] = useState<SajuResult[]>([])
  const [selectedResult, setSelectedResult] = useState<SajuResult | null>(null)

  const [dailyFortuneResults, setDailyFortuneResults] = useState<DailyFortuneResult[]>([])
  const [selectedDailyResult, setSelectedDailyResult] = useState<DailyFortuneResult | null>(null)

  const [yearlyFortuneResults, setYearlyFortuneResults] = useState<YearlyFortuneResult[]>([])
  const [selectedYearlyResult, setSelectedYearlyResult] = useState<YearlyFortuneResult | null>(null)

  const [sajuInput, setSajuInput] = useState<SajuInput | null>(null)
  const [coins, setCoins] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [userName, setUserName] = useState<string>("")

  const now = useMemo(() => new Date(), [])
  const defaultYear = useMemo(() => now.getFullYear(), [now])

  // -----------------------------
  // UI: 다크모드
  // -----------------------------
  useEffect(() => {
    const saved = localStorage.getItem("sajuDarkMode")
    if (saved !== null) setIsDarkMode(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
    localStorage.setItem("sajuDarkMode", JSON.stringify(isDarkMode))
  }, [isDarkMode])

  // -----------------------------
  // Auth: 로그인 세션/이름
  // -----------------------------
  useEffect(() => {
    const applyUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        setUserName("")
        return
      }
      const meta: any = user.user_metadata || {}
      const name = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "손님")
      setUserName(String(name))
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsLoggedIn(true)
        setCurrentScreen("main")
        applyUser()
      } else {
        setIsLoggedIn(false)
        setCurrentScreen("login")
        setUserName("")
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true)
        setCurrentScreen("main")
        applyUser()
      } else {
        setIsLoggedIn(false)
        setCurrentScreen("login")
        setUserName("")
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // -----------------------------
  // DB: 공통 refresh
  // -----------------------------
  const refreshCoins = async () => {
    const { data, error } = await supabase.rpc("rpc_get_coin_balance")
    if (error) throw error
    setCoins((data ?? 0) as number)
  }

  const refreshProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,birth_date,birth_time_code,gender,calendar_type")
      .order("created_at", { ascending: false })
    if (error) throw error

    const mapped: SavedProfile[] =
      (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        birthDate: p.birth_date,
        birthTime: p.birth_time_code ?? "unknown",
        gender: p.gender,
        calendarType: p.calendar_type,
      })) ?? []

    setSavedProfiles(mapped)
  }

  const readingToSajuInput = (snap: any): SajuInput => ({
    name: String(snap?.name ?? ""),
    birthDate: String(snap?.birthDate ?? snap?.birth_date ?? ""),
    birthTime: String(snap?.birthTime ?? snap?.birth_time_code ?? "unknown"),
    gender: (snap?.gender === "female" ? "female" : "male") as "male" | "female",
    calendarType: (snap?.calendarType === "lunar" ? "lunar" : "solar") as "solar" | "lunar",
  })

  const refreshReadings = async () => {
    const { data, error } = await supabase
      .from("readings_public_view")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error

    const rows = (data ?? []) as ReadingPublicRow[]

    const saju: SajuResult[] = []
    const daily: DailyFortuneResult[] = []
    const yearly: YearlyFortuneResult[] = []

    for (const r of rows) {
      const input = readingToSajuInput(r.input_snapshot)
      const isUnlocked = r.result_detail != null

      if (r.type === "saju") {
        saju.push({
          id: r.id,
          sajuInput: input,
          createdAt: r.created_at,
          year: r.target_year ?? defaultYear,
          isDetailUnlocked: isUnlocked,
        })
      } else if (r.type === "daily") {
        daily.push({
          id: r.id,
          sajuInput: input,
          createdAt: r.created_at,
          date: r.target_date ?? new Date(r.created_at).toISOString().slice(0, 10),
          isDetailUnlocked: isUnlocked,
        })
      } else if (r.type === "yearly") {
        yearly.push({
          id: r.id,
          sajuInput: input,
          createdAt: r.created_at,
          year: r.target_year ?? defaultYear,
          isDetailUnlocked: isUnlocked,
        })
      }
    }

    setSavedResults(saju)
    setDailyFortuneResults(daily)
    setYearlyFortuneResults(yearly)
  }

  const refreshAll = async () => {
    await Promise.all([refreshCoins(), refreshProfiles(), refreshReadings()])
  }

  // 로그인되면 DB 로드
  useEffect(() => {
    if (!isLoggedIn) return
    refreshAll().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  // -----------------------------
  // Profiles: upsert (이름+생일 기준으로 “없으면 만들기”)
  // -----------------------------
  const upsertProfileFromInput = async (input: SajuInput) => {
    // 기존 프로필 있으면 그걸 사용
    const existing = savedProfiles.find((p) => p.name === input.name && p.birthDate === input.birthDate)
    if (existing) return existing.id

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        name: input.name,
        relationship: "self", // UI 추가되면 여기만 바꾸면 됨
        birth_date: input.birthDate,
        birth_time_code: input.birthTime ?? "unknown",
        gender: input.gender,
        calendar_type: input.calendarType,
      })
      .select("id")
      .single()

    if (error) throw error
    await refreshProfiles()
    return data.id as string
  }

  // -----------------------------
  // Auth handlers
  // -----------------------------
  const handleLogin = () => {}
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // -----------------------------
  // Navigation
  // -----------------------------
  const handleBackToMain = () => setCurrentScreen("main")
  const handleToggleDarkMode = () => setIsDarkMode((prev) => !prev)

  const handleOpenCoinPurchase = () => {
    setPreviousScreen(currentScreen)
    setCurrentScreen("coin-purchase")
  }
  const handleBackFromCoinPurchase = () => setCurrentScreen(previousScreen)

  // -----------------------------
  // Coin purchase (DEV): rpc_grant_coins
  // -----------------------------
  const handlePurchaseCoins = async (amount: number) => {
    try {
      const { error } = await supabase.rpc("rpc_grant_coins", { p_amount: amount })
      if (error) throw error
      await refreshCoins()
      setCurrentScreen(previousScreen)
    } catch (e) {
      console.error(e)
      setCurrentScreen(previousScreen)
    }
  }

  // -----------------------------
  // Saju flow
  // -----------------------------
  const handleStartSaju = () => {
    setSelectedResult(null)
    setCurrentScreen("result-list")
  }
  const handleNewSaju = () => {
    setSajuInput(null)
    setSelectedResult(null)
    setCurrentScreen("saju-input")
  }

  const handleSajuSubmit = async (input: SajuInput) => {
    try {
      setSajuInput(input)

      const profileId = await upsertProfileFromInput(input)

      // readings 저장 (요약/상세는 일단 플레이스홀더로)
      const { data, error } = await supabase
        .from("readings")
        .insert({
          profile_id: profileId,
          type: "saju",
          target_year: defaultYear,
          input_snapshot: input,
          result_summary: { text: "요약 생성 예정" },
          result_detail: null,
        })
        .select("id, created_at")
        .single()

      if (error) throw error

      await refreshReadings()

      // 방금 만든 결과를 선택
      const createdId = data.id as string
      const created = (savedResults.find((r) => r.id === createdId) ??
        ({
          id: createdId,
          sajuInput: input,
          createdAt: data.created_at,
          year: defaultYear,
          isDetailUnlocked: false,
        } as SajuResult))

      setSelectedResult(created)
      setCurrentScreen("result")
    } catch (e) {
      console.error(e)
    }
  }

  const handleViewResult = (result: SajuResult) => {
    setSelectedResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("result")
  }

  const handleBackToResultList = () => setCurrentScreen("result-list")

  const handleUnlockDetail = async (resultId: string) => {
    try {
      const { data, error } = await supabase.rpc("rpc_unlock_detail", { p_reading_id: resultId })
      if (error) throw error

      // unlocked / already_unlocked 모두 refresh 하면 됨
      await refreshAll()

      // 선택된 결과 최신화
      const updated = savedResults.find((r) => r.id === resultId)
      if (updated) setSelectedResult(updated)

      // (선택) insufficient_coins면 코인 구매 화면 유도
      if (data?.status === "insufficient_coins") {
        handleOpenCoinPurchase()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // -----------------------------
  // Daily fortune flow
  // -----------------------------
  const handleStartDailyFortune = () => {
    setSelectedDailyResult(null)
    setCurrentScreen("daily-fortune-list")
  }
  const handleNewDailyFortune = () => {
    setSajuInput(null)
    setSelectedDailyResult(null)
    setCurrentScreen("daily-fortune-input")
  }

  const handleDailyFortuneSubmit = async (input: SajuInput) => {
    try {
      setSajuInput(input)

      const profileId = await upsertProfileFromInput(input)
      const today = new Date().toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from("readings")
        .insert({
          profile_id: profileId,
          type: "daily",
          target_date: today,
          input_snapshot: input,
          result_summary: { text: "요약 생성 예정" },
          result_detail: null,
        })
        .select("id, created_at")
        .single()

      if (error) throw error

      await refreshReadings()

      const createdId = data.id as string
      const created = (dailyFortuneResults.find((r) => r.id === createdId) ??
        ({
          id: createdId,
          sajuInput: input,
          createdAt: data.created_at,
          date: today,
          isDetailUnlocked: false,
        } as DailyFortuneResult))

      setSelectedDailyResult(created)
      setCurrentScreen("daily-fortune-result")
    } catch (e) {
      console.error(e)
    }
  }

  const handleViewDailyResult = (result: DailyFortuneResult) => {
    setSelectedDailyResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("daily-fortune-result")
  }

  const handleUnlockDailyDetail = async (resultId: string) => {
    // DB 가격표/해금은 동일 RPC로 처리 (type=daily에 맞는 가격 적용)
    await handleUnlockDetail(resultId)
    const updated = dailyFortuneResults.find((r) => r.id === resultId)
    if (updated) setSelectedDailyResult(updated)
  }

  // -----------------------------
  // Yearly fortune flow
  // -----------------------------
  const handleStartYearlyFortune = () => {
    setSelectedYearlyResult(null)
    setCurrentScreen("yearly-fortune-list")
  }
  const handleNewYearlyFortune = () => {
    setSajuInput(null)
    setSelectedYearlyResult(null)
    setCurrentScreen("yearly-fortune-input")
  }

  const handleYearlyFortuneSubmit = async (input: SajuInput) => {
    try {
      setSajuInput(input)

      const profileId = await upsertProfileFromInput(input)

      const { data, error } = await supabase
        .from("readings")
        .insert({
          profile_id: profileId,
          type: "yearly",
          target_year: defaultYear,
          input_snapshot: input,
          result_summary: { text: "요약 생성 예정" },
          result_detail: null,
        })
        .select("id, created_at")
        .single()

      if (error) throw error

      await refreshReadings()

      const createdId = data.id as string
      const created = (yearlyFortuneResults.find((r) => r.id === createdId) ??
        ({
          id: createdId,
          sajuInput: input,
          createdAt: data.created_at,
          year: defaultYear,
          isDetailUnlocked: false,
        } as YearlyFortuneResult))

      setSelectedYearlyResult(created)
      setCurrentScreen("yearly-fortune-result")
    } catch (e) {
      console.error(e)
    }
  }

  const handleViewYearlyResult = (result: YearlyFortuneResult) => {
    setSelectedYearlyResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("yearly-fortune-result")
  }

  const handleUnlockYearlyDetail = async (resultId: string) => {
    await handleUnlockDetail(resultId)
    const updated = yearlyFortuneResults.find((r) => r.id === resultId)
    if (updated) setSelectedYearlyResult(updated)
  }

  return (
    <main className="min-h-screen bg-background">
      {currentScreen === "login" && <LoginScreen onLogin={handleLogin} />}

      {currentScreen === "main" && (
        <MainScreen
          userName={userName}
          coins={coins}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onStartSaju={handleStartSaju}
          onStartDailyFortune={handleStartDailyFortune}
          onStartYearlyFortune={handleStartYearlyFortune}
          onLogout={handleLogout}
          onOpenCoinPurchase={handleOpenCoinPurchase}
        />
      )}

      {/* 사주 */}
      {currentScreen === "result-list" && (
        <ResultListScreen results={savedResults} onNewSaju={handleNewSaju} onViewResult={handleViewResult} onBack={handleBackToMain} />
      )}

      {currentScreen === "saju-input" && (
        <SajuInputScreen savedProfiles={savedProfiles} onSubmit={handleSajuSubmit} onBack={() => setCurrentScreen("result-list")} />
      )}

      {currentScreen === "result" && (sajuInput || selectedResult) && (
        <ResultScreen
          sajuInput={selectedResult?.sajuInput || sajuInput!}
          year={selectedResult?.year || defaultYear}
          isDetailUnlocked={selectedResult?.isDetailUnlocked || false}
          coins={coins}
          resultId={selectedResult?.id || ""}
          onUnlockDetail={handleUnlockDetail}
          onOpenCoinPurchase={handleOpenCoinPurchase}
          onBack={handleBackToResultList}
        />
      )}

      {/* 코인 구매(DEV) */}
      {currentScreen === "coin-purchase" && <CoinPurchaseScreen onPurchase={handlePurchaseCoins} onBack={handleBackFromCoinPurchase} />}

      {/* 오늘의 운세 */}
      {currentScreen === "daily-fortune-list" && (
        <DailyFortuneListScreen
          results={dailyFortuneResults}
          onNewFortune={handleNewDailyFortune}
          onViewResult={handleViewDailyResult}
          onBack={handleBackToMain}
        />
      )}

      {currentScreen === "daily-fortune-input" && (
        <DailyFortuneInputScreen
          savedProfiles={savedProfiles}
          onSubmit={handleDailyFortuneSubmit}
          onBack={() => setCurrentScreen("daily-fortune-list")}
        />
      )}

      {currentScreen === "daily-fortune-result" && (sajuInput || selectedDailyResult) && (
        <DailyFortuneResultScreen
          sajuInput={selectedDailyResult?.sajuInput || sajuInput!}
          date={selectedDailyResult?.date || new Date().toISOString().slice(0, 10)}
          isDetailUnlocked={selectedDailyResult?.isDetailUnlocked || false}
          coins={coins}
          resultId={selectedDailyResult?.id || ""}
          onUnlockDetail={handleUnlockDailyDetail}
          onOpenCoinPurchase={handleOpenCoinPurchase}
          onBack={() => setCurrentScreen("daily-fortune-list")}
        />
      )}

      {/* 연간 운세 */}
      {currentScreen === "yearly-fortune-list" && (
        <YearlyFortuneListScreen
          results={yearlyFortuneResults}
          onNewFortune={handleNewYearlyFortune}
          onViewResult={handleViewYearlyResult}
          onBack={handleBackToMain}
        />
      )}

      {currentScreen === "yearly-fortune-input" && (
        <YearlyFortuneInputScreen
          savedProfiles={savedProfiles}
          onSubmit={handleYearlyFortuneSubmit}
          onBack={() => setCurrentScreen("yearly-fortune-list")}
        />
      )}

      {currentScreen === "yearly-fortune-result" && (sajuInput || selectedYearlyResult) && (
        <YearlyFortuneResultScreen
          sajuInput={selectedYearlyResult?.sajuInput || sajuInput!}
          year={selectedYearlyResult?.year || defaultYear}
          isDetailUnlocked={selectedYearlyResult?.isDetailUnlocked || false}
          coins={coins}
          resultId={selectedYearlyResult?.id || ""}
          onUnlockDetail={handleUnlockYearlyDetail}
          onOpenCoinPurchase={handleOpenCoinPurchase}
          onBack={() => setCurrentScreen("yearly-fortune-list")}
        />
      )}
    </main>
  )
}
