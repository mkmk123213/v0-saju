"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock, User, Sun, Sparkles, Star, Coins } from "lucide-react"
import type { SajuInput, SavedProfile, Relationship } from "@/app/page"

interface DailyFortuneInputScreenProps {
  savedProfiles: SavedProfile[]
  onSubmit: (input: SajuInput) => void
  onBack: () => void
  isLoading?: boolean
  coins?: number
  onDeleteProfile?: (profileId: string) => Promise<void> | void
}

const relationshipOptions: { value: Relationship; label: string }[] = [
  { value: "self", label: "본인" },
  { value: "spouse", label: "배우자" },
  { value: "partner", label: "연인" },
  { value: "parent", label: "부모" },
  { value: "child", label: "자녀" },
  { value: "friend", label: "친구" },
  { value: "acquaintance", label: "지인" },
]

export default function DailyFortuneInputScreen({ savedProfiles, onSubmit, onBack, isLoading = false, coins = 0, onDeleteProfile }: DailyFortuneInputScreenProps) {
  const [relationship, setRelationship] = useState<Relationship>("self")
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar")
  const [selectedProfileId, setSelectedProfileId] = useState<string>("")

  const isExistingSelected = selectedProfileId !== "" && selectedProfileId !== "new"

  const relationshipLabel = (value?: Relationship) =>
    relationshipOptions.find((r) => r.value === (value ?? "self"))?.label ?? "본인"

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId)

    if (profileId === "new") {
      setRelationship("self")
      setName("")
      setBirthDate("")
      setBirthTime("")
      setGender("male")
      setCalendarType("solar")
      return
    }

    const profile = savedProfiles.find((p) => p.id === profileId)
    if (!profile) return

    setRelationship((profile.relationship ?? "self") as Relationship)
    setName(profile.name)
    setBirthDate(profile.birthDate)
    setBirthTime(profile.birthTime || "")
    setGender(profile.gender === "female" ? "female" : "male")
    setCalendarType(profile.calendarType === "lunar" ? "lunar" : "solar")
  }

  const handleSubmit = () => {
    if (!name || !birthDate) return
    onSubmit({
      profileId: isExistingSelected ? selectedProfileId : undefined,
      relationship,
      name,
      birthDate,
      birthTime: birthTime || "",
      gender,
      calendarType,
    })
  }

  const isValid = name !== "" && birthDate !== ""

  return (
    <div className="flex min-h-screen flex-col starfield">
      {/* Loading Overlay Popup */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="border-none bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-2xl mx-6 max-w-sm w-full overflow-hidden">
            <CardContent className="p-0">
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-[40px]" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 blur-[50px]" />
                {/* Constellation pattern */}
                <svg className="absolute top-4 right-4 w-16 h-16 opacity-20" viewBox="0 0 80 80">
                  <circle cx="20" cy="15" r="2" fill="white" />
                  <circle cx="60" cy="25" r="1.5" fill="white" />
                  <circle cx="40" cy="50" r="2" fill="white" />
                  <circle cx="15" cy="60" r="1.5" fill="white" />
                  <line x1="20" y1="15" x2="60" y2="25" stroke="white" strokeWidth="0.5" opacity="0.5" />
                  <line x1="60" y1="25" x2="40" y2="50" stroke="white" strokeWidth="0.5" opacity="0.5" />
                  <line x1="40" y1="50" x2="15" y2="60" stroke="white" strokeWidth="0.5" opacity="0.5" />
                </svg>
              </div>

              <div className="relative p-6 text-center text-white">
                {/* Animated Icon */}
                <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-2 rounded-full bg-white/15 animate-pulse" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                    <Sparkles className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  {/* Orbiting stars */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
                    <Star className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 text-yellow-200" fill="currentColor" />
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
                    <Star className="absolute top-1/2 -right-1 -translate-y-1/2 h-2 w-2 text-white/80" fill="currentColor" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-3">운세 분석 중</h3>

                {/* Description */}
                <p className="text-sm text-white/90 leading-relaxed mb-5">
                  당신의 사주와 별자리를 꼼꼼하게 분석하여,<br />
                  소름돋는 오늘의 운세를 확인해볼게요.
                </p>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full animate-pulse"
                    style={{ 
                      width: '70%',
                      animation: 'loading-progress 2s ease-in-out infinite'
                    }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-amber-500/10 blur-[80px]" />
        <div className="absolute bottom-40 -left-20 w-48 h-48 rounded-full bg-orange-500/10 blur-[60px]" />
      </div>

      <header className="flex items-center gap-3 px-4 py-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <h1 className="font-medium text-foreground">오늘의 운세 정보 입력</h1>
        </div>
      </header>

      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-6">
          {savedProfiles.length > 0 && (
            <Card className="border-none glass shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Label className="text-sm font-medium text-foreground">운세를 볼 사람을 선택해주세요</Label>
                <Select value={selectedProfileId} onValueChange={handleProfileSelect}>
                  <SelectTrigger className="h-12 rounded-xl border-border bg-secondary/50">
                    <SelectValue placeholder="저장된 프로필 또는 새로 입력" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        새로운 사람 입력
                      </div>
                    </SelectItem>
                    {savedProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {relationshipLabel(profile.relationship)} · {profile.name} ({profile.birthDate})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              
            {isExistingSelected && onDeleteProfile && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={async () => {
                    if (!confirm("이 프로필을 삭제할까? (삭제 후에는 목록에 보이지 않아)")) return
                    await onDeleteProfile(selectedProfileId)
                    handleProfileSelect("new")
                    setSelectedProfileId("new")
                  }}
                >
                  선택한 프로필 삭제
                </Button>
              </div>
            )}
</CardContent>
            </Card>
          )}

          <Card className="border-none glass shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Label className="text-sm font-medium text-foreground">관계</Label>
              <Select value={relationship} onValueChange={(v) => setRelationship(v as Relationship)}>
                <SelectTrigger className="h-12 rounded-xl border-border bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {relationshipOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-none glass shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Label className="text-sm font-medium text-foreground">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력해주세요"
                className="h-12 rounded-xl border-border bg-secondary/50 px-4"
              />
            </CardContent>
          </Card>

          <Card className="border-none glass shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Label className="text-sm font-medium text-foreground">
                생년월일 <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Calendar className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none glass shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Label className="text-sm font-medium text-foreground">
                태어난 시간 <span className="text-muted-foreground font-normal">(선택)</span>
              </Label>
              <div className="relative">
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  placeholder="예: 14:30"
                  className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Clock className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">모르면 비워두세요</p>
            </CardContent>
          </Card>

          <Card className="border-none glass shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Label className="text-sm font-medium text-foreground">성별</Label>
              <RadioGroup
                value={gender}
                onValueChange={(v) => setGender(v as "male" | "female")}
                className="flex gap-3"
              >
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    gender === "male"
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="male" className="sr-only" />
                  <span className="font-medium">남성</span>
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    gender === "female"
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="female" className="sr-only" />
                  <span className="font-medium">여성</span>
                </label>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="border-none glass shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Label className="text-sm font-medium text-foreground">양력 / 음력</Label>
              <RadioGroup
                value={calendarType}
                onValueChange={(v) => setCalendarType(v as "solar" | "lunar")}
                className="flex gap-3"
              >
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    calendarType === "solar"
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="solar" className="sr-only" />
                  <span className="font-medium">양력</span>
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    calendarType === "lunar"
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="lunar" className="sr-only" />
                  <span className="font-medium">음력</span>
                </label>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border glass px-6 py-4 relative z-10">
        <div className="mx-auto max-w-sm space-y-3">
          {/* Coin Info */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 rounded-xl bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-white/60 dark:from-orange-950/25 dark:via-amber-950/20 dark:to-white/5 border border-orange-200/60 dark:border-orange-900/25 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-white/10 border border-orange-200/60 dark:border-orange-900/30 shadow-sm">
                <Coins className="h-5 w-5 text-orange-800/70 dark:text-orange-200/70" />
              </div>
              <div>
                <p className="text-[11px] text-orange-700/70 dark:text-orange-300/70 font-medium">필요</p>
                <p className="text-lg font-bold text-orange-950/80 dark:text-orange-100/85">1개</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 rounded-xl bg-gradient-to-br from-amber-50/75 via-orange-50/55 to-white/60 dark:from-amber-950/18 dark:via-orange-950/14 dark:to-white/5 border border-orange-200/50 dark:border-orange-900/20 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-white/10 border border-orange-200/60 dark:border-orange-900/30 shadow-sm">
                <Coins className="h-5 w-5 text-orange-800/65 dark:text-orange-200/70" />
              </div>
              <div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium">보유</p>
                <p className="text-lg font-bold text-stone-900/90 dark:text-stone-100">{coins}개</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!isValid || !!isLoading}
            className="h-14 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-base font-medium shadow-lg disabled:opacity-50"
          >
            결과 보기
          </Button>
        </div>
      </div>
    </div>
  )
}
