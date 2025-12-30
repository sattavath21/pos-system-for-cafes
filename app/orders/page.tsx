"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, Play, Printer } from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type Order = {
    id: string
    orderNumber: string
    status: string
    total: number
    customerId?: string
    customerName?: string
    createdAt: string
    items?: any[]
}

export default function ActiveOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [filter, setFilter] = useState<string>("ALL")
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders')
            if (res.ok) {
                const data = await res.json()
                setOrders(data)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleResumeOrder = async (orderId: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/resume`, {
                method: 'PUT'
            })
            if (res.ok) {
                // Redirect to POS with order data
                window.location.href = `/pos?resumeOrder=${orderId}`
            }
        } catch (e) {
            console.error(e)
        }
    }

    const filteredOrders = filter === "ALL"
        ? orders
        : orders.filter(o => o.status === filter)

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; icon: any }> = {
            PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
            COMPLETED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
            HOLD: { color: "bg-orange-100 text-orange-800", icon: Clock },
            CANCELLED: { color: "bg-red-100 text-red-800", icon: XCircle }
        }

        const config = variants[status] || variants.PENDING
        const Icon = config.icon

        return (
            <Badge className={`${config.color} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {status}
            </Badge>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <h1 className="text-2xl font-bold text-amber-900">All Orders</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" size="sm">
                                Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto">
                    {["ALL", "PENDING", "HOLD", "COMPLETED", "CANCELLED"].map((status) => (
                        <Button
                            key={status}
                            variant={filter === status ? "default" : "outline"}
                            onClick={() => setFilter(status)}
                            className={filter === status ? "bg-amber-600 hover:bg-amber-700" : ""}
                        >
                            {status}
                        </Button>
                    ))}
                </div>

                {/* Orders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map((order) => (
                        <Card key={order.id} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {getStatusBadge(order.status)}
                            </div>

                            {order.customerName && (
                                <p className="text-sm mb-2">
                                    <span className="font-medium">Customer:</span> {order.customerName}
                                </p>
                            )}

                            <div className="flex justify-between items-center pt-3 border-t">
                                <span className="text-xl font-bold text-amber-600">
                                    {formatLAK(order.total)}
                                </span>

                                {["HOLD", "PENDING", "PREPARING"].includes(order.status) && (
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => window.location.href = `/pos?resumeOrder=${order.id}`}
                                    >
                                        <Play className="w-4 h-4 mr-1" />
                                        Resume
                                    </Button>
                                )}

                                {order.status === "COMPLETED" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                        onClick={() => setPrintingOrder(order)}
                                    >
                                        <Printer className="w-4 h-4 mr-1" />
                                        Print
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No {filter.toLowerCase()} orders found</p>
                    </div>
                )}
            </div>

            {/* Receipt Modal for Re-printing */}
            <Dialog open={!!printingOrder} onOpenChange={(open) => !open && setPrintingOrder(null)}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="flex flex-col items-center pt-4">
                        <Card id="reprint-receipt" className="w-full p-6 bg-slate-50 border-dashed border-2 shadow-none font-mono text-sm mb-6">
                            <div className="text-center border-b border-dashed pb-4 mb-4">
                                <h3 className="font-bold text-lg uppercase">Cafe POS</h3>
                                <p className="text-xs text-muted-foreground">Vientiane, Laos</p>
                                <p className="text-xs mt-1">{printingOrder && new Date(printingOrder.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="flex justify-between font-bold mb-4">
                                <span>Receipt {printingOrder?.orderNumber}</span>
                            </div>

                            <div className="space-y-2 mb-4">
                                {printingOrder?.items?.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between">
                                        <span className="flex-1 text-[11px] leading-tight">{item.name || "Product"} x{item.quantity}</span>
                                        <span className="text-[11px]">{formatLAK(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-dashed pt-4 space-y-1">
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{printingOrder && formatLAK(printingOrder.total / 1.1)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>Tax (10%)</span>
                                    <span>{printingOrder && formatLAK(printingOrder.total - (printingOrder.total / 1.1))}</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-dashed">
                                    <span>TOTAL</span>
                                    <span>{printingOrder && formatLAK(printingOrder.total)}</span>
                                </div>
                            </div>

                            <div className="text-center mt-6 pt-4 border-t border-dashed opacity-50 text-[10px]">
                                <p>DUPLICATE RECEIPT</p>
                            </div>
                        </Card>

                        <div className="w-full grid grid-cols-2 gap-3 print:hidden">
                            <Button
                                variant="outline"
                                onClick={() => setPrintingOrder(null)}
                            >
                                Close
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => window.print()}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                  /* Root level isolation */
                  html, body {
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    height: auto !important;
                    overflow: visible !important;
                  }

                  body * {
                    visibility: hidden !important;
                  }

                  #reprint-receipt, #reprint-receipt * {
                    visibility: visible !important;
                    opacity: 1 !important;
                    color: black !important;
                  }

                  #reprint-receipt {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 80mm !important;
                    padding: 10mm !important;
                    margin: 0 !important;
                    background: white !important;
                    border: none !important;
                    box-shadow: none !important;
                    display: block !important;
                    font-family: monospace !important;
                    height: auto !important;
                    overflow: visible !important;
                  }

                  /* Force hide dialog accessories */
                  [role="dialog"], [data-state="open"], .fixed {
                      background: none !important;
                      border: none !important;
                      box-shadow: none !important;
                  }

                  #reprint-receipt * {
                    color: black !important;
                    border-color: black !important;
                  }
                }
            ` }} />
        </div>
    )
}
