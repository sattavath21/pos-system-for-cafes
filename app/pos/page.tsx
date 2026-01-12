"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Minus, Plus, X, Search, Clock, User, List, Pause, Package, Check, AlertCircle, Tag, Printer } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatLAK, calculateChange, LAK_DENOMINATIONS, calculateTax } from "@/lib/currency"
import { PaymentQR } from "@/components/payment-qr"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"

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
  const [appliedPromo, setAppliedPromo] = useState<any>(null)
  const [promoCodeInput, setPromoCodeInput] = useState("")
  const [isPromoOpen, setIsPromoOpen] = useState(false)
  const [isHoldConfirmOpen, setIsHoldConfirmOpen] = useState(false)
  const [beeperNumber, setBeeperNumber] = useState("")
  const [showBeeperError, setShowBeeperError] = useState(false)

  const [sysSettings, setSysSettings] = useState<any>({ tax_rate: '10', loyalty_rate: '100' })
  const [pointsRedeemed, setPointsRedeemed] = useState(0)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)

  // UI state for custom confirmations
  const [isNewOrderConfirmOpen, setIsNewOrderConfirmOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [lastOrderInfo, setLastOrderInfo] = useState<any>(null)
  const [resumedOrderId, setResumedOrderId] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isHoldSuccessOpen, setIsHoldSuccessOpen] = useState(false)

  const calculateTotal = () => {
    const subtotal = Math.round(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))
    let promoDiscount = 0
    if (appliedPromo) {
      if (appliedPromo.discountType === 'percentage') {
        promoDiscount = Math.round(subtotal * (appliedPromo.discountValue / 100))
      } else {
        promoDiscount = appliedPromo.discountValue
      }
    }

    const taxableAmount = subtotal - promoDiscount - loyaltyDiscount
    const tax = calculateTax(taxableAmount, Number(sysSettings.tax_rate) || 0)
    const total = taxableAmount + tax
    return { subtotal, tax, total, promoDiscount, loyaltyDiscount, discount: promoDiscount + loyaltyDiscount }
  }

  const { subtotal, tax, total, promoDiscount, discount } = calculateTotal()

  // Broadcast cart update to customer view
  useEffect(() => {
    const channel = new BroadcastChannel("pos_channel")
    channel.postMessage({
      type: "CART_UPDATE",
      cart,
      subtotal,
      tax,
      total,
      discount,
      promoDiscount,
      loyaltyDiscount,
      promoName: appliedPromo?.name
    })
    return () => channel.close()
  }, [cart, appliedPromo, loyaltyDiscount, total])

  // Sync payment state with customer view
  useEffect(() => {
    const channel = new BroadcastChannel("payment_channel")
    if (isPaymentOpen) {
      if (paymentMethod === 'QR_CODE') {
        channel.postMessage({
          type: "QR_PAYMENT",
          data: {
            amount: total,
            orderNumber: orderNumber,
            qrData: "STATIC_QR_PLACEHOLDER" // In real app, this would be the actual data
          }
        })
      } else {
        channel.postMessage({ type: "PAYMENT_METHOD_CHANGE", method: paymentMethod })
      }
    } else {
      channel.postMessage({ type: "PAYMENT_COMPLETE" }) // Generic clear signal
    }
    return () => channel.close()
  }, [isPaymentOpen, paymentMethod, total, orderNumber])

  // Load persisted state
  useEffect(() => {
    const savedCart = localStorage.getItem("pos_cart")
    if (savedCart) setCart(JSON.parse(savedCart))

    const savedTable = localStorage.getItem("pos_table")
    if (savedTable) setTableNumber(savedTable)

    const savedCustomer = localStorage.getItem("pos_customer")
    if (savedCustomer) setSelectedCustomer(JSON.parse(savedCustomer))

    const savedOrderNum = localStorage.getItem("pos_orderNumber")
    const savedOrderDate = localStorage.getItem("pos_orderDate")
    const today = new Date().toDateString()

    if (savedOrderNum && savedOrderDate === today) {
      setOrderNumber(savedOrderNum)
    } else {
      localStorage.removeItem("pos_orderNumber")
      localStorage.removeItem("pos_orderDate")
    }

    const savedResumedId = localStorage.getItem("pos_resumedOrderId")
    if (savedResumedId) setResumedOrderId(savedResumedId)

    fetchSettings()
    setIsInitialLoad(false)
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) setSysSettings(await res.json())
    } catch (e) { }
  }


  // Persist state
  useEffect(() => {
    if (isInitialLoad) return

    localStorage.setItem("pos_cart", JSON.stringify(cart))
    localStorage.setItem("pos_customer", JSON.stringify(selectedCustomer))
    localStorage.setItem("pos_table", tableNumber)
    localStorage.setItem("pos_orderNumber", orderNumber)
    localStorage.setItem("pos_orderDate", new Date().toDateString())
    localStorage.setItem("pos_beeperNumber", beeperNumber)
    if (resumedOrderId) {
      localStorage.setItem("pos_resumedOrderId", resumedOrderId)
    } else {
      localStorage.removeItem("pos_resumedOrderId")
    }
  }, [cart, selectedCustomer, tableNumber, orderNumber, resumedOrderId, isInitialLoad])

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
    const fetchCustomers = async () => {
      try {
        const url = customerQuery.length >= 2
          ? `/api/customers?q=${customerQuery}`
          : '/api/customers'
        const res = await fetch(url)
        if (res.ok) setCustomerResults(await res.json())
      } catch (e) { }
    }

    const handler = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(handler)
  }, [customerQuery, isCustomerSearchOpen])

  // Handle Resume Order and Fetch Next Number
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resumeId = params.get('resumeOrder')

    const initialize = async () => {
      // 1. Auto-Hold existing session if switching
      const existingCartStr = localStorage.getItem("pos_cart")
      const existingCart = existingCartStr ? JSON.parse(existingCartStr) : []
      const existingResumedId = localStorage.getItem("pos_resumedOrderId")

      if (resumeId && existingCart.length > 0 && existingResumedId !== resumeId) {
        // Auto-save the current session as HOLD before loading the next one
        try {
          const existingCust = JSON.parse(localStorage.getItem("pos_customer") || "null")
          const existingTable = localStorage.getItem("pos_table") || ""
          const existingOrderNum = localStorage.getItem("pos_orderNumber")

          const subtotal = Math.round(existingCart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0))
          const tax = calculateTax(subtotal)
          const total = subtotal + tax

          await fetch('/api/orders', {
            method: 'POST',
            body: JSON.stringify({
              id: existingResumedId,
              items: existingCart,
              total, subtotal, tax,
              customerId: existingCust?.id,
              status: 'HOLD'
            }),
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (e) { console.error("Auto-hold failed", e) }
      }

      // 2. Load the requested order or fetch next number
      if (resumeId) {
        try {
          const res = await fetch('/api/orders')
          if (res.ok) {
            const all = await res.json()
            const found = all.find((o: any) => o.id === resumeId)
            if (found) {
              setCart(found.items.map((i: any) => ({
                id: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                modifiers: []
              })))
              setOrderNumber(found.orderNumber)
              setResumedOrderId(found.id)
              if (found.customerId) {
                const cRes = await fetch(`/api/customers?q=${found.customerId}`)
                if (cRes.ok) {
                  const customers = await cRes.json()
                  const c = customers.find((cust: any) => cust.id === found.customerId)
                  if (c) setSelectedCustomer(c)
                }
              }
              window.history.replaceState({}, document.title, "/pos")
            }
          }
        } catch (e) { console.error(e) }
      } else {
        const savedOrderNum = localStorage.getItem("pos_orderNumber")
        if (!savedOrderNum) {
          fetchNextOrderNumber()
        }
      }
    }
    initialize()
  }, [])

  const fetchNextOrderNumber = async () => {
    try {
      const res = await fetch('/api/orders?next-number=true')
      if (res.ok) {
        const { orderNumber: nextNum } = await res.json()
        setOrderNumber(nextNum)
      }
    } catch (e) { console.error(e) }
  }

  const applyPromoCode = async () => {
    try {
      const res = await fetch('/api/promotions')
      if (res.ok) {
        const all = await res.json()
        const found = all.find((p: any) => p.code.toUpperCase() === promoCodeInput.toUpperCase() && p.isActive)
        if (found) {
          // Check dates
          const now = new Date()
          if (now < new Date(found.startDate) || now > new Date(found.endDate)) {
            alert("Promotion is expired or not yet active")
            return
          }
          setAppliedPromo(found)
          setIsPromoOpen(false)
          setPromoCodeInput("")
        } else {
          alert("Invalid or inactive promo code")
        }
      }
    } catch (e) { alert("Error applying promo") }
  }

  const handleRedeemPoints = () => {
    if (!selectedCustomer) return
    const availablePoints = (selectedCustomer as any).loyaltyPoints || 0
    if (availablePoints <= 0) {
      alert("Customer has no points to redeem")
      return
    }

    const rate = Number(sysSettings.loyalty_rate) || 100
    const maxDiscount = subtotal - promoDiscount

    // Logic: 1 point = loyalty_rate LAK
    const pointsToUse = Math.min(availablePoints, Math.floor(maxDiscount / rate))
    const discountAmount = pointsToUse * rate

    if (pointsToUse <= 0) {
      alert("Not enough points or items for redemption")
      return
    }

    setPointsRedeemed(pointsToUse)
    setLoyaltyDiscount(discountAmount)
  }

  const handleNewOrderClick = () => {
    if (cart.length > 0) {
      setIsNewOrderConfirmOpen(true)
    } else {
      handleNewOrder()
    }
  }

  const handleNewOrder = () => {
    setCart([])
    setSelectedCustomer(null)
    setAppliedPromo(null)
    setResumedOrderId(null)
    setTableNumber("")
    fetchNextOrderNumber()
    localStorage.removeItem("pos_cart")
    localStorage.removeItem("pos_customer")
    localStorage.removeItem("pos_table")
    localStorage.removeItem("pos_orderNumber")
    localStorage.removeItem("pos_beeperNumber")
    setBeeperNumber("")
    setShowBeeperError(false)
    setCashReceived("")
    setIsNewOrderConfirmOpen(false)
  }

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


  const handleCheckout = async () => {
    if (!beeperNumber) {
      setShowBeeperError(true)
      return
    }
    setIsProcessing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          id: resumedOrderId,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total,
          subtotal,
          tax,
          discount,
          promoId: appliedPromo?.id,
          customerId: selectedCustomer?.id,
          paymentMethod,
          status: 'COMPLETED',
          beeperNumber: beeperNumber || null,
          pointsRedeemed,
          taxAmount: tax
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        const data = await res.json()
        // Broadcast payment complete
        const channel = new BroadcastChannel("payment_channel")
        channel.postMessage({ type: "PAYMENT_COMPLETE" })
        channel.close()

        // Success - Store full details for receipt
        setLastOrderInfo({
          id: data.id,
          orderNumber,
          beeperNumber,
          total,
          subtotal,
          tax,
          discount,
          items: cart,
          customer: selectedCustomer,
          promo: appliedPromo,
          date: new Date().toLocaleString()
        })
        setCart([])
        setTableNumber("")
        setSelectedCustomer(null)
        setAppliedPromo(null)
        setResumedOrderId(null)
        setBeeperNumber("")
        setCashReceived("")
        setOrderNumber("")
        setIsPaymentOpen(false)
        localStorage.removeItem("pos_cart")
        localStorage.removeItem("pos_customer")
        localStorage.removeItem("pos_table")
        localStorage.removeItem("pos_orderNumber")
        localStorage.removeItem("pos_beeperNumber")
        fetchNextOrderNumber()
        setIsSuccessOpen(true)
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
          id: resumedOrderId,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total,
          subtotal,
          tax,
          discount,
          promoId: appliedPromo?.id,
          customerId: selectedCustomer?.id,
          paymentMethod: 'BANK_NOTE',
          status: 'HOLD',
          beeperNumber: beeperNumber || null,
          pointsRedeemed,
          taxAmount: tax
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        setCart([])
        setTableNumber("")
        setSelectedCustomer(null)
        setBeeperNumber("")
        setCashReceived("")
        setOrderNumber("")
        localStorage.removeItem("pos_cart")
        localStorage.removeItem("pos_customer")
        localStorage.removeItem("pos_table")
        localStorage.removeItem("pos_orderNumber")
        localStorage.removeItem("pos_beeperNumber")
        fetchNextOrderNumber()
        setIsHoldSuccessOpen(true)
      } else {
        // Handle error
      }
    } catch (e) {
      console.error(e)
      alert("Error holding order")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!resumedOrderId) {
      handleNewOrder()
      return
    }
    if (!confirm("Are you sure you want to cancel this order? It will be recorded as CANCELLED.")) return

    setIsProcessing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          id: resumedOrderId,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total, subtotal, tax, discount,
          promoId: appliedPromo?.id,
          customerId: selectedCustomer?.id,
          status: 'CANCELLED'
        }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        handleNewOrder()
      }
    } catch (e) { console.error(e) }
    finally {
      setIsProcessing(false)
      setPointsRedeemed(0)
      setLoyaltyDiscount(0)
    }
  }

  const filteredItems = menuItems.filter(
    (item) => (activeCategory === "All" || item.category === activeCategory) && item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background text-slate-900">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="bg-amber-50 border-amber-200 text-amber-900">
                {t.dashboard}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-amber-900">{t.pos}</h1>
            <Badge variant="secondary" className="px-3 py-1 text-lg font-mono bg-amber-50 text-amber-900 border-amber-200">
              {orderNumber || "No. --"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="text-amber-700 border-amber-200 hover:bg-amber-50" onClick={handleNewOrder}>
              <Plus className="w-4 h-4 mr-1" /> {t.new_order}
            </Button>

            <Link href="/orders">
              <Button variant="outline" size="sm">
                <List className="w-4 h-4 mr-2" />
                {t.orders}
              </Button>
            </Link>
            <Link href="/menu">
              <Button variant="outline" size="sm">
                <List className="w-4 h-4 mr-2" />
                {t.menu}
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                <Package className="w-4 h-4 mr-2" />
                {t.inventory}
              </Button>
            </Link>
            <Link href="/promotions">
              <Button variant="outline" size="sm">
                <Tag className="w-4 h-4 mr-2" />
                {t.promotions}
              </Button>
            </Link>

            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
              {t.logout}
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
                placeholder={t.search_menu}
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
          {/* <div className="p-4 border-b">
            <label className="block text-sm font-medium mb-2">Table Number</label>
            <Input
              placeholder="Enter table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </div> */}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Clock className="w-12 h-12 mb-2" />
                <p>No items in {t.cart}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{formatLAK(item.price)} {t.each}</p>
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
                <span>{t.loyalty_points_earning}</span>
                <span>+{Math.floor(total / 1000)} {t.pts}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.subtotal}</span>
              <span className="font-semibold">{formatLAK(subtotal)}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between text-sm text-rose-600 font-medium">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {appliedPromo.name}
                </span>
                <span>-{formatLAK(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.tax} ({sysSettings.tax_rate}%)</span>
              <span className="font-semibold">{formatLAK(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>{t.total}</span>
              <span className="text-amber-600">{formatLAK(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t space-y-2">
            {selectedCustomer ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 w-full">
                  <Badge variant="outline" className="flex-1 py-3 text-sm flex items-center justify-between gap-2 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-bold">{selectedCustomer.name}</span>
                    </div>
                    <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      {(selectedCustomer as any).loyaltyPoints || 0} {t.pts}
                    </span>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600 border border-slate-100"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setPointsRedeemed(0)
                      setLoyaltyDiscount(0)
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                {pointsRedeemed === 0 && ((selectedCustomer as any).loyaltyPoints || 0) > 0 && (
                  <Button
                    variant="outline"
                    className="w-full bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    onClick={handleRedeemPoints}
                  >
                    <Tag className="w-4 h-4 mr-2" /> {t.redeem_points}
                  </Button>
                )}
                {pointsRedeemed > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setPointsRedeemed(0)
                      setLoyaltyDiscount(0)
                    }}
                  >
                    {t.cancel_redemption} ({pointsRedeemed} {t.pts})
                  </Button>
                )}
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setIsCustomerSearchOpen(true)}>
                <User className="w-4 h-4 mr-2" /> {t.add_customer}
              </Button>
            )}

            {!appliedPromo ? (
              <Button variant="outline" className="w-full border-dashed" onClick={() => setIsPromoOpen(true)}>
                <Tag className="w-4 h-4 mr-2" />
                {t.apply_promo}
              </Button>
            ) : (
              <Button variant="ghost" className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setAppliedPromo(null)}>
                {t.remove_promo} ({appliedPromo.code})
              </Button>
            )}



            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCancelOrder}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {t.cancel}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleHoldOrder}
              >
                <Pause className="w-4 h-4 mr-2" />
                {t.hold_order}
              </Button>
            </div>
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  disabled={cart.length === 0 || isProcessing}
                >
                  {t.proceed_to_payment}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.checkout}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center py-4 border-b">
                    <p className="text-muted-foreground">{t.total_to_pay}</p>
                    <p className="text-4xl font-bold text-green-600">{formatLAK(total)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={paymentMethod === 'BANK_NOTE' ? "default" : "outline"}
                      onClick={() => setPaymentMethod('BANK_NOTE')}
                      className={paymentMethod === 'BANK_NOTE' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                    >
                      💵 {t.bank_note}
                    </Button>
                    <Button
                      variant={paymentMethod === 'QR_CODE' ? "default" : "outline"}
                      onClick={() => setPaymentMethod('QR_CODE')}
                      className={paymentMethod === 'QR_CODE' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      📱 {t.qr_code}
                    </Button>
                  </div>

                  {paymentMethod === 'BANK_NOTE' && (
                    <div className="space-y-4">

                      <div>
                        <Label
                          className={`flex justify-between ${showBeeperError && !beeperNumber ? "text-rose-500" : ""
                            }`}
                        >
                          <span>{t.beeper}</span>
                          <span className="text-xs font-bold">
                            {showBeeperError && !beeperNumber ? t.required : `(${t.required})`}
                          </span>
                        </Label>

                        <Input
                          placeholder="e.g. 05"
                          value={beeperNumber}
                          onChange={e => {
                            setBeeperNumber(e.target.value)
                            if (showBeeperError) setShowBeeperError(false)
                          }}
                          className={`text-lg font-bold ${showBeeperError && !beeperNumber
                            ? "border-rose-500 bg-rose-50 focus-visible:ring-rose-500"
                            : ""
                            }`}
                        />

                        {showBeeperError && !beeperNumber && (
                          <p className="text-[10px] text-rose-500 mt-1 font-bold animate-pulse">
                            {t.please_enter_beeper_number}
                          </p>
                        )}
                      </div>

                      <div className="bg-muted p-4 rounded-lg">
                        <Label>{t.cash_received}</Label>
                        <Input
                          type="text"
                          value={cashReceived ? Number(cashReceived).toLocaleString() : ""}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "")
                            setCashReceived(val)
                          }}
                          placeholder="Enter amount in kips"
                          className="text-2xl font-bold h-14"
                        />
                      </div>
                      {Number(cashReceived) > total && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">{t.change}</p>
                          <p className="text-2xl font-bold text-green-600">{formatLAK(Number(cashReceived) - total)}</p>
                          {/* <div className="mt-2 text-xs text-muted-foreground">
                            {calculateChange(total, Number(cashReceived)).denominations.map((d, i) => (
                              <div key={i}>{d.count} x {formatLAK(d.denom)}</div>
                            ))}
                          </div> */}
                        </div>
                      )}
                      <div className="grid grid-cols-4 gap-2">
                        {LAK_DENOMINATIONS.map(denom => (
                          <Button
                            key={denom}
                            variant="outline"
                            size="sm"
                            onClick={() => setCashReceived(prev => String(Number(prev || 0) + denom))}
                            className="text-xs"
                          >
                            +{formatLAK(denom)}
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCashReceived("")}
                          className="text-xs text-red-500 hover:bg-red-50"
                        >
                          {t.clear}
                        </Button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'QR_CODE' && (
                    <div className="space-y-4">
                      <div>
                        <Label className={`flex justify-between ${showBeeperError && !beeperNumber ? 'text-rose-500' : ''}`}>
                          <span>Beeper Number</span>
                          <span className="text-xs font-bold">{showBeeperError && !beeperNumber ? 'REQUIRED' : '(Required)'}</span>
                        </Label>
                        <Input
                          placeholder="e.g. 05"
                          value={beeperNumber}
                          onChange={e => {
                            setBeeperNumber(e.target.value)
                            if (showBeeperError) setShowBeeperError(false)
                          }}
                          className={`text-lg font-bold ${showBeeperError && !beeperNumber ? 'border-rose-500 bg-rose-50 focus-visible:ring-rose-500' : ''}`}
                        />
                        {showBeeperError && !beeperNumber && (
                          <p className="text-[10px] text-rose-500 mt-1 font-bold animate-pulse">Please enter a beeper number</p>
                        )}
                      </div>
                      <PaymentQR
                        amount={total}
                        orderNumber={orderNumber || `ORD-${Date.now().toString().slice(-6)}`}
                        onComplete={handleCheckout}
                      />
                      <div className="pt-4 border-t">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleCheckout}
                          disabled={isProcessing}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark as Paid (Manual)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {paymentMethod === 'BANK_NOTE' && (
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>{t.cancel}</Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleCheckout}
                      disabled={isProcessing || !cashReceived || Number(cashReceived) < total}
                    >
                      {isProcessing ? t.processing : t.complete_order}
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </div>

      {/* Promo Dialog */}
      <Dialog open={isPromoOpen} onOpenChange={setIsPromoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Apply Promo Code</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Enter code (e.g. WELCOME10)"
              value={promoCodeInput}
              onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
              autoFocus
            />
            <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={applyPromoCode}>
              Apply Discount
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* New Order Confirmation */}
      <AlertDialog open={isNewOrderConfirmOpen} onOpenChange={setIsNewOrderConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard the current items in your cart. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={handleNewOrder}>
              Discard & Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog with Receipt */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Payment Successful Receipt</DialogTitle>
          <div className="flex flex-col items-center pt-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-6">Payment Successful</h2>

            {/* Receipt Visual */}
            <Card id="printable-receipt" className="w-full p-6 bg-white border-dashed border-2 shadow-none font-mono text-sm mb-6">
              <div className="text-center border-b border-dashed pb-4 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Receipt Number</p>
                <h2 className="text-4xl font-bold mb-2">{lastOrderInfo?.orderNumber}</h2>
                <h3 className="font-bold text-lg uppercase">Cafe POS</h3>
                <p className="text-xs text-muted-foreground">Vientiane, Laos</p>
                <p className="text-xs mt-1">{lastOrderInfo?.date}</p>
              </div>

              {lastOrderInfo?.beeperNumber && (
                <div className="flex justify-center font-bold mb-4 text-orange-600 border-2 border-orange-600 p-2 text-center text-xl">
                  <span>BEEPER: {lastOrderInfo.beeperNumber}</span>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {lastOrderInfo?.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="flex-1">{item.name} x{item.quantity}</span>
                    <span>{formatLAK(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed pt-4 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatLAK(lastOrderInfo?.subtotal)}</span>
                </div>
                {lastOrderInfo?.discount > 0 && (
                  <div className="flex justify-between text-xs text-rose-600">
                    <span>Discount ({lastOrderInfo?.promo?.name})</span>
                    <span>-{formatLAK(lastOrderInfo?.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tax (10%)</span>
                  <span>{formatLAK(lastOrderInfo?.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed">
                  <span>TOTAL</span>
                  <span>{formatLAK(lastOrderInfo?.total)}</span>
                </div>
              </div>

              {lastOrderInfo?.customer && (
                <div className="mt-4 pt-4 border-t border-dashed text-[10px] text-muted-foreground">
                  <p>Customer: {lastOrderInfo.customer.name}</p>
                  <p>Points Earned: +{Math.floor(lastOrderInfo.total / 1000)}</p>
                  <p>Payment: {lastOrderInfo?.paymentMethod === 'BANK_NOTE' ? 'Cash' : 'Bank Transfer'}</p>
                </div>
              )}

              <div className="text-center mt-6 pt-4 border-t border-dashed opacity-50 text-[10px]">
                {!lastOrderInfo?.customer && <p className="mb-2">Payment: {lastOrderInfo?.paymentMethod === 'BANK_NOTE' ? 'Cash' : 'Bank Transfer'}</p>}
                <p>THANK YOU FOR YOUR VISIT!</p>
              </div>
            </Card>

            <div className="w-full space-y-3 print:hidden">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-6 text-md"
                onClick={() => {
                  if (lastOrderInfo?.id) {
                    window.open(`/receipt?id=${lastOrderInfo.id}`, '_blank', 'width=450,height=600');
                  }
                }}
              >
                <Printer className="w-6 h-6 mr-2" />
                Print Receipt
              </Button>
              <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => setIsSuccessOpen(false)}>
                New Order
              </Button>
              <Link href="/orders" className="block w-full">
                <Button variant="outline" className="w-full">
                  View Orders
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Custom Hold Success Dialog */}
      <Dialog open={isHoldSuccessOpen} onOpenChange={setIsHoldSuccessOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogTitle className="sr-only">Order Put on Hold</DialogTitle>
          <div className="flex flex-col items-center justify-center pt-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Pause className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">Order Put on Hold</h2>
            <p className="text-muted-foreground mb-6">
              This order can be resumed later from the <span className="font-semibold text-amber-700">All Orders</span> list.
            </p>
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => setIsHoldSuccessOpen(false)}>
              Back to POS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
