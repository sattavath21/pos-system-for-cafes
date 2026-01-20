import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { formatLAK } from "@/lib/currency"

interface MenuVariation {
    id: string
    type: string
    displayOrder?: number
    sizes: {
        id: string
        size: string
        price: number
        displayOrder?: number
    }[]
}

interface CustomizationDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (selection: {
        variationSizeId: string
        name: string
        price: number
        sugar: string
        shot: string
        variation: string
        size: string
    }) => void
    menuName: string
    variations: MenuVariation[]
}

export function CustomizationDialog({
    isOpen,
    onClose,
    onConfirm,
    menuName,
    variations
}: CustomizationDialogProps) {
    const { t } = useTranslation()
    const [sugar, setSugar] = useState("100%")
    const [shot, setShot] = useState("Normal")
    const [selectedVariation, setSelectedVariation] = useState<string>("")
    const [selectedSize, setSelectedSize] = useState<string>("")

    // Reset defaults when opening
    useEffect(() => {
        if (isOpen && variations.length > 0) {
            setSugar("100%")
            setShot("Normal")

            // Set default variation (first available)
            const defaultVar = variations[0]
            setSelectedVariation(defaultVar.type)

            // Set default size (M if available, otherwise first)
            const mSize = defaultVar.sizes.find(s => s.size === "M")
            setSelectedSize(mSize ? mSize.id : defaultVar.sizes[0]?.id || "")
        }
    }, [isOpen, variations])

    const sugarOptions = ["0%", "25%", "50%", "75%", "100%", "125%"]
    const shotOptions = ["Reduced", "Normal", "Double"]

    // Get current variation object
    const currentVariation = variations.find(v => v.type === selectedVariation)

    // Get selected size details
    const selectedSizeObj = currentVariation?.sizes.find(s => s.id === selectedSize)
    const finalPrice = selectedSizeObj?.price || 0

    const handleVariationChange = (varType: string) => {
        setSelectedVariation(varType)
        const newVar = variations.find(v => v.type === varType)
        if (newVar) {
            // Try to keep same size if available
            const sameSize = newVar.sizes.find(s => s.size === selectedSizeObj?.size)
            if (sameSize) {
                setSelectedSize(sameSize.id)
            } else {
                // Default to first size
                setSelectedSize(newVar.sizes[0]?.id || "")
            }
        }
    }

    const handleSizeChange = (sizeLabel: string) => {
        const sizeObj = currentVariation?.sizes.find(s => s.size === sizeLabel)
        if (sizeObj) {
            setSelectedSize(sizeObj.id)
        }
    }

    const handleConfirm = () => {
        if (!selectedSize || !selectedSizeObj) {
            alert("Please select a size")
            return
        }

        onConfirm({
            variationSizeId: selectedSize,
            name: menuName, // Keep name as the base product name
            price: finalPrice,
            sugar,
            shot,
            variation: selectedVariation,
            size: selectedSizeObj.size
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{menuName}</DialogTitle>
                    <DialogDescription>
                        Customize your drink - {formatLAK(finalPrice)}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">

                    {/* Variation Type */}
                    <div className="space-y-2">
                        <Label>Variation</Label>
                        <div className="flex flex-wrap gap-2">
                            {[...variations]
                                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                .map((variation) => (
                                    <Button
                                        key={variation.type}
                                        variant={selectedVariation === variation.type ? "default" : "outline"}
                                        onClick={() => handleVariationChange(variation.type)}
                                        className="flex-1"
                                    >
                                        {variation.type}
                                    </Button>
                                ))}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="space-y-2">
                        <Label>Size</Label>
                        <div className="flex flex-wrap gap-2">
                            {[...(currentVariation?.sizes || [])]
                                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                .map((size) => (
                                    <Button
                                        key={size.id}
                                        variant={selectedSize === size.id ? "default" : "outline"}
                                        onClick={() => setSelectedSize(size.id)}
                                        className="flex-1 h-12"
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-bold">{size.size}</span>
                                            <span className="text-xs">{formatLAK(size.price)}</span>
                                        </div>
                                    </Button>
                                ))}
                        </div>
                    </div>

                    {/* Sugar Level */}
                    <div className="space-y-2">
                        <Label>Sugar Level</Label>
                        <div className="flex flex-wrap gap-2">
                            {sugarOptions.map((opt) => (
                                <Button
                                    key={opt}
                                    variant={sugar === opt ? "default" : "outline"}
                                    onClick={() => setSugar(opt)}
                                    className="flex-1 min-w-[3rem]"
                                >
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Shot Type */}
                    <div className="space-y-2">
                        <Label>Shot Type</Label>
                        <div className="flex flex-wrap gap-2">
                            {shotOptions.map((opt) => (
                                <Button
                                    key={opt}
                                    variant={shot === opt ? "default" : "outline"}
                                    onClick={() => setShot(opt)}
                                    className="flex-1"
                                >
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    </div>


                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm}>
                        Add to Cart - {formatLAK(finalPrice)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
