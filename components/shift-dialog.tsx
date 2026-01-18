"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useShift } from "@/components/shift-provider"

interface ShiftDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ShiftDialog({ open, onOpenChange }: ShiftDialogProps) {
    const [startCash, setStartCash] = useState("")
    const [userId, setUserId] = useState<string | null>(null)
    const { checkShiftStatus } = useShift()
    const [responsiblePerson, setResponsiblePerson] = useState("Staff")

    useEffect(() => {
        if (open) {
            // Fetch user when dialog opens to ensure we have current user
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUserId(data.user.id)
                        setResponsiblePerson(data.user.name || "Staff")
                    }
                })
                .catch(() => { })
            setStartCash("")
        }
    }, [open])

    const handleOpenShift = async () => {
        if (!startCash) return alert("Please enter opening cash amount")
        try {
            const res = await fetch('/api/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startCash: Number(startCash),
                    userId: userId,
                    responsiblePerson: responsiblePerson
                })
            })
            if (res.ok) {
                await checkShiftStatus() // Refresh context
                onOpenChange(false)
            } else {
                const err = await res.json()
                alert(err.error || "Failed to open shift")
            }
        } catch (e) { alert("Error opening shift") }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md pointer-events-auto">
                <DialogHeader>
                    <DialogTitle>Open New Shift</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg text-amber-900 text-sm">
                        <p className="font-bold">👋 Good Morning!</p>
                        <p>You must open a shift and count the cash drawer before taking orders.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Responsible Person</Label>
                        <Input
                            value={responsiblePerson}
                            onChange={(e) => setResponsiblePerson(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Starting Cash Amount</Label>
                        <Input
                            type="text"
                            placeholder="0"
                            value={startCash ? Number(startCash).toLocaleString() : ""}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, "")
                                setStartCash(val)
                            }}
                            className="text-lg font-bold"
                        />
                    </div>
                    <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleOpenShift}>
                        Open Shift
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
