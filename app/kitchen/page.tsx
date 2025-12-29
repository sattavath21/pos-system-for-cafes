"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

type Order = {
  id: string
  table: string
  items: { name: string; quantity: number; modifiers?: string[] }[]
  status: "pending" | "preparing" | "ready"
  time: string
}

export default function KitchenPage() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/role-select'
  }

  const orders: Order[] = [
    {
      id: "ORD-125",
      table: "T3",
      items: [
        { name: "Latte", quantity: 2, modifiers: ["Medium", "Extra Shot"] },
        { name: "Cappuccino", quantity: 1 },
      ],
      status: "pending",
      time: "2 min ago",
    },
    {
      id: "ORD-126",
      table: "T5",
      items: [
        { name: "Americano", quantity: 3 },
        { name: "Croissant", quantity: 2 },
      ],
      status: "preparing",
      time: "5 min ago",
    },
    {
      id: "ORD-127",
      table: "T1",
      items: [
        { name: "Espresso", quantity: 1 },
        { name: "Mocha", quantity: 1, modifiers: ["Large", "Extra Chocolate"] },
      ],
      status: "preparing",
      time: "8 min ago",
    },
    {
      id: "ORD-128",
      table: "T7",
      items: [
        { name: "Green Tea", quantity: 2 },
        { name: "Blueberry Muffin", quantity: 3 },
      ],
      status: "ready",
      time: "12 min ago",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-600 hover:bg-orange-700">Pending</Badge>
      case "preparing":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Preparing</Badge>
      case "ready":
        return <Badge className="bg-green-600 hover:bg-green-700">Ready</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Kitchen Display</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{orders.filter((o) => o.status === "pending").length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Preparing</p>
            <p className="text-3xl font-bold text-blue-600">{orders.filter((o) => o.status === "preparing").length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Ready</p>
            <p className="text-3xl font-bold text-green-600">{orders.filter((o) => o.status === "ready").length}</p>
          </Card>
        </div>

        {/* Orders Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={`p-6 ${order.status === "pending"
                  ? "border-orange-200 bg-orange-50"
                  : order.status === "preparing"
                    ? "border-blue-200 bg-blue-50"
                    : "border-green-200 bg-green-50"
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{order.id}</h3>
                  <p className="text-sm text-muted-foreground">Table {order.table}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="space-y-3 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="border-b pb-2">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold">{item.name}</p>
                      <Badge variant="secondary" className="bg-white">
                        x{item.quantity}
                      </Badge>
                    </div>
                    {item.modifiers && <p className="text-sm text-muted-foreground">{item.modifiers.join(", ")}</p>}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="w-4 h-4" />
                <span>{order.time}</span>
              </div>

              <div className="space-y-2">
                {order.status === "pending" && (
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Preparing</Button>
                )}
                {order.status === "preparing" && (
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Ready
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button className="w-full bg-transparent" variant="outline">
                    Complete Order
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
