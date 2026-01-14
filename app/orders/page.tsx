"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, Play, Printer } from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"

type Order = {
    id: string
    orderNumber: string
    status: string
    total: number
    customerId?: string
    customerName?: string
    beeperNumber?: string
    createdAt: string
    items?: any[]
}

export default function ActiveOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [filter, setFilter] = useState<string>("ALL")
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null)
    const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null)
    const [cancelReason, setCancelReason] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

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

    const handleCancelOrder = async () => {
        if (!cancellingOrder || !cancelReason) return
        setIsProcessing(true)
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    id: cancellingOrder.id,
                    items: cancellingOrder.items || [],
                    total: cancellingOrder.total,
                    subtotal: cancellingOrder.total,
                    tax: 0,
                    status: 'CANCELLED',
                    cancellationReason: cancelReason
                }),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setCancellingOrder(null)
                setCancelReason("")
                fetchOrders()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsProcessing(false)
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
            <Header title="All Orders" />

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

                            {order.beeperNumber && (
                                <div className="mb-2">
                                    <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50 font-bold">
                                        BEEPER: {order.beeperNumber}
                                    </Badge>
                                </div>
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
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={() => setCancellingOrder(order)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                            onClick={() => {
                                                window.open(`/receipt?id=${order.id}`, '_blank', 'width=450,height=600');
                                            }}
                                        >
                                            <Printer className="w-4 h-4 mr-1" />
                                            Print
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Cancellation Modal */}
                <Dialog open={!!cancellingOrder} onOpenChange={() => setCancellingOrder(null)}>
                    <DialogContent>
                        <div className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>Cancel Order {cancellingOrder?.orderNumber}</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground">Are you sure you want to cancel this order? This will revert stock and refund cash payments.</p>
                            <div className="space-y-2">
                                <Label>Reason for Cancellation</Label>
                                <Input
                                    placeholder="e.g. Customer changed mind, incorrect item"
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setCancellingOrder(null)}>No, keep order</Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleCancelOrder}
                                    disabled={!cancelReason || isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Yes, cancel order"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Printing Modal (placeholder for future implementation) */}
                <Dialog open={!!printingOrder} onOpenChange={() => setPrintingOrder(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Print Receipt</DialogTitle>
                        </DialogHeader>
                        <p>Printing functionality will be implemented here.</p>
                        <Button onClick={() => setPrintingOrder(null)}>Close</Button>
                    </DialogContent>
                </Dialog>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No {filter.toLowerCase()} orders found</p>
                    </div>
                )}
            </div>

        </div>
    )
}
