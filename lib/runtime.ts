// lib/runtime.ts
export function isV0Preview() {
  if (typeof window === "undefined") return false

  // ✅ v0 프리뷰는 iframe 안에서 실행됨
  const isIframe = window.self !== window.top

  // (보조 조건: 혹시 나중에 구조 바뀔 때 대비)
  const host = window.location.hostname
  const looksLikeV0 = host.includes("v0") || host.includes("vercel")

  return isIframe || looksLikeV0
}
