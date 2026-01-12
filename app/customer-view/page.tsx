"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { formatLAK, calculateTax } from "@/lib/currency"

type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
    modifiers: string[]
    category: string
}

export default function CustomerViewPage() {
    const [cart, setCart] = useState<CartItem[]>([])
    const [total, setTotal] = useState(0)
    const [subtotal, setSubtotal] = useState(0)
    const [tax, setTax] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [promoDiscount, setPromoDiscount] = useState(0)
    const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
    const [promoName, setPromoName] = useState("")
    const [isIdle, setIsIdle] = useState(true)
    const [qrPayment, setQrPayment] = useState<any>(null)

    useEffect(() => {
        const posChannel = new BroadcastChannel("pos_channel")
        const paymentChannel = new BroadcastChannel("payment_channel")

        posChannel.onmessage = (event) => {
            if (event.data.type === "CART_UPDATE") {
                setCart(event.data.cart)
                setTotal(event.data.total)
                setSubtotal(event.data.subtotal || 0)
                setTax(event.data.tax || 0)
                setDiscount(event.data.discount || 0)
                setPromoDiscount(event.data.promoDiscount || 0)
                setLoyaltyDiscount(event.data.loyaltyDiscount || 0)
                setPromoName(event.data.promoName || "")
                setIsIdle(event.data.cart.length === 0)
            }
        }
        // ... (rest of the effect)

        paymentChannel.onmessage = (event) => {
            if (event.data.type === "QR_PAYMENT") {
                setQrPayment(event.data.data)
                setIsIdle(false)
            } else if (event.data.type === "PAYMENT_METHOD_CHANGE") {
                if (event.data.method !== 'QR_CODE') {
                    setQrPayment(null)
                }
            } else if (event.data.type === "PAYMENT_COMPLETE") {
                setQrPayment(null)
                // Don't set isIdle true here if cart still has items,
                // but usually PAYMENT_COMPLETE means order finished.
                // If generic clear signal, just clear QR.
                setQrPayment(null)
            }
        }

        return () => {
            posChannel.close()
            paymentChannel.close()
        }
    }, [])

    if (isIdle) {
        return (
            <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
                <div className="max-w-2xl space-y-8">
                    <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-6xl">☕</span>
                    </div>
                    <h1 className="text-6xl font-bold text-amber-900 tracking-tight">Welcome to Cafe POS</h1>
                    <p className="text-2xl text-amber-700 font-light">
                        We're ready to take your order. Please let our barista know what you'd like!
                    </p>
                    <div className="pt-12 grid grid-cols-3 gap-8 opacity-70">
                        <div className="text-center">
                            <div className="text-4xl mb-2">🥐</div>
                            <p className="font-medium text-amber-800">Fresh Pastries</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-2">🍵</div>
                            <p className="font-medium text-amber-800">Organic Tea</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-2">🍰</div>
                            <p className="font-medium text-amber-800">Sweet Treats</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Left Panel: Order Details */}
            <div className="flex-1 p-8 flex flex-col h-screen">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Your Order</h1>
                    <p className="text-slate-500">Please review your items below</p>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {cart.map((item) => (
                        <Card key={item.id} className="p-6 flex items-center justify-between shadow-sm border-0 bg-white/80 backdrop-blur">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl">
                                    {item.category === "Coffee" ? "☕" : item.category === "Tea" ? "🍵" : "🍽️"}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800">{item.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">x{item.quantity}</Badge>
                                        <span className="text-slate-400">@ {formatLAK(item.price)}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xl font-bold text-slate-700">{formatLAK(item.price * item.quantity)}</p>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right Panel: Totals or QR Payment */}
            <div className="w-[400px] bg-white border-l p-8 flex flex-col justify-center shadow-2xl z-10">
                {qrPayment ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan to Pay</h2>
                            <p className="text-lg font-semibold text-green-600">{formatLAK(qrPayment.amount)}</p>
                        </div>
                        <Card className="p-6 bg-slate-50">
                            <div className="flex justify-center">
                                <QRCodeSVG value={qrPayment.qrData} size={250} level="H" />
                            </div>
                        </Card>
                        <div className="text-center space-y-2">
                            <p className="text-sm text-slate-600">Order #{qrPayment.orderNumber}</p>
                            <p className="text-sm text-blue-600 font-medium">Waiting for payment confirmation...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between text-xl text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatLAK(subtotal)}</span>
                        </div>
                        {promoDiscount > 0 && (
                            <div className="flex justify-between text-xl text-rose-500">
                                <span>Promotion {promoName ? `(${promoName})` : ''}</span>
                                <span>-{formatLAK(promoDiscount)}</span>
                            </div>
                        )}
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-xl text-amber-500">
                                <span>Loyalty Points Earning</span>
                                <span>-{formatLAK(loyaltyDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl text-slate-500">
                            <span>Tax</span>
                            <span>{formatLAK(tax)}</span>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex justify-between items-baseline">
                                <span className="text-3xl font-bold text-slate-800">Total</span>
                                <span className="text-5xl font-extrabold text-amber-600">{formatLAK(total)}</span>
                            </div>
                            <p className="text-right text-sm text-slate-400 mt-2">Thank you for visiting!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
