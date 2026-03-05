"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, List, Package, Tag, Clock, X, Minus, Trash2, Pause, User, ArrowLeft, Check, ChevronRight, ChevronUp, ChevronDown, Printer, CheckCircle, Star, ShoppingCart, CandyOff, Droplet, Droplets, Candy, Coffee, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatLAK, calculateChange, LAK_DENOMINATIONS, calculateTax, calculateInclusiveTax } from "@/lib/currency"
import { PaymentQR } from "@/components/payment-qr"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"
import { Header } from "@/components/header"
import { CustomizationDialog } from "@/app/pos/components/CustomizationDialog"
import { useShift } from "@/components/shift-provider"
import { Switch } from "@/components/ui/switch"

type MenuItem = {
  id: string
  name: string
  localName?: string
  category: string
  hasSugarLevel: boolean
  hasShotType: boolean
  isAvailable: boolean
  image?: string
  variations: Array<{
    id: string
    type: string
    sizes: Array<{
      id: string
      size: string
      price: number
    }>
  }>
}

type CartItem = {
  id: string
  variationSizeId: string
  name: string
  localName?: string
  price: number
  quantity: number
  sugar?: string
  shot?: string
  variation?: string
  size?: string
  category?: string
  image?: string
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
  const [isComplimentary, setIsComplimentary] = useState(false)
  const [user, setUser] = useState<any>(null)
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
  const [focusedInput, setFocusedInput] = useState<'beeper' | 'cash'>('beeper')

  const [sysSettings, setSysSettings] = useState<any>({ taxRate: '10', loyaltyRate: '100' })
  const [pointsRedeemed, setPointsRedeemed] = useState(0)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)

  // UI state for custom confirmations
  const [isNewOrderConfirmOpen, setIsNewOrderConfirmOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [lastOrderInfo, setLastOrderInfo] = useState<any>(null)
  const [resumedOrderId, setResumedOrderId] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isHoldSuccessOpen, setIsHoldSuccessOpen] = useState(false)

  // Cancel Reason
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  // Customization Logic
  const [customizationOpen, setCustomizationOpen] = useState(false)
  const [productToCustomize, setProductToCustomize] = useState<MenuItem | null>(null)
  const [manualPoints, setManualPoints] = useState("")
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)

  // Fly-to-cart animation state
  const [flyAnims, setFlyAnims] = useState<{ id: string; image?: string; x: number; y: number }[]>([])
  const [pendingDialogFly, setPendingDialogFly] = useState<{ image?: string; x: number; y: number } | null>(null)

  const calculateTotal = () => {
    // Gross subtotal: sum of all items before any reductions (VAT inclusive)
    const grossTotal = Math.round(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))

    let promoDiscount = 0
    if (appliedPromo) {
      if (appliedPromo.discountType === 'percentage') {
        promoDiscount = Math.round(grossTotal * (appliedPromo.discountValue / 100))
      } else {
        promoDiscount = appliedPromo.discountValue
      }
    }

    // Final total customer pays (after discounts, tax is inclusive)
    const finalTotal = grossTotal - promoDiscount - loyaltyDiscount

    // Tax is calculated from the discounted total
    const tax = calculateInclusiveTax(finalTotal, Number(sysSettings.taxRate) || 10)

    // Net Subtotal (Total without Tax)
    const netSubtotal = finalTotal - tax

    return {
      grossTotal,
      subtotal: netSubtotal, // Return net amount as subtotal for display
      tax,
      total: finalTotal,
      promoDiscount,
      loyaltyDiscount,
      discount: promoDiscount + loyaltyDiscount
    }
  }

  const { grossTotal, subtotal, tax, total, promoDiscount, discount } = calculateTotal()


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
      loyaltyPoints: loyaltyDiscount,
      promoName: appliedPromo?.name,
      customer: selectedCustomer,
      isComplimentary
    })
    return () => channel.close()
  }, [cart, appliedPromo, loyaltyDiscount, total, selectedCustomer, isComplimentary])

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const d = await res.json()
          setUser(d.user)
        }
      } catch (e) { }
    }
    fetchUser()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSysSettings({
          ...data,
          taxRate: data.taxRate || data.tax_rate || '10',
          loyaltyRate: data.loyaltyRate || data.loyalty_rate || '1000'
        })
      }
    } catch (e) { }
  }


  // Shift Management context
  const { status: shiftStatus, checkShiftStatus } = useShift()

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
      const res = await fetch('/api/menu?availableOnly=true')
      if (res.ok) {
        const data = await res.json()
        // Data already in correct hierarchical format from API
        setMenuItems(data)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.map((i: any) => i.category))) as string[]
        setCategories(["All", ...uniqueCategories])

        // Silent Validation: Remove cart items that no longer exist in the menu
        const allVariationSizeIds = new Set(
          data.flatMap((m: any) => m.variations.flatMap((v: any) => v.sizes.map((s: any) => s.id)))
        )
        setCart((prev) => {
          const valid = prev.filter(item => allVariationSizeIds.has(item.variationSizeId))
          if (valid.length !== prev.length) {
            console.warn("Pruned invalid/stale items from cart after seeding/update.")
          }
          return valid
        })

        // Validate Selected Customer
        const savedCustomer = localStorage.getItem("pos_customer")
        if (savedCustomer) {
          const cust = JSON.parse(savedCustomer)
          try {
            const checkRes = await fetch(`/api/customers?q=${cust.id}`)
            if (checkRes.ok) {
              const results = await checkRes.json()
              const found = results.find((c: any) => c.id === cust.id)
              if (!found) {
                console.warn("Selected customer no longer exists. Clearing.")
                setSelectedCustomer(null)
              }
            }
          } catch (e) { }
        }
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
  const [isResumeWarningOpen, setIsResumeWarningOpen] = useState(false)
  const [pendingResumeId, setPendingResumeId] = useState<string | null>(null)

  const handleResumeOrder = async (resumeId: string) => {
    if (cart.length > 0) {
      setPendingResumeId(resumeId)
      setIsResumeWarningOpen(true)
      return
    }
    await performResume(resumeId)
  }

  const performResume = async (resumeId: string) => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const all = await res.json()
        const found = all.find((o: any) => o.id === resumeId)
        if (found) {
          setCart(found.items.map((i: any) => ({
            id: i.variationSizeId, // Could use i.id if uniqueCartId was stored, but variationSizeId is safer for now
            variationSizeId: i.variationSizeId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            sugar: i.sugarLevel,
            shot: i.shotType,
            cupSize: i.cupSize
          })))
          setOrderNumber(found.orderNumber)
          setResumedOrderId(found.id)
          setBeeperNumber(found.beeperNumber || "")

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
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resumeId = params.get('resumeOrder')

    // Auto-Hold existing session if switching (this logic remains in the useEffect for initial load)
    const existingCartStr = localStorage.getItem("pos_cart")
    const existingCart = existingCartStr ? JSON.parse(existingCartStr) : []
    const existingResumedId = localStorage.getItem("pos_resumedOrderId")

    if (resumeId && existingCart.length > 0 && existingResumedId !== resumeId) {
      // Auto-save the current session as HOLD before loading the next one
      const autoHold = async () => {
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
      autoHold()
    }

    if (resumeId) {
      performResume(resumeId)
    } else {
      const savedOrderNum = localStorage.getItem("pos_orderNumber")
      if (!savedOrderNum) {
        fetchNextOrderNumber()
      }
    }
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

  // Replaced by manual function below
  // const handleRedeemPoints = () => { ... }

  const handleManualRedeem = () => {
    if (!selectedCustomer) return
    const points = parseInt(manualPoints)
    if (isNaN(points) || points <= 0) return alert("Invalid points")

    // Check max available
    const available = (selectedCustomer as any).loyaltyPoints || 0
    if (points > available) return alert(`Not enough points. Max ${available}`)

    const rate = Number(sysSettings.loyalty_rate) || 100
    const discountAmount = points * rate

    // Check against total
    const maxDiscount = subtotal - promoDiscount
    if (discountAmount > maxDiscount && maxDiscount > 0) {
      // Allow using more points than total? usually no.
      // Auto adjust? Or alert? User asked to "type how many point".
      // Let's allow and cap discount at total, but points deducted should probably match discount used?
      // Or just block if > total.
      alert(`Discount exceeds total. Max points usable: ${Math.floor(maxDiscount / rate)}`)
      return
    }

    setPointsRedeemed(points)
    setLoyaltyDiscount(discountAmount)
    setManualPoints("")
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
    setPointsRedeemed(0)
    setLoyaltyDiscount(0)

    // Also broadcast to customer view to reset success screen
    const channel = new BroadcastChannel("pos_channel")
    channel.postMessage({ type: "ORDER_RESET" })
    channel.close()
  }

  const triggerFlyAnim = (item: MenuItem, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    // Add slight random offset for spread
    const offsetX = (Math.random() - 0.5) * 40
    const offsetY = (Math.random() - 0.5) * 40
    const newAnim = {
      id: Math.random().toString(),
      image: item.image,
      x: rect.left + rect.width / 2 + offsetX,
      y: rect.top + rect.height / 2 + offsetY
    }
    setFlyAnims(prev => [...prev, newAnim])
    setTimeout(() => setFlyAnims(prev => prev.filter(a => a.id !== newAnim.id)), 750)
  }

  const handleClickProduct = (item: MenuItem, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    // Check if this item is "simple" – just 1 variation with 1 size and no sugar/shot
    const enabled = item.variations?.filter(v => (v as any).isEnabled !== false) || []
    const isSimple =
      !item.hasSugarLevel &&
      !item.hasShotType &&
      enabled.length === 1 &&
      enabled[0].sizes.length === 1

    if (isSimple) {
      const variation = enabled[0]
      const size = variation.sizes[0]
      const uniqueId = `${size.id}-Normal-Normal-${variation.type}`
      triggerFlyAnim(item, e)
      setCart(prev => {
        const existing = prev.find(ci => ci.id === uniqueId)
        if (existing) {
          return prev.map(ci => ci.id === uniqueId ? { ...ci, quantity: ci.quantity + 1 } : ci)
        }
        return [...prev, {
          id: uniqueId,
          variationSizeId: size.id,
          name: item.name,
          localName: item.localName,
          price: size.price,
          quantity: 1,
          sugar: 'Normal',
          shot: 'Normal',
          variation: variation.type,
          size: size.size,
          category: item.category,
          image: item.image
        }]
      })
      return
    }

    // Otherwise show customization dialog — save click position for later
    setPendingDialogFly({ image: item.image, x: cx, y: cy })
    setProductToCustomize(item)
    setCustomizationOpen(true)
  }

  const handleAddToCartWithCustomization = (selection: {
    variationSizeId: string
    name: string
    localName?: string
    price: number
    sugar: string
    shot: string
    variation: string
    size: string
  }) => {
    // Double Shot = +10% price markup
    const finalPrice = selection.shot === "Double" ? Math.round(selection.price * 1.1) : selection.price

    setCart((prev) => {
      // Unique ID based on variationSizeId + customizations
      const uniqueId = `${selection.variationSizeId}-${selection.sugar}-${selection.shot}-${selection.variation}`

      // Check existing similar item
      const existing = prev.find((item) => item.id === uniqueId)

      if (existing) {
        return prev.map((item) =>
          item.id === uniqueId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }

      return [...prev, {
        id: uniqueId,
        variationSizeId: selection.variationSizeId,
        name: selection.name,
        localName: selection.localName,
        price: finalPrice,
        quantity: 1,
        sugar: selection.sugar,
        shot: selection.shot,
        variation: selection.variation,
        size: selection.size,
        category: productToCustomize?.category || "Other",
        image: productToCustomize?.image
      }]
    })
    // Trigger fly animation now that user confirmed
    if (pendingDialogFly) {
      const offsetX = (Math.random() - 0.5) * 40
      const offsetY = (Math.random() - 0.5) * 40
      const animId = Math.random().toString()
      const newAnim = { id: animId, image: pendingDialogFly.image, x: pendingDialogFly.x + offsetX, y: pendingDialogFly.y + offsetY }
      setFlyAnims(prev => [...prev, newAnim])
      setTimeout(() => setFlyAnims(prev => prev.filter(a => a.id !== animId)), 750)
      setPendingDialogFly(null)
    }
    setProductToCustomize(null)
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
          beeperNumber: beeperNumber || null,
          pointsRedeemed,
          taxAmount: tax,
          items: cart.map(i => ({
            variationSizeId: i.variationSizeId,
            name: `${i.localName || i.name} (${i.name})`, // Snapshot both names
            price: i.price,
            quantity: i.quantity,
            sugarLevel: i.sugar,
            shotType: i.shot,
            variation: i.variation,
            size: i.size
          })),
          total,
          subtotal: grossTotal, // Backend expects gross before discount in subtotal
          tax,
          discount,
          promoId: appliedPromo?.id,

          customerId: selectedCustomer?.id,
          paymentMethod,
          status: 'COMPLETED',
          isReportable: !isComplimentary
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        const data = await res.json()
        const channel = new BroadcastChannel("payment_channel")
        channel.postMessage({ type: "PAYMENT_COMPLETE" })
        channel.close()

        setLastOrderInfo({
          id: data.id,
          orderNumber,
          total,
          subtotal: grossTotal,
          tax,
          discount,
          cashReceived: Number(cashReceived) || 0,
          items: [...cart], // Clone cart
          customer: selectedCustomer,
          promo: appliedPromo,
          date: new Date().toLocaleString(),
          paymentMethod
        })
        // handleNewOrder() // Removed: Don't clear cart immediately
        setIsPaymentOpen(false)
        setIsSuccessOpen(true)

        // Broadcast SUCCESS to customer view
        const posChannel = new BroadcastChannel("pos_channel")
        posChannel.postMessage({
          type: "PAYMENT_SUCCESS",
          total,
          cashReceived: Number(cashReceived) || 0,
          change: Math.max(0, (Number(cashReceived) || 0) - total)
        })
        posChannel.close()
      } else {
        const errorData = await res.json()
        if (errorData.code === 'STALE_ID_VIOLATION') {
          alert(`Order failed because some items in your cart are outdated (IDs changed). These items have been removed. Please try again.`)
          // IDs likely changed because of seeding. Clear cart to be safe or prune if we have missingIds.
          if (errorData.missingIds) {
            setCart(prev => prev.filter(i => !errorData.missingIds.includes(i.variationSizeId)))
          }
        } else if (errorData.code === 'STALE_CUSTOMER_VIOLATION') {
          alert(`Order failed because the selected customer no longer exists in the system. They have been removed from this order. Please try again.`)
          setSelectedCustomer(null)
        } else {
          alert(errorData.error || "Failed to create order")
        }
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
          items: cart.map(i => ({
            variationSizeId: i.variationSizeId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            sugarLevel: i.sugar,
            shotType: i.shot,
            variation: i.variation,
            size: i.size
          })),
          total,
          subtotal: grossTotal,
          tax,
          discount,
          promoId: appliedPromo?.id,
          customerId: selectedCustomer?.id,
          paymentMethod: 'CASH',
          status: 'HOLD',
          beeperNumber: beeperNumber || null,
          pointsRedeemed,
          taxAmount: tax
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        handleNewOrder() // This resets resumedOrderId and orderNumber
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

  const handleInitiateOnepay = async () => {
    if (resumedOrderId && paymentMethod === 'QR_CODE') return;

    setIsProcessing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          id: resumedOrderId,
          items: cart.map(i => ({
            variationSizeId: i.variationSizeId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            sugarLevel: i.sugar,
            shotType: i.shot,
            variation: i.variation,
            size: i.size
          })),
          total, subtotal: grossTotal, tax, discount,
          promoId: appliedPromo?.id,
          customerId: selectedCustomer?.id,
          paymentMethod: 'QR_CODE',
          status: 'HOLD',
          beeperNumber: beeperNumber || null,
          pointsRedeemed,
          taxAmount: tax
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        const data = await res.json()
        setResumedOrderId(data.id)
        setOrderNumber(data.orderNumber)
        setPaymentMethod('QR_CODE')
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Failed to initiate payment")
      }
    } catch (e) {
      console.error(e)
      alert("Error initiating Onepay")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelOrderClick = () => {
    if (!resumedOrderId) {
      setCart([]) // Just clear the cart if it's a fresh order
      return
    }
    setIsCancelConfirmOpen(true)
  }

  const handleCancelOrderConfirm = async () => {
    if (!cancelReason) return alert("Reason is required")

    setIsProcessing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          id: resumedOrderId,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total, subtotal: grossTotal, tax, discount,
          promoId: appliedPromo?.id,
          customerId: selectedCustomer?.id,
          status: 'CANCELLED',
          cancellationReason: cancelReason
        }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        handleNewOrder()
        setCancelReason("")
        setIsCancelConfirmOpen(false)
      }
    } catch (e) { console.error(e) }
    finally {
      setIsProcessing(false)
      setPointsRedeemed(0)
      setLoyaltyDiscount(0)
    }
  }

  const filteredItems = menuItems.filter(
    (item) => (activeCategory === "All" || item.category === activeCategory) &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.localName && item.localName.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const { t } = useTranslation()

  return (
    <div className="h-screen flex bg-slate-50 text-slate-900 overflow-hidden">
      {/* Left Side - Menu & Header */}
      <div className="flex-1 flex flex-col min-w-0 bg-background border-r">
        <Header title={t.pos}>
          <Badge variant="secondary" className="px-3 py-1 text-lg font-mono bg-amber-50 text-amber-900 border-amber-200">
            {orderNumber || "No. --"}
          </Badge>
        </Header>

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
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className={activeCategory === category ? "bg-amber-600 hover:bg-amber-700 text-lg h-10" : "text-lg h-10"}
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
                className={`p-4 cursor-pointer hover:shadow-lg transition-all bg-amber-50 hover:bg-amber-100 border-amber-200 shadow-sm ${!item.isAvailable ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={(e) => handleClickProduct(item, e)}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="relative w-full aspect-square mb-3 rounded-md overflow-hidden bg-white shadow-inner">
                    {item.image && item.image !== "/placeholder.svg" ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight text-slate-800">{item.localName || item.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{item.name}</p>
                  </div>
                </div>
              </Card>

            ))}
          </div>
        </div>

      </div>

      {/* Fly-to-cart overlay animations */}
      {flyAnims.map((anim) => (
        <div
          key={anim.id}
          className="pointer-events-none fixed z-50"
          style={{
            left: anim.x - 36,
            top: anim.y - 36,
            '--target-x': `${1650 - anim.x}px`,
            '--target-y': `${300 - anim.y}px`,
            animation: 'flyToCart 0.75s cubic-bezier(0.4,0,0.2,1) forwards'
          } as React.CSSProperties}
        >
          {anim.image && anim.image !== '/placeholder.svg' ? (
            <img src={anim.image} className="w-[72px] h-[72px] rounded-full object-cover shadow-xl border-4 border-amber-300" />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-amber-400 flex items-center justify-center shadow-xl border-4 border-amber-300 text-white text-3xl">☕</div>
          )}
        </div>
      ))}

      {/* Right Side - Cart */}
      <div className="w-[490px] flex flex-col bg-white shadow-2xl z-10 border-l shrink-0">
        <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> {t.cart}
          </h3>
          <Badge variant="secondary" className="bg-amber-100 text-amber-900 font-black px-2">{cart.reduce((sum, i) => sum + i.quantity, 0)}</Badge>
        </div>
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
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Clock className="w-12 h-12 mb-2 opacity-50" />
              <p>{t.no_items_found} in {t.cart}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {cart.map((item) => (
                <Card key={item.id} className="p-2 border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5 pr-4">
                        <h4 className="font-bold text-slate-800 text-[15px] whitespace-normal break-words leading-tight">
                          {item.localName || item.name}
                        </h4>
                        <div className="flex flex-wrap items-start gap-1 shrink-0 mt-0.5">
                          {item.variation && (
                            <span className="text-[10px] bg-amber-50 px-1.5 py-0.5 rounded-full text-amber-700 font-bold uppercase whitespace-nowrap">
                              {item.variation}
                            </span>
                          )}
                          {item.size && item.size.toLowerCase() !== 'standard' && (
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600 font-bold whitespace-nowrap">
                              {item.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-2 mt-0.5 flex-col">
                        <span className="text-xs text-slate-500 font-medium">{formatLAK(item.price)}</span>
                        {(item.sugar && item.sugar !== "Normal Sweet" && item.sugar !== "100%") || (item.shot && item.shot !== "Normal Shot") ? (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.sugar && item.sugar !== "Normal Sweet" && item.sugar !== "100%" && (
                              <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-1 rounded border border-slate-100">{item.sugar}</span>
                            )}
                            {item.shot && item.shot !== "Normal Shot" && (
                              <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-1 rounded border border-slate-100">{item.shot}</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-slate-50 border border-slate-200 text-slate-600 shadow-sm"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-5 text-center font-bold text-[15px] shrink-0">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-sm"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-right w-[80px] shrink-0">
                      <p className="font-black text-[15px] text-slate-800 tracking-tight">
                        {formatLAK(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="w-[30px]">

                    </div>


                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-0 right-0 p-3 bg-red-50 text-red-500 rounded-bl-xl hover:bg-red-100 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div
          className="p-3 border-t bg-slate-50/50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] cursor-pointer select-none"
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Order Summary</span>
            {isSummaryExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>

          {isSummaryExpanded && (
            <div className="space-y-2 mb-3 px-1">
              {selectedCustomer && (
                <div className="flex justify-between text-xs text-amber-600 font-medium">
                  <span>{t.loyalty_points_earning}</span>
                  <span>+{Math.floor(total / 1000)} {t.pts}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between py-1 text-xs bg-rose-50/50 -mx-4 px-4 relative">
                  <span className="text-slate-500 line-through">{formatLAK(grossTotal)}</span>
                  <span className="text-rose-600 font-medium">-{formatLAK(discount)} {t.discount || "Discount"}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t.subtotal} (Net)</span>
                <span className="font-semibold">{formatLAK(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">VAT ({sysSettings.taxRate || 10}%)</span>
                <span className="font-semibold">{formatLAK(tax)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between text-xl font-black items-end pt-1">
            <span>{t.total}</span>
            <span className="text-amber-600 text-[26px]">{formatLAK(total)}</span>
          </div>
        </div>

        {/* Resume Warning Dialog */}
        <AlertDialog open={isResumeWarningOpen} onOpenChange={setIsResumeWarningOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.active_orders_warning_title}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.active_orders_warning_desc}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setPendingResumeId(null)
                setIsResumeWarningOpen(false)
              }}>
                {t.cancel}
              </AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                if (pendingResumeId) {
                  // Auto-hold current first
                  const existingSubtotal = Math.round(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))
                  const existingTax = calculateInclusiveTax(existingSubtotal - discount, Number(sysSettings.taxRate) || 10)
                  const existingTotal = existingSubtotal - discount

                  await fetch('/api/orders', {
                    method: 'POST',
                    body: JSON.stringify({
                      id: resumedOrderId,
                      items: cart,
                      total: existingTotal, subtotal: existingSubtotal, tax: existingTax,
                      customerId: selectedCustomer?.id,
                      status: 'HOLD'
                    }),
                    headers: { 'Content-Type': 'application/json' }
                  })

                  await performResume(pendingResumeId)
                  setPendingResumeId(null)
                  setIsResumeWarningOpen(false)
                }
              }}>
                {t.continue_as || "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
          <DialogContent
            className="max-w-[400px] max-h-[90vh] overflow-y-auto !transform-none data-[state=open]:animate-none p-4"
            size="sm"
            showCloseButton={false}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="text-center space-y-2 mb-4 pt-2">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-emerald-700">{t.payment_successful}</DialogTitle>
              <p className="text-sm font-medium text-slate-500">{t.order_completed_successfully}</p>
            </div>

            {lastOrderInfo && (
              <div className={`p-4 rounded-xl border-dashed border-2 border-slate-200 bg-white font-mono text-[10px] leading-tight shadow-sm ${sysSettings?.boldReceipt === 'true' ? 'font-bold' : ''}`}>
                <div className="text-center space-y-1 mb-4">
                  <div className="flex justify-center mb-2">
                    <img src={sysSettings?.shopLogo || "/placeholder-logo.png"} alt="Logo" className="h-10 w-auto object-contain" />
                  </div>
                  <h1 className="text-sm font-black uppercase tracking-tight">{sysSettings?.shopName || 'Cafe POS'}</h1>
                  {sysSettings?.shopAddress && <p className="text-[8px] text-muted-foreground">{sysSettings.shopAddress}</p>}
                  {sysSettings?.shopPhone && <p className="text-[8px] text-muted-foreground">Tel: {sysSettings.shopPhone}</p>}
                </div>

                <div className="border border-dashed border-slate-200 p-2 rounded-lg bg-slate-50 relative overflow-hidden mb-3">
                  <div className="text-center border-b border-dashed border-slate-300 pb-2 mb-2">
                    <p className="text-[8px] uppercase tracking-wider text-slate-400">Order Number</p>
                    <p className="text-lg font-black">{lastOrderInfo.orderNumber}</p>
                    <p className="text-[8px] text-slate-400">{lastOrderInfo.date}</p>
                  </div>

                  {lastOrderInfo.beeperNumber && (
                    <div className="mb-2 p-1 border-2 border-dashed border-slate-400 text-center font-black text-sm text-slate-700">
                      BEEPER: {lastOrderInfo.beeperNumber}
                    </div>
                  )}

                  <div className="space-y-2 mb-2">
                    {lastOrderInfo.items?.map((item: any, i: number) => {
                      const taxRate = Number(sysSettings?.taxRate) || 10;
                      const netPrice = (item.price * item.quantity) - calculateInclusiveTax(item.price * item.quantity, taxRate);

                      return (
                        <div key={i} className="flex flex-col mb-1 capitalize">
                          <div className="flex justify-between font-bold">
                            <span className="mr-2">{item.name} x{item.quantity}</span>
                            <span>{formatLAK(item.price * item.quantity)}</span>
                          </div>

                          {(item.variation || item.size) && (
                            <div className="text-[8px] text-slate-500 pl-1 font-bold">
                              {item.variation}{item.variation && item.size ? ' - ' : ''}{item.size}
                            </div>
                          )}

                          <div className="text-[8px] text-slate-500 pl-1">
                            <span className="italic">Net: {formatLAK(netPrice)} </span>
                          </div>

                          {((item.sugar && item.sugar !== "100%") || (item.shot && item.shot !== "Normal")) && (
                            <div className="text-[8px] text-slate-500 pl-1">
                              {item.sugar && item.sugar !== "100%" && `${t.sugar}: ${item.sugar}, `}
                              {item.shot && item.shot !== "Normal" && `${t.shot}: ${item.shot}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5">
                    {lastOrderInfo.discount > 0 && (
                      <>
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Gross Total</span>
                          <span className="line-through">{formatLAK(lastOrderInfo.total + lastOrderInfo.discount)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-rose-500 font-bold">
                          <span>Discount</span>
                          <span>-{formatLAK(lastOrderInfo.discount)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Subtotal (Net)</span>
                      <span>{formatLAK(lastOrderInfo.total - lastOrderInfo.tax)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>VAT ({sysSettings?.taxRate || '10'}%)</span>
                      <span>{formatLAK(lastOrderInfo.tax)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm mt-1.5 pt-1.5 border-t border-solid border-slate-300">
                      <span>GRAND TOTAL</span>
                      <span>{formatLAK(lastOrderInfo.total)}</span>
                    </div>

                    {lastOrderInfo.paymentMethod === 'BANK_NOTE' && (
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-300 space-y-1">
                        <div className="flex justify-between text-slate-500 text-[9px]">
                          <span>{t.cash_received}</span>
                          <span>{formatLAK(lastOrderInfo.cashReceived)}</span>
                        </div>
                        <div className="flex justify-between font-black text-base text-emerald-600">
                          <span>{t.change}</span>
                          <span>{formatLAK(Math.max(0, lastOrderInfo.cashReceived - lastOrderInfo.total))}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {lastOrderInfo.customer && (
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-300 text-[8px] text-slate-500">
                    <p>Customer: {lastOrderInfo.customer.name}</p>
                    <p>Points Earned: +{Math.floor(lastOrderInfo.total / 1000)}</p>
                  </div>
                )}

                <div className="text-center mt-3 pt-2 text-[7px] text-slate-400 border-t border-dashed border-slate-200">
                  <p>Payment: {lastOrderInfo.paymentMethod === 'BANK_NOTE' ? 'Cash' : 'Transfer'}</p>
                  <p className="font-bold mt-1 uppercase text-slate-500">{sysSettings?.receiptFooter || 'Thank you for your visit!'}</p>
                </div>
              </div>
            )}


            <div className="flex flex-col gap-2 mt-6">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg font-bold" onClick={() => {
                if (lastOrderInfo?.id) window.open(`/receipt?id=${lastOrderInfo.id}`, '_blank', 'width=450,height=600')
              }}>
                <Printer className="w-5 h-5 mr-2" />
                {t.print_receipt}
              </Button>
              <Button
                variant="outline"
                className="w-full py-6 text-lg font-semibold border-amber-200 text-amber-900 bg-amber-50 hover:bg-amber-100"
                onClick={() => {
                  handleNewOrder()
                  setIsSuccessOpen(false)
                }}
              >
                {t.new_order}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Actions */}
        <div className="p-2 border-t space-y-2">
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
              {pointsRedeemed === 0 && ((selectedCustomer as any).loyaltyPoints || 0) > 0 && !isComplimentary && (
                <div className="flex gap-2">
                  <Input
                    placeholder={t.pts.toUpperCase()}
                    value={manualPoints}
                    onChange={(e) => setManualPoints(e.target.value.replace(/\D/g, ""))}
                    className="h-9"
                  />
                  <Button
                    variant="outline"
                    className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 h-9"
                    onClick={handleManualRedeem}
                    disabled={!manualPoints}
                  >
                    <Tag className="w-4 h-4 mr-2" /> {t.redeem_points}
                  </Button>
                </div>
              )}
              {pointsRedeemed > 0 && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-rose-400 hover:text-rose-700 hover:bg-rose-50"
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
            <Button variant="outline" className="w-full border-dashed" onClick={() => setIsPromoOpen(true)} disabled={isComplimentary}>
              <Tag className="w-4 h-4 mr-2" />
              {t.apply_promo}
            </Button>
          ) : (
            <Button variant="outline" className="w-full text-rose-600 border-rose-400 hover:text-rose-700 hover:bg-rose-50" onClick={() => setAppliedPromo(null)}>
              {t.remove_promo} ({appliedPromo.code})
            </Button>
          )}

          <div className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-amber-900">Complimentary Mode</span>
              <span className="text-[10px] text-amber-700/70 uppercase">Owner / Friends (No Report)</span>
            </div>
            <Switch
              checked={isComplimentary}
              onCheckedChange={(val) => {
                setIsComplimentary(val)
                if (val) {
                  setAppliedPromo(null)
                  setPointsRedeemed(0)
                  setLoyaltyDiscount(0)
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 h-12"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCancelOrderClick}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.clear}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 bg-gray-500 hover:bg-gray-500 hover:text-white text-white"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleHoldOrder}
            >
              <Pause className="w-4 h-4 mr-2" />
              {t.hold_order}
            </Button>
          </div>

        </div>

        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
          disabled={cart.length === 0 || isProcessing}
          onClick={() => {
            if (shiftStatus !== 'OPEN') {
              alert(t.please_open_shift_first)
              return
            }
            // Complimentary mode requires customer selection
            if (isComplimentary && !selectedCustomer) {
              alert('Please select a customer for complimentary orders')
              return
            }
            // Auto-set payment for complimentary mode
            if (isComplimentary) {
              setPaymentMethod('BANK_NOTE')
              setCashReceived(total.toString())
            }
            setIsPaymentOpen(true)
          }}
        >
          {t.proceed_to_payment}
        </Button>

        <Dialog open={isPaymentOpen} onOpenChange={(open) => {
          setIsPaymentOpen(open)
          if (open) setFocusedInput('beeper')
        }}>
          <DialogContent
            showCloseButton={false}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            className="max-w-4xl bg-slate-50 border-none shadow-2xl p-0 overflow-hidden"
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 md:hidden"
              onClick={() => setIsPaymentOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <div className="flex flex-col md:flex-row min-h-[500px] max-h-[85vh]">
              {/* Left Side: Order Summary & Info */}


              <div className="w-full md:w-80 p-6 bg-white border-r flex flex-col justify-between relative">

                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">{t.checkout}</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-sm text-amber-700 font-medium mb-1">{t.total_to_pay}</p>
                      <p className="text-3xl font-black text-amber-900">{formatLAK(total)}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-400 px-1">{t.payment_method}</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant={paymentMethod === 'BANK_NOTE' ? "default" : "outline"}
                          onClick={() => setPaymentMethod('BANK_NOTE')}
                          disabled={isComplimentary}
                          className={`h-12 justify-start px-4 text-lg ${paymentMethod === 'BANK_NOTE' ? 'bg-amber-600 hover:bg-amber-700 shadow-md transform scale-[1.02]' : 'hover:bg-amber-50'}`}
                        >
                          <span className="mr-3 text-xl">💵</span> {t.bank_note}
                        </Button>
                        <Button
                          variant={paymentMethod === 'QR_CODE' ? "default" : "outline"}
                          onClick={handleInitiateOnepay}
                          disabled={isComplimentary || isProcessing}
                          className={`h-12 justify-start px-4 text-lg ${isComplimentary ? 'opacity-50 cursor-not-allowed' : paymentMethod === 'QR_CODE' ? 'bg-blue-600 hover:bg-blue-700 shadow-md transform scale-[1.02]' : 'hover:bg-blue-50'}`}
                        >
                          {isProcessing && paymentMethod !== 'QR_CODE' ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <span className="mr-3 text-xl">📱</span>} {t.qr_code}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'BANK_NOTE' && (
                  <div className="space-y-3 pt-6 border-t font-medium">
                    <div className="flex justify-between text-slate-500">
                      <span>{t.cash_received}</span>
                      <span>{formatLAK(Number(cashReceived) || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-slate-800">
                        {calculateChange(total, Number(cashReceived)).totalChange >= 0 ? t.change : t.missing_amount}
                      </span>
                      <span className={`text-2xl font-black ${calculateChange(total, Number(cashReceived)).totalChange >= 0 ? 'text-green-600' : 'text-rose-500'}`}>
                        {formatLAK(Math.abs(calculateChange(total, Number(cashReceived)).totalChange))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Interactive Input */}
              <div className="flex-1 p-6 flex flex-col relative overflow-y-auto">


                {paymentMethod === 'BANK_NOTE' ? (
                  <div className="flex flex-col min-h-full space-y-6">
                    {/* Inputs Section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${focusedInput === 'beeper' ? 'border-amber-600 bg-white ring-4 ring-amber-100 shadow-lg' : 'border-slate-200 bg-slate-50'}`}
                        onClick={() => setFocusedInput('beeper')}
                      >
                        <Label className={`text-xs font-bold uppercase mb-1 block ${focusedInput === 'beeper' ? 'text-amber-600' : 'text-slate-400'}`}>
                          {t.beeper} {showBeeperError && !beeperNumber && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="text-2xl font-black text-slate-800 h-8 flex items-center">
                          {beeperNumber || <span className="text-slate-300 font-normal italic text-lg">Enter No.</span>}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${focusedInput === 'cash' ? 'border-amber-600 bg-white ring-4 ring-amber-100 shadow-lg' : 'border-slate-200 bg-slate-50'}`}
                        onClick={() => setFocusedInput('cash')}
                      >
                        <Label className={`text-xs font-bold uppercase mb-1 block ${focusedInput === 'cash' ? 'text-amber-600' : 'text-slate-400'}`}>
                          {t.cash_received}
                        </Label>
                        <div className="text-2xl font-black text-slate-800 h-8 flex items-center">
                          {cashReceived ? Number(cashReceived).toLocaleString() : <span className="text-slate-300 font-normal italic text-lg">0</span>}
                        </div>
                      </div>
                    </div>

                    {/* Primary Numpad */}
                    <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <Button
                            key={num}
                            variant="outline"
                            className="h-12 text-2xl font-black border-2 hover:bg-amber-50 hover:border-amber-400 transition-all rounded-xl shadow-sm"
                            onClick={() => {
                              if (focusedInput === 'beeper') setBeeperNumber(prev => (prev + num).slice(0, 4))
                              if (focusedInput === 'cash') setCashReceived(prev => prev + num)
                            }}
                          >
                            {num}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          className="h-12 text-base font-bold border-2 text-rose-500 hover:bg-rose-50 hover:border-rose-400 rounded-xl"
                          onClick={() => {
                            if (focusedInput === 'beeper') setBeeperNumber("")
                            if (focusedInput === 'cash') setCashReceived("")
                          }}
                        >
                          CLR
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 text-2xl font-black border-2 hover:bg-amber-50 hover:border-amber-400 rounded-xl shadow-sm"
                          onClick={() => {
                            if (focusedInput === 'beeper') setBeeperNumber(prev => (prev + '0').slice(0, 4))
                            if (focusedInput === 'cash') setCashReceived(prev => prev + '0')
                          }}
                        >
                          0
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 text-base font-bold border-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                          onClick={() => {
                            if (focusedInput === 'beeper') setBeeperNumber(prev => prev.slice(0, -1))
                            if (focusedInput === 'cash') setCashReceived(prev => prev.slice(0, -1))
                          }}
                        >
                          DEL
                        </Button>
                      </div>
                    </div>

                    {/* Bank Note Quick Actions */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.bank_note} Denominations</Label>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow rounded-xl"
                          onClick={() => setCashReceived(total.toString())}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          {t.pay_exact}
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 500, color: 'bg-slate-100 text-slate-600 border-slate-200' },
                          { val: 1000, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                          { val: 2000, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                          { val: 5000, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                          { val: 10000, color: 'bg-red-50 text-red-700 border-red-200' },
                          { val: 20000, color: 'bg-green-50 text-green-700 border-green-200' },
                          { val: 50000, color: 'bg-sky-50 text-sky-700 border-sky-200' },
                          { val: 100000, color: 'bg-amber-50 text-amber-700 border-amber-200' }
                        ].map(denom => (
                          <Button
                            key={denom.val}
                            variant="outline"
                            className={`h-10 flex flex-col items-center justify-center gap-0 border-2 font-bold rounded-xl hover:scale-[1.04] active:scale-95 transition-all text-xs ${denom.color} hover:shadow-sm`}
                            onClick={() => setCashReceived(prev => String(Number(prev || 0) + denom.val))}
                          >
                            {denom.val.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1 h-12 text-base font-bold border-2 rounded-xl" onClick={() => setIsPaymentOpen(false)}>
                        {t.cancel}
                      </Button>
                      <Button
                        className="flex-[2] h-12 text-base font-black bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 rounded-xl"
                        disabled={isProcessing || !beeperNumber || !cashReceived || Number(cashReceived) < total}
                        onClick={handleCheckout}
                      >
                        {isProcessing ? t.processing : t.complete_order}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="space-y-2 mb-6">
                        <Label className={`flex justify-between font-bold ${showBeeperError && !beeperNumber ? 'text-rose-500' : 'text-slate-600'}`}>
                          <span>{t.beeper}</span>
                          <span className="text-xs">{showBeeperError && !beeperNumber ? t.required : `(${t.required})`}</span>
                        </Label>
                        <Input
                          placeholder="e.g. 05"
                          value={beeperNumber}
                          onChange={e => {
                            setBeeperNumber(e.target.value)
                            if (showBeeperError) setShowBeeperError(false)
                          }}
                          className={`text-2xl font-black h-16 rounded-xl border-2 transition-all ${showBeeperError && !beeperNumber ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`}
                        />
                      </div>

                      <PaymentQR
                        amount={total}
                        orderNumber={orderNumber || `ORD-${Date.now().toString().slice(-6)}`}
                        orderId={resumedOrderId || undefined}
                        onComplete={handleCheckout}
                      />
                    </div>

                    <div className="pt-6 border-t flex gap-3">
                      <Button variant="outline" className="flex-1 h-14 text-lg font-bold border-2 rounded-xl" onClick={() => setIsPaymentOpen(false)}>
                        {t.cancel}
                      </Button>
                      <Button
                        className="flex-[2] h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl"
                        onClick={handleCheckout}
                        disabled={isProcessing || !beeperNumber}
                      >
                        <Check className="w-5 h-5 mr-3" />
                        {t.mark_as_paid_manual}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Promo Dialog */}

        <Dialog open={isPromoOpen} onOpenChange={setIsPromoOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{t.apply_promo}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={t.promo_code}
                value={promoCodeInput}
                onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                autoFocus
              />
              <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={applyPromoCode}>
                {t.apply_discount}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Customer Search Dialog */}
        <Dialog open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.select_customer}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={t.search_customer}
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
                  <div className="text-center text-muted-foreground p-4">{t.no_results}</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Order Confirmation */}
        <AlertDialog open={isNewOrderConfirmOpen} onOpenChange={setIsNewOrderConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.start_new_order_title}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.start_new_order_desc}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={handleNewOrder}>
                {t.discard_start_new}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        {/* Custom Hold Success Dialog */}
        <Dialog open={isHoldSuccessOpen} onOpenChange={setIsHoldSuccessOpen}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogTitle className="sr-only">Order Put on Hold</DialogTitle>
            <div className="flex flex-col items-center justify-center pt-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Pause className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-amber-900 mb-2">{t.order_put_on_hold_title}</h2>
              <p className="text-muted-foreground mb-6">
                {t.order_put_on_hold_desc}
              </p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => setIsHoldSuccessOpen(false)}>
                {t.back_to_pos}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Reason Dialog */}
        <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.cancel_redemption.replace(/\(.*\)/, '').trim() || t.cancel}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>{t.please_provide_cancel_reason}</p>
              <Input
                placeholder={t.cancel_reason_placeholder}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCancelConfirmOpen(false)}>{t.back}</Button>
                <Button variant="destructive" onClick={handleCancelOrderConfirm} disabled={!cancelReason}>
                  {t.confirm_cancel}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {productToCustomize && (
          <CustomizationDialog
            isOpen={customizationOpen}
            onClose={() => { setCustomizationOpen(false); setProductToCustomize(null); }}
            onConfirm={handleAddToCartWithCustomization}
            menuName={productToCustomize.name}
            localName={productToCustomize.localName}
            variations={productToCustomize.variations || []}
            hasSugarLevel={productToCustomize.hasSugarLevel}
            hasShotType={productToCustomize.hasShotType}
          />
        )}
      </div>
    </div >
  )
}
