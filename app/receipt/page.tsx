"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

const formatLAK = (amount: number) => {
  return new Intl.NumberFormat('lo-LA', {
    style: 'currency',
    currency: 'LAK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('LAK', '').trim() + ' ₭'
}

function ReceiptContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => {
          if (res.ok) return res.json()
          throw new Error("Order not found")
        })
        .then(data => {
          setOrder(data)
          // Auto-trigger print once loaded
          setTimeout(() => {
            window.print()
          }, 500)
        })
        .catch(e => {
          console.error(e)
          setError(e.message)
        })
    }
  }, [orderId])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-rose-600 mb-4">Error: {error}</p>
        <Link href="/pos">
          <Button variant="outline">Back to POS</Button>
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900"></div>
        <p className="ml-3">Generating Receipt...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-0 sm:p-8 print:bg-white print:p-0">
      <Card id="printable-receipt" className="w-[80mm] p-6 bg-white shadow-none border-none font-mono text-sm">
        <div className="text-center border-b border-dashed border-black pb-4 mb-4">
          <h1 className="text-lg font-bold uppercase tracking-tight">Cafe POS</h1>
          <p className="text-xs">Vientiane, Laos</p>
          <p className="text-[10px] mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>

        <div className="flex justify-between font-bold mb-4">
          <span>{order.status === 'COMPLETED' ? 'RECEIPT' : 'ORDER'} {order.orderNumber}</span>
        </div>

        <div className="space-y-2 mb-4">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span className="flex-1 text-[11px] leading-tight">{item.name} x{item.quantity}</span>
              <span className="text-[11px]">{formatLAK(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-4 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span>Subtotal</span>
            <span>{formatLAK(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[11px]">
              <span>Discount</span>
              <span>-{formatLAK(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[11px]">
            <span>Tax (10%)</span>
            <span>{formatLAK(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed border-black">
            <span>TOTAL</span>
            <span>{formatLAK(order.total)}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed border-black text-[10px]">
          <p>Payment: {order.paymentMethod}</p>
          {order.customer && (
            <>
              <p>Customer: {order.customer.name}</p>
              <p>Points Earned: +{Math.floor(order.total / 1000)}</p>
            </>
          )}
        </div>

        <div className="text-center mt-6 pt-4 border-t border-dashed border-black text-[10px] uppercase">
          <p>Thank you for your visit!</p>
          <p className="mt-1">Please come again</p>
        </div>
      </Card>

      {/* Action Buttons - Hidden in Print */}
      <div className="mt-8 flex gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Re-Print
        </Button>
        <Link href="/pos">
          <Button className="bg-amber-600 hover:bg-amber-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to POS
          </Button>
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-receipt {
            box-shadow: none !important;
            border: none !important;
            width: 80mm !important;
            padding: 8mm !important; /* Enough margin for thermal head */
            position: absolute;
            left: 0;
            top: 0;
          }
          .print-hidden, button, a {
            display: none !important;
          }
        }
      ` }} />
    </div>
  )
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReceiptContent />
    </Suspense>
  )
}
