"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { formatLAK } from "@/lib/currency"
import { Header } from "@/components/header"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Search, ImageIcon, X, Check, Minus } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { PriceInput } from "@/components/ui/PriceInput"

// --- Types ---
type SizeItem = {
  id?: string
  size: string
  price: number
  isAvailable: boolean
  displayOrder: number
}

type VariationItem = {
  id?: string
  type: string // e.g., HOT, COLD, FRAPPE, BOTTLE (Editable)
  isEnabled: boolean
  displayOrder: number
  sizes: SizeItem[]
}

type MenuItem = {
  id: string
  name: string
  description: string
  // price is removed from top level in DB, but UI might still have it in type definition for legacy, ignoring it.
  category: string
  isAvailable: boolean
  image?: string
  variations: VariationItem[]
}

const DEFAULT_SIZES = [
  { size: "S", price: 0, isAvailable: true, displayOrder: 1 },
  { size: "M", price: 0, isAvailable: true, displayOrder: 2 },
  { size: "L", price: 0, isAvailable: true, displayOrder: 3 },
]

export default function MenuPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<{ id: string, name: string } | null>(null)
  const [newVariationType, setNewVariationType] = useState("")

  // Form states
  const [formData, setFormData] = useState<Partial<MenuItem>>({})

  // Variation form state
  const [formVariations, setFormVariations] = useState<VariationItem[]>([])

  useEffect(() => {
    fetchMenuItems()
    fetchCategories()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        setMenuItems(data)
      }
    } catch (error) {
      console.error("Failed to fetch menu items", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/menu/categories')
      if (res.ok) {
        setCategories(await res.json())
      }
    } catch (e) {
      console.error("Failed to fetch categories", e)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName) return
    try {
      const res = await fetch('/api/menu/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        setNewCategoryName("")
        fetchCategories()
      }
    } catch (e) {
      console.error("Failed to create category", e)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name) return
    try {
      const res = await fetch(`/api/menu/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingCategory.name }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        setEditingCategory(null)
        fetchCategories()
      }
    } catch (e) {
      console.error("Failed to update category", e)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t.delete + "?")) return
    try {
      const res = await fetch(`/api/menu/categories/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchCategories()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete category")
      }
    } catch (e) {
      console.error("Failed to delete category", e)
    }
  }

  const filteredItems = menuItems.filter((item) => item.name?.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      isAvailable: item.isAvailable,
      image: item.image
    })

    // Load existing variations directly
    // If no variations exist (legacy item), maybe initialize with empty or standard? 
    // Let's just load what is there.
    if (!item.variations || item.variations.length === 0) {
      // Option: Initialize with standard types for convenience if empty? 
      // User asked for dynamic, so maybe start empty or with just one default?
      // Let's start with empty and let them add.
      setFormVariations([])
    } else {
      setFormVariations(item.variations.map(v => ({ ...v })))
    }

    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setFormData({
      name: "",
      description: "",
      category: categories[0]?.name || "Coffee",
      isAvailable: true,
      image: ""
    })

    // Start with empty variations or maybe a default "Regular"?
    // User requested dynamic. Let's start empty and provide "Add Variation" UI.
    setFormVariations([])
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.delete + "?")) return
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchMenuItems()
      }
    } catch (error) {
      console.error("Failed to delete", error)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    const finalVariations = formVariations.map(v => ({
      ...v,
      sizes: v.sizes.map(s => ({
        ...s,
        price: Number(s.price)
      }))
    }))

    const payload = {
      ...formData,
      variations: finalVariations
    }

    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' }
        })
        if (res.ok) {
          setIsDialogOpen(false)
          fetchMenuItems()
        }
      } else {
        // Create
        const res = await fetch('/api/menu', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' }
        })
        if (res.ok) {
          setIsDialogOpen(false)
          fetchMenuItems()
        }
      }
    } catch (error) {
      console.error("Failed to save", error)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Variation Helpers ---
  const addVariationType = () => {
    if (!newVariationType) return;
    setFormVariations([...formVariations, {
      type: newVariationType,
      isEnabled: true,
      displayOrder: formVariations.length + 1,
      sizes: DEFAULT_SIZES.map(s => ({ ...s }))
    }])
    setNewVariationType("")
  }

  const removeVariationType = (index: number) => {
    const next = [...formVariations]
    next.splice(index, 1)
    setFormVariations(next)
  }

  const toggleVariation = (index: number) => {
    const next = [...formVariations]
    next[index].isEnabled = !next[index].isEnabled
    setFormVariations(next)
  }

  const updateSizePrice = (varIndex: number, sizeIndex: number, newPrice: number) => {
    const next = [...formVariations]
    next[varIndex].sizes[sizeIndex].price = newPrice
    setFormVariations(next)
  }



  const addSize = (varIndex: number) => {
    const next = [...formVariations]
    next[varIndex].sizes.push({
      size: "XL",
      price: 0,
      isAvailable: true,
      displayOrder: next[varIndex].sizes.length + 1
    })
    setFormVariations(next)
  }

  const removeSize = (varIndex: number, sizeIndex: number) => {
    const next = [...formVariations]
    next[varIndex].sizes.splice(sizeIndex, 1)
    setFormVariations(next)
  }

  const updateSizeLabel = (varIndex: number, sizeIndex: number, newLabel: string) => {
    const next = [...formVariations]
    next[varIndex].sizes[sizeIndex].size = newLabel
    setFormVariations(next)
  }

  const updateOrder = (type: 'variation' | 'size', vIndex: number, value: string, sIndex?: number) => {
    const next = [...formVariations]
    const val = Math.max(1, parseInt(value) || 1)
    if (type === 'variation') {
      next[vIndex].displayOrder = val
    } else if (type === 'size' && sIndex !== undefined) {
      next[vIndex].sizes[sIndex].displayOrder = val
    }
    setFormVariations(next)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <Header title={t.menu_management} />

      <div className="p-6 space-y-6">
        {/* Search and Add */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t.search_menu_items}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50">
                <Plus className="w-4 h-4 mr-2" />
                {t.new_category}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t.manage_categories || "Manage Categories"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Create New */}
                <div className="space-y-2 border-b pb-4">
                  <Label htmlFor="catName">{t.add_new_category || "Add New Category"}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="catName"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder={t.category_name}
                    />
                    <Button className="bg-amber-600 shrink-0" onClick={handleCreateCategory}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* List Existing */}
                <div className="space-y-3">
                  <Label>{t.existing_categories || "Existing Categories"}</Label>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50">
                        {editingCategory?.id === cat.id ? (
                          <>
                            <Input
                              value={editingCategory.name}
                              onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              className="h-8"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" className="text-green-600 h-8 w-8 p-0" onClick={handleUpdateCategory}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-400 h-8 w-8 p-0" onClick={() => setEditingCategory(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 font-medium px-2">{cat.name}</span>
                            <Button size="sm" variant="ghost" className="text-slate-500 h-8 w-8 p-0" onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => handleDeleteCategory(cat.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full" onClick={() => setIsCategoryDialogOpen(false)}>{t.close || "Close"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                {t.add_item}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-7xl max-h-[95vh] overflow-y-auto" size="xl">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? t.edit_menu_item : t.add_menu_item}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Basic Info Section */}
                  <div className="grid grid-cols-2 gap-6 p-4 border rounded-lg bg-slate-50">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t.item_name}</Label>
                        <Input
                          id="name"
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">{t.category}</Label>
                        <select
                          id="category"
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={formData.category || (categories[0]?.name || "")}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">{t.description}</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>{t.item_image}</Label>
                      <div className="flex gap-4 items-start">
                        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center overflow-hidden border shadow-sm">
                          {formData.image ? (
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return

                              const uploadFormData = new FormData()
                              uploadFormData.append("file", file)

                              try {
                                setIsLoading(true)
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  body: uploadFormData,
                                })
                                if (res.ok) {
                                  const { url } = await res.json()
                                  setFormData({ ...formData, image: url })
                                }
                              } catch (e) {
                                console.error("Upload failed", e)
                              } finally {
                                setIsLoading(false)
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">{t.recommended_image_msg}</p>
                          {formData.image && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 h-auto p-0 hover:bg-transparent hover:text-red-700"
                              onClick={() => setFormData({ ...formData, image: "" })}
                            >
                              {t.remove_image}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="availability"
                          checked={formData.isAvailable ?? true}
                          onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                        />
                        <Label htmlFor="availability">{t.available}</Label>
                      </div>
                    </div>
                  </div>

                  {/* Variations & Pricing Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{t.variations_pricing}</h3>
                    </div>

                    {/* Dynamic Variation Adder */}
                    <div className="flex gap-2">
                      <Input
                        placeholder={t.variation_name_placeholder}

                        value={newVariationType}
                        onChange={(e) => setNewVariationType(e.target.value.toUpperCase())}
                        className="max-w-[300px]"
                      />
                      <Button type="button" onClick={addVariationType} disabled={!newVariationType}>
                        <Plus className="w-4 h-4 mr-2" /> {t.add_variation_type}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {formVariations.map((variation, vIndex) => (
                        <Card key={vIndex} className={`p-4 border ${variation.isEnabled ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200 opacity-70'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={variation.isEnabled}
                                onCheckedChange={() => toggleVariation(vIndex)}
                              />
                              <Label className="text-base font-bold">{variation.type}</Label>
                            </div>
                            <div className="flex gap-2 items-center">
                              {variation.isEnabled && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-amber-600 border-amber-200"
                                      onClick={() => updateOrder("variation", vIndex, (variation.displayOrder - 1).toString())}
                                      disabled={variation.displayOrder <= 1}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <div className="w-8 h-8 flex items-center justify-center bg-white border rounded font-bold text-xs">
                                      {variation.displayOrder}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-amber-600 border-amber-200"
                                      onClick={() => updateOrder("variation", vIndex, (variation.displayOrder + 1).toString())}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => addSize(vIndex)} className="text-amber-600">
                                    <Plus className="w-4 h-4 mr-2" /> {t.add_size}
                                  </Button>
                                </>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => removeVariationType(vIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {variation.isEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {variation.sizes.map((size, sIndex) => (
                                <div key={sIndex} className="flex items-center gap-2 bg-white p-2 rounded border shadow-sm">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-slate-500 border-slate-200"
                                      onClick={() => updateOrder("size", vIndex, (size.displayOrder - 1).toString(), sIndex)}
                                      disabled={size.displayOrder <= 1}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <div className="w-8 h-8 flex items-center justify-center bg-white border rounded font-bold text-xs">
                                      {size.displayOrder}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-slate-500 border-slate-200"
                                      onClick={() => updateOrder("size", vIndex, (size.displayOrder + 1).toString(), sIndex)}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="w-20">
                                    <Input
                                      value={size.size}
                                      onChange={(e) => updateSizeLabel(vIndex, sIndex, e.target.value)}
                                      className="h-9 text-center font-bold"
                                      placeholder={t.size_label}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <PriceInput
                                      value={size.price}
                                      onChange={(num) => updateSizePrice(vIndex, sIndex, num)}
                                      className="h-9 text-right font-mono"
                                      placeholder="Price (LAK)"
                                      currency="₭"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-red-400 hover:text-red-600"
                                    onClick={() => removeSize(vIndex, sIndex)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                    {isLoading ? t.processing : t.save}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-white shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center overflow-hidden border">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">☕</span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    {!item.isAvailable && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700">
                        {t.unavailable}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground italic mt-1">{t.category}: {item.category}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t.variations}</p>
                  <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                    {item.variations && item.variations.length > 0 ? (
                      item.variations
                        .filter(v => v.isEnabled)
                        .map(v => (
                          <Badge key={v.type} variant="secondary" className="text-[10px] px-1 h-5">
                            {v.type} ({v.sizes.length})
                          </Badge>
                        ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">{t.none}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-600 hover:text-red-700 bg-transparent"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
