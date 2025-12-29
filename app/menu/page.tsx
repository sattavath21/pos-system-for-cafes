"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { formatLAK } from "@/lib/currency"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Search, ImageIcon } from "lucide-react"
import Link from "next/link"

type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  image?: string
}

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  // Form states
  const [formData, setFormData] = useState<Partial<MenuItem>>({})

  useEffect(() => {
    fetchMenuItems()
    fetchCategories()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        // Transform data: ensure numbers are numbers, booleans are booleans
        const items = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: Number(item.price),
          category: item.categoryName || "Uncategorized",
          isAvailable: Boolean(item.isAvailable),
          image: item.image
        }))
        setMenuItems(items)
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
        setIsCategoryDialogOpen(false)
        fetchCategories()
      }
    } catch (e) {
      console.error("Failed to create category", e)
    }
  }

  const filteredItems = menuItems.filter((item) => item.name?.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData(item)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "Coffee",
      isAvailable: true
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
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
    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
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
          body: JSON.stringify(formData),
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Menu Management</h1>
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
        {/* Search and Add */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50">
                <Plus className="w-4 h-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Label htmlFor="catName">Category Name</Label>
                <Input id="catName" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Smoothies" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                <Button className="bg-amber-600" onClick={handleCreateCategory}>Save Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Caramel Latte"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
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
                      {categories.length === 0 && <option value="">No categories</option>}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the item"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (LAK)</Label>
                    <Input
                      id="price"
                      type="text"
                      placeholder="0"
                      value={formData.price ? formData.price.toLocaleString() : ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, "");
                        if (value === "" || !isNaN(Number(value))) {
                          setFormData({ ...formData, price: value === "" ? 0 : parseFloat(value) });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <select
                      id="availability"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={formData.isAvailable ? "available" : "unavailable"}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === "available" })}
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Item Image</Label>
                  {/* Simplified Image Input for now - just text URL or placeholder */}
                  <Input
                    id="image"
                    placeholder="Image URL (optional)"
                    value={formData.image || ""}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Saving..." : (editingItem ? "Update Item" : "Add Item")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">☕</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    {!item.isAvailable && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground italic">Category: {item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-bold text-amber-600">{formatLAK(item.price)}</p>
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
