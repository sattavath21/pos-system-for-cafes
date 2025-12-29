"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Coffee, Users, Package, Receipt } from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"

export default function DashboardPage() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/role-select'
  }

  const stats = [
    {
      title: "Today's Sales",
      value: formatLAK(2847500),
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Orders",
      value: "156",
      change: "+8.2%",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Avg Order Value",
      value: formatLAK(18250),
      change: "+3.1%",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Low Stock Items",
      value: "8",
      change: "Alert",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  const activeOrders = [
    { id: "ORD-001", table: "T3", items: 3, total: 24500, status: "preparing" },
    { id: "ORD-002", table: "T1", items: 2, total: 18000, status: "ready" },
    { id: "ORD-003", table: "T5", items: 5, total: 42750, status: "pending" },
  ]

  const topItems = [
    { name: "Latte", sold: 45, revenue: 213750 },
    { name: "Cappuccino", sold: 38, revenue: 171000 },
    { name: "Croissant", sold: 32, revenue: 112000 },
    { name: "Mocha", sold: 28, revenue: 147000 },
  ]

  const lowStock = [
    { name: "Coffee Beans", current: 2.5, unit: "kg", min: 5 },
    { name: "Milk", current: 8, unit: "L", min: 15 },
    { name: "Croissants", current: 12, unit: "pcs", min: 20 },
  ]

  const quickActions = [
    { title: "New Order", icon: Coffee, href: "/pos", color: "bg-amber-600 hover:bg-amber-700" },
    { title: "Menu", icon: Package, href: "/menu", color: "bg-blue-600 hover:bg-blue-700" },
    { title: "Customers", icon: Users, href: "/customers", color: "bg-green-600 hover:bg-green-700" },
    { title: "Reports", icon: Receipt, href: "/reports", color: "bg-purple-600 hover:bg-purple-700" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Admin User</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold mb-2">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.title} href={action.href}>
                  <Button className={`w-full h-24 flex flex-col gap-2 ${action.color} text-white`}>
                    <Icon className="w-8 h-8" />
                    <span>{action.title}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Active Orders</h2>
              <Link href="/orders">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Table {order.table} • {order.items} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">{formatLAK(order.total)}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "ready"
                          ? "bg-green-100 text-green-700"
                          : order.status === "preparing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Selling Items */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Top Selling Items</h2>
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.sold} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">{formatLAK(item.revenue)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold">Low Stock Alerts</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {lowStock.map((item) => (
              <div key={item.name} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <p className="font-semibold mb-1">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Current: {item.current} {item.unit} (Min: {item.min} {item.unit})
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
