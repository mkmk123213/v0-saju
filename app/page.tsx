"use client"

import { supabase } from "@/lib/supabaseClient"
import { apiCreateSummary } from "@/lib/api/readings"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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

type DailyDraft = {
  selectedProfileId: string
  relationship: Relationship
  name: string
  birthDate: string
  birthTime: string
  gender: "male" | "female"
  calendarType: "solar" | "lunar"
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

  // 브라우저 뒤로가기/앞으로가기 동작을 위해 화면 전환을 history에 기록한다.
  // (기존에는 setState로만 화면을 바꿔서 히스토리가 쌓이지 않아 뒤로가기가 안 됨)
  const currentScreenRef = useRef<Screen>("login")
  const sajuResultsRef = useRef<SajuResult[]>([])
  const dailyResultsRef = useRef<DailyFortuneResult[]>([])
  const yearlyResultsRef = useRef<YearlyFortuneResult[]>([])

  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([])

  const [savedResults, setSavedResults] = useState<SajuResult[]>([])
  const [selectedResult, setSelectedResult] = useState<SajuResult | null>(null)

  const [dailyFortuneResults, setDailyFortuneResults] = useState<DailyFortuneResult[]>([])
  const [selectedDailyResult, setSelectedDailyResult] = useState<DailyFortuneResult | null>(null)

  const [yearlyFortuneResults, setYearlyFortuneResults] = useState<YearlyFortuneResult[]>([])
  const [selectedYearlyResult, setSelectedYearlyResult] = useState<YearlyFortuneResult | null>(null)

  const [sajuInput, setSajuInput] = useState<SajuInput | null>(null)
  // 오늘의 운세 입력 화면이 코인 충전 화면으로 넘어갔다 돌아와도 내용 유지되도록 draft를 상위에서 관리
  const [dailyDraft, setDailyDraft] = useState<DailyDraft>({
    // Radix Select는 value가 ""(빈 문자열)일 때 런타임 에러가 날 수 있어 기본값은 "new"로 둔다.
    selectedProfileId: "new",
    relationship: "self",
    name: "",
    birthDate: "",
    birthTime: "",
    gender: "male",
    calendarType: "solar",
  })

  // DailyFortuneInputScreen에서 draft를 올려주는 콜백은 반드시 stable 해야 한다.
  // (인라인 함수로 넘기면 매 렌더마다 onDraftChange 레퍼런스가 바뀌어,
  //  자식 useEffect가 반복 실행되며 "Maximum update depth exceeded" 크래시가 날 수 있음)
  const handleDailyDraftChange = useCallback((d: DailyDraft | undefined) => {
    if (!d) return
    setDailyDraft(d)
  }, [])
  const [coins, setCoins] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [userName, setUserName] = useState<string>("")
  const [userId, setUserId] = useState<string>("")

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
  const userIdRef = useRef<string>("")

  useEffect(() => {
    currentScreenRef.current = currentScreen
  }, [currentScreen])

  useEffect(() => {
    sajuResultsRef.current = savedResults
  }, [savedResults])

  useEffect(() => {
    dailyResultsRef.current = dailyFortuneResults
  }, [dailyFortuneResults])

  useEffect(() => {
    yearlyResultsRef.current = yearlyFortuneResults
  }, [yearlyFortuneResults])

  const isValidScreen = (v: any): v is Screen =>
    [
      "login",
      "main",
      "saju-input",
      "result",
      "result-list",
      "coin-purchase",
      "daily-fortune-list",
      "daily-fortune-input",
      "daily-fortune-result",
      "yearly-fortune-list",
      "yearly-fortune-input",
      "yearly-fortune-result",
    ].includes(String(v))

  const getScreenFromHash = (): Screen | null => {
    if (typeof window === "undefined") return null
    const raw = String(window.location.hash || "").replace(/^#/, "").trim()
    if (!raw) return null
    return isValidScreen(raw) ? (raw as Screen) : null
  }

  const syncHistory = (next: Screen, state: Record<string, any> = {}, replace = false) => {
    if (typeof window === "undefined") return
    const url = `#${next}`
    const payload = { screen: next, ...state }
    try {
      if (replace) window.history.replaceState(payload, "", url)
      else window.history.pushState(payload, "", url)
    } catch {
      // ignore
    }
  }

  // 앞으로 이동(히스토리 쌓기)
  const navigate = useCallback((next: Screen, state: Record<string, any> = {}) => {
    const prev = currentScreenRef.current
    setPreviousScreen(prev)
    setCurrentScreen(next)
    syncHistory(next, { prevScreen: prev, ...state }, false)
  }, [])

  // 뒤로/교체 이동(히스토리 늘리지 않기)
  const replaceScreen = useCallback((next: Screen, state: Record<string, any> = {}) => {
    const prev = currentScreenRef.current
    setPreviousScreen(prev)
    setCurrentScreen(next)
    syncHistory(next, { prevScreen: prev, ...state }, true)
  }, [])

  const goBack = useCallback(() => {
    if (typeof window === "undefined") return
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    // fallback
    replaceScreen("main")
  }, [replaceScreen])

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

  const resetUserScopedState = () => {
    setSavedProfiles([])
    setSavedResults([])
    setSelectedResult(null)
    setDailyFortuneResults([])
    setSelectedDailyResult(null)
    setYearlyFortuneResults([])
    setSelectedYearlyResult(null)
    setCoins(0)
    setDailyDraft({
      selectedProfileId: "new",
      relationship: "self",
      name: "",
      birthDate: "",
      birthTime: "",
      gender: "male",
      calendarType: "solar",
    })
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
        setUserId("")
        userIdRef.current = ""
        return
      }

      // 로그인 계정 기준으로 결과/프로필 리스트가 섞이지 않게 userId로 스코프를 잡아둠
      setUserId(user.id)
      userIdRef.current = user.id
      const meta: any = user.user_metadata || {}
      const name = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "손님")
      setUserName(String(name))
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const nextUid = data.session.user.id
        if (userIdRef.current && userIdRef.current !== nextUid) {
          // 계정이 바뀌었는데 이전 상태가 남아있으면 카드가 섞여 보여서 초기화
          resetUserScopedState()
        }
        userIdRef.current = nextUid
        setUserId(nextUid)
        setIsLoggedIn(true)
        replaceScreen("main")
        applyUser()
        // 로그인/계정 변경 시 사용자 스코프 데이터 다시 로드
        setTimeout(() => refreshAll().catch(console.error), 0)
      } else {
        setIsLoggedIn(false)
        replaceScreen("login")
        setUserName("")
        setUserId("")
        userIdRef.current = ""
        resetUserScopedState()
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const nextUid = session.user.id
        if (userIdRef.current && userIdRef.current !== nextUid) {
          resetUserScopedState()
        }
        userIdRef.current = nextUid
        setUserId(nextUid)
        setIsLoggedIn(true)
        replaceScreen("main")
        applyUser()
        setTimeout(() => refreshAll().catch(console.error), 0)
      } else {
        setIsLoggedIn(false)
        replaceScreen("login")
        setUserName("")
        setUserId("")
        userIdRef.current = ""
        resetUserScopedState()
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // -----------------------------
  // History: 브라우저 뒤로가기/앞으로가기 지원
  // -----------------------------
  useEffect(() => {
    if (typeof window === "undefined") return

    const onPopState = (ev: PopStateEvent) => {
      const st: any = ev.state || {}
      let next: Screen | null = null

      if (st?.screen && isValidScreen(st.screen)) next = st.screen as Screen
      if (!next) next = getScreenFromHash()

      // 로그인 상태에 맞지 않는 화면은 보정
      if (!isLoggedIn) {
        setCurrentScreen("login")
        return
      }

      if (!next || next === "login") {
        // 로그인 상태에서 login으로 되돌아가는 건 UX가 안 좋아서 main으로 보정
        replaceScreen("main")
        return
      }

      setCurrentScreen(next)
      if (st?.prevScreen && isValidScreen(st.prevScreen)) setPreviousScreen(st.prevScreen as Screen)

      // 선택된 결과 복원
      if (next === "result" && st?.selectedSajuId) {
        const found = sajuResultsRef.current.find((r) => r.id === st.selectedSajuId)
        if (found) {
          setSelectedResult(found)
          setSajuInput(found.sajuInput)
        }
      }
      if (next === "daily-fortune-result" && st?.selectedDailyId) {
        const found = dailyResultsRef.current.find((r) => r.id === st.selectedDailyId)
        if (found) {
          setSelectedDailyResult(found)
          setSajuInput(found.sajuInput)
        }
      }
      if (next === "yearly-fortune-result" && st?.selectedYearlyId) {
        const found = yearlyResultsRef.current.find((r) => r.id === st.selectedYearlyId)
        if (found) {
          setSelectedYearlyResult(found)
          setSajuInput(found.sajuInput)
        }
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [isLoggedIn, replaceScreen])

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
    // ⚠️ 결과 카드에서는 삭제된 프로필로 만든 과거 결과도 이름/생년월일이 보이게 해야 해서
    // profiles를 가져올 때는 delete_yn으로 필터링하지 않는다(목록 UI에서는 refreshProfiles가 필터링).
    let profilesRes = await supabase
      .from("profiles")
      .select("id,relationship,name,birth_date,birth_time,gender,calendar_type,delete_yn")

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

    const { data: u, error: uerr } = await supabase.auth.getUser()
    if (uerr) throw uerr
    const uid = u.user?.id
    if (!uid) throw new Error("not_authenticated")

    const { data, error } = await supabase
      .from("readings_public_view")
      .select("*")
      .eq("user_id", uid)
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
        profileId: r.profile_id ?? undefined,
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
  const handleBackToMain = () => replaceScreen("main")
  const handleToggleDarkMode = () => setIsDarkMode((prev) => !prev)

  const handleOpenCoinPurchase = () => {
    navigate("coin-purchase")
  }
  const handleBackFromCoinPurchase = () => goBack()

  // -----------------------------
  // Coin purchase (DEV): rpc_grant_coins
  // -----------------------------
  const handlePurchaseCoins = async (amount: number) => {
    try {
      const { error } = await supabase.rpc("rpc_grant_coins", { p_amount: amount })
      if (error) throw error
      await refreshCoins()
      goBack()
    } catch (e) {
      console.error(e)
      goBack()
    }
  }

  // -----------------------------
  // Saju flow
  // -----------------------------
  const handleStartSaju = () => {
    setSelectedResult(null)
    navigate("result-list")
  }
  const handleNewSaju = () => {
    setSajuInput(null)
    setSelectedResult(null)
    navigate("saju-input")
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
      navigate("result", { selectedSajuId: reading_id })
    } catch (e: any) {
      console.error(e)
      if (e?.status === 402 && e?.detail?.error === "coin_required") {
        // 필요 엽전/보유 엽전을 보여주고, 다시 시도할 수 있게
        await openCoinDialog({
          requiredCoins: e?.detail?.required_coins ?? 1,
          balanceCoins: e?.detail?.balance_coins,
          message: e?.detail?.message ?? "결과를 보려면 엽전 1닢이 필요해.",
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
    navigate("result", { selectedSajuId: result.id })
  }

  const handleBackToResultList = () => goBack()


  // -----------------------------
  // Daily fortune flow
  // -----------------------------
  const handleStartDailyFortune = () => {
    setSelectedDailyResult(null)
    navigate("daily-fortune-list")
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
    navigate("daily-fortune-input")
  }

  const handleDailyFortuneSubmit = async (input: SajuInput) => {
    if (isCreatingSummary) return

    // KST 기준 "오늘"
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())

    // ✅ 동일 프로필/오늘 결과가 이미 있으면(=이미 결제/생성됨) 코인 없어도 바로 재열람
    if (input.profileId) {
      const existing = dailyFortuneResults.find(
        (r) => r?.date === today && r?.sajuInput?.profileId === input.profileId
      )
      if (existing) {
        setSelectedDailyResult(existing)
        setSajuInput(existing.sajuInput)
        navigate("daily-fortune-result", { selectedDailyId: existing.id })
        return
      }
    }

    // ✅ 엽전이 부족하면 API 호출 전에 즉시 팝업(서버에서도 재검증함)
    if ((coins ?? 0) < 1) {
      await openCoinDialog({
        requiredCoins: 1,
        balanceCoins: coins ?? 0,
        message: "결과를 보려면 엽전 1닢이 필요해.",
        onRetry: () => handleDailyFortuneSubmit(input),
      })
      return
    }

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
      navigate("daily-fortune-result", { selectedDailyId: reading_id })
    } catch (e: any) {
      console.error(e)
      if (e?.status === 402 && e?.detail?.error === "coin_required") {
        await openCoinDialog({
          requiredCoins: e?.detail?.required_coins ?? 1,
          balanceCoins: e?.detail?.balance_coins,
          message: e?.detail?.message ?? "결과를 보려면 엽전 1닢이 필요해.",
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
    navigate("daily-fortune-result", { selectedDailyId: result.id })
  }

  // (상세 유료보기 기능 제거)

  // -----------------------------
  // Yearly fortune flow
  // -----------------------------
  const handleStartYearlyFortune = () => {
    setSelectedYearlyResult(null)
    navigate("yearly-fortune-list")
  }
  const handleNewYearlyFortune = () => {
    setSajuInput(null)
    setSelectedYearlyResult(null)
    navigate("yearly-fortune-input")
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
      navigate("yearly-fortune-result", { selectedYearlyId: reading_id })
    } catch (e: any) {
      console.error(e)
      if (e?.status === 402 && e?.detail?.error === "coin_required") {
        await openCoinDialog({
          requiredCoins: e?.detail?.required_coins ?? 1,
          balanceCoins: e?.detail?.balance_coins,
          message: e?.detail?.message ?? "결과를 보려면 엽전 1닢이 필요해.",
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
    navigate("yearly-fortune-result", { selectedYearlyId: result.id })
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

      {/* 전역 상단 우측 컨트롤: 어디서든 다크/라이트, 엽전, 로그아웃 노출 */}
      {isLoggedIn && currentScreen !== "login" ? (
        <div className="fixed top-4 right-4 z-[60] flex items-center gap-2">
          {/* Dark/Light */}
          <button
            type="button"
            onClick={handleToggleDarkMode}
            aria-label="다크/라이트 모드 전환"
            className="rounded-full h-8 w-8 inline-flex items-center justify-center hover:bg-muted glass"
          >
            {isDarkMode ? (
              <span className="inline-flex items-center justify-center">
                {/* lucide 아이콘을 직접 import하지 않고, 기존 스타일 유지 위해 MainScreen 버튼과 동일하게 */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              </span>
            ) : (
              <span className="inline-flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              </span>
            )}
          </button>

          {/* Coins */}
          <button
            type="button"
            onClick={handleOpenCoinPurchase}
            className="flex items-center gap-1.5 rounded-full glass px-3 py-2 h-auto hover:bg-primary/10"
            aria-label="엽전 충전"
          >
            <div className="w-4 h-4 rounded-full gradient-gold flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-900">
                <circle cx="8" cy="8" r="6" />
                <path d="M18.09 10.37A6 6 0 1 1 10.37 18.09" />
                <path d="M7 6h1v4" />
                <path d="m16.71 13.88.7.71-2.82 2.82" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-foreground">{coins}</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="로그아웃"
            className="rounded-full h-8 w-8 inline-flex items-center justify-center hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </div>
      ) : null}

      {currentScreen === "login" && <LoginScreen onLogin={handleLogin} />}

      {currentScreen === "main" && (
        <MainScreen
          userName={userName}
          onStartSaju={handleStartSaju}
          onStartDailyFortune={handleStartDailyFortune}
          onStartYearlyFortune={handleStartYearlyFortune}
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
          onBack={goBack}
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
          onBack={goBack}
          isLoading={isCreatingDaily}
          coins={coins}
          onDeleteProfile={handleDeleteProfile}
          draft={dailyDraft}
          onDraftChange={handleDailyDraftChange}
        />
      )}

      {currentScreen === "daily-fortune-result" && (sajuInput || selectedDailyResult) && (
        <DailyFortuneResultScreen
          sajuInput={selectedDailyResult?.sajuInput || sajuInput!}
          date={selectedDailyResult?.date || new Date().toISOString().slice(0, 10)}
          resultSummary={selectedDailyResult?.result_summary}
          onBack={goBack}
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
          onBack={goBack}
        />
      )}

      {currentScreen === "yearly-fortune-result" && (sajuInput || selectedYearlyResult) && (
        <YearlyFortuneResultScreen
          sajuInput={selectedYearlyResult?.sajuInput || sajuInput!}
          year={selectedYearlyResult?.year || defaultYear}
          resultSummary={selectedYearlyResult?.result_summary}
          onBack={goBack}
        />
      )}
    </main>
  )
}
