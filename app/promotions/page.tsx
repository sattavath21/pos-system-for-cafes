"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Tag, Percent } from "lucide-react"
import Link from "next/link"

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)

  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: "1",
      name: "New Customer Discount",
      description: "15% off for first-time customers",
      code: "WELCOME15",
      discountType: "percentage",
      discountValue: 15,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      isActive: true,
    },
    {
      id: "2",
      name: "Happy Hour Special",
      description: "$5 off orders above $20 between 2-4 PM",
      code: "HAPPY5",
      discountType: "fixed",
      discountValue: 5,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      isActive: true,
    },
    {
      id: "3",
      name: "Weekend Deal",
      description: "20% off all beverages on weekends",
      code: "WEEKEND20",
      discountType: "percentage",
      discountValue: 20,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      isActive: true,
    },
    {
      id: "4",
      name: "Holiday Special",
      description: "$10 off orders above $50",
      code: "HOLIDAY10",
      discountType: "fixed",
      discountValue: 10,
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      isActive: false,
    },
  ])

  const activePromotions = promotions.filter((p) => p.isActive).length

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
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Promotions & Discounts</h1>
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

        {/* Add Button */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPromo ? "Edit Promotion" : "Create New Promotion"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="promoName">Promotion Name</Label>
                  <Input id="promoName" placeholder="e.g., Weekend Special" defaultValue={editingPromo?.name} />
                </div>
                <div>
                  <Label htmlFor="promoDesc">Description</Label>
                  <Textarea
                    id="promoDesc"
                    placeholder="Describe the promotion"
                    defaultValue={editingPromo?.description}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="promoCode">Promo Code</Label>
                    <Input id="promoCode" placeholder="SAVE20" defaultValue={editingPromo?.code} />
                  </div>
                  <div>
                    <Label htmlFor="discountType">Discount Type</Label>
                    <select
                      id="discountType"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      defaultValue={editingPromo?.discountType || "percentage"}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input id="discountValue" type="number" placeholder="0" defaultValue={editingPromo?.discountValue} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" defaultValue={editingPromo?.startDate} />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" defaultValue={editingPromo?.endDate} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <select
                    id="isActive"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    defaultValue={editingPromo?.isActive ? "active" : "inactive"}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setIsDialogOpen(false)}>
                  {editingPromo ? "Update Promotion" : "Create Promotion"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Promotions List */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">All Promotions</h2>
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`${promo.discountType === "percentage" ? "bg-purple-100" : "bg-green-100"} p-2 rounded-lg`}
                    >
                      {promo.discountType === "percentage" ? (
                        <Percent className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Tag className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{promo.name}</h3>
                        {promo.isActive ? (
                          <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{promo.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground ml-14">
                    <span>
                      Code: <span className="font-semibold text-foreground">{promo.code}</span>
                    </span>
                    <span>
                      Discount:{" "}
                      <span className="font-semibold text-foreground">
                        {promo.discountType === "percentage" ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                      </span>
                    </span>
                    <span>
                      Valid: {promo.startDate} to {promo.endDate}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(promo)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="w-4 h-4" />
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
