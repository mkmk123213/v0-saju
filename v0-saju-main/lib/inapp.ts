// lib/inapp.ts
export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""

  // 대표 인앱브라우저들
  return /KAKAOTALK|FBAN|FBAV|Instagram|NAVER|DaumApps|Line|Twitter|Snapchat/i.test(ua)
}

/**
 * Android에서는 Chrome intent로 외부 브라우저 열기 시도.
 * iOS는 시스템 제약으로 강제 Safari 열기가 어려워서 안내를 띄우는 방식이 안전함.
 */
export function openInExternalBrowser(url?: string) {
  if (typeof window === "undefined") return
  const target = url || window.location.href

  const isAndroid = /Android/i.test(navigator.userAgent || "")
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "")

  if (isAndroid) {
    // 크롬 인텐트로 열기 시도 (실패하면 그냥 현재창 이동)
    const u = new URL(target)
    const intentUrl =
      `intent://${u.host}${u.pathname}${u.search}` +
      `#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`
    window.location.href = intentUrl
    return
  }

  if (isIOS) {
    // iOS는 외부브라우저 강제 열기 제한이 많아서 새창 시도 + 안내
    window.open(target, "_blank", "noopener,noreferrer")
    alert("인앱 브라우저에서는 구글 로그인이 막힐 수 있어요.\n공유 버튼(↗︎) → 'Safari에서 열기'로 접속해 주세요.")
    return
  }

  // 일반 브라우저
  window.open(target, "_blank", "noopener,noreferrer")
}
