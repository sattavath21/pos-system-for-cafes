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

type Ingredient = {
  id: string
  name: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  cost: number
}

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    currentStock: 0,
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
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      cost: item.cost
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return

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
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      cost: 0
    })
  }

  const getStockStatus = (item: Ingredient) => {
    if (item.currentStock <= item.minStock) {
      return { label: "Low Stock", color: "bg-red-100 text-red-800" }
    } else if (item.currentStock >= item.maxStock) {
      return { label: "Overstock", color: "bg-yellow-100 text-yellow-800" }
    }
    return { label: "Normal", color: "bg-green-100 text-green-800" }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Inventory Management</h1>
          <div className="flex items-center gap-4">
            <Link href="/inventory/recipes">
              <Button variant="outline" size="sm" className="border-amber-600 text-amber-600 hover:bg-amber-50">
                Manage Recipes
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Items</p>
            <p className="text-3xl font-bold">{ingredients.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-red-600">
              {ingredients.filter(i => i.currentStock <= i.minStock).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              {formatLAK(ingredients.reduce((sum, i) => sum + (i.currentStock * i.cost), 0))}
            </p>
          </Card>
          <Card className="p-6 flex items-center justify-center">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ingredient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit' : 'Add'} Ingredient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Unit</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      >
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                        <option value="pcs">pcs</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                    <div>
                      <Label>Current Stock</Label>
                      <Input type="number" value={formData.currentStock} onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Stock</Label>
                      <Input type="number" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Max Stock</Label>
                      <Input type="number" value={formData.maxStock} onChange={e => setFormData({ ...formData, maxStock: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <Label>Cost per Unit (LAK)</Label>
                    <Input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        {/* Inventory List */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">All Ingredients</h2>
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
                      <span>Stock: {item.currentStock} {item.unit}</span>
                      <span>Min: {item.minStock} {item.unit}</span>
                      <span>Cost: {formatLAK(item.cost)}/{item.unit}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                <p>No ingredients yet. Add your first ingredient to get started.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
