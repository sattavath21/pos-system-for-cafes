"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"

type Order = {
    id: string
    orderNumber: string
    status: string
    total: number
    subtotal: number
    tax: number
    customerId?: string
    items: { name: string; quantity: number; price: number }[]
    createdAt: string
}

export default function ActiveOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchOrders()
    }, [])

    useEffect(() => {
        let filtered = orders
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(o => o.status === statusFilter)
        }
        if (searchQuery) {
            filtered = filtered.filter(o =>
                o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }
        setFilteredOrders(filtered)
    }, [orders, statusFilter, searchQuery])

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders')
            if (res.ok) {
                const data = await res.json()
                setOrders(data)
                setFilteredOrders(data)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleResumeOrder = (order: Order) => {
        // TODO: Load order into POS
        window.location.href = `/pos?orderId=${order.id}`
    }

    const getStatusBadge = (status: string) => {
        const colors = {
            PENDING: "bg-orange-100 text-orange-700",
            HOLD: "bg-yellow-100 text-yellow-700",
            COMPLETED: "bg-green-100 text-green-700",
            CANCELLED: "bg-red-100 text-red-700",
        }
        return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700"
    }

    const statusCounts = {
        ALL: orders.length,
        HOLD: orders.filter(o => o.status === "HOLD").length,
        PENDING: orders.filter(o => o.status === "PENDING").length,
        COMPLETED: orders.filter(o => o.status === "COMPLETED").length,
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold text-amber-900">Active Orders</h1>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by order number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        {["ALL", "HOLD", "PENDING", "COMPLETED"].map(status => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? "default" : "outline"}
                                onClick={() => setStatusFilter(status)}
                                className={statusFilter === status ? "bg-amber-600 hover:bg-amber-700" : ""}
                            >
                                {status} ({statusCounts[status as keyof typeof statusCounts]})
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Orders List */}
                <div className="grid gap-4">
                    {filteredOrders.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">
                            No orders found
                        </Card>
                    ) : (
                        filteredOrders.map(order => (
                            <Card key={order.id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold">{order.orderNumber}</h3>
                                            <Badge className={getStatusBadge(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-amber-600">{formatLAK(order.total)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span className="text-muted-foreground">{formatLAK(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>

                                {order.status === "HOLD" && (
                                    <Button
                                        className="w-full bg-amber-600 hover:bg-amber-700"
                                        onClick={() => handleResumeOrder(order)}
                                    >
                                        Resume Order
                                    </Button>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
