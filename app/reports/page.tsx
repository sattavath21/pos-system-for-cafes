'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
  Line, LineChart, Pie, PieChart, Cell
} from "recharts"
import {
  Calendar, Download, TrendingUp, DollarSign, ShoppingBag,
  CreditCard, TrendingDown, Clock, Tag, Package, AlertTriangle, Search, Filter
} from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"

const COLORS = ['#d97706', '#2563eb', '#16a34a', '#7c3aed', '#db2777', '#4b5563']

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30") // 7, 30, 90

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const d = await res.json()
          if (d.user.role === 'CASHIER') {
            window.location.href = '/dashboard'
          }
        }
      } catch (e) { }
    }
    checkRole()
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const start = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()
      const res = await fetch(`/api/reports/analytics?startDate=${start}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const exportCSV = () => {
    if (!data) return
    const headers = "Metric,Value\n"
    const summary = [
      `Total Revenue,${data.summary.totalRevenue}`,
      `Total Orders,${data.summary.totalOrders}`,
      `AOV,${data.summary.aov}`,
      `Total Discounts,${data.summary.totalDiscounts}`
    ].join("\n")
    const blob = new Blob([headers + summary], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${dateRange}d.csv`
    a.click()
  }

  if (isLoading && !data) return <div className="p-10 text-center">Loading Analytics...</div>

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Advanced Analytics</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <p className="text-sm font-medium mr-2 hidden md:block">Timeframe:</p>
            {[
              { label: "7 Days", value: "7" },
              { label: "30 Days", value: "30" },
              { label: "90 Days", value: "90" },
            ].map(range => (
              <Button
                key={range.value}
                variant={dateRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range.value)}
                className={dateRange === range.value ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export Full Insight
          </Button>
        </div>

        {/* Global Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatLAK(data?.summary.totalRevenue || 0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className="text-2xl font-bold">{data?.summary.totalOrders || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardDescription>Avg Order Value (AOV)</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatLAK(data?.summary.aov || 0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-rose-500">
            <CardHeader className="pb-2">
              <CardDescription>Customer Discounts</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatLAK(data?.summary.totalDiscounts || 0)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
            <TabsTrigger value="operations">Operations & Payments</TabsTrigger>
            <TabsTrigger value="promotions">Promotions ROI</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Revenue & Orders Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.dailyTrend}>
                      <XAxis dataKey="date" fontSize={11} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                      <YAxis yAxisId="left" orientation="left" stroke="#d97706" fontSize={11} tickFormatter={(v) => `${(v / 1000)}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#2563eb" fontSize={11} />
                      <Tooltip formatter={(v, name) => [name === 'revenue' ? formatLAK(v as number) : v, name]} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Share</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.categoryShare}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%" cy="50%"
                        outerRadius={80}
                        label={(e) => e.category}
                      >
                        {data?.categoryShare.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatLAK(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Best Sellers (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.topProducts.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-green-50/50">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-green-700">{i + 1}</span>
                          <p className="font-medium text-amber-900">{p.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{p.sold} sold</p>
                          <p className="text-xs text-muted-foreground">{formatLAK(p.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-700">
                      <TrendingDown className="w-5 h-5" />
                      Low Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data?.worstProducts.filter((p: any) => p.sold > 0).map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 border-b">
                          <p>{p.name}</p>
                          <p className="font-semibold text-rose-600">{p.sold} sales</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-rose-200">
                  <CardHeader className="bg-rose-50">
                    <CardTitle className="flex items-center gap-2 text-rose-800">
                      <AlertTriangle className="w-5 h-5" />
                      Trash Items (Zero Sales)
                    </CardTitle>
                    <CardDescription>Items that haven't sold at all in this period. Consider removal or discount.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {data?.zeroSales.map((p: any, i: number) => (
                        <div key={i} className="p-2 text-xs bg-muted rounded flex justify-between">
                          <span className="truncate mr-2">{p.name}</span>
                          <span className="text-muted-foreground">{formatLAK(p.price)}</span>
                        </div>
                      ))}
                      {data?.zeroSales.length === 0 && <p className="text-sm text-green-600">Great! All items have sales.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Sales (Peak Hours)</CardTitle>
                  <CardDescription>Helps determine staffing and power-saving hours.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.hourlySales}>
                      <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                      <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000)}k`} />
                      <Tooltip formatter={(v) => formatLAK(v as number)} />
                      <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Distribution</CardTitle>
                  <CardDescription>Revenue split for cash control and QR fees.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.paymentMethods}
                        dataKey="revenue"
                        nameKey="paymentMethod"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        label
                      >
                        {data?.paymentMethods.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#16a34a' : '#2563eb'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatLAK(v as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotion Performance (ROI)</CardTitle>
                <CardDescription>Identify which promotions are driving revenue vs losing money.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data?.promoImpact.map((p: any, i: number) => (
                    <Card key={i} className="p-4 bg-muted/50 border-rose-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5 text-rose-600" />
                        <h4 className="font-bold text-amber-900">{p.name}</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Times Used:</span>
                          <span className="font-bold">{p.usageCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Revenue Gained:</span>
                          <span className="font-bold text-green-600">{formatLAK(p.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Discount Cost:</span>
                          <span className="font-bold text-rose-600">-{formatLAK(p.totalDiscount)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {data?.promoImpact.length === 0 && <p className="text-center py-10 text-muted-foreground w-full col-span-full italic">No promotion usage data in this period.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
