import type React from "react"
import type { Metadata, Viewport } from "next"
import { Noto_Serif_KR } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "너의 운명은 - 사주와 점성술의 만남",
  description: "당신만의 신비로운 운명을 발견하세요",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1625",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className={`${notoSerifKR.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
