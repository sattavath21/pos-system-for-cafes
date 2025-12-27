"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Wallet, QrCode, DollarSign, Tag, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [cashReceived, setCashReceived] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  const orderTotal = 32.4
  const discount = discountCode ? 5.0 : 0
  const finalTotal = orderTotal - discount
  const change = cashReceived ? Math.max(0, Number.parseFloat(cashReceived) - finalTotal) : 0

  const paymentMethods = [
    { id: "cash", name: "Cash", icon: DollarSign, color: "bg-green-500 hover:bg-green-600" },
    { id: "card", name: "Card", icon: CreditCard, color: "bg-blue-500 hover:bg-blue-600" },
    { id: "qr", name: "QR Code", icon: QrCode, color: "bg-purple-500 hover:bg-purple-600" },
    { id: "ewallet", name: "E-Wallet", icon: Wallet, color: "bg-orange-500 hover:bg-orange-600" },
  ]

  const handlePayment = () => {
    setShowSuccess(true)
    setTimeout(() => {
      // Redirect to receipt
    }, 2000)
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <CheckCircle className="w-24 h-24 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-6">Order #ORD-125 completed</p>
          <div className="space-y-2">
            <Link href="/receipt">
              <Button className="w-full" size="lg">
                View Receipt
              </Button>
            </Link>
            <Link href="/pos">
              <Button className="w-full bg-transparent" variant="outline" size="lg">
                New Order
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/pos">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-amber-900">Payment</h1>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Order #ORD-125
          </Badge>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Order Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">2x Latte</span>
              <span>$9.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">1x Cappuccino</span>
              <span>$4.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">3x Croissant</span>
              <span>$10.50</span>
            </div>
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>$30.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span>$2.40</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-amber-600">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Discount Code */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Apply Discount</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Enter discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Apply</Button>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Select Payment Method</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <Button
                  key={method.id}
                  variant={paymentMethod === method.id ? "default" : "outline"}
                  className={`h-32 flex flex-col gap-3 ${paymentMethod === method.id ? method.color : ""}`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <Icon className="w-8 h-8" />
                  <span>{method.name}</span>
                </Button>
              )
            })}
          </div>
        </Card>

        {/* Cash Payment Details */}
        {paymentMethod === "cash" && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Cash Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cash Received</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="text-lg"
                />
              </div>

              {cashReceived && Number.parseFloat(cashReceived) >= finalTotal && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Change Due</span>
                    <span className="text-2xl font-bold text-green-600">${change.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                {[20, 50, 100, 200].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setCashReceived(amount.toString())}
                    className="h-12"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Confirm Payment */}
        <div className="flex gap-4">
          <Link href="/pos" className="flex-1">
            <Button variant="outline" size="lg" className="w-full bg-transparent">
              Cancel
            </Button>
          </Link>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
            disabled={!paymentMethod || (paymentMethod === "cash" && Number.parseFloat(cashReceived) < finalTotal)}
            onClick={handlePayment}
          >
            Confirm Payment ${finalTotal.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  )
}
