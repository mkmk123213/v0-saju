export function isV0Preview() {
  if (typeof window === "undefined") return false
  return window.location.hostname.includes("v0.app")
}
