"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { Minus } from "lucide-react"

interface WithdrawDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ingredient: {
        id: string
        name: string
        unit: string
        mainStock: number
    } | null
    onSuccess: () => void
}

export function WithdrawDialog({ open, onOpenChange, ingredient, onSuccess }: WithdrawDialogProps) {
    const [quantity, setQuantity] = useState("")
    const [reason, setReason] = useState("")
    const [notes, setNotes] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (!ingredient || !quantity || parseFloat(quantity) <= 0) {
            alert("Please enter a valid quantity")
            return
        }

        if (!reason) {
            alert("Please select a reason for withdrawal")
            return
        }

        if (parseFloat(quantity) > ingredient.mainStock) {
            alert(`Cannot withdraw more than available stock (${ingredient.mainStock} ${ingredient.unit})`)
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/inventory/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredientId: ingredient.id,
                    quantity: parseFloat(quantity),
                    reason,
                    notes: notes || undefined
                })
            })

            if (res.ok) {
                alert(`✅ Successfully withdrew ${quantity} ${ingredient.unit} of ${ingredient.name}`)
                handleClose()
                onSuccess()
            } else {
                const error = await res.json()
                alert(`❌ Failed to withdraw: ${error.error || 'Unknown error'}`)
            }
        } catch (e) {
            console.error(e)
            alert('❌ Failed to withdraw. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setQuantity("")
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
                        <Minus className="w-5 h-5 text-rose-600" />
                        Withdraw Stock: {ingredient.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                        <p className="text-sm text-muted-foreground">Current Warehouse Stock</p>
                        <p className="text-2xl font-bold text-rose-700">{ingredient.mainStock} {ingredient.unit}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantity to Withdraw *</Label>
                        <FormattedNumberInput
                            value={quantity}
                            onChange={setQuantity}
                            allowDecimals={true}
                            placeholder="Enter quantity"
                        />
                        <p className="text-xs text-muted-foreground">
                            Remaining stock will be: {Math.max(0, ingredient.mainStock - (parseFloat(quantity) || 0))} {ingredient.unit}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason for Withdrawal *</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CORRECTION">Inventory Correction</SelectItem>
                                <SelectItem value="DAMAGED">Damaged/Expired</SelectItem>
                                <SelectItem value="SAMPLE">Sample/Testing</SelectItem>
                                <SelectItem value="OTHER_USE">Other Use</SelectItem>
                                <SelectItem value="LOST">Lost/Missing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional details about this withdrawal..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-rose-600 hover:bg-rose-700"
                        onClick={handleSubmit}
                        disabled={isLoading || !quantity || parseFloat(quantity) <= 0 || !reason}
                    >
                        {isLoading ? "Withdrawing..." : "Withdraw Stock"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
