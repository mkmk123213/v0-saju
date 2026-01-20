"use client"

import { supabase } from "@/lib/supabaseClient"
import { apiCreateSummary, apiGenerateDetail } from "@/lib/api/readings"
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

export type Relationship =
  | "self"
  | "spouse"
  | "partner"
  | "parent"
  | "child"
  | "friend"
  | "acquaintance"

export interface SajuInput {
  relationship?: Relationship // 다른 input 화면들 빌드 깨짐 방지
  name: string
  birthDate: string
  birthTime: string // 'unknown' | '23-01' ...
  gender: "male" | "female"
  calendarType: "solar" | "lunar"
}

export interface SavedProfile {
  id: string
  relationship?: Relationship
  name: string
  birthDate: string
  birthTime: string
  gender: "male" | "female"
  calendarType: "solar" | "lunar"
}

export interface SajuResult {
  id: string // readings.id (uuid)
  sajuInput: SajuInput
  createdAt: string
  year: number
  isDetailUnlocked: boolean
  resultSummary?: any
  resultDetail?: any | null
}

export interface DailyFortuneResult {
  id: string
  sajuInput: SajuInput
  createdAt: string
  date: string
  isDetailUnlocked: boolean
  resultSummary?: any
  resultDetail?: any | null
}

export interface YearlyFortuneResult {
  id: string
  sajuInput: SajuInput
  createdAt: string
  year: number
  isDetailUnlocked: boolean
  resultSummary?: any
  resultDetail?: any | null
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
      .select("id,relationship,name,birth_date,birth_time,gender,calendar_type")
      .order("created_at", { ascending: false })
    if (error) throw error

    const mapped: SavedProfile[] =
      (data ?? []).map((p: any) => ({
        id: p.id,
        relationship: (p.relationship ?? "self") as Relationship,
        name: p.name,
        birthDate: p.birth_date,
        birthTime: p.birth_time ?? "",
        gender: p.gender,
        calendarType: p.calendar_type,
      })) ?? []

