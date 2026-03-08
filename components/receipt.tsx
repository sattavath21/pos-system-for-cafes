"use client"

import { useTranslation } from "@/hooks/use-translation"
import { formatLAK } from "@/lib/currency"
import { ShoppingBag } from "lucide-react"

interface ReceiptProps {
    order: {
        orderNumber: string
        date: string
        items: any[]
        subtotal: number
        tax: number
        discount: number
        total: number
        cashReceived?: number
        paymentMethod: string
        customer?: any
    }
}

export function Receipt({ order }: ReceiptProps) {
    const { t } = useTranslation()

    return (
        <div id="receipt-content" className="w-[80mm] p-4 bg-white text-slate-900 font-mono text-xs">
            <div className="text-center mb-4">
                <h1 className="text-lg font-bold">MEMORIES LANE CAFE</h1>
                <p>Vientiane, Laos</p>
                <p>Tel: +856 20 XXXX XXXX</p>
            </div>

            <div className="border-b border-dashed mb-2 pb-2">
                <div className="flex justify-between">
                    <span>Order:</span>
                    <span>{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{order.date}</span>
                </div>
                <div className="flex justify-between">
                    <span>Method:</span>
                    <span>{order.paymentMethod}</span>
                </div>
            </div>

            <div className="mb-2">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-dashed">
                            <th className="text-left font-normal py-1">Item</th>
                            <th className="text-right font-normal py-1">Qty</th>
                            <th className="text-right font-normal py-1">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-1">
                                    <div>{item.localName || item.name}</div>
                                    <div className="text-[10px] opacity-70">
                                        {item.variation ? `${item.variation} - ` : ''} {item.size}
                                        {item.isTakeaway && <span className="text-blue-600 font-bold ml-1">(TAKE AWAY)</span>}
                                    </div>
                                </td>
                                <td className="text-right py-1">{item.quantity}</td>
                                <td className="text-right py-1">{formatLAK(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-dashed pt-2 space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatLAK(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                    <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{formatLAK(order.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatLAK(order.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed">
                    <span>TOTAL:</span>
                    <span>{formatLAK(order.total)}</span>
                </div>
            </div>

            {order.paymentMethod === 'CASH' && order.cashReceived !== undefined && (
                <div className="mt-2 text-[10px] space-y-0.5 opacity-80">
                    <div className="flex justify-between">
                        <span>Cash Received:</span>
                        <span>{formatLAK(order.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Change:</span>
                        <span>{formatLAK(Math.max(0, order.cashReceived - order.total))}</span>
                    </div>
                </div>
            )}

            {order.customer && (
                <div className="mt-4 pt-2 border-t border-dashed text-center italic">
                    <p>Customer: {order.customer.name}</p>
                    <p>Points Earned: {Math.floor(order.total / 1000)} pts</p>
                </div>
            )}

            <div className="text-center mt-6">
                <p className="font-bold">THANK YOU!</p>
                <p>Please come again</p>
            </div>
        </div>
    )
}
