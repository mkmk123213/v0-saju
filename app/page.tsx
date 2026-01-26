"use client"

import { supabase } from "@/lib/supabaseClient"
import { apiCreateSummary } from "@/lib/api/readings"
import { useEffect, useMemo, useRef, useState } from "react"

import LoginScreen from "@/components/login-screen"
import MainScreen from "@/components/main-screen"
import SajuInputScreen from "@/components/saju-input-screen"
import ResultScreen from "@/components/result-screen"
import ResultListScreen from "@/components/result-list-screen"
import CoinPurchaseScreen from "@/components/coin-purchase-screen"
import CoinRequiredDialog from "@/components/coin-required-dialog"

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
  profileId?: string
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
  result_summary?: any
}

export interface DailyFortuneResult {
  id: string
  sajuInput: SajuInput
  createdAt: string
  date: string
  result_summary?: any
}

export interface YearlyFortuneResult {
  id: string
  sajuInput: SajuInput
  createdAt: string
  year: number
  result_summary?: any
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

  // API 중복 호출 방지
  const [isCreatingSummary, setIsCreatingSummary] = useState(false)
  const [isCreatingDaily, setIsCreatingDaily] = useState(false)

  // -----------------------------
  // UI: 유료(엽전) 안내 다이얼로그
  // -----------------------------
  const [coinDialogOpen, setCoinDialogOpen] = useState(false)
  const [coinDialogRequired, setCoinDialogRequired] = useState(1)
  const [coinDialogBalance, setCoinDialogBalance] = useState(0)
  const [coinDialogMessage, setCoinDialogMessage] = useState<string>("")
  const coinRetryRef = useRef<null | (() => void)>(null)

  const safeInt = (n: any, fallback = 0) => {
    const v = Number(n)
    return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : fallback
  }

  const openCoinDialog = async (args: { requiredCoins: number; balanceCoins?: number; message?: string; onRetry: () => void }) => {
    const required = safeInt(args.requiredCoins, 1)
    setCoinDialogRequired(required)
    setCoinDialogMessage(String(args.message ?? "").trim())
    coinRetryRef.current = args.onRetry
    setCoinDialogOpen(true)

    if (args.balanceCoins != null) {
      setCoinDialogBalance(safeInt(args.balanceCoins, 0))
    }

    // 화면에 보이는 coins state가 stale일 수 있어서, 항상 DB에서 최신 잔액을 다시 읽어
    try {
      const { data, error } = await supabase.rpc("rpc_get_coin_balance")
      if (error) throw error
      setCoinDialogBalance(safeInt(data ?? 0, 0))
    } catch {
      // fallback: 현재 state
      setCoinDialogBalance(safeInt(coins ?? 0, 0))
    }
  }

  const closeCoinDialog = () => {
    setCoinDialogOpen(false)
    setCoinDialogMessage("")
    coinRetryRef.current = null
  }

  const retryFromCoinDialog = () => {
    const fn = coinRetryRef.current
    closeCoinDialog()
    fn?.()
  }

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
    // delete_yn 컬럼이 아직 DB에 없을 수 있어서(마이그레이션 전), 1) 필터 포함 조회를 시도하고
    // 실패하면 2) 기존 스키마 기준으로 폴백 조회한다.
    let res = await supabase
      .from("profiles")
      .select("id,relationship,name,birth_date,birth_time,gender,calendar_type,delete_yn")
      .neq("delete_yn", "Y")
      .order("created_at", { ascending: false })

    if (res.error) {
      const msg = String((res.error as any)?.message ?? "")
      if (msg.includes("delete_yn") || msg.includes("column") || msg.includes("does not exist")) {
        res = await supabase
          .from("profiles")
          .select("id,relationship,name,birth_date,birth_time,gender,calendar_type")
          .order("created_at", { ascending: false })
      }
    }

    const { data, error } = res
    if (error) throw error

