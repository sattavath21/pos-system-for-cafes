"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, LogOut } from "lucide-react"
import Link from "next/link"
import { format24Hour, formatDateTime24 } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"

interface Shift {
    id: string
    userId: string | null
    startTime: string
    endTime: string | null
    startCash: number
    endCash: number | null
    actualCash: number | null
    difference: number | null
    cashPayments: number
    status: string
    createdAt: string
    updatedAt: string
}

export default function ShiftsPage() {
    const [shifts, setShifts] = useState<Shift[]>([])
    const [loading, setLoading] = useState(true)
    const [isEndShiftOpen, setIsEndShiftOpen] = useState(false)
    const [actualCash, setActualCash] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    const activeShift = shifts.find(s => s.status === 'OPEN')

    useEffect(() => {
        fetchShifts()
    }, [])

    const fetchShifts = async () => {
        try {
            const res = await fetch('/api/shifts')
            if (res.ok) {
                const data = await res.json()
                setShifts(data)
            }
        } catch (error) {
            console.error('Failed to fetch shifts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEndShift = async () => {
        if (!activeShift || !actualCash) return
        setIsProcessing(true)
        try {
            const res = await fetch('/api/shifts', {
                method: 'PUT',
                body: JSON.stringify({
                    id: activeShift.id,
                    actualCash: parseFloat(actualCash)
                }),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setIsEndShiftOpen(false)
                setActualCash("")
                const channel = new BroadcastChannel("payment_channel")
                channel.postMessage({ type: "PAYMENT_COMPLETE" }) // Reuse this as it triggers checkShiftStatus
                channel.close()
                fetchShifts()
            }
        } catch (error) {
            console.error('Failed to end shift:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US').format(amount)
    }

    const getShiftDuration = (start: string, end: string | null) => {
        if (!end) return 'Ongoing'
        const duration = new Date(end).getTime() - new Date(start).getTime()
        const hours = Math.floor(duration / (1000 * 60 * 60))
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}h ${minutes}m`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <Header title="Shift Reports">
                    {activeShift && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="ml-4 bg-red-600 hover:bg-red-700 h-8"
                            onClick={() => setIsEndShiftOpen(true)}
                        >
                            <LogOut className="w-4 h-4 mr-1" />
                            End Shift
                        </Button>
                    )}
                </Header>

                {/* Shifts Table */}
                <Card className="p-6">
                    {loading ? (
                        <div className="text-center py-8">Loading shifts...</div>
                    ) : shifts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No shifts found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-semibold">Date</th>
                                        <th className="text-left p-3 font-semibold">Start Time</th>
                                        <th className="text-left p-3 font-semibold">End Time</th>
                                        <th className="text-right p-3 font-semibold">Duration</th>
                                        <th className="text-right p-3 font-semibold">Start Cash</th>
                                        <th className="text-right p-3 font-semibold">Cash Sales</th>
                                        <th className="text-right p-3 font-semibold">Expected</th>
                                        <th className="text-right p-3 font-semibold">Actual</th>
                                        <th className="text-right p-3 font-semibold">Difference</th>
                                        <th className="text-center p-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shifts.map((shift) => {
                                        const expected = shift.startCash + shift.cashPayments
                                        const difference = shift.actualCash ? shift.actualCash - expected : null

                                        return (
                                            <tr key={shift.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3">{new Date(shift.startTime).toLocaleDateString('en-GB')}</td>
                                                <td className="p-3">{format24Hour(shift.startTime)}</td>
                                                <td className="p-3">{shift.endTime ? format24Hour(shift.endTime) : '-'}</td>
                                                <td className="p-3 text-right">{getShiftDuration(shift.startTime, shift.endTime)}</td>
                                                <td className="p-3 text-right font-mono">{formatCurrency(shift.startCash)}</td>
                                                <td className="p-3 text-right font-mono">{formatCurrency(shift.cashPayments)}</td>
                                                <td className="p-3 text-right font-mono">{formatCurrency(expected)}</td>
                                                <td className="p-3 text-right font-mono">
                                                    {shift.actualCash !== null ? formatCurrency(shift.actualCash) : '-'}
                                                </td>
                                                <td className={`p-3 text-right font-mono font-bold ${difference === null ? '' :
                                                    difference > 0 ? 'text-green-600' :
                                                        difference < 0 ? 'text-red-600' : ''
                                                    }`}>
                                                    {difference !== null ? (
                                                        difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${shift.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {shift.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            <Dialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>End Current Shift</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Starting Cash:</span>
                                <span>{activeShift ? formatCurrency(activeShift.startCash) : 0} LAK</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Cash Sales:</span>
                                <span>{activeShift ? formatCurrency(activeShift.cashPayments) : 0} LAK</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2">
                                <span>Expected Cash:</span>
                                <span className="text-amber-600">
                                    {activeShift ? formatCurrency(activeShift.startCash + activeShift.cashPayments) : 0} LAK
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="actualCash">Actual Cash Counted</Label>
                            <Input
                                id="actualCash"
                                type="number"
                                placeholder="Enter total cash in drawer"
                                value={actualCash}
                                onChange={e => setActualCash(e.target.value)}
                                className="text-lg font-bold"
                            />
                        </div>

                        {actualCash && activeShift && (
                            <div className={`p-3 rounded-md text-sm font-medium ${parseFloat(actualCash) - (activeShift.startCash + activeShift.cashPayments) >= 0
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                                }`}>
                                Difference: {formatCurrency(parseFloat(actualCash) - (activeShift.startCash + activeShift.cashPayments))} LAK
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEndShiftOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={!actualCash || isProcessing}
                            onClick={handleEndShift}
                        >
                            {isProcessing ? "Ending Shift..." : "Confirm & Close Shift"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
