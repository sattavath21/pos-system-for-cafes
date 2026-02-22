"use client"

import { ShoppingCart, CheckCircle, Clock, Utensils, Coffee, Candy, CandyOff, Droplet, Droplets, Minus } from "lucide-react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { formatLAK, calculateTax } from "@/lib/currency"
import { useShift } from "@/components/shift-provider"
import { useTranslation } from "@/hooks/use-translation"

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
    localName?: string
}

export default function CustomerViewPage() {
    const { t } = useTranslation()
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
            <div className="h-screen bg-slate-50 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-700">
                <div className="max-w-lg w-full px-6 relative">
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                    <Card className="relative overflow-hidden border-none shadow-[0_16px_48px_-12px_rgba(0,0,0,0.1)] rounded-3xl bg-white/90 backdrop-blur-xl">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500"></div>

                        <div className="p-8 flex flex-col items-center gap-5">
                            {/* Icon */}
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-ping opacity-20"></div>
                                <div className="absolute inset-3 rounded-full border-2 border-emerald-200 animate-pulse"></div>
                                <CheckCircle className="w-14 h-14 text-emerald-500 relative z-10" />
                            </div>

                            {/* Title */}
                            <div className="text-center space-y-1">
                                <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">
                                    {t.order_complete_msg || "Payment Confirmed!"}
                                </h1>
                                <p className="text-base text-slate-400 font-medium italic">Your order is now being prepared</p>
                            </div>

                            {/* Payment Details */}
                            <div className="w-full bg-slate-50/80 rounded-2xl px-6 py-4 space-y-3 border border-slate-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Amount Paid</span>
                                    <span className="text-2xl font-black text-slate-700">{formatLAK(successInfo.cashReceived)}</span>
                                </div>
                                <div className="h-px bg-slate-200/50"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Billed Total</span>
                                    <span className="text-xl font-bold text-slate-400">{formatLAK(successInfo.total)}</span>
                                </div>
                                <div className="bg-emerald-500 rounded-2xl px-5 py-4 text-white flex justify-between items-center shadow-md shadow-emerald-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <Coffee className="w-12 h-12 transform rotate-12" />
                                    </div>
                                    <span className="text-lg font-black uppercase tracking-tight">Your Change</span>
                                    <span className="text-4xl font-black tabular-nums">{formatLAK(successInfo.change)}</span>
                                </div>
                            </div>

                            {/* Thank you */}
                            <div className="space-y-1 text-center">
                                <div className="flex items-center justify-center gap-3 text-emerald-600 font-black text-base uppercase tracking-widest">
                                    <div className="h-px w-6 bg-emerald-200"></div>
                                    {t.thank_you}
                                    <div className="h-px w-6 bg-emerald-200"></div>
                                </div>
                                <p className="text-sm text-slate-400 font-medium">Please wait for your beeper call</p>
                            </div>
                        </div>
                    </Card>
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
            <div className="flex-1 p-4 flex flex-col h-screen">
                <header className="mb-4">
                    <h1 className="text-2xl font-bold text-slate-800">Your Order</h1>
                    <p className="text-sm text-slate-500">Please review your items below</p>
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
                        <div key={category} className="mb-4">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b pb-1">{category}</h2>
                            <div className="grid grid-cols-4 gap-2">
                                {items.map((item: any) => (
                                    <div key={item.id} className="p-2 border rounded-lg bg-white/80 hover:bg-white transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col">
                                                    <h3 className="text-base font-bold text-slate-800 leading-tight">{item.localName || item.name}</h3>
                                                    {item.localName && <span className="text-xs text-slate-500 font-medium">{item.name}</span>}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.variation && (
                                                        <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100 text-[10px] font-bold uppercase px-1.5 py-0">
                                                            {item.variation}
                                                        </Badge>
                                                    )}
                                                    {item.size && (
                                                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] font-bold px-1.5 py-0">
                                                            {item.size}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {(item.sugar || item.shot) && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.sugar && item.sugar !== 'Normal Sweet' && (
                                                            <Badge variant="outline" className="text-[10px] bg-amber-50/50 text-amber-800 border-amber-100 px-1 py-0 flex items-center gap-1">
                                                                {item.sugar === "No Sweet" && <CandyOff className="w-3 h-3" />}
                                                                {item.sugar === "Less Sweet" && <Droplet className="w-3 h-3" />}
                                                                {item.sugar === "Extra Sweet" && <Candy className="w-3 h-3" />}
                                                                {item.sugar}
                                                            </Badge>
                                                        )}
                                                        {item.shot && item.shot !== 'Normal Shot' && (
                                                            <Badge variant="outline" className="text-[10px] bg-gray-50/50 text-stone-800 border-stone-100 px-1 py-0 flex items-center gap-1">
                                                                {item.shot === "Reduced Shot" && <div className="flex"><Minus className="w-3 h-3" /><Coffee className="w-3 h-3" /></div>}
                                                                {item.shot === "Double Shot" && <div className="flex"><Coffee className="w-3 h-3" /><Coffee className="w-3 h-3" /></div>}
                                                                {item.shot}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-1.5 py-0 text-sm font-bold">x{item.quantity}</Badge>
                                                    <span className="text-sm text-slate-400 font-medium">@ {formatLAK(item.price)}</span>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-amber-700 flex-shrink-0">{formatLAK(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Totals or QR Payment */}
            <div className="w-[350px] bg-white border-l p-4 flex flex-col shadow-2xl z-10">
                {customer && (
                    <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100 animate-in slide-in-from-right duration-500">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                <span className="text-lg">👤</span>
                            </div>
                            <div>
                                <p className="text-xs text-amber-700 font-medium leading-tight">Selected Customer</p>
                                <p className="text-base font-bold text-amber-900 leading-tight">{customer.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col justify-center">
                    {qrPayment ? (
                        <div className="space-y-4">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-slate-800 mb-1">Scan to Pay</h2>
                                <p className="text-base font-semibold text-green-600">{formatLAK(qrPayment.amount)}</p>
                            </div>
                            <Card className="p-4 bg-slate-50">
                                <div className="flex justify-center">
                                    <QRCodeSVG value={qrPayment.qrData} size={200} level="H" />
                                </div>
                            </Card>
                            <div className="text-center space-y-1">
                                <p className="text-xs text-slate-600">Order #{qrPayment.orderNumber}</p>
                                <p className="text-xs text-blue-600 font-medium">Waiting for payment confirmation...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between text-base text-slate-500">
                                <span>Subtotal</span>
                                <span>{formatLAK(subtotal)}</span>
                            </div>
                            {promoDiscount > 0 && (
                                <div className="flex justify-between text-base text-rose-500">
                                    <span>Promotion {promoName ? `(${promoName})` : ''}</span>
                                    <span>-{formatLAK(promoDiscount)}</span>
                                </div>
                            )}
                            {loyaltyDiscount > 0 && (
                                <div className="flex justify-between text-base text-amber-500">
                                    <span>Loyalty Points Redeemed</span>
                                    <span>-{formatLAK(loyaltyDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base text-slate-500">
                                <span>Tax</span>
                                <span>{formatLAK(tax)}</span>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-2xl font-bold text-slate-800">Total</span>
                                    <span className="text-4xl font-extrabold text-amber-600">{formatLAK(total)}</span>
                                </div>
                                <p className="text-right text-xs text-slate-400 mt-1">Thank you for visiting!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