    // DB 값이 null/예상치 못한 값일 때도 UI가 터지지 않도록 기본값 보정
    const mapped: SavedProfile[] =
      (data ?? []).map((p: any) => ({
        id: String(p.id),
        relationship: (p.relationship ?? "self") as Relationship,
        name: String(p.name ?? ""),
        birthDate: String(p.birth_date ?? ""),
        birthTime: String(p.birth_time ?? ""),
        gender: (p.gender === "female" ? "female" : "male") as "male" | "female",
        calendarType: (p.calendar_type === "lunar" ? "lunar" : "solar") as "solar" | "lunar",
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
    // 먼저 profiles를 가져와서 profileMap을 구성
    // delete_yn 컬럼이 없을 수 있으니 폴백 처리
    let profilesRes = await supabase
      .from("profiles")
      .select("id,relationship,name,birth_date,birth_time,gender,calendar_type,delete_yn")
      .neq("delete_yn", "Y")

    if (profilesRes.error) {
      const msg = String((profilesRes.error as any)?.message ?? "")
      if (msg.includes("delete_yn") || msg.includes("column") || msg.includes("does not exist")) {
        profilesRes = await supabase
          .from("profiles")
          .select("id,relationship,name,birth_date,birth_time,gender,calendar_type")
      }
    }

    const { data: profilesData, error: profilesError } = profilesRes
    if (profilesError) throw profilesError

    const profileList: SavedProfile[] =
      (profilesData ?? []).map((p: any) => ({
        id: String(p.id),
        relationship: (p.relationship ?? "self") as Relationship,
        name: String(p.name ?? ""),
        birthDate: String(p.birth_date ?? ""),
        birthTime: String(p.birth_time ?? ""),
        gender: (p.gender === "female" ? "female" : "male") as "male" | "female",
        calendarType: (p.calendar_type === "lunar" ? "lunar" : "solar") as "solar" | "lunar",
      })) ?? []

    const profileMap = new Map(profileList.map((p) => [p.id, p]))

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
      const inputRaw = readingToSajuInput(r.input_snapshot)

      // input_snapshot에 이름/생년월일이 비어있는 과거 데이터가 있을 수 있어 profile로 보정
      const prof = r.profile_id ? profileMap.get(r.profile_id) : undefined
      const input = {
        ...inputRaw,
        name: inputRaw.name || prof?.name || "",
        birthDate: inputRaw.birthDate || prof?.birthDate || "",
        birthTime: inputRaw.birthTime || prof?.birthTime || "unknown",
        gender: (inputRaw.gender ?? prof?.gender ?? "male") as "male" | "female",
        calendarType: (inputRaw.calendarType ?? prof?.calendarType ?? "solar") as "solar" | "lunar",
        relationship: (inputRaw.relationship ?? prof?.relationship ?? "self") as Relationship,
      } as SajuInput

      if (r.type === "saju") {
        saju.push({
          id: r.id,
          sajuInput: input,
          createdAt: r.created_at,
          year: r.target_year ?? defaultYear,
          result_summary: r.result_summary,
        })
      } else if (r.type === "daily") {
        daily.push({
          id: r.id,
          sajuInput: input,
          createdAt: r.created_at,
          date: r.target_date ?? new Date(r.created_at).toISOString().slice(0, 10),
          result_summary: r.result_summary,
        })
      } else if (r.type === "yearly") {
        yearly.push({
          id: r.id,
          sajuInput: input,
          createdAt: r.created_at,
          year: r.target_year ?? defaultYear,
          result_summary: r.result_summary,
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
      delete_yn: "N",
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
  // Profiles: Soft delete (delete_yn='Y')
  // -----------------------------
  const softDeleteProfile = async (profileId: string) => {
    const { error } = await supabase.from("profiles").update({ delete_yn: "Y" }).eq("id", profileId)
    if (error) throw error
    await Promise.all([refreshProfiles(), refreshReadings()])
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
    if (isCreatingSummary) return
    setIsCreatingSummary(true)
    setIsCreatingDaily(true)
    try {
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error("로그인이 필요해요")

      setSajuInput(input)
      const profileId = input.profileId ? input.profileId : await upsertProfileFromInput(input)

      const { reading_id, result_summary } = await apiCreateSummary({
        profile_id: profileId,
        type: "saju",
        target_year: defaultYear,
      })

      // 코인 차감이 발생할 수 있으니(신규 생성 시) 잔액도 함께 갱신
      await Promise.all([refreshReadings(), refreshCoins()])

      setSelectedResult({
        id: reading_id,
        sajuInput: input,
        createdAt: new Date().toISOString(),
        year: defaultYear,
        result_summary,
      })
      setCurrentScreen("result")
    } catch (e: any) {
      console.error(e)
      if (e?.status === 402 && e?.detail?.error === "coin_required") {
        // 필요 엽전/보유 엽전을 보여주고, 다시 시도할 수 있게
        await openCoinDialog({
          requiredCoins: e?.detail?.required_coins ?? 1,
          balanceCoins: e?.detail?.balance_coins,
          message: e?.detail?.message ?? "결과를 보려면 엽전이 필요해.",
          onRetry: () => handleSajuSubmit(input),
      })
      } else if (e?.status === 402 && e?.detail?.error === "OPENAI_INSUFFICIENT_QUOTA") {
        alert(e?.detail?.message ?? "OpenAI API 결제/한도가 부족해요. Billing/Usage를 확인해주세요.")
      } else {
        alert(e?.message ?? "사주 생성 중 오류가 발생했어요")
      }
    } finally {
      setIsCreatingSummary(false)
      setIsCreatingDaily(false)
    }
  }


  const handleViewResult = (result: SajuResult) => {
    setSelectedResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("result")
  }

  const handleBackToResultList = () => setCurrentScreen("result-list")


  // -----------------------------
  // Daily fortune flow
  // -----------------------------
  const handleStartDailyFortune = () => {
    setSelectedDailyResult(null)
    setCurrentScreen("daily-fortune-list")
  }

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await softDeleteProfile(profileId)
      // 삭제 즉시 UI 반영(새로고침 전에도 목록에서 사라지게)
      setSavedProfiles((prev) => prev.filter((p) => p.id !== profileId))
      // DB 상태와 동기화(혹시 다른 곳에서도 영향이 있으면 반영)
      await refreshProfiles()
    } catch (e) {
      console.error(e)
      alert("프로필 삭제에 실패했어. 잠시 후 다시 시도해줘.")
    }
  }

  const handleNewDailyFortune = () => {
    setSajuInput(null)
    setSelectedDailyResult(null)
    setCurrentScreen("daily-fortune-input")
  }

  const handleDailyFortuneSubmit = async (input: SajuInput) => {
    if (isCreatingSummary) return
    setIsCreatingSummary(true)
    setIsCreatingDaily(true)
    try {
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error("로그인이 필요해요")

      setSajuInput(input)
      const profileId = input.profileId ? input.profileId : await upsertProfileFromInput(input)
      // KST 기준 "오늘" (UTC ISO는 자정 근처에서 날짜가 어긋날 수 있음)
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())

      const { reading_id, result_summary } = await apiCreateSummary({
        profile_id: profileId,
        type: "daily",
        target_date: today,
      })

      // 코인 차감이 발생할 수 있으니(신규 생성 시) 잔액도 함께 갱신
      await Promise.all([refreshReadings(), refreshCoins()])

      setSelectedDailyResult({
        id: reading_id,
        sajuInput: input,
        createdAt: new Date().toISOString(),
        date: today,
        result_summary,
      })
      setCurrentScreen("daily-fortune-result")
    } catch (e: any) {
      console.error(e)
      if (e?.status === 402 && e?.detail?.error === "coin_required") {
        await openCoinDialog({
          requiredCoins: e?.detail?.required_coins ?? 1,
          balanceCoins: e?.detail?.balance_coins,
          message: e?.detail?.message ?? "결과를 보려면 엽전이 필요해.",
          onRetry: () => handleDailyFortuneSubmit(input),
      })
      } else if (e?.status === 402 && e?.detail?.error === "OPENAI_INSUFFICIENT_QUOTA") {
        alert(e?.detail?.message ?? "OpenAI API 결제/한도가 부족해요. Billing/Usage를 확인해주세요.")
      } else {
        alert(e?.message ?? "오늘의 운세 생성 중 오류가 발생했어요")
      }
    } finally {
      setIsCreatingSummary(false)
      setIsCreatingDaily(false)
    }
  }


  const handleViewDailyResult = (result: DailyFortuneResult) => {
    setSelectedDailyResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("daily-fortune-result")
  }

  // (상세 유료보기 기능 제거)

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
    if (isCreatingSummary) return
    setIsCreatingSummary(true)
    setIsCreatingDaily(true)
    try {
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) throw new Error("로그인이 필요해요")

      setSajuInput(input)
      const profileId = input.profileId ? input.profileId : await upsertProfileFromInput(input)

      const { reading_id, result_summary } = await apiCreateSummary({
        profile_id: profileId,
        type: "yearly",
        target_year: defaultYear,
      })

      // 코인 차감이 발생할 수 있으니(신규 생성 시) 잔액도 함께 갱신
      await Promise.all([refreshReadings(), refreshCoins()])

      setSelectedYearlyResult({
        id: reading_id,
        sajuInput: input,
        createdAt: new Date().toISOString(),
        year: defaultYear,
        result_summary,
      })
      setCurrentScreen("yearly-fortune-result")
    } catch (e: any) {
      console.error(e)
      if (e?.status === 402 && e?.detail?.error === "coin_required") {
        await openCoinDialog({
          requiredCoins: e?.detail?.required_coins ?? 1,
          balanceCoins: e?.detail?.balance_coins,
          message: e?.detail?.message ?? "결과를 보려면 엽전이 필요해.",
          onRetry: () => handleYearlyFortuneSubmit(input),
      })
      } else if (e?.status === 402 && e?.detail?.error === "OPENAI_INSUFFICIENT_QUOTA") {
        alert(e?.detail?.message ?? "OpenAI API 결제/한도가 부족해요. Billing/Usage를 확인해주세요.")
      } else {
        alert(e?.message ?? "연간 운세 생성 중 오류가 발생했어요")
      }
    } finally {
      setIsCreatingSummary(false)
      setIsCreatingDaily(false)
    }
  }


  const handleViewYearlyResult = (result: YearlyFortuneResult) => {
    setSelectedYearlyResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("yearly-fortune-result")
  }

  // (상세보기 유료 기능 제거)

  return (
    <main className="min-h-screen bg-background">
      <CoinRequiredDialog
        open={coinDialogOpen}
        requiredCoins={coinDialogRequired}
        balanceCoins={coinDialogBalance}
        message={coinDialogMessage}
        onClose={closeCoinDialog}
        onRetry={retryFromCoinDialog}
        onOpenPurchase={() => {
          closeCoinDialog()
          handleOpenCoinPurchase()
        }}
      />

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
          resultSummary={selectedResult?.result_summary}
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
          isLoading={isCreatingDaily}
          coins={coins}
          onDeleteProfile={handleDeleteProfile}
        />
      )}

      {currentScreen === "daily-fortune-result" && (sajuInput || selectedDailyResult) && (
        <DailyFortuneResultScreen
          sajuInput={selectedDailyResult?.sajuInput || sajuInput!}
          date={selectedDailyResult?.date || new Date().toISOString().slice(0, 10)}
          resultSummary={selectedDailyResult?.result_summary}
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
          resultSummary={selectedYearlyResult?.result_summary}
          onBack={() => setCurrentScreen("yearly-fortune-list")}
        />
      )}
    </main>
  )
}
