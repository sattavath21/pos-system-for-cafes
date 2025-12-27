"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Store, Receipt, DollarSign, Bell } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [shopName, setShopName] = useState("Café Delight")
  const [taxRate, setTaxRate] = useState("8")
  const [serviceCharge, setServiceCharge] = useState("10")
  const [currency, setCurrency] = useState("USD")
  const [receiptFooter, setReceiptFooter] = useState("Thank you for your visit!")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Settings</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Shop Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-3 rounded-lg">
              <Store className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Shop Information</h2>
              <p className="text-sm text-muted-foreground">Basic details about your café</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="shopName">Shop Name</Label>
              <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Coffee Street" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1 555-0100" />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contact@cafe.com" />
            </div>

            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input id="taxId" placeholder="123-456-789" />
            </div>
          </div>
        </Card>

        {/* Tax & Service Charge */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tax & Service Charge</h2>
              <p className="text-sm text-muted-foreground">Configure pricing and charges</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="serviceCharge">Service Charge (%)</Label>
                <Input
                  id="serviceCharge"
                  type="number"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Receipt Customization */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Receipt Customization</h2>
              <p className="text-sm text-muted-foreground">Customize receipt appearance and content</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="receiptHeader">Receipt Header Text</Label>
              <Input id="receiptHeader" placeholder="Welcome to..." />
            </div>

            <div>
              <Label htmlFor="receiptFooter">Receipt Footer Text</Label>
              <Textarea
                id="receiptFooter"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you message..."
              />
            </div>

            <div>
              <Label htmlFor="receiptLogo">Receipt Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload logo</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Manage notification preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when inventory is running low</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">New Order Notifications</p>
                <p className="text-sm text-muted-foreground">Real-time alerts for new orders</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Daily Sales Summary</p>
                <p className="text-sm text-muted-foreground">Receive daily sales reports via email</p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" size="lg">
            Cancel
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700" size="lg">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
