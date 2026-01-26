"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock, User, Sparkles } from "lucide-react"
import type { SajuInput, SavedProfile, Relationship } from "@/app/page"

interface SajuInputScreenProps {
  savedProfiles: SavedProfile[]
  onSubmit: (input: SajuInput) => void
  onBack: () => void
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

export default function SajuInputScreen({ savedProfiles, onSubmit, onBack, onDeleteProfile }: SajuInputScreenProps) {
  const [relationship, setRelationship] = useState<Relationship>("self")
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar")
  // Radix Select는 value가 ""(빈 문자열)일 때 런타임 에러가 날 수 있어 기본값은 "new"로 둔다.
  const [selectedProfileId, setSelectedProfileId] = useState<string>("new")

  const isExistingSelected = selectedProfileId !== "new" && selectedProfileId !== ""

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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-primary/15 blur-[80px]" />
        <div className="absolute bottom-40 -left-20 w-48 h-48 rounded-full bg-accent/10 blur-[60px]" />
      </div>

      <header className="flex items-center gap-3 px-4 py-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h1 className="font-medium text-foreground">운명 정보 입력</h1>
          <span className="rounded-full gradient-primary px-2 py-0.5 text-xs font-medium text-white">2026년</span>
        </div>
      </header>

      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-6">
          {savedProfiles.length > 0 && (
            <Card className="border-none glass shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Label className="text-sm font-medium text-foreground">운명을 볼 사람을 선택해주세요</Label>
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
                          {(profile.relationship ? relationshipOptions.find(r => r.value === profile.relationship)?.label : "본인") ?? "본인"} ·{" "}
                          {profile.name} ({profile.birthDate})
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
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="male" className="sr-only" />
                  <span className="font-medium">남성</span>
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    gender === "female"
                      ? "border-primary bg-primary/10 text-primary"
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
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="solar" className="sr-only" />
                  <span className="font-medium">양력</span>
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-3 transition-all ${
                    calendarType === "lunar"
                      ? "border-primary bg-primary/10 text-primary"
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
        <div className="mx-auto max-w-sm">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="h-14 w-full rounded-xl gradient-cosmic text-white text-base font-medium shadow-lg disabled:opacity-50"
          >
            결과 보기
          </Button>
        </div>
      </div>
    </div>
  )
}