    setSavedProfiles(mapped)
  }

  const readingToSajuInput = (snap: any): SajuInput => ({
    relationship: (snap?.relationship ?? "self") as Relationship,
    name: String(snap?.name ?? ""),
    birthDate: String(snap?.birthDate ?? snap?.birth_date ?? ""),
    birthTime: String(snap?.birthTime ?? snap?.birth_time ?? ""),
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
          resultSummary: r.result_summary,
          resultDetail: r.result_detail,
        })
      } else if (r.type === "daily") {
        daily.push({
          id: r.id,
          sajuInput: input,
          createdAt: r.created_at,
          date: r.target_date ?? new Date(r.created_at).toISOString().slice(0, 10),
          isDetailUnlocked: isUnlocked,
          resultSummary: r.result_summary,
          resultDetail: r.result_detail,
        })
      } else if (r.type === "yearly") {
        yearly.push({
          id: r.id,
          sajuInput: input,
          createdAt: r.created_at,
          year: r.target_year ?? defaultYear,
          isDetailUnlocked: isUnlocked,
          resultSummary: r.result_summary,
          resultDetail: r.result_detail,
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

  useEffect(() => {
    if (!isLoggedIn) return
    refreshAll().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  // -----------------------------
  // Profiles: UPSERT
  // -----------------------------
  const upsertProfileFromInput = async (input: SajuInput) => {
    const { data: u, error: uerr } = await supabase.auth.getUser()
    if (uerr) throw uerr
    const uid = u.user?.id
    if (!uid) throw new Error("로그인이 필요해요")

    const payload = {
      user_id: uid,
      name: input.name,
      relationship: (input.relationship ?? "self") as Relationship,
      birth_date: input.birthDate,
      birth_time: input.birthTime || null,
      gender: input.gender,
      calendar_type: input.calendarType,
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id,name,birth_date" })
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
      const { data: s } = await supabase.auth.getSession()
      console.log("hasSession?", !!s.session)

      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error("로그인이 필요해요")

      setSajuInput(input)
      const profileId = await upsertProfileFromInput(input)
      // 🔮 AI 요약 생성 API 호출 (사주+점성술)
      const created = await apiCreateSummary({
        profile_id: profileId,
        type: "saju",
        target_date: null,
        target_year: defaultYear,
      })

      await refreshReadings()

      setSelectedResult({
        id: created.reading_id,
        sajuInput: input,
        createdAt: new Date().toISOString(),
        year: defaultYear,
        isDetailUnlocked: false,
        resultSummary: created.result_summary,
        resultDetail: null,
      })
      setCurrentScreen("result")
    } catch (e: any) {
      console.error(e)
      alert(e?.message ?? "사주 저장 중 오류가 발생했어요")
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
      await apiGenerateDetail({ reading_id: resultId });
      await refreshAll();
      const updated = savedResults.find((r) => r.id === resultId);
      if (updated) setSelectedResult(updated);
    } catch (e: any) {
      if (e?.status === 402) {
        handleOpenCoinPurchase();
        return;
      }
      console.error(e);
      alert("상세 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
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
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error("로그인이 필요해요")

      setSajuInput(input)
      const profileId = await upsertProfileFromInput(input)
      const today = new Date().toISOString().slice(0, 10)
      const created = await apiCreateSummary({
        profile_id: profileId,
        type: "daily",
        target_date: today,
      })

      await refreshReadings()

      setSelectedDailyResult({
        id: created.reading_id,
        sajuInput: input,
        createdAt: new Date().toISOString(),
        date: today,
        isDetailUnlocked: false,
        resultSummary: created.result_summary,
        resultDetail: null,
      })
      setCurrentScreen("daily-fortune-result")
    } catch (e: any) {
      console.error(e)
      alert(e?.message ?? "오늘의 운세 저장 중 오류가 발생했어요")
    }
  }

  const handleViewDailyResult = (result: DailyFortuneResult) => {
    setSelectedDailyResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("daily-fortune-result")
  }

  const handleUnlockDailyDetail = async (resultId: string) => {
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
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error("로그인이 필요해요")

      setSajuInput(input)
      const profileId = await upsertProfileFromInput(input)
      const created = await apiCreateSummary({
        profile_id: profileId,
        type: "yearly",
        target_date: null,
        target_year: defaultYear,
      })
      await refreshReadings()
      setSelectedYearlyResult({
        id: created.reading_id,
        sajuInput: input,
        createdAt: new Date().toISOString(),
        year: defaultYear,
        isDetailUnlocked: false,
        resultSummary: created.result_summary,
        resultDetail: null,
      })
      setCurrentScreen("yearly-fortune-result")
    } catch (e: any) {
      console.error(e)
      alert(e?.message ?? "연간 운세 저장 중 오류가 발생했어요")
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
        <ResultListScreen
          results={savedResults}
          onNewSaju={handleNewSaju}
          onViewResult={handleViewResult}
          onBack={handleBackToMain}
        />
      )}

      {currentScreen === "saju-input" && (
        <SajuInputScreen
          savedProfiles={savedProfiles}
          onSubmit={handleSajuSubmit}
          onBack={() => setCurrentScreen("result-list")}
        />
      )}

      {currentScreen === "result" && (sajuInput || selectedResult) && (
        <ResultScreen
          sajuInput={selectedResult?.sajuInput || sajuInput!}
          year={selectedResult?.year || defaultYear}
          isDetailUnlocked={selectedResult?.isDetailUnlocked || false}
          coins={coins}
          resultId={selectedResult?.id || ""}
          resultSummary={selectedResult?.resultSummary}
          resultDetail={selectedResult?.resultDetail}
          onUnlockDetail={handleUnlockDetail}
          onOpenCoinPurchase={handleOpenCoinPurchase}
          onBack={handleBackToResultList}
        />
      )}

      {/* 코인 구매(DEV) */}
      {currentScreen === "coin-purchase" && (
        <CoinPurchaseScreen onPurchase={handlePurchaseCoins} onBack={handleBackFromCoinPurchase} />
      )}

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
          resultSummary={selectedDailyResult?.resultSummary}
          resultDetail={selectedDailyResult?.resultDetail}
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
          resultSummary={selectedYearlyResult?.resultSummary}
          resultDetail={selectedYearlyResult?.resultDetail}
          onUnlockDetail={handleUnlockYearlyDetail}
          onOpenCoinPurchase={handleOpenCoinPurchase}
          onBack={() => setCurrentScreen("yearly-fortune-list")}
        />
      )}
    </main>
  )
}
