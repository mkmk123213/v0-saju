"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, User, Star } from "lucide-react"
import type { SajuInput, SavedProfile, Relationship } from "@/app/page"

interface YearlyFortuneInputScreenProps {
  savedProfiles: SavedProfile[]
  onSubmit: (input: SajuInput) => void
  onBack: () => void
}

const birthTimeOptions = [
  { value: "unknown", label: "모름" },
  { value: "23-01", label: "자시 (23:00~01:00)" },
  { value: "01-03", label: "축시 (01:00~03:00)" },
  { value: "03-05", label: "인시 (03:00~05:00)" },
  { value: "05-07", label: "묘시 (05:00~07:00)" },
  { value: "07-09", label: "진시 (07:00~09:00)" },
  { value: "09-11", label: "사시 (09:00~11:00)" },
  { value: "11-13", label: "오시 (11:00~13:00)" },
  { value: "13-15", label: "미시 (13:00~15:00)" },
  { value: "15-17", label: "신시 (15:00~17:00)" },
  { value: "17-19", label: "유시 (17:00~19:00)" },
  { value: "19-21", label: "술시 (19:00~21:00)" },
  { value: "21-23", label: "해시 (21:00~23:00)" },
]

const relationshipOptions: { value: Relationship; label: string }[] = [
  { value: "self", label: "본인" },
  { value: "spouse", label: "배우자" },
  { value: "partner", label: "연인" },
  { value: "parent", label: "부모" },
  { value: "child", label: "자녀" },
  { value: "friend", label: "친구" },
  { value: "acquaintance", label: "지인" },
]

export default function YearlyFortuneInputScreen({ savedProfiles, onSubmit, onBack }: YearlyFortuneInputScreenProps) {
  const [relationship, setRelationship] = useState<Relationship>("self")
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("unknown")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar")
  const [selectedProfileId, setSelectedProfileId] = useState<string>("")

  const relationshipLabel = (value?: Relationship) =>
    relationshipOptions.find((r) => r.value === (value ?? "self"))?.label ?? "본인"

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId)

    if (profileId === "new") {
      setRelationship("self")
      setName("")
      setBirthDate("")
      setBirthTime("unknown")
      setGender("male")
      setCalendarType("solar")
      return
    }

    const profile = savedProfiles.find((p) => p.id === profileId)
    if (!profile) return

    setRelationship((profile.relationship ?? "self") as Relationship)
    setName(profile.name)
    setBirthDate(profile.birthDate)
    setBirthTime(profile.birthTime)
    setGender(profile.gender)
    setCalendarType(profile.calendarType)
  }

  const handleSubmit = () => {
    if (!name || !birthDate) return
    onSubmit({
      relationship,
      name,
      birthDate,
      birthTime,
      gender,
      calendarType,
    })
  }

  const isValid = name !== "" && birthDate !== ""

  return (
    <div className="flex min-h-screen flex-col starfield">
      {/* Cosmic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-sky-500/10 blur-[80px]" />
        <div className="absolute bottom-40 -left-20 w-48 h-48 rounded-full bg-cyan-500/10 blur-[60px]" />
      </div>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-sky-400" />
          <h1 className="font-medium text-foreground">운세 정보 입력</h1>
          <span className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 px-2 py-0.5 text-xs font-medium text-white">
            2026년
          </span>
        </div>
      </header>

      {/* Form Content */}
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
              </CardContent>
            </Card>
          )}

          {/* ✅ 관계 */}
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
              <Select value={birthTime} onValueChange={setBirthTime}>
                <SelectTrigger className="h-12 rounded-xl border-border bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {birthTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      ? "border-sky-400 bg-sky-400/10 text-sky-400"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="male" className="sr-only" />
                  <span className="font-medium">남성</span>
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    gender === "female"
                      ? "border-sky-400 bg-sky-400/10 text-sky-400"
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
                      ? "border-sky-400 bg-sky-400/10 text-sky-400"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="solar" className="sr-only" />
                  <span className="font-medium">양력</span>
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    calendarType === "lunar"
                      ? "border-sky-400 bg-sky-400/10 text-sky-400"
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

      {/* Submit Button */}
      <div className="sticky bottom-0 border-t border-border glass px-6 py-4 relative z-10">
        <div className="mx-auto max-w-sm">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="h-14 w-full rounded-xl bg-gradient-to-r from-sky-400 via-cyan-500 to-teal-400 text-white text-base font-medium shadow-lg disabled:opacity-50"
          >
            결과 보기
          </Button>
        </div>
      </div>
    </div>
  )
}
