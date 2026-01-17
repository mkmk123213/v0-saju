"use client"

import { useState, useEffect } from "react"
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
  birthTime: string
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
  id: string
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

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [previousScreen, setPreviousScreen] = useState<Screen>("main")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sajuInput, setSajuInput] = useState<SajuInput | null>(null)
  const [savedResults, setSavedResults] = useState<SajuResult[]>([])
  const [selectedResult, setSelectedResult] = useState<SajuResult | null>(null)
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([])
  const [coins, setCoins] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)

  const [dailyFortuneResults, setDailyFortuneResults] = useState<DailyFortuneResult[]>([])
  const [selectedDailyResult, setSelectedDailyResult] = useState<DailyFortuneResult | null>(null)

  const [yearlyFortuneResults, setYearlyFortuneResults] = useState<YearlyFortuneResult[]>([])
  const [selectedYearlyResult, setSelectedYearlyResult] = useState<YearlyFortuneResult | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("sajuResults")
    if (saved) {
      setSavedResults(JSON.parse(saved))
    }
    const profiles = localStorage.getItem("sajuProfiles")
    if (profiles) {
      setSavedProfiles(JSON.parse(profiles))
    }
    const savedCoins = localStorage.getItem("sajuCoins")
    if (savedCoins) {
      setCoins(JSON.parse(savedCoins))
    }
    const dailyResults = localStorage.getItem("dailyFortuneResults")
    if (dailyResults) {
      setDailyFortuneResults(JSON.parse(dailyResults))
    }
    const yearlyResults = localStorage.getItem("yearlyFortuneResults")
    if (yearlyResults) {
      setYearlyFortuneResults(JSON.parse(yearlyResults))
    }
    const savedDarkMode = localStorage.getItem("sajuDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("sajuDarkMode", JSON.stringify(isDarkMode))
  }, [isDarkMode])

  useEffect(() => {
    if (savedResults.length > 0) {
      localStorage.setItem("sajuResults", JSON.stringify(savedResults))
    }
  }, [savedResults])

  useEffect(() => {
    if (savedProfiles.length > 0) {
      localStorage.setItem("sajuProfiles", JSON.stringify(savedProfiles))
    }
  }, [savedProfiles])

  useEffect(() => {
    localStorage.setItem("sajuCoins", JSON.stringify(coins))
  }, [coins])

  useEffect(() => {
    if (dailyFortuneResults.length > 0) {
      localStorage.setItem("dailyFortuneResults", JSON.stringify(dailyFortuneResults))
    }
  }, [dailyFortuneResults])

  useEffect(() => {
    if (yearlyFortuneResults.length > 0) {
      localStorage.setItem("yearlyFortuneResults", JSON.stringify(yearlyFortuneResults))
    }
  }, [yearlyFortuneResults])

  const saveProfile = (input: SajuInput) => {
    const existingProfile = savedProfiles.find((p) => p.name === input.name && p.birthDate === input.birthDate)
    if (!existingProfile) {
      const newProfile: SavedProfile = {
        id: Date.now().toString(),
        name: input.name,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        gender: input.gender,
        calendarType: input.calendarType,
      }
      setSavedProfiles((prev) => [newProfile, ...prev])
    }
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
    setCurrentScreen("main")
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentScreen("login")
  }

  const handleStartSaju = () => {
    setSelectedResult(null)
    setCurrentScreen("result-list")
  }

  const handleSajuSubmit = (input: SajuInput) => {
    setSajuInput(input)
    saveProfile(input)
    const newResult: SajuResult = {
      id: Date.now().toString(),
      sajuInput: input,
      createdAt: new Date().toISOString(),
      year: 2026,
      isDetailUnlocked: false,
    }
    setSavedResults((prev) => [newResult, ...prev])
    setSelectedResult(newResult)
    setCurrentScreen("result")
  }

  const handleBackToMain = () => {
    setCurrentScreen("main")
  }

  const handleNewSaju = () => {
    setSajuInput(null)
    setSelectedResult(null)
    setCurrentScreen("saju-input")
  }

  const handleViewResult = (result: SajuResult) => {
    setSelectedResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("result")
  }

  const handleBackToResultList = () => {
    setCurrentScreen("result-list")
  }

  const handleOpenCoinPurchase = () => {
    setPreviousScreen(currentScreen)
    setCurrentScreen("coin-purchase")
  }

  const handlePurchaseCoins = (amount: number) => {
    setCoins((prev) => prev + amount)
    setCurrentScreen(previousScreen)
  }

  const handleUnlockDetail = (resultId: string) => {
    if (coins >= 9) {
      setCoins((prev) => prev - 9)
      setSavedResults((prev) => prev.map((r) => (r.id === resultId ? { ...r, isDetailUnlocked: true } : r)))
      if (selectedResult && selectedResult.id === resultId) {
        setSelectedResult({ ...selectedResult, isDetailUnlocked: true })
      }
    }
  }

  const handleStartDailyFortune = () => {
    setSelectedDailyResult(null)
    setCurrentScreen("daily-fortune-list")
  }

  const handleNewDailyFortune = () => {
    setSajuInput(null)
    setSelectedDailyResult(null)
    setCurrentScreen("daily-fortune-input")
  }

  const handleDailyFortuneSubmit = (input: SajuInput) => {
    setSajuInput(input)
    saveProfile(input)
    const newResult: DailyFortuneResult = {
      id: Date.now().toString(),
      sajuInput: input,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      isDetailUnlocked: false,
    }
    setDailyFortuneResults((prev) => [newResult, ...prev])
    setSelectedDailyResult(newResult)
    setCurrentScreen("daily-fortune-result")
  }

  const handleViewDailyResult = (result: DailyFortuneResult) => {
    setSelectedDailyResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("daily-fortune-result")
  }

  const handleUnlockDailyDetail = (resultId: string) => {
    if (coins >= 1) {
      setCoins((prev) => prev - 1)
      setDailyFortuneResults((prev) => prev.map((r) => (r.id === resultId ? { ...r, isDetailUnlocked: true } : r)))
      if (selectedDailyResult && selectedDailyResult.id === resultId) {
        setSelectedDailyResult({ ...selectedDailyResult, isDetailUnlocked: true })
      }
    }
  }

  const handleStartYearlyFortune = () => {
    setSelectedYearlyResult(null)
    setCurrentScreen("yearly-fortune-list")
  }

  const handleNewYearlyFortune = () => {
    setSajuInput(null)
    setSelectedYearlyResult(null)
    setCurrentScreen("yearly-fortune-input")
  }

  const handleYearlyFortuneSubmit = (input: SajuInput) => {
    setSajuInput(input)
    saveProfile(input)
    const newResult: YearlyFortuneResult = {
      id: Date.now().toString(),
      sajuInput: input,
      createdAt: new Date().toISOString(),
      year: 2026,
      isDetailUnlocked: false,
    }
    setYearlyFortuneResults((prev) => [newResult, ...prev])
    setSelectedYearlyResult(newResult)
    setCurrentScreen("yearly-fortune-result")
  }

  const handleViewYearlyResult = (result: YearlyFortuneResult) => {
    setSelectedYearlyResult(result)
    setSajuInput(result.sajuInput)
    setCurrentScreen("yearly-fortune-result")
  }

  const handleUnlockYearlyDetail = (resultId: string) => {
    if (coins >= 9) {
      setCoins((prev) => prev - 9)
      setYearlyFortuneResults((prev) => prev.map((r) => (r.id === resultId ? { ...r, isDetailUnlocked: true } : r)))
      if (selectedYearlyResult && selectedYearlyResult.id === resultId) {
        setSelectedYearlyResult({ ...selectedYearlyResult, isDetailUnlocked: true })
      }
    }
  }

  const handleBackFromCoinPurchase = () => {
    setCurrentScreen(previousScreen)
  }

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev)
  }

  return (
    <main className="min-h-screen bg-background">
      {currentScreen === "login" && <LoginScreen onLogin={handleLogin} />}
      {currentScreen === "main" && (
        <MainScreen
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
      {currentScreen === "coin-purchase" && (
        <CoinPurchaseScreen onPurchase={handlePurchaseCoins} onBack={handleBackFromCoinPurchase} />
      )}
      {currentScreen === "result" && (sajuInput || selectedResult) && (
        <ResultScreen
          sajuInput={selectedResult?.sajuInput || sajuInput!}
          year={selectedResult?.year || 2026}
          isDetailUnlocked={selectedResult?.isDetailUnlocked || false}
          coins={coins}
          resultId={selectedResult?.id || ""}
          onUnlockDetail={handleUnlockDetail}
          onOpenCoinPurchase={handleOpenCoinPurchase}
          onBack={handleBackToResultList}
        />
      )}

      {/* 오늘의 운세 화면들 */}
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
          date={selectedDailyResult?.date || new Date().toISOString().split("T")[0]}
          isDetailUnlocked={selectedDailyResult?.isDetailUnlocked || false}
          coins={coins}
          resultId={selectedDailyResult?.id || ""}
          onUnlockDetail={handleUnlockDailyDetail}
          onOpenCoinPurchase={handleOpenCoinPurchase}
          onBack={() => setCurrentScreen("daily-fortune-list")}
        />
      )}

      {/* 운세 보기 화면들 */}
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
          year={selectedYearlyResult?.year || 2026}
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
