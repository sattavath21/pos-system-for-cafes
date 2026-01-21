"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { formatLAK, calculateTax } from "@/lib/currency"
import { useShift } from "@/components/shift-provider"

type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
    modifiers: string[]
    category: string
    image?: string
    sugar?: string
    shot?: string
    variation?: string
    size?: string
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
    const [settings, setSettings] = useState<any>(null)
    const [customer, setCustomer] = useState<any>(null)
    const [successInfo, setSuccessInfo] = useState<{ total: number, cashReceived: number, change: number } | null>(null)

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
                setLoyaltyDiscount(event.data.loyaltyPoints || 0)
                setPromoName(event.data.promoName || "")
                setCustomer(event.data.customer || null)
                setIsIdle(event.data.cart.length === 0)
                setSuccessInfo(null) // Clear success when cart updates
            } else if (event.data.type === "PAYMENT_SUCCESS") {
                setSuccessInfo({
                    total: event.data.total,
                    cashReceived: event.data.cashReceived,
                    change: event.data.change
                })
            } else if (event.data.type === "ORDER_RESET") {
                setSuccessInfo(null)
                setCart([])
                setIsIdle(true)
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

        // Fetch settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(e => console.error(e))

        return () => {
            posChannel.close()
            paymentChannel.close()
        }
    }, [])

    const { status: shiftStatus } = useShift()

    // ... rest of useEffects

    if (shiftStatus === 'CLOSED') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
                <div className="max-w-md space-y-6">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <span className="text-4xl">🔒</span>
                    </div>
                    <h1 className="text-4xl font-bold">Store is Currently Closed</h1>
                    <p className="text-xl text-slate-400">
                        We are not taking orders at the moment. Please check back later.
                    </p>
                </div>
            </div>
        )
    }

    if (successInfo) {
        return (
            <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
                <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-3xl shadow-2xl border-4 border-emerald-100">
                    <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-6xl text-emerald-600">✅</span>
                    </div>
                    <h1 className="text-5xl font-black text-emerald-900 tracking-tight">Payment Successful!</h1>
                    <p className="text-xl text-emerald-700">Thank you for your visit</p>

                    <div className="border-y-2 border-dashed border-emerald-100 py-8 space-y-4">
                        <div className="flex justify-between items-center text-slate-500">
                            <span className="text-lg">Total Amount</span>
                            <span className="text-2xl font-bold">{formatLAK(successInfo.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                            <span className="text-lg">Amount Paid</span>
                            <span className="text-2xl font-bold">{formatLAK(successInfo.cashReceived)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-2xl font-bold text-emerald-800">Your Change</span>
                            <span className="text-4xl font-black text-emerald-600">{formatLAK(successInfo.change)}</span>
                        </div>
                    </div>

                    <p className="text-emerald-500 font-bold uppercase tracking-widest pt-4">See you again soon!</p>
                </div>
            </div>
        )
    }

    if (isIdle) {
        return (
            <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
                <div className="max-w-2xl space-y-8">
                    <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-6xl">☕</span>
                    </div>
                    <h1 className="text-6xl font-bold text-amber-900 tracking-tight">Welcome to {settings?.shopName || 'Cafe POS'}</h1>
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

                <div className="flex-1 overflow-y-auto pr-2">
                    {/* Grouping Logic */}
                    {Object.entries(
                        cart.reduce((acc: any, item) => {
                            const cat = item.category || "Other";
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(item);
                            return acc;
                        }, {})
                    ).map(([category, items]: [string, any]) => (
                        <div key={category} className="mb-8">
                            <h2 className="text-md font-bold text-slate-400 uppercase tracking-widest mb-4 border-b ">{category}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.map((item: any) => (
                                    <Card key={item.id} className="p-4 flex flex-col gap-3 shadow-sm border-0 bg-white/80 backdrop-blur hover:bg-white transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 bg-amber-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl">{item.category === "Coffee" ? "☕" : item.category === "Tea" ? "🍵" : "🍽️"}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{item.name}</h3>
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {item.variation && (
                                                        <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100 text-xs font-bold uppercase px-2 py-0.5">
                                                            {item.variation}
                                                        </Badge>
                                                    )}
                                                    {item.size && (
                                                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold px-2 py-0.5">
                                                            Size: {item.size}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {(item.sugar || item.shot) && (
                                                    <div className="flex flex-wrap gap-1 mt-1 opacity-80">
                                                        {item.sugar && item.sugar !== '100%' && <Badge variant="outline" className="text-[12px] bg-amber-50/50 text-amber-800 border-amber-100">Sweet: {item.sugar}</Badge>}
                                                        {item.shot && item.shot !== 'Normal' && <Badge variant="outline" className="text-[12px] bg-gray-50/50 text-stone-800 border-stone-100">Shot: {item.shot}</Badge>}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-2 py-0.5 text-lg font-bold">x{item.quantity}</Badge>
                                                    <span className="text-lg text-slate-400 font-medium">@ {formatLAK(item.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto">
                                            <p className="text-2xl font-bold text-amber-700">{formatLAK(item.price * item.quantity)}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Totals or QR Payment */}
            <div className="w-[400px] bg-white border-l p-8 flex flex-col shadow-2xl z-10">
                {customer && (
                    <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-100 animate-in slide-in-from-right duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <span className="text-xl">👤</span>
                            </div>
                            <div>
                                <p className="text-sm text-amber-700 font-medium leading-tight">Selected Customer</p>
                                <p className="text-lg font-bold text-amber-900 leading-tight">{customer.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col justify-center">
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
                            <div className="flex justify-between text-lg text-slate-500">
                                <span>Subtotal</span>
                                <span>{formatLAK(subtotal)}</span>
                            </div>
                            {promoDiscount > 0 && (
                                <div className="flex justify-between text-lg text-rose-500">
                                    <span>Promotion {promoName ? `(${promoName})` : ''}</span>
                                    <span>-{formatLAK(promoDiscount)}</span>
                                </div>
                            )}
                            {loyaltyDiscount > 0 && (
                                <div className="flex justify-between text-lg text-amber-500">
                                    <span>Loyalty Points Redeemed</span>
                                    <span>-{formatLAK(loyaltyDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg text-slate-500">
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
        </div>
    )
}
