"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"
import { Header } from "@/components/header"

type Ingredient = {
  id: string
  name: string
  unit: string
  mainStock: number
  subStock: number
  minStock: number
  maxStock: number
  cost: number
}

import { useTranslation } from "@/hooks/use-translation"

export default function InventoryPage() {
  const { t } = useTranslation()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null)
  const [activeTab, setActiveTab] = useState<"SUB" | "MAIN">("SUB")
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferItem, setTransferItem] = useState<Ingredient | null>(null)
  const [transferQty, setTransferQty] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    mainStock: 0,
    subStock: 0,
    minStock: 0,
    maxStock: 0,
    cost: 0
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory')
      if (res.ok) {
        setIngredients(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    try {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setIsDialogOpen(false)
        resetForm()
        fetchInventory()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleEdit = (item: Ingredient) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      unit: item.unit,
      mainStock: item.mainStock,
      subStock: item.subStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      cost: item.cost
    })
    setIsDialogOpen(true)
  }

  const handleTransfer = async () => {
    if (!transferItem || !transferQty) return
    try {
      // Record transaction
      const res = await fetch('/api/stock-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: transferItem.id,
          type: 'TRANSFER',
          quantity: parseFloat(transferQty),
          fromStore: 'MAIN',
          toStore: 'SUB'
        })
      })

      if (res.ok) {
        setIsTransferOpen(false)
        setTransferQty("")
        fetchInventory()
      }
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.delete + '?')) return

    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      if (res.ok) fetchInventory()
    } catch (e) {
      console.error(e)
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      name: "",
      unit: "kg",
      mainStock: 0,
      subStock: 0,
      minStock: 0,
      maxStock: 0,
      cost: 0
    })
  }

  const getStockStatus = (item: Ingredient) => {
    const stock = activeTab === "SUB" ? item.subStock : item.mainStock
    if (stock <= item.minStock) {
      return { label: t.low_stock, color: "bg-red-100 text-red-800" }
    } else if (stock >= item.maxStock) {
      return { label: t.overstock, color: "bg-yellow-100 text-yellow-800" }
    }
    return { label: t.normal, color: "bg-green-100 text-green-800" }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title={t.inventory_management} />


      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">{t.total_items}</p>
            <p className="text-3xl font-bold">{ingredients.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">{t.low_stock} ({activeTab === "SUB" ? "Shop" : "Whse"})</p>
            <p className="text-3xl font-bold text-red-600">
              {ingredients.filter(i => (activeTab === "SUB" ? i.subStock : i.mainStock) <= i.minStock).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">{t.total_value} ({activeTab === "SUB" ? "Shop" : "Whse"})</p>
            <p className="text-2xl font-bold text-green-600">
              {formatLAK(ingredients.reduce((sum, i) => sum + ((activeTab === "SUB" ? i.subStock : i.mainStock) * i.cost), 0))}
            </p>
          </Card>
          <Card className="p-6 flex items-center justify-center">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.add_ingredient}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? t.edit : t.add_item} {t.inventory}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t.name}</Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.unit}</Label>
                      <Input
                        placeholder="e.g. kg, L, pcs"
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Warehouse Stock</Label>
                      <Input type="text" value={formData.mainStock} onChange={e => setFormData({ ...formData, mainStock: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Shop Stock</Label>
                      <Input type="text" value={formData.subStock} onChange={e => setFormData({ ...formData, subStock: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.min_stock}</Label>
                      <Input type="text" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.max_stock}</Label>
                      <Input type="text" value={formData.maxStock} onChange={e => setFormData({ ...formData, maxStock: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.cost_per_unit} (LAK)</Label>
                    <Input type="text" value={formData.cost} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSubmit}>
                    {editingItem ? t.update : t.save}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        {/* Inventory List */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">{t.all_ingredients}</h2>
          <div className="space-y-3">
            {ingredients.map((item) => {
              const status = getStockStatus(item)
              return (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Package className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <div className="flex gap-6 text-sm text-muted-foreground ml-8">
                      <span>{t.stock}: {activeTab === "SUB" ? item.subStock : item.mainStock} {item.unit}</span>
                      <span>{t.min_stock}: {item.minStock} {item.unit}</span>
                      <span>{t.cost}: {formatLAK(item.cost)}/{item.unit}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {activeTab === "MAIN" && (
                      <Button
                        variant="outline"
                        className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                        onClick={() => { setTransferItem(item); setIsTransferOpen(true); }}
                      >
                        Transfer to Shop
                      </Button>
                    )}
                    <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              )
            })}
            {ingredients.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.no_items_found}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div >
  )
}
