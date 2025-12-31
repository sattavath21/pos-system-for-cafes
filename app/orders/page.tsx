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
                                        onClick={() => {
                                            window.open(`/receipt?id=${order.id}`, '_blank', 'width=450,height=600');
                                        }}
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

        </div>
    )
}
