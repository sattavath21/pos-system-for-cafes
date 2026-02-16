"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, AlertTriangle, Package, ShoppingCart, Minus, Settings, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { formatLAK } from "@/lib/currency"
import { Header } from "@/components/header"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { FormattedTextInput } from "@/components/ui/formatted-text-input"
import { DepositDialog } from "@/components/inventory/deposit-dialog"
import { WithdrawDialog } from "@/components/inventory/withdraw-dialog"
import { ShopAdjustDialog } from "@/components/inventory/shop-adjust-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslation } from "@/hooks/use-translation"

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

type SortConfig = {
  key: keyof Ingredient | null
  direction: 'asc' | 'desc'
}

export default function InventoryPage() {
  const { t } = useTranslation()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null)
  const [activeTab, setActiveTab] = useState<"SUB" | "MAIN">("SUB")
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferItem, setTransferItem] = useState<Ingredient | null>(null)
  const [transferQty, setTransferQty] = useState("")
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [depositItem, setDepositItem] = useState<Ingredient | null>(null)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [withdrawItem, setWithdrawItem] = useState<Ingredient | null>(null)
  const [isShopAdjustOpen, setIsShopAdjustOpen] = useState(false)
  const [shopAdjustItem, setShopAdjustItem] = useState<Ingredient | null>(null)

  // Search and Sort
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })

  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    mainStock: "",
    minStock: "",
    maxStock: "",
    cost: ""
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

      // Convert string values to numbers for API
      const payload = {
        name: formData.name,
        unit: formData.unit,
        mainStock: parseFloat(formData.mainStock) || 0,
        minStock: parseFloat(formData.minStock) || 0,
        maxStock: parseFloat(formData.maxStock) || 0,
        cost: parseFloat(formData.cost) || 0
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    // Ensure numbers
    item.minStock = Number(item.minStock) || 0;
    item.maxStock = Number(item.maxStock) || 0;
    item.subStock = Number(item.subStock) || 0;
    item.mainStock = Number(item.mainStock) || 0;
    item.cost = Number(item.cost) || 0;

    setEditingItem(item)

    setFormData({
      name: item.name,
      unit: item.unit,
      mainStock: item.mainStock.toString(),
      minStock: item.minStock.toString(),
      maxStock: item.maxStock.toString(),
      cost: item.cost.toString()
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
        alert(`✅ ${t.transfer_success} ${transferQty} ${transferItem.unit} of ${transferItem.name} ${t.to_shop}`)
        setIsTransferOpen(false)
        setTransferQty("")
        fetchInventory()
      } else {
        alert('❌ Transfer failed. Please try again.')
      }
    } catch (e) {
      console.error(e)
      alert('❌ Transfer failed. Please try again.')
    }
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
      mainStock: "",
      minStock: "",
      maxStock: "",
      cost: ""
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

  const handleSort = (key: keyof Ingredient) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedIngredients = useMemo(() => {
    let sortableItems = [...ingredients];

    // Filter
    if (searchQuery) {
      sortableItems = sortableItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // @ts-ignore
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        // @ts-ignore
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [ingredients, sortConfig, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header title={t.inventory_management} />

      <div className="p-6 space-y-6">
        {/* Inventory View Tabs */}
        <div className="flex gap-3 justify-between items-center">
          <div className="flex gap-3">
            <Button
              variant={activeTab === "SUB" ? "default" : "outline"}
              onClick={() => setActiveTab("SUB")}
              className={activeTab === "SUB" ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              🏪 Shop Inventory
            </Button>
            <Button
              variant={activeTab === "MAIN" ? "default" : "outline"}
              onClick={() => setActiveTab("MAIN")}
              className={activeTab === "MAIN" ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              🏭 Warehouse
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search_items}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {(activeTab == "MAIN") ?
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-600 hover:bg-amber-700">
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
                      <FormattedTextInput value={formData.name} onChange={val => setFormData({ ...formData, name: val })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t.unit}</Label>
                        <FormattedTextInput
                          placeholder="e.g. kg, L, pcs"
                          value={formData.unit}
                          onChange={val => setFormData({ ...formData, unit: val })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Initial Warehouse Stock</Label>
                        <FormattedNumberInput value={formData.mainStock} onChange={val => setFormData({ ...formData, mainStock: val })} />
                        <p className="text-xs text-muted-foreground">Shop stock starts at 0. Transfer from warehouse as needed.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t.min_stock}</Label>
                        <FormattedNumberInput value={formData.minStock} onChange={val => setFormData({ ...formData, minStock: val })} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.max_stock}</Label>
                        <FormattedNumberInput value={formData.maxStock} onChange={val => setFormData({ ...formData, maxStock: val })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.cost_per_unit} (LAK)</Label>
                      <FormattedNumberInput allowDecimals={true} value={formData.cost} onChange={val => setFormData({ ...formData, cost: val })} />
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
              : null}
          </div>
        </div>

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
        </div>

        {/* Inventory Table */}
        <Card className="p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      {t.item}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort(activeTab === 'SUB' ? 'subStock' : 'mainStock')}>
                    <div className="flex items-center gap-1">
                      Stock ({activeTab === 'SUB' ? 'Shop' : 'Whse'})
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>{t.unit}</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('minStock')}>
                    <div className="flex items-center gap-1">
                      {t.min_stock}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>{t.cost}</TableHead>
                  <TableHead>{t.value}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedIngredients.length > 0 ? (
                  sortedIngredients.map((item) => {
                    const status = getStockStatus(item)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-lg">
                          {activeTab === "SUB" ? item.subStock : item.mainStock}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.minStock}</TableCell>
                        <TableCell>{formatLAK(item.cost)}</TableCell>
                        <TableCell>{formatLAK((activeTab === 'SUB' ? item.subStock : item.mainStock) * item.cost)}</TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {activeTab === "MAIN" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                                  onClick={() => { setDepositItem(item); setIsDepositOpen(true); }}
                                >
                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                  In
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                                  onClick={() => { setWithdrawItem(item); setIsWithdrawOpen(true); }}
                                >
                                  <Minus className="w-3 h-3 mr-1" />
                                  Out
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                  onClick={() => { setTransferItem(item); setIsTransferOpen(true); }}
                                >
                                  To Shop
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                  onClick={() => { setShopAdjustItem(item); setIsShopAdjustOpen(true); }}
                                >
                                  <Settings className="w-4 h-4 mr-1" />
                                  Adjust
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {t.no_items_found}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Stock Transfer Dialog */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Stock: {transferItem?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Move stock from Warehouse to Shop for daily operations
              </p>
              <div className="space-y-2">
                <Label>Available in Warehouse: {transferItem?.mainStock} {transferItem?.unit}</Label>
                <Label>Quantity to Transfer</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={transferQty}
                  onChange={e => setTransferQty(e.target.value)}
                  max={transferItem?.mainStock}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransferOpen(false)}>{t.cancel}</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleTransfer}
                disabled={!transferQty || parseFloat(transferQty) <= 0 || parseFloat(transferQty) > (transferItem?.mainStock || 0)}
              >
                Transfer to Shop
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Transaction Dialogs */}
        <DepositDialog
          open={isDepositOpen}
          onOpenChange={setIsDepositOpen}
          ingredient={depositItem}
          onSuccess={() => { fetchInventory(); setDepositItem(null); }}
        />
        <WithdrawDialog
          open={isWithdrawOpen}
          onOpenChange={setIsWithdrawOpen}
          ingredient={withdrawItem}
          onSuccess={() => { fetchInventory(); setWithdrawItem(null); }}
        />
        <ShopAdjustDialog
          open={isShopAdjustOpen}
          onOpenChange={setIsShopAdjustOpen}
          ingredient={shopAdjustItem}
          onSuccess={() => { fetchInventory(); setShopAdjustItem(null); }}
        />
      </div>
    </div >
  )
}
