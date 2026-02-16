"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { AlertTriangle } from "lucide-react"

interface ShopAdjustDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ingredient: {
        id: string
        name: string
        unit: string
        subStock: number
    } | null
    onSuccess: () => void
}

export function ShopAdjustDialog({ open, onOpenChange, ingredient, onSuccess }: ShopAdjustDialogProps) {
    const [actualStock, setActualStock] = useState("")
    const [reason, setReason] = useState("")
    const [notes, setNotes] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const discrepancy = ingredient ? (parseFloat(actualStock) || 0) - ingredient.subStock : 0

    const handleSubmit = async () => {
        if (!ingredient || actualStock === "") {
            alert("Please enter the actual stock amount")
            return
        }

        if (!reason) {
            alert("Please select a reason for adjustment")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/inventory/shop-adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredientId: ingredient.id,
                    actualStock: parseFloat(actualStock),
                    reason,
                    notes: notes || undefined
                })
            })

            if (res.ok) {
                alert(`✅ Successfully adjusted shop stock for ${ingredient.name}`)
                handleClose()
                onSuccess()
            } else {
                const error = await res.json()
                alert(`❌ Failed to adjust: ${error.error || 'Unknown error'}`)
            }
        } catch (e) {
            console.error(e)
            alert('❌ Failed to adjust. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setActualStock("")
        setReason("")
        setNotes("")
        onOpenChange(false)
    }

    if (!ingredient) return null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Adjust Shop Stock: {ingredient.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg border">
                            <p className="text-xs text-muted-foreground">System Stock</p>
                            <p className="text-xl font-bold text-slate-700">{ingredient.subStock} {ingredient.unit}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <p className="text-xs text-muted-foreground">Actual Stock</p>
                            <p className="text-xl font-bold text-amber-700">
                                {actualStock ? `${parseFloat(actualStock)} ${ingredient.unit}` : "—"}
                            </p>
                        </div>
                    </div>

                    {actualStock && discrepancy !== 0 && (
                        <div className={`p-3 rounded-lg border ${discrepancy > 0 ? 'bg-green-50 border-green-100' : 'bg-rose-50 border-rose-100'}`}>
                            <p className="text-xs text-muted-foreground">Discrepancy</p>
                            <p className={`text-lg font-bold ${discrepancy > 0 ? 'text-green-700' : 'text-rose-700'}`}>
                                {discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)} {ingredient.unit}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {discrepancy > 0 ? 'More than expected' : 'Less than expected'}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Actual Physical Stock *</Label>
                        <FormattedNumberInput
                            value={actualStock}
                            onChange={setActualStock}
                            allowDecimals={true}
                            placeholder="Enter actual counted stock"
                        />
                        <p className="text-xs text-muted-foreground">
                            Count the physical inventory and enter the actual amount
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason for Discrepancy *</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SPILLAGE">Spillage/Waste</SelectItem>
                                <SelectItem value="THEFT">Theft/Loss</SelectItem>
                                <SelectItem value="COUNTING_ERROR">Counting Error</SelectItem>
                                <SelectItem value="SYSTEM_ERROR">System Deduction Error</SelectItem>
                                <SelectItem value="EXPIRED">Expired/Damaged</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional details about this adjustment..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-amber-600 hover:bg-amber-700"
                        onClick={handleSubmit}
                        disabled={isLoading || actualStock === "" || !reason}
                    >
                        {isLoading ? "Adjusting..." : "Adjust Stock"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
