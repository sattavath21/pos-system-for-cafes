"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"
import { formatLAK } from "@/lib/currency"

interface PaymentQRProps {
    amount: number
    orderNumber: string
    onComplete?: () => void
}

export function PaymentQR({ amount, orderNumber, onComplete }: PaymentQRProps) {
    const [status, setStatus] = useState<"pending" | "completed">("pending")

    // Generate QR data (placeholder - will be replaced with bank API)
    const qrData = JSON.stringify({
        orderNumber,
        amount,
        merchant: "POS System",
        timestamp: new Date().toISOString(),
    })

    // Broadcast to customer-view
    useEffect(() => {
        const channel = new BroadcastChannel("payment_channel")
        channel.postMessage({
            type: "QR_PAYMENT",
            data: {
                qrData,
                amount,
                orderNumber,
                status,
            },
        })

        return () => channel.close()
    }, [qrData, amount, orderNumber, status])

    // Simulate payment completion (replace with actual bank API webhook)
    useEffect(() => {
        // In production, this would listen for payment confirmation from bank API
        // For now, we'll just show the QR code
    }, [])

    const handleManualComplete = () => {
        setStatus("completed")
        if (onComplete) {
            setTimeout(onComplete, 1000)
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Amount to Pay</p>
                <p className="text-3xl font-bold text-green-600">{formatLAK(amount)}</p>
            </div>

            <Card className="p-6 bg-white">
                <div className="flex flex-col items-center gap-4">
                    {status === "pending" ? (
                        <>
                            <QRCodeSVG value={qrData} size={200} level="H" />
                            <div className="text-center">
                                <p className="font-semibold">Scan QR Code to Pay</p>
                                <p className="text-sm text-muted-foreground">Order #{orderNumber}</p>
                            </div>
                            <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Waiting for payment...</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-green-600">
                            <CheckCircle className="w-16 h-16" />
                            <p className="font-semibold text-lg">Payment Completed!</p>
                        </div>
                    )}
                </div>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 text-center">
                    ✓ QR Code is displaying on customer screen
                </p>
            </div>

            {/* Manual completion for testing - remove in production */}
            {status === "pending" && (
                <button
                    onClick={handleManualComplete}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                    (Dev: Mark as Paid)
                </button>
            )}
        </div>
    )
}
