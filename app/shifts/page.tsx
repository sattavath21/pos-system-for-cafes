"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"
import { format24Hour, formatDateTime24 } from "@/lib/utils"

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
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Shift Reports</h1>
                            <p className="text-muted-foreground">View cash drawer history and shift summaries</p>
                        </div>
                    </div>
                </div>

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
        </div>
    )
}
