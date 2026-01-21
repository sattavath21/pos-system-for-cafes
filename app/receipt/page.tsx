"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatLAK, calculateInclusiveTax } from "@/lib/currency"


function ReceiptContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const [order, setOrder] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null) // Added settings state
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

    // Fetch settings
    fetch('/api/settings')
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error("Failed to fetch settings")
      })
      .then((data) => setSettings(data))
      .catch((e) => {
        console.error(e)
        // Optionally set an error for settings as well, or just log
      })
  }, [orderId])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-rose-600 mb-4">Error: {error}</p>
        <Button variant="outline" onClick={() => window.close()}>Close Window</Button>
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
      <Card id="printable-receipt" className="w-[400px] p-6 bg-white shadow-none border-none font-mono text-sm leading-relaxed">
        <div className="text-center space-y-2 mb-6 pt-4">
          <div className="flex justify-center mb-4">
            <img src="/placeholder-logo.png" alt="Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">{settings?.shopName || 'Cafe POS'}</h1>
          <p className="text-xs text-muted-foreground">Order completed successfully</p>
        </div>

        <div className="border border-dashed border-slate-200 p-4 rounded-lg bg-slate-50 relative overflow-hidden">
          <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Order Number</p>
            <p className="text-3xl font-bold">{order.orderNumber}</p>
            <p className="text-lg font-bold uppercase mt-1">{settings?.shopName || 'Cafe POS'}</p>
            <p className="text-[10px] mt-1">{new Date(order.createdAt).toLocaleString()}</p>
          </div>

          {order.beeperNumber && (
            <div className="mb-3 p-2 border-2 border-dashed border-slate-400 text-center font-bold text-xl">
              BEEPER: {order.beeperNumber}
            </div>
          )}

          <div className="space-y-1 mb-3">
            {order.items?.map((item: any, i: number) => {

              const getVariation = (name: string) => {
                const match = name.match(/\(([^)]+)\)/);
                return match ? match[1] : null;
              };
              const getSize = (name: string) => {
                const parts = name.split('-');
                return parts[1] ? parts[1].trim() : null;
              };
              const cleanName = (name: string) => {
                return name
                  .replace(/\([^)]*\)/g, '') // remove (FRAPPE)
                  .replace(/-.*$/, '')       // remove - M
                  .trim();
              };

              const variation = item.variation || getVariation(item.name) || item.variationSize?.variation?.type;
              const size = item.cupSize || item.size || getSize(item.name) || item.variationSize?.size;
              const name = cleanName(item.name);

              return (
                <div key={i} className="flex flex-col mb-1 capitalize">
                  <div className="flex justify-between font-bold">
                    <span className="mr-2">{name} x{item.quantity}</span>
                    <span>{formatLAK(item.price * item.quantity)}</span>
                  </div>

                  {(variation || size) && (
                    <div className="text-[10px] text-slate-500 pl-2 font-bold">
                      {variation}{variation && size ? ' - ' : ''}{size}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 pl-2">
                    <span className="italic">Net: {formatLAK((item.price * item.quantity) - calculateInclusiveTax(item.price * item.quantity, settings?.taxRate || 10))} </span>
                  </div>

                  {((item.sugarLevel && item.sugarLevel !== "100%") || (item.shotType && item.shotType !== "Normal")) && (
                    <div className="text-[10px] text-slate-500 pl-2">
                      {item.sugarLevel && item.sugarLevel !== "100%" && `Sugar: ${item.sugarLevel} `}
                      {item.shotType && item.shotType !== "Normal" && `Shot: ${item.shotType}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Subtotal (Net)</span>
              <span>{formatLAK(order.total - order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-rose-600">
                <span>Discount</span>
                <span>-{formatLAK(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span>Tax ({settings?.taxRate || '10'}% Incl.)</span>
              <span>{formatLAK(order.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-dashed border-slate-300">
              <span>TOTAL</span>
              <span>{formatLAK(order.total)}</span>
            </div>
          </div>
        </div>

        {order.customer && (
          <div className="mt-3 pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-600">
            <p>Customer: {order.customer.name}</p>
            <p>Points Earned: +{Math.floor(order.total / 1000)}</p>
          </div>
        )}

        <div className="text-center mt-3 pt-2 text-[8px] opacity-70 border-t border-dashed border-slate-300">
          <p>Payment: {order.paymentMethod === 'BANK_NOTE' ? 'Cash' : 'Transfer'}</p>
          <p className="font-bold mt-1 uppercase">Thank you for your visit!</p>
        </div>
      </Card>

      {/* Action Buttons - Hidden in Print */}
      <div className="mt-8 flex gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Re-Print
        </Button>
        <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => window.close()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Close & Back
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0;
            size: 58mm auto; /* Fixed for 58mm thermal */
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          #printable-receipt {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important; 
            max-width: 80mm !important; /* Increased for better fitting */
            padding: 2mm !important; 
            margin: 0 auto !important;
            position: relative !important;
            left: auto !important;
            top: auto !important;
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
