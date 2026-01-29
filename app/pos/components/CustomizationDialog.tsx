import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { formatLAK } from "@/lib/currency"
import {
    Droplet,
    Droplets,
    CandyOff,
    Candy,
    Coffee,
    Minus
} from "lucide-react"

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
    const [sugar, setSugar] = useState("Normal")
    const [shot, setShot] = useState("Normal")
    const [selectedVariation, setSelectedVariation] = useState<string>("")
    const [selectedSize, setSelectedSize] = useState<string>("")

    // Reset defaults when opening
    useEffect(() => {
        if (isOpen && variations.length > 0) {
            setSugar("Normal")
            setShot("Normal")

            // Set default variation (first available)
            const defaultVar = variations[0]
            setSelectedVariation(defaultVar.type)

            // Set default size (M if available, otherwise first)
            const mSize = defaultVar.sizes.find(s => s.size === "M")
            setSelectedSize(mSize ? mSize.id : defaultVar.sizes[0]?.id || "")
        }
    }, [isOpen, variations])

    const sugarOptions = [
        { label: "No Sweet", icon: CandyOff },
        { label: "Less Sweet", icon: Droplet },
        { label: "Normal", icon: Droplets },
        { label: "Extra Sweet", icon: Candy }

    ]
    const shotOptions = [
        { label: "Reduced", level: 0.5 },
        { label: "Normal", level: 1 },
        { label: "Double", level: 2 }
    ]

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
            alert("Please select a customization")
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
                        Customization - {formatLAK(finalPrice)}
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
                        <Label>Choice</Label>
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
                        <div className="grid grid-cols-4 gap-2">
                            {sugarOptions.map(({ label, icon: Icon }) => (
                                <Button
                                    key={label}
                                    variant={sugar === label ? "default" : "outline"}
                                    onClick={() => setSugar(label)}
                                    className="h-16 flex flex-col items-center justify-center gap-1"
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-xs">{label}</span>
                                </Button>
                            ))}
                        </div>
                    </div>


                    {/* Shot Type */}
                    <div className="space-y-2">
                        <Label>Shot Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {shotOptions.map(({ label, level }) => (
                                <Button
                                    key={label}
                                    variant={shot === label ? "default" : "outline"}
                                    onClick={() => setShot(label)}
                                    className="h-14 flex flex-col items-center justify-center gap-1"
                                >
                                    <div className="flex gap-1 items-center">
                                        {level === 0.5 && <div className="flex gap-1 items-center"><Minus className="h-4 w-4" /> <Coffee className="h-4 w-4" /></div>}

                                        {level >= 1 &&
                                            Array.from({ length: Math.floor(level) }).map((_, i) => (
                                                <Coffee key={i} className="h-4 w-4" />
                                            ))}
                                    </div>
                                    <span className="text-xs">{label}</span>
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
