// lib/saju-lite.ts
export function getZodiacAnimal(birthDateISO: string): string | null {
  const y = Number(birthDateISO.slice(0, 4))
  if (!y) return null
  const animals = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"]
  const idx = ((y - 2016) % 12 + 12) % 12
  return `${animals[idx]}띠`
}

export function buildSajuLiteSummary(birthDateISO: string, birthTimeCode?: string | null): string {
  const zodiac = getZodiacAnimal(birthDateISO) ?? "미확인"
  const time = birthTimeCode ? `출생시간 코드: ${birthTimeCode}` : "출생시간: 미상"
  return [
    `띠(참고): ${zodiac}`,
    time,
    `성향 힌트: 꾸준함/리듬/선택과 집중 (정밀 명식 계산은 추후 고도화)`,
  ].join("\n")
}
