// lib/runtime.ts
export function isV0Preview() {
  if (typeof window === "undefined") return false

  // ✅ v0 프리뷰는 iframe 안에서 실행됨 → 이것만 신뢰
  return window.self !== window.top
}
