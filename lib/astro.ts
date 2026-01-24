// lib/astro.ts
export type SunSign =
  | "양자리" | "황소자리" | "쌍둥이자리" | "게자리"
  | "사자자리" | "처녀자리" | "천칭자리" | "전갈자리"
  | "사수자리" | "염소자리" | "물병자리" | "물고기자리"

export function getSunSignFromBirthDate(birthDateISO: string): SunSign | null {
  const m = Number(birthDateISO.slice(5, 7))
  const d = Number(birthDateISO.slice(8, 10))
  if (!m || !d) return null

  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "양자리"
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "황소자리"
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "쌍둥이자리"
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "게자리"
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "사자자리"
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "처녀자리"
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "천칭자리"
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "전갈자리"
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "사수자리"
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "염소자리"
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "물병자리"
  return "물고기자리"
}

export function buildAstroSummary(birthDateISO: string): string {
  const sign = getSunSignFromBirthDate(birthDateISO)
  if (!sign) return "태양궁: 미확인\n강점 키워드: 미확인\n주의 키워드: 미확인"

  const map: Record<SunSign, { strengths: string; cautions: string }> = {
    "양자리": { strengths: "즉시결단·직진·승부욕", cautions: "성급함·말실수" },
    "황소자리": { strengths: "지속력·감각·현실성", cautions: "고집·변화저항" },
    "쌍둥이자리": { strengths: "정보력·소통·순발력", cautions: "산만·피로누적" },
    "게자리": { strengths: "공감·보호본능·기억력", cautions: "예민·혼자짐" },
    "사자자리": { strengths: "존재감·자신감·리더십", cautions: "과시·자존심" },
    "처녀자리": { strengths: "정리력·정확함·관리력", cautions: "완벽주의·걱정" },
    "천칭자리": { strengths: "균형감·관계감각·미감", cautions: "결정지연·눈치" },
    "전갈자리": { strengths: "집중력·깊이·밀도", cautions: "의심·극단화" },
    "사수자리": { strengths: "확장성·낙관·도전", cautions: "과신·약속과다" },
    "염소자리": { strengths: "책임감·구조화·지속성", cautions: "과몰입·감정절제" },
    "물병자리": { strengths: "독창성·객관성·개혁", cautions: "거리감·고집" },
    "물고기자리": { strengths: "직감·상상력·치유", cautions: "경계흐림·미루기" },
  }

  const { strengths, cautions } = map[sign]
  return [
    `태양궁: ${sign}`,
    `강점 키워드: ${strengths}`,
    `주의 키워드: ${cautions}`,
  ].join("\n")
}
