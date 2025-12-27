"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit, AlertTriangle, Search, TrendingDown, Package } from "lucide-react"
import Link from "next/link"

type InventoryItem = {
  id: string
  name: string
  quantity: number
  unit: string
  minQuantity: number
  lastRestocked: string
  status: "low" | "ok" | "good"
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: "1",
      name: "Coffee Beans",
      quantity: 2.5,
      unit: "kg",
      minQuantity: 5,
      lastRestocked: "2 days ago",
      status: "low",
    },
    { id: "2", name: "Milk", quantity: 8, unit: "L", minQuantity: 15, lastRestocked: "1 day ago", status: "low" },
    { id: "3", name: "Sugar", quantity: 15, unit: "kg", minQuantity: 10, lastRestocked: "3 days ago", status: "ok" },
    { id: "4", name: "Croissants", quantity: 12, unit: "pcs", minQuantity: 20, lastRestocked: "Today", status: "low" },
    { id: "5", name: "Tea Leaves", quantity: 8, unit: "kg", minQuantity: 5, lastRestocked: "4 days ago", status: "ok" },
    {
      id: "6",
      name: "Chocolate Syrup",
      quantity: 4,
      unit: "L",
      minQuantity: 3,
      lastRestocked: "2 days ago",
      status: "ok",
    },
    {
      id: "7",
      name: "Vanilla Syrup",
      quantity: 6,
      unit: "L",
      minQuantity: 3,
      lastRestocked: "1 day ago",
      status: "good",
    },
    {
      id: "8",
      name: "Cups (Small)",
      quantity: 450,
      unit: "pcs",
      minQuantity: 200,
      lastRestocked: "1 week ago",
      status: "good",
    },
    {
      id: "9",
      name: "Cups (Medium)",
      quantity: 380,
      unit: "pcs",
      minQuantity: 200,
      lastRestocked: "1 week ago",
      status: "good",
    },
    {
      id: "10",
      name: "Cups (Large)",
      quantity: 280,
      unit: "pcs",
      minQuantity: 200,
      lastRestocked: "1 week ago",
      status: "ok",
    },
  ])

  const filteredInventory = inventory.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const lowStockItems = inventory.filter((item) => item.status === "low").length

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Inventory Management</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                <p className="text-3xl font-bold">{inventory.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
                <p className="text-3xl font-bold text-orange-600">{lowStockItems}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Needs Restock</p>
                <p className="text-3xl font-bold">{lowStockItems}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input id="itemName" placeholder="e.g., Coffee Beans" defaultValue={editingItem?.name} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Current Quantity</Label>
                    <Input id="quantity" type="number" placeholder="0" defaultValue={editingItem?.quantity} />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" placeholder="kg, L, pcs" defaultValue={editingItem?.unit} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="minQuantity">Minimum Quantity</Label>
                  <Input id="minQuantity" type="number" placeholder="0" defaultValue={editingItem?.minQuantity} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setIsDialogOpen(false)}>
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Inventory List */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Inventory Items</h2>
          <div className="space-y-3">
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                  item.status === "low" ? "border-orange-200 bg-orange-50" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.status === "low" && (
                      <Badge variant="secondary" className="bg-orange-600 text-white">
                        Low Stock
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Last restocked: {item.lastRestocked}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {item.quantity} {item.unit}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Min: {item.minQuantity} {item.unit}
                    </p>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
