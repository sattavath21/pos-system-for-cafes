"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, Mail, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

function ReceiptContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (orderId) {
      // Fetch order details.
      // I didn't make a specific GET /api/orders/[id] yet, but I can use GET /api/orders and filter or make a new one.
      // Actually faster to make a specific route /api/orders/[id] or just filter on client for now if list is short?
      // No, list limits 100.
      // I should create GET /api/orders/[id].
      // Or I can just fetch /api/reports? No.

      // Let's implement fetch logic here assuming I add the API route or use a query param on main route.
      // Let's add the API route quickly in the next tool call.

      fetch(`/api/orders/${orderId}`)
        .then(res => {
          if (res.ok) return res.json()
          throw new Error("Order not found")
        })
        .then(data => setOrder(data))
        .catch(e => console.error(e))
    }
  }, [orderId])

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading receipt...</p>
      </div>
    )
  }

  return (
    <Card className="max-w-md mx-auto my-8 p-8 bg-white shadow-lg print:shadow-none print:my-0 print:max-w-none">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-amber-900">Cafe POS</h1>
        <p className="text-muted-foreground">123 Coffee Street, Brewtown</p>
        <p className="text-muted-foreground">Tel: (555) 123-4567</p>
      </div>

      <div className="mb-6 text-sm">
        <div className="flex justify-between mb-1">
          <span className="text-muted-foreground">Date:</span>
          <span>{new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-muted-foreground">Order #:</span>
          <span>{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cashier:</span>
          <span>Admin</span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3 mb-6">
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-sm">
            <div className="flex-1">
              <span className="font-medium">{item.name}</span>
              <div className="text-muted-foreground text-xs">
                {item.quantity} x ${item.price.toFixed(2)}
              </div>
            </div>
            <span className="font-medium">${(item.quantity * item.price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${order.subtotal?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>${order.tax?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
          <span>Total</span>
          <span>${order.total?.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-6 text-center text-sm">
        <p className="font-medium">Payment Method: {order.paymentMethod}</p>
      </div>

      <div className="text-center space-y-2 text-sm text-muted-foreground print:hidden">
        <p>Thank you for your business!</p>
        <p>Please visit again</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-8 print:hidden">
        <Button className="flex-1" variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button className="flex-1" variant="outline">
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
        <Link href="/pos" className="flex-1">
          <Button className="w-full" variant="ghost">
            Close
          </Button>
        </Link>
      </div>
    </Card>
  )
}

export default function ReceiptPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <Suspense>
        <ReceiptContent />
      </Suspense>
    </div>
  )
}
