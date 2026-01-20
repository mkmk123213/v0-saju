"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"

interface PaymentScreenProps {
  onComplete: () => void
  onBack: () => void
}

export default function PaymentScreen({ onComplete, onBack }: PaymentScreenProps) {
  const [status, setStatus] = useState<"processing" | "complete">("processing")

  useEffect(() => {
    // 결제 시뮬레이션 (실제로는 카카오페이 연동)
    const timer = setTimeout(() => {
      setStatus("complete")
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (status === "complete") {
      const timer = setTimeout(() => {
        onComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [status, onComplete])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={status === "complete"}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-medium text-foreground">결제</h1>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="space-y-6 text-center">
          {status === "processing" ? (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-xl font-semibold text-foreground">결제 진행 중</h2>
                <p className="text-sm text-muted-foreground">카카오페이 결제를 진행하고 있습니다</p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-xl font-semibold text-foreground">결제 완료</h2>
                <p className="text-sm text-muted-foreground">사주 결과 화면으로 이동합니다</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
