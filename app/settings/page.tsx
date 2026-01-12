"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, Receipt, DollarSign, Languages, Key } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [adminPin, setAdminPin] = useState("")
  const [cashierPin, setCashierPin] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/settings')
      ])
      if (uRes.ok) setUser((await uRes.json()).user)
      if (sRes.ok) setSettings(await sRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) alert("Settings saved successfully")
    } catch (e) {
      alert("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePin = async (role: string, pin: string) => {
    if (pin.length < 4) return alert("PIN must be at least 4 digits")
    try {
      const res = await fetch('/api/auth/update-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, newPin: pin })
      })
      if (res.ok) {
        alert(`${role} PIN updated successfully`)
        if (role === 'ADMIN') setAdminPin("")
        else setCashierPin("")
      } else {
        alert("Failed to update PIN")
      }
    } catch (e) {
      alert("Error updating PIN")
    }
  }

  if (isLoading) return <div className="p-10 text-center">Loading Settings...</div>

  return (
    <div className="min-h-screen bg-background text-slate-900">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Settings</h1>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Language Selection */}
        <Card className="p-6 border-amber-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Languages className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Language / ພາສາ</h2>
              <p className="text-sm text-muted-foreground">Select your preferred language</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              variant={settings.language === 'en' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, language: 'en' })}
              className={settings.language === 'en' ? 'bg-amber-600' : ''}
            >
              English
            </Button>
            <Button
              variant={settings.language === 'lo' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, language: 'lo' })}
              className={settings.language === 'lo' ? 'bg-amber-600' : ''}
            >
              ພາສາລາວ
            </Button>
          </div>
        </Card>

        {/* Shop Information */}
        <Card className="p-6 border-amber-100 shadow-sm">
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
              <Label>Shop Name</Label>
              <Input
                value={settings.shop_name || ""}
                onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Tax & Pricing */}
        <Card className="p-6 border-amber-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tax & Pricing</h2>
              <p className="text-sm text-muted-foreground">Configure global tax and loyalty rates</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={settings.tax_rate || ""}
                onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
              />
            </div>
            <div>
              <Label>Loyalty Rate (1pt = ? LAK)</Label>
              <Input
                type="number"
                value={settings.loyalty_rate || ""}
                onChange={(e) => setSettings({ ...settings, loyalty_rate: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Save Global Settings */}
        <div className="flex justify-end">
          <Button
            className="bg-amber-600 hover:bg-amber-700 h-12 px-8 text-lg"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Global Settings"}
          </Button>
        </div>

        {/* Admin PIN Management */}
        {user?.role === 'ADMIN' && (
          <Card className="p-6 border-red-100 bg-red-50/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 p-3 rounded-lg">
                <Key className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Security & PINs</h2>
                <p className="text-sm text-red-600/80">Manage access codes for staff</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-xl bg-white">
                <div className="space-y-2">
                  <Label className="text-amber-900 font-bold">Update Admin PIN</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="New 4+ digit PIN"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                    />
                    <Button onClick={() => handleUpdatePin('ADMIN', adminPin)}>Update</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-900 font-bold">Update Cashier PIN</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="New 4+ digit PIN"
                      value={cashierPin}
                      onChange={(e) => setCashierPin(e.target.value)}
                    />
                    <Button onClick={() => handleUpdatePin('CASHIER', cashierPin)}>Update</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
