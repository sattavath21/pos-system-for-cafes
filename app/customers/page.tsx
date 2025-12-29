"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Star, Eye } from "lucide-react"
import Link from "next/link"

type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  loyaltyPoints: number
  totalOrders: number // Need to fetch from Orders or aggregate?
  totalSpent: number
  lastVisit: string // Date string
  dateOfBirth?: string | null
  createdAt: string
}

import { formatLAK } from "@/lib/currency"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orderHistory, setOrderHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: ""
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        // Map data
        setCustomers(data.map((c: any) => ({
          ...c,
          totalOrders: c.visitCount || 0, // Using visitCount as proxy for totalOrders for now, or need better schema mapping
          totalSpent: c.totalSpent || 0,
          lastVisit: c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'N/A'
        })))
      }
    } catch (e) { console.error(e) }
  }

  const handleAddNew = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        setIsDialogOpen(false)
        setIsDialogOpen(false)
        setFormData({ name: "", phone: "", email: "", dateOfBirth: "" }) // Reset
        fetchCustomers()
        fetchCustomers()
      }
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }


  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewDetails = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`/api/orders?customerId=${customer.id}`)
      if (res.ok) {
        setOrderHistory(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Customer Management</h1>
          <div className="flex items-center gap-4">
            <Link href="/menu">
              <Button variant="outline" size="sm">
                Menu
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                Inventory
              </Button>
            </Link>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
            <p className="text-3xl font-bold">{customers.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Active Today</p>
            <p className="text-3xl font-bold text-green-600">
              {/* Mock logic for "Today" as we deal with dates differently in real DB */}
              {customers.filter((c) => c.lastVisit === new Date().toLocaleDateString()).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Avg Loyalty Points</p>
            <p className="text-3xl font-bold text-amber-600">
              {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.loyaltyPoints, 0) / customers.length) : 0}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatLAK(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
            </p>
          </Card>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Full Name</Label>
                  <Input
                    id="customerName"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    placeholder="+1 555-0100"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email (Optional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerDob">Date of Birth (Optional)</Label>
                  <Input
                    id="customerDob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddNew} disabled={isLoading}>
                  {isLoading ? "Using..." : "Add Customer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customer List */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">All Customers</h2>
          <div className="space-y-3">
            {filteredCustomers.length === 0 ? <p className="text-muted-foreground">No customers found.</p> :
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{customer.name}</h3>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        <Star className="w-3 h-3 mr-1" />
                        {customer.loyaltyPoints} pts
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{customer.phone || 'No Phone'}</span>
                      <span>{customer.email || 'No Email'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Visits</p>
                      <p className="font-semibold">{customer.totalOrders}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="font-semibold text-green-600">{formatLAK(customer.totalSpent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Last Visit</p>
                      <p className="font-semibold">{customer.lastVisit}</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handleViewDetails(customer)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Customer Details Dialog */}
        {selectedCustomer && (
          <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-semibold">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-semibold">{selectedCustomer.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Loyalty Points</Label>
                    <p className="font-semibold text-amber-600">{selectedCustomer.loyaltyPoints}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-semibold">{selectedCustomer.dateOfBirth ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-4">Order History</h3>
                  {isLoadingHistory ? (
                    <p className="text-muted-foreground text-sm">Loading history...</p>
                  ) : orderHistory.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {orderHistory.map((order) => (
                        <div key={order.id} className="p-3 border rounded bg-slate-50 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-semibold">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-amber-900">{formatLAK(order.total)}</p>
                            <Badge variant="outline" className="text-[10px] h-4">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No past orders found for this customer.</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
