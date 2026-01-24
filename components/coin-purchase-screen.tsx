"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Coins, Minus, Plus, Sparkles } from "lucide-react"

interface CoinPurchaseScreenProps {
  onPurchase: (amount: number) => void
  onBack: () => void
}

const COIN_PRICE = 100

export default function CoinPurchaseScreen({ onPurchase, onBack }: CoinPurchaseScreenProps) {
  const [quantity, setQuantity] = useState(1)

  const totalPrice = quantity * COIN_PRICE

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (quantity < 99) {
      setQuantity(quantity + 1)
    }
  }

  const handlePurchase = () => {
    onPurchase(quantity)
  }

  return (
    <div className="flex min-h-screen flex-col starfield">
      {/* Cosmic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-primary/15 blur-[80px]" />
        <div className="absolute bottom-40 -left-20 w-48 h-48 rounded-full bg-accent/10 blur-[60px]" />
      </div>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h1 className="font-medium text-foreground">엽전 환전소</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="mx-auto max-w-sm space-y-6">
          {/* Coin Info */}
          <Card className="border-none glass shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-gold shadow-xl animate-float">
                  <Coins className="h-12 w-12 text-amber-900" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h2 className="font-serif text-xl font-semibold text-foreground">엽전</h2>
                <p className="text-sm text-muted-foreground">1개 = {COIN_PRICE.toLocaleString()}원</p>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Selector */}
          <Card className="border-none glass shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">구매 수량</span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-border bg-secondary/50"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-lg font-semibold text-foreground">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-border bg-secondary/50"
                    onClick={handleIncrease}
                    disabled={quantity >= 99}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">총 결제 금액</span>
                  <span className="text-xl font-bold gradient-text">{totalPrice.toLocaleString()}원</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 9, 18].map((num) => (
              <Button
                key={num}
                variant={quantity === num ? "default" : "outline"}
                className={`h-12 rounded-xl ${quantity === num ? "gradient-primary text-white" : "border-border bg-secondary/50"}`}
                onClick={() => setQuantity(num)}
              >
                {num}개
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Button */}
      <div className="sticky bottom-0 border-t border-border glass px-6 py-4 relative z-10">
        <div className="mx-auto max-w-sm">
          <Button
            onClick={handlePurchase}
            className="h-14 w-full rounded-xl bg-kakao text-kakao-foreground text-base font-medium hover:bg-kakao/90 shadow-lg"
          >
            카카오페이로 {totalPrice.toLocaleString()}원 결제
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            오늘의 운세 1개 / 운명, 운세보기 9개가 필요합니다
          </p>
        </div>
      </div>
    </div>
  )
}
