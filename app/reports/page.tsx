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
  Calendar as CalendarIcon, Download, TrendingUp, DollarSign, ShoppingBag,
  CreditCard, TrendingDown, Clock, Tag, Package, AlertTriangle, Search, Filter, Target
} from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays, startOfDay, endOfDay, isSameDay, startOfToday, endOfToday } from "date-fns"
import { DateRange } from "react-day-picker"
import { useTranslation } from "@/hooks/use-translation"
import { Badge } from "@/components/ui/badge"

const COLORS = ['#d97706', '#2563eb', '#16a34a', '#7c3aed', '#db2777', '#4b5563']

export default function ReportsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  })

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
  }, [])

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchReports()
    }
  }, [dateRange])

  const fetchReports = async () => {
    if (!dateRange?.from || !dateRange?.to) return
    setIsLoading(true)
    try {
      const start = startOfDay(dateRange.from).toISOString()
      const end = endOfDay(dateRange.to).toISOString()
      const res = await fetch(`/api/reports/analytics?startDate=${start}&endDate=${end}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    if (!dateRange?.from || !dateRange?.to) return
    const start = startOfDay(dateRange.from).toISOString()
    const end = endOfDay(dateRange.to).toISOString()
    const url = `/api/reports/export?startDate=${start}&endDate=${end}`
    window.open(url, '_blank')
  }

  const getSalesTitle = () => {
    if (!dateRange?.from || !dateRange?.to) return t.today_sales

    const from = startOfToday()
    const isToday = isSameDay(dateRange.from, from) && isSameDay(dateRange.to, endOfToday())
    if (isToday) return t.today_sales_text

    const is7Days = isSameDay(dateRange.from, startOfDay(subDays(new Date(), 7)))
    if (is7Days) return t.this_week_sales

    const is30Days = isSameDay(dateRange.from, startOfDay(subDays(new Date(), 30)))
    if (is30Days) return t.in_30_days_sales

    const is90Days = isSameDay(dateRange.from, startOfDay(subDays(new Date(), 90)))
    if (is90Days) return t.this_quarter_sales

    return t.selected_period_sales
  }

  if (isLoading && !data) return <div className="p-10 text-center">{t.loading_analytics}</div>

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">{t.advanced_analytics}</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">{t.dashboard}</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <p className="text-sm font-medium hidden md:block">{t.timeframe}:</p>
            <div className="flex gap-2">
              <Button
                variant={dateRange?.from && isSameDay(dateRange.from, startOfDay(new Date())) && dateRange?.to && isSameDay(dateRange.to, endOfDay(new Date())) ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}
                className={dateRange?.from && isSameDay(dateRange.from, startOfDay(new Date())) && dateRange?.to && isSameDay(dateRange.to, endOfDay(new Date())) ? "bg-amber-600 text-white hover:bg-amber-700" : ""}
              >
                {t.today_caps}
              </Button>
              <Button
                variant={dateRange?.from && isSameDay(dateRange.from, startOfDay(subDays(new Date(), 7))) ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange({ from: startOfDay(subDays(new Date(), 7)), to: new Date() })}
                className={dateRange?.from && isSameDay(dateRange.from, startOfDay(subDays(new Date(), 7))) ? "bg-amber-600 text-white hover:bg-amber-700" : ""}
              >
                7 {t.days}
              </Button>
              <Button
                variant={dateRange?.from && isSameDay(dateRange.from, startOfDay(subDays(new Date(), 30))) ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange({ from: startOfDay(subDays(new Date(), 30)), to: new Date() })}
                className={dateRange?.from && isSameDay(dateRange.from, startOfDay(subDays(new Date(), 30))) ? "bg-amber-600 text-white hover:bg-amber-700" : ""}
              >
                30 {t.days}
              </Button>
              <Button
                variant={dateRange?.from && isSameDay(dateRange.from, startOfDay(subDays(new Date(), 90))) ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange({ from: startOfDay(subDays(new Date(), 90)), to: new Date() })}
                className={dateRange?.from && isSameDay(dateRange.from, startOfDay(subDays(new Date(), 90))) ? "bg-amber-600 text-white hover:bg-amber-700" : ""}
              >
                90 {t.days}
              </Button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>{t.select_date_range}</span>
                  )}

                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="bg-amber-600 text-white hover:bg-amber-700 hover:text-white border-amber-600">
            <Download className="w-4 h-4 mr-2" />
            {t.export_report}
          </Button>
        </div>

        {/* Global Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="p-4">
              <CardDescription>{getSalesTitle()}</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatLAK(data?.summary.totalRevenue || 0)}</CardTitle>
              <p className="text-[14px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{t.gross_sales_tax_incl}</p>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="p-4">
              <CardDescription>{t.net_sales}</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatLAK(data?.summary.netSales || 0)}</CardTitle>
              <p className="text-[14px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{t.revenue_before_tax}</p>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="p-4">
              <CardDescription>{t.tax_collected}</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatLAK(data?.summary.taxCollected || 0)}</CardTitle>
              <p className="text-[14px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{t.estimated_vat_sales_tax}</p>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="p-4">
              <CardDescription>{t.orders}</CardDescription>
              <CardTitle className="text-2xl font-bold">{data?.summary.totalOrders || 0}</CardTitle>
              <p className="text-[14px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{t.total_completed_transactions}</p>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="p-4">
              <CardDescription>{t.aov}</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatLAK(data?.summary.aov || 0)}</CardTitle>
              <p className="text-[14px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{t.average_order_value}</p>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="products">{t.product_performance}</TabsTrigger>
            <TabsTrigger value="operations">{t.operations_payments}</TabsTrigger>
            <TabsTrigger value="promotions">{t.promotions_roi}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>{t.revenue_trend}</CardTitle>
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
                  <CardTitle>{t.category_share}</CardTitle>
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
                  <CardTitle className="text-green-700">{t.best_sellers_caps}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.topProducts.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-900 border border-amber-200">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{p.productName}</p>
                            <div className="flex gap-1.5 mt-1">
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-slate-50 border-slate-200 font-medium text-slate-500 uppercase">{p.variantType}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-emerald-600">{p.sold} <span className="text-[10px] text-muted-foreground uppercase font-normal">{t.sold}</span></p>
                          <p className="text-sm font-semibold text-slate-500">{formatLAK(p.revenue)}</p>
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
                      {t.low_performance}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data?.worstProducts.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm p-3 rounded-lg border bg-slate-50/50">
                          <div>
                            <p className="font-semibold">{p.name}</p>
                          </div>
                          <p className="font-bold text-rose-600">{p.sold} sales</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-rose-200">
                  <CardHeader className="">
                    <CardTitle className="flex items-center gap-2 text-rose-800">
                      <AlertTriangle className="w-5 h-5" />
                      {t.trash_items}
                    </CardTitle>
                    <CardDescription>{t.trash_items_desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {data?.zeroSales.map((p: any, i: number) => (
                        <div key={i} className="p-2 text-xs bg-muted rounded flex justify-between">
                          <span className="truncate mr-2">{p.name}</span>
                          <span className="text-muted-foreground">{formatLAK(p.price)}</span>
                        </div>
                      ))}
                      {data?.zeroSales.length === 0 && <p className="text-sm text-green-600">{t.great_all_items_sold}</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Performance by Attributes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {t.size_performance}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.sizeStats.map((s: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl border bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center p-0">{s.name}</Badge>
                          <span className="font-bold text-slate-700">{s.name} Size</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{s.sold} items</p>
                          <p className="text-xs text-muted-foreground">{formatLAK(s.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t.variation_performance}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.variationStats.map((v: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl border bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-bold px-3 py-1 uppercase">{v.name}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{v.sold} items</p>
                          <p className="text-xs text-muted-foreground">{formatLAK(v.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.peak_hours}</CardTitle>
                  <CardDescription>{t.peak_activity_desc || "Peak activity hours."}</CardDescription>
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
                  <CardTitle>{t.payment_method_distribution}</CardTitle>
                  <CardDescription>{t.revenue_split || "Revenue split."}</CardDescription>
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
                <CardTitle>{t.promotions_roi}</CardTitle>
                <CardDescription>{t.promo_efficiency || "Promo efficiency."}</CardDescription>
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
                          <span>{t.times_used}:</span>
                          <span className="font-bold">{p.usageCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{t.revenue_gained}:</span>
                          <span className="font-bold text-green-600">{formatLAK(p.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{t.total_discount_cost}:</span>
                          <span className="font-bold text-rose-600">-{formatLAK(p.totalDiscount)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {data?.promoImpact.length === 0 && <p className="text-center py-10 text-muted-foreground w-full col-span-full italic">{t.no_promo_usage}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
