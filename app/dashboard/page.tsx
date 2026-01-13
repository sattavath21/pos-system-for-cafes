"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Coffee, Users, Package, Receipt, List, Tag, Play, Store, Settings, ChartLine } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"

export default function DashboardPage() {
  const { t } = useTranslation()
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/role-select'
  }

  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Shift Management
  const [isShiftOpen, setIsShiftOpen] = useState(false)
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null)
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [startCash, setStartCash] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const d = await res.json()
          setUser(d.user)
        }
      } catch (e) { }
    }
    fetchUser()

    const checkShiftStatus = async () => {
      try {
        const res = await fetch('/api/shifts?status=OPEN')
        if (res.ok) {
          const shifts = await res.json()
          if (shifts.length > 0) {
            setIsShiftOpen(true)
            setActiveShiftId(shifts[0].id)
          } else {
            setIsShiftOpen(false)
            setIsShiftModalOpen(true)
          }
        }
      } catch (e) { console.error(e) }
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }

    const cart = localStorage.getItem("pos_cart")
    if (cart && JSON.parse(cart).length > 0) {
      setHasActiveSession(true)
    }

    checkShiftStatus()
    fetchStats()
  }, [])

  const handleOpenShift = async () => {
    if (!startCash) return alert("Please enter opening cash amount")
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        body: JSON.stringify({
          startCash: Number(startCash)
        })
      })
      if (res.ok) {
        const shift = await res.json()
        setActiveShiftId(shift.id)
        setIsShiftOpen(true)
        setIsShiftModalOpen(false)
      } else {
        alert("Failed to open shift")
      }
    } catch (e) { alert("Error opening shift") }
  }

  const quickActions = [
    {
      title: hasActiveSession ? t.resume_order : t.new_order,
      icon: Coffee,
      href: "/pos",
      color: hasActiveSession ? "bg-orange-600 hover:bg-orange-700" : "bg-amber-600 hover:bg-amber-700"
    },
    { title: t.orders, icon: Receipt, href: "/orders", color: "bg-green-600 hover:bg-green-700" },
    { title: t.menu, icon: List, href: "/menu", color: "bg-blue-600 hover:bg-blue-700" },
    { title: t.inventory, icon: Package, href: "/inventory", color: "bg-orange-600 hover:bg-orange-700" },
    { title: t.customers, icon: Users, href: "/customers", color: "bg-yellow-600 hover:bg-yellow-700" },
    { title: t.promotions, icon: Tag, href: "/promotions", color: "bg-rose-600 hover:bg-rose-700" },
    { title: t.reports, icon: ChartLine, href: "/reports", color: "bg-purple-600 hover:bg-purple-700" },
  ]

  const statIcons: Record<string, any> = {
    "Today's Sales": DollarSign,
    "Orders": ShoppingCart,
    "Avg Order Value": TrendingUp,
    "Low Stock Items": AlertTriangle
  }

  const statColors: Record<string, string> = {
    "Today's Sales": "text-green-600",
    "Orders": "text-blue-600",
    "Avg Order Value": "text-purple-600",
    "Low Stock Items": "text-orange-600"
  }

  const statBgs: Record<string, string> = {
    "Today's Sales": "bg-green-50",
    "Orders": "bg-blue-50",
    "Avg Order Value": "bg-purple-50",
    "Low Stock Items": "bg-orange-50"
  }

  if (isLoading) return <div className="p-10 text-center">Loading Dashboard...</div>

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">{t.dashboard}</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-amber-900 leading-none">{user?.full_name || user?.name || "Staff"}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            {user?.role === 'ADMIN' && (
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="text-amber-900 hover:bg-amber-50 cursor-pointer">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
              {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        {user?.role === 'ADMIN' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data?.summary.map((stat: any) => {
              const Icon = statIcons[stat.title] || DollarSign
              return (
                <Card key={stat.title} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.title === "Today's Sales" ? t.today_sales :
                          stat.title === "Orders" ? t.orders :
                            stat.title === "Avg Order Value" ? t.avg_order_value :
                              stat.title === "Low Stock Items" ? t.low_stock_items : stat.title}
                      </p>
                      <p className="text-3xl font-bold mb-2">
                        {stat.type === "currency" ? formatLAK(stat.value) : stat.value}
                      </p>
                      <p className={`text-sm ${stat.change.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>{stat.change}</p>
                    </div>
                    <div className={`${statBgs[stat.title]} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${statColors[stat.title]}`} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Quick Actions */}
        {/* Page Navigation – Touch Screen Friendly */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">{t.quick_actions}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions
              .filter(action => action.href !== '/reports' || user?.role === 'ADMIN')
              .map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.title} href={action.href}>
                    <div
                      className={`
                h-24 px-6
                flex items-center gap-5
                rounded-2xl
                ${action.color}
                text-white
                active:opacity-80
                hover:opacity-90
                transition-opacity
                select-none
                cursor-pointer
              `}
                    >
                      <Icon className="w-9 h-9 shrink-0" />
                      <span className="text-xl font-bold">
                        {action.title}
                      </span>
                    </div>
                  </Link>
                )
              })}
          </div>
        </Card>



        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t.active_orders}</h2>
              <Link href="/orders">
                <Button variant="outline" size="sm">
                  {t.view_all}
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {data?.activeOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">{formatLAK(order.total)}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "READY"
                          ? "bg-green-100 text-green-700"
                          : order.status === "PREPARING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                          }`}
                      >
                        {order.status}
                      </span>
                      {["HOLD", "PENDING", "PREPARING"].includes(order.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => window.location.href = `/pos?resumeOrder=${order.id}`}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {data?.activeOrders.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No active orders</p>}
            </div>
          </Card>

          {/* Top Selling Items */}
          {user?.role === 'ADMIN' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">{t.top_selling_items}</h2>
              <div className="space-y-3">
                {data?.topItems.map((item: any, index: number) => (
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
                {data?.topItems.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No sales data yet</p>}
              </div>
            </Card>
          )}
        </div>

        {/* Low Stock Alerts */}
        {
          user?.role === 'ADMIN' && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold">{t.low_stock_alerts}</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {data?.lowStockAlerts.map((item: any) => (
                  <div key={item.name} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <p className="font-semibold mb-1">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.current} {item.unit} (Min: {item.min} {item.unit})
                    </p>
                  </div>
                ))}
                {data?.lowStockAlerts.length === 0 && <p className="col-span-full text-sm text-muted-foreground py-4 text-center">All stock levels are healthy</p>}
              </div>
            </Card>
          )
        }
      </div >

      {/* Open Shift Dialog */}
      <Dialog open={isShiftModalOpen} onOpenChange={(open) => { if (!open && isShiftOpen) setIsShiftModalOpen(false) }}>
        <DialogContent className="sm:max-w-md pointer-events-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Open New Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg text-amber-900 text-sm">
              <p className="font-bold">👋 Good Morning!</p>
              <p>You must open a shift and count the cash drawer before taking orders.</p>
            </div>
            <div>
              <Label>Starting Cash Amount</Label>
              <Input
                type="number"
                placeholder="0"
                value={startCash}
                onChange={e => setStartCash(e.target.value)}
                className="text-lg font-bold"
              />
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleOpenShift}>
              Open Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  )
}
