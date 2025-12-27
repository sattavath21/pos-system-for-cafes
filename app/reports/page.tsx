"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Calendar, Download, TrendingUp, DollarSign, ShoppingBag, CreditCard } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports')
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
  }

  const exportCSV = () => {
    if (!data) return
    // Simple CSV export of daily sales
    const headers = "Date,Total Revenue\n"
    const rows = data.dailySales.map((d: any) => `${d.date},${d.total}`).join("\n")
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sales_report.csv'
    a.click()
  }

  // Fallback for chart data if empty
  const chartData = data?.dailySales?.length ? data.dailySales.map((d: any) => ({ name: d.date, total: d.total })) : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Sales Reports</h1>
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
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue (Today)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data?.today?.total?.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders (Today)</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.today?.orders || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="total" fill="#d97706" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No Data</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topProducts?.map((product: any, i: number) => (
                  <div key={i} className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold mr-4">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                    </div>
                    <div className="font-medium">${product.revenue?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
