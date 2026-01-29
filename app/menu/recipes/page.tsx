"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Trash2, ChevronRight, Package, Coffee } from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"

type Product = {
    id: string
    name: string
    categoryName: string
}

type Ingredient = {
    id: string
    name: string
    unit: string
}

type RecipeItem = {
    id: string
    productId: string
    ingredientId: string
    quantity: number
    ingredientName: string
    unit: string
}

import { useTranslation } from "@/hooks/use-translation"

export default function RecipesPage() {
    const { t } = useTranslation()
    const [products, setProducts] = useState<Product[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [recipe, setRecipe] = useState<RecipeItem[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [newRecipeItem, setNewRecipeItem] = useState({
        ingredientId: "",
        quantity: 0
    })

    useEffect(() => {
        fetchProducts()
        fetchIngredients()
    }, [])

    useEffect(() => {
        if (selectedProduct) {
            fetchRecipe(selectedProduct.id)
        }
    }, [selectedProduct])

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/menu')
            if (res.ok) setProducts(await res.json())
        } catch (e) { console.error(e) }
    }

    const fetchIngredients = async () => {
        try {
            const res = await fetch('/api/inventory')
            if (res.ok) setIngredients(await res.json())
        } catch (e) { console.error(e) }
    }

    const fetchRecipe = async (productId: string) => {
        try {
            const res = await fetch(`/api/recipes/${productId}`)
            if (res.ok) setRecipe(await res.json())
        } catch (e) { console.error(e) }
    }

    const handleAddIngredient = async () => {
        if (!selectedProduct || !newRecipeItem.ingredientId) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/recipes/${selectedProduct.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecipeItem)
            })
            if (res.ok) {
                fetchRecipe(selectedProduct.id)
                setIsAddIngredientOpen(false)
                setNewRecipeItem({ ingredientId: "", quantity: 0 })
            }
        } catch (e) { console.error(e) }
        finally { setIsLoading(false) }
    }

    const handleRemoveIngredient = async (ingredientId: string) => {
        if (!selectedProduct) return
        if (!confirm(t.delete + '?')) return
        try {
            const res = await fetch(`/api/recipes/${selectedProduct.id}?ingredientId=${ingredientId}`, {
                method: 'DELETE'
            })
            if (res.ok) fetchRecipe(selectedProduct.id)
        } catch (e) { console.error(e) }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <Link href="/menu" className="text-amber-900 hover:text-amber-700">
                            <h1 className="text-2xl font-bold">{t.menu_management}</h1>
                        </Link>
                        <ChevronRight className="w-5 h-4 text-muted-foreground" />
                        <h1 className="text-2xl font-bold text-amber-900">{t.recipes}</h1>
                    </div>

                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Product Sidebar */}
                <div className="w-80 border-r bg-slate-50 flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t.search_products}
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => setSelectedProduct(product)}
                                className={`w-full text-left p-4 border-b hover:bg-amber-50 transition-colors ${selectedProduct?.id === product.id ? 'bg-amber-100 border-l-4 border-l-amber-600' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Coffee className="w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="font-semibold">{product.name}</p>
                                        <p className="text-xs text-muted-foreground uppercase">{product.categoryName}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Recipe Content */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedProduct ? (
                        <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
                            <div className="flex items-end justify-between border-b pb-6">
                                <div>
                                    <Badge variant="outline" className="mb-2 uppercase">{selectedProduct.categoryName}</Badge>
                                    <h2 className="text-4xl font-bold text-slate-900">{selectedProduct.name}</h2>
                                    <p className="text-muted-foreground mt-2">{t.consumption_per_unit}</p>
                                </div>
                                <Dialog open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-amber-600 hover:bg-amber-700">
                                            <Plus className="w-4 h-4 mr-2" />
                                            {t.add_ingredient}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t.add_ingredient_to} {selectedProduct.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>{t.select_product}</Label>
                                                <select
                                                    className="w-full p-2 border rounded-md"
                                                    value={newRecipeItem.ingredientId}
                                                    onChange={e => setNewRecipeItem({ ...newRecipeItem, ingredientId: e.target.value })}
                                                >
                                                    <option value="">-- {t.select_product} --</option>
                                                    {ingredients.map(ing => (
                                                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t.quantity_used}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={newRecipeItem.quantity}
                                                        onChange={e => setNewRecipeItem({ ...newRecipeItem, quantity: parseFloat(e.target.value) })}
                                                    />
                                                    <span className="text-muted-foreground">
                                                        {ingredients.find(i => i.id === newRecipeItem.ingredientId)?.unit || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddIngredientOpen(false)}>{t.cancel}</Button>
                                            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddIngredient} disabled={isLoading || !newRecipeItem.ingredientId || newRecipeItem.quantity <= 0}>
                                                {isLoading ? t.processing : t.add_to_recipe}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Package className="w-5 h-5 text-slate-400" />
                                    {t.ingredients_list}
                                </h3>
                                {recipe.length > 0 ? (
                                    <div className="grid gap-4">
                                        {recipe.map((item) => (
                                            <Card key={item.id} className="p-4 flex items-center justify-between hover:border-amber-200 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                        {item.ingredientName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-lg">{item.ingredientName}</p>
                                                        <p className="text-sm text-muted-foreground">{t.consumption_per_unit || "Consumption per unit produced"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">{t.quantity}</p>
                                                        <p className="font-bold text-xl">{item.quantity} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span></p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleRemoveIngredient(item.ingredientId)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="p-12 border-dashed flex flex-col items-center justify-center text-center space-y-4">
                                        <Package className="w-12 h-12 text-slate-200" />
                                        <div className="space-y-2">
                                            <p className="font-semibold text-slate-600">{t.no_ingredients_linked}</p>
                                            <p className="text-sm text-slate-400 max-w-xs mx-auto">{t.add_to_recipe}</p>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 bg-slate-50/50">
                            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
                                <Coffee className="w-10 h-10 text-amber-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-800">{t.select_product}</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">{t.search_products}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
