"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Minus, Plus, X, Search, Clock, User, List, Pause } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatLAK, calculateChange, LAK_DENOMINATIONS, calculateTax } from "@/lib/currency"
import { PaymentQR } from "@/components/payment-qr"
import Image from "next/image"

type MenuItem = {
  id: string
  name: string
  price: number
  category: string
  isAvailable: boolean
  image?: string
}

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  modifiers: string[]
  category: string
}

type Customer = {
  id: string
  name: string
  phone?: string
}

export default function POSPage() {
  const [activeCategory, setActiveCategory] = useState("All")

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/role-select'
  }

  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Payment Dialog state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("BANK_NOTE")
  const [cashReceived, setCashReceived] = useState("")
  const [orderNumber, setOrderNumber] = useState("")

  // Customer Search Dialog
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false)
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        const items = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          price: Number(d.price),
          category: d.categoryName || "Uncategorized",
          isAvailable: Boolean(d.isAvailable),
          image: d.image
        }))

        setMenuItems(items)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(items.map((i: any) => i.category))) as string[]
        setCategories(["All", ...uniqueCategories])
      }
    } catch (e) { console.error(e) }
  }

  // Search Customers
  useEffect(() => {
    if (!isCustomerSearchOpen) return
    const handler = setTimeout(async () => {
      if (customerQuery.length < 2) {
        setCustomerResults([])
        return
      }
      try {
        const res = await fetch(`/api/customers?q=${customerQuery}`)
        if (res.ok) setCustomerResults(await res.json())
      } catch (e) { }
    }, 300)
    return () => clearTimeout(handler)
  }, [customerQuery, isCustomerSearchOpen])

  // Broadcast cart changes
  useEffect(() => {
    const channel = new BroadcastChannel("pos_channel")
    channel.postMessage({ type: "CART_UPDATE", cart, total: calculateTotal().total })
    return () => channel.close()
  }, [cart])

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id)
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      }
      return [...prev, { ...item, quantity: 1, modifiers: [] }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const calculateTotal = () => {
    const subtotal = Math.round(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))
    const tax = calculateTax(subtotal)
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const { subtotal, tax, total } = calculateTotal()

  const handleCheckout = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total,
          subtotal,
          tax,
          customerId: selectedCustomer?.id,
          paymentMethod,
          status: 'COMPLETED'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        const data = await res.json()
        // Broadcast payment complete
        const channel = new BroadcastChannel("payment_channel")
        channel.postMessage({ type: "PAYMENT_COMPLETE" })
        channel.close()

        // Success
        setCart([])
        setTableNumber("")
        setSelectedCustomer(null)
        setIsPaymentOpen(false)
        alert("Order Completed!") // Replace with Toast later
      } else {
        alert("Failed to create order")
      }
    } catch (e) {
      console.error(e)
      alert("Error processing order")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleHoldOrder = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total,
          subtotal,
          tax,
          customerId: selectedCustomer?.id,
          paymentMethod: 'BANK_NOTE',
          status: 'HOLD'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        setCart([])
        setTableNumber("")
        setSelectedCustomer(null)
        alert("Order placed on hold!")
      } else {
        alert("Failed to hold order")
      }
    } catch (e) {
      console.error(e)
      alert("Error holding order")
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredItems = menuItems.filter(
    (item) => (activeCategory === "All" || item.category === activeCategory) && item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">POS - Order Taking</h1>
          <div className="flex items-center gap-4">
            {selectedCustomer ? (
              <Badge variant="outline" className="px-3 py-1 flex items-center gap-2" onClick={() => setSelectedCustomer(null)}>
                <User className="w-3 h-3" /> {selectedCustomer.name} (x)
              </Badge>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsCustomerSearchOpen(true)}>
                <User className="w-4 h-4 mr-2" /> Add Customer
              </Button>
            )}
            <Link href="/orders">
              <Button variant="outline" size="sm">
                <List className="w-4 h-4 mr-2" />
                View All Orders
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Side - Menu */}
        <div className="flex-1 flex flex-col border-r">
          {/* Search */}
          <div className="p-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-b bg-white">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className={activeCategory === category ? "bg-amber-600 hover:bg-amber-700" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${!item.isAvailable ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => addToCart(item)}
                >
                  <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {item.image && item.image !== '/placeholder.svg' ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">☕</span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1 text-balance">{item.name}</h3>
                  <p className="text-lg font-bold text-amber-600">{formatLAK(item.price)}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 flex flex-col bg-white">
          {/* Table Number */}
          <div className="p-4 border-b">
            <label className="block text-sm font-medium mb-2">Table Number</label>
            <Input
              placeholder="Enter table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Clock className="w-12 h-12 mb-2" />
                <p>No items in cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{formatLAK(item.price)} each</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="font-bold">{formatLAK(item.price * item.quantity)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="p-4 border-t space-y-3">
            {selectedCustomer && (
              <div className="flex justify-between text-sm text-amber-600 font-medium">
                <span>Loyalty Points Earning</span>
                <span>+{Math.floor(total / 1000)} pts</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatLAK(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span className="font-semibold">{formatLAK(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-amber-600">{formatLAK(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t space-y-2">
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={cart.length === 0}
              onClick={handleHoldOrder}
            >
              <Pause className="w-4 h-4 mr-2" />
              Hold Order
            </Button>
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  disabled={cart.length === 0}
                >
                  Proceed to Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center py-4 border-b">
                    <p className="text-muted-foreground">Total to Pay</p>
                    <p className="text-4xl font-bold text-green-600">{formatLAK(total)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={paymentMethod === 'BANK_NOTE' ? "default" : "outline"}
                      onClick={() => setPaymentMethod('BANK_NOTE')}
                      className={paymentMethod === 'BANK_NOTE' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                    >
                      💵 Bank Note
                    </Button>
                    <Button
                      variant={paymentMethod === 'QR_CODE' ? "default" : "outline"}
                      onClick={() => setPaymentMethod('QR_CODE')}
                      className={paymentMethod === 'QR_CODE' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      📱 QR Code
                    </Button>
                  </div>

                  {paymentMethod === 'BANK_NOTE' && (
                    <div className="space-y-3">
                      <div>
                        <Label>Cash Received</Label>
                        <Input
                          type="number"
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value)}
                          placeholder="Enter amount in kips"
                        />
                      </div>
                      {Number(cashReceived) > total && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Change</p>
                          <p className="text-2xl font-bold text-green-600">{formatLAK(Number(cashReceived) - total)}</p>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {calculateChange(total, Number(cashReceived)).denominations.map((d, i) => (
                              <div key={i}>{d.count} x {formatLAK(d.denom)}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-4 gap-2">
                        {LAK_DENOMINATIONS.map(denom => (
                          <Button
                            key={denom}
                            variant="outline"
                            size="sm"
                            onClick={() => setCashReceived(String(denom))}
                            className="text-xs"
                          >
                            {formatLAK(denom)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'QR_CODE' && (
                    <PaymentQR
                      amount={total}
                      orderNumber={`ORD-${Date.now().toString().slice(-6)}`}
                      onComplete={handleCheckout}
                    />
                  )}
                </div>

                {paymentMethod === 'BANK_NOTE' && (
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleCheckout}
                      disabled={isProcessing || !cashReceived || Number(cashReceived) < total}
                    >
                      {isProcessing ? "Processing..." : "Complete Order"}
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </div>

      {/* Customer Search Dialog */}
      <Dialog open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Select Customer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search customer..."
              value={customerQuery}
              onChange={e => setCustomerQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {customerResults.map(c => (
                <div
                  key={c.id}
                  className="p-3 border rounded hover:bg-muted cursor-pointer flex justify-between"
                  onClick={() => {
                    setSelectedCustomer(c)
                    setIsCustomerSearchOpen(false)
                  }}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground text-sm">{c.phone}</span>
                </div>
              ))}
              {customerResults.length === 0 && customerQuery.length > 2 && (
                <div className="text-center text-muted-foreground p-4">No results</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
