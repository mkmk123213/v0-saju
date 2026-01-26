"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Coins, Sparkles } from "lucide-react"

type Props = {
  open: boolean
  requiredCoins: number
  balanceCoins: number
  message?: string
  onClose: () => void
  onRetry: () => void
  onOpenPurchase: () => void
}

function safeInt(n: any, fallback = 0) {
  const v = Number(n)
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : fallback
}

export default function CoinRequiredDialog({
  open,
  requiredCoins,
  balanceCoins,
  message,
  onClose,
  onRetry,
  onOpenPurchase,
}: Props) {
  const required = safeInt(requiredCoins, 1)
  const balance = safeInt(balanceCoins, 0)
  const canPay = balance >= required

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Coins className="h-4 w-4 text-primary" />
            </span>
            엽전이 부족해요!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {message?.trim() ? message : "결과를 보려면 엽전 1닢이 필요해."}
          </div>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">필요 엽전</div>
              <div className="font-semibold">{required}닢</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">보유 엽전</div>
              <div className="font-semibold">{balance}닢</div>
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={canPay ? onRetry : onOpenPurchase}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                {canPay ? `${required}닢 쓰고 결과 보기` : "엽전 충전하러 가기"}
              </span>
            </Button>
            <Button variant="secondary" className="w-full" onClick={onClose}>
              다음에 보기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
