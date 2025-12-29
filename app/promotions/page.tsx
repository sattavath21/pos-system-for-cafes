"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Tag, Percent } from "lucide-react"
import Link from "next/link"
import { formatLAK } from "@/lib/currency"

type Promotion = {
  id: string
  name: string
  description: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  isActive: boolean
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)

  useEffect(() => {
    fetchPromotions()
  }, [])

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions')
      if (res.ok) setPromotions(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const activePromotions = promotions.filter((p) => p.isActive).length

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      code: formData.get('code'),
      discountType: formData.get('discountType'),
      discountValue: Number(formData.get('discountValue')),
      startDate: new Date(formData.get('startDate') as string).toISOString(),
      endDate: new Date(formData.get('endDate') as string).toISOString(),
      isActive: formData.get('isActive') === 'active'
    }

    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        setIsDialogOpen(false)
        fetchPromotions()
      } else {
        const err = await res.json()
        alert(err.error || "Failed to save")
      }
    } catch (e) {
      alert("Error saving promotion")
    }
  }

  const handleEdit = (promo: Promotion) => {
    setEditingPromo(promo)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingPromo(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Promotions & Discounts</h1>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Promotions</p>
            <p className="text-3xl font-bold">{promotions.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">{activePromotions}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Inactive</p>
            <p className="text-3xl font-bold text-red-600">{promotions.length - activePromotions}</p>
          </Card>
        </div>

        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" /> Create Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{editingPromo ? "Edit Promotion" : "Create New Promotion"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Promotion Name</Label>
                    <Input id="name" name="name" required defaultValue={editingPromo?.name} />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={editingPromo?.description || ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Promo Code</Label>
                      <Input id="code" name="code" required defaultValue={editingPromo?.code} />
                    </div>
                    <div>
                      <Label htmlFor="discountType">Type</Label>
                      <select name="discountType" className="w-full h-10 px-3 rounded-md border" defaultValue={editingPromo?.discountType || "percentage"}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="discountValue">Value</Label>
                    <Input id="discountValue" name="discountValue" type="number" required defaultValue={editingPromo?.discountValue} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required defaultValue={editingPromo?.startDate?.split('T')[0]} />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input id="endDate" name="endDate" type="date" required defaultValue={editingPromo?.endDate?.split('T')[0]} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="isActive">Status</Label>
                    <select name="isActive" className="w-full h-10 px-3 rounded-md border" defaultValue={editingPromo?.isActive ? "active" : "inactive"}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-amber-600">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">All Promotions</h2>
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${promo.discountType === "percentage" ? "bg-purple-100" : "bg-green-100"} p-2 rounded-lg`}>
                      {promo.discountType === "percentage" ? <Percent className="w-5 h-5 text-purple-600" /> : <Tag className="w-5 h-5 text-green-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{promo.name}</h3>
                        {promo.isActive ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{promo.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground ml-14">
                    <span>Code: <span className="font-semibold text-foreground">{promo.code}</span></span>
                    <span>Discount: <span className="font-semibold text-foreground">{promo.discountType === "percentage" ? `${promo.discountValue}%` : formatLAK(promo.discountValue)}</span></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(promo)}><Edit className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {promotions.length === 0 && !isLoading && <p className="text-center py-10 text-muted-foreground">No promotions found.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
