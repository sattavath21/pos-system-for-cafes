"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
    modifiers: string[]
}

export default function CustomerViewPage() {
    const [cart, setCart] = useState<CartItem[]>([])
    const [total, setTotal] = useState(0)
    const [isIdle, setIsIdle] = useState(true)

    useEffect(() => {
        const channel = new BroadcastChannel("pos_channel")

        channel.onmessage = (event) => {
            if (event.data.type === "CART_UPDATE") {
                setCart(event.data.cart)
                setTotal(event.data.total)
                setIsIdle(event.data.cart.length === 0)
            }
        }

        return () => channel.close()
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
                                        <span className="text-slate-400">@ ${item.price.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xl font-bold text-slate-700">${(item.price * item.quantity).toFixed(2)}</p>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right Panel: Totals */}
            <div className="w-[400px] bg-white border-l p-8 flex flex-col justify-center shadow-2xl z-10">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-lg text-slate-500">
                            <span>Subtotal</span>
                            <span>${(total / 1.08).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg text-slate-500">
                            <span>Tax (8%)</span>
                            <span>${(total - (total / 1.08)).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-bold text-slate-800">Total</span>
                            <span className="text-5xl font-extrabold text-amber-600">${total.toFixed(2)}</span>
                        </div>
                        <p className="text-right text-sm text-slate-400 mt-2">Thank you for visiting!</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
