"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Types
export type ShiftStatus = "OPEN" | "CLOSED" | "LOADING"

interface ShiftState {
    status: ShiftStatus
    activeShiftId: string | null
    startCash: number | null
    cashPayments: number | null
    checkShiftStatus: () => Promise<void>
}

const ShiftContext = createContext<ShiftState | undefined>(undefined)

export function ShiftProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<ShiftStatus>("LOADING")
    const [activeShiftId, setActiveShiftId] = useState<string | null>(null)
    const [startCash, setStartCash] = useState<number | null>(null)
    const [cashPayments, setCashPayments] = useState<number | null>(null)

    const checkShiftStatus = async () => {
        try {
            const res = await fetch('/api/shifts/status')
            if (res.ok) {
                const data = await res.json()
                if (data.activeShift) {
                    setStatus("OPEN")
                    setActiveShiftId(data.activeShift.id)
                    setStartCash(data.activeShift.startCash)
                    setCashPayments(data.activeShift.cashPayments)
                } else {
                    setStatus("CLOSED")
                    setActiveShiftId(null)
                    setStartCash(null)
                    setCashPayments(null)
                }
            } else {
                // If 404 or other, assume closed or error. 
                // Defaulting to CLOSED is safer for UI logic (blocking).
                setStatus("CLOSED")
                setActiveShiftId(null)
            }
        } catch (e) {
            console.error("Failed to check shift status", e)
            setStatus("CLOSED") // Fail safe
        }
    }

    // Poll on mount and periodically? 
    // User asked for "fetched once", but updates need to propagate. 
    // Maybe just on mount and provide refresh function.
    useEffect(() => {
        checkShiftStatus()

        // Listen for payments to update cash amount in real-time
        const channel = new BroadcastChannel("payment_channel")
        channel.onmessage = (event) => {
            if (event.data.type === "PAYMENT_COMPLETE") {
                checkShiftStatus()
            }
        }

        return () => {
            channel.close()
        }
    }, [])

    return (
        <ShiftContext.Provider value={{ status, activeShiftId, startCash, cashPayments, checkShiftStatus }}>
            {children}
        </ShiftContext.Provider>
    )
}

export function useShift() {
    const context = useContext(ShiftContext)
    if (context === undefined) {
        throw new Error("useShift must be used within a ShiftProvider")
    }
    return context
}
