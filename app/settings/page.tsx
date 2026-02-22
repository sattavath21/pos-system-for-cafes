"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, Receipt, DollarSign, Languages, Key, AlertTriangle, Trash2, Bold } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { Header } from "@/components/header"

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
      if (sRes.ok) {
        const data = await sRes.json()
        setSettings({
          ...data,
          taxRate: data.taxRate || data.tax_rate || "",
          loyaltyRate: data.loyaltyRate || data.loyalty_rate || "",
          shopName: data.shopName || data.shop_name || "",
        })
      }
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

  const handleWipeData = async () => {
    if (!confirm("CRITICAL WARNING: This will permanently delete ALL orders, sales, and shifts. This action CANNOT be undone. Are you absolutely sure?")) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/wipe', { method: 'POST' })
      if (res.ok) {
        alert("System wiped successfully. All transactions have been cleared.")
        window.location.reload()
      } else {
        alert("Failed to wipe data.")
      }
    } catch (e) {
      alert("Error during wipe process.")
    } finally {
      setIsSaving(false)
    }
  }

  const { t } = useTranslation()

  if (isLoading) return <div className="p-10 text-center">{t.loading_setting}</div>


  return (
    <div className="min-h-screen bg-background text-slate-900">
      {/* Header */}
      <Header title="Shop Settings" />
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Language Selection */}
        <Card className="p-6 border-amber-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Languages className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Language / ພາສາ</h2>
              <p className="text-sm text-muted-foreground">{t.select_preferred_language}</p>
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
              <h2 className="text-xl font-bold">{t.shop_info}</h2>
              <p className="text-sm text-muted-foreground">Basic details about your café</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shop Name</Label>
                <Input
                  value={settings.shopName || ""}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={settings.shopPhone || ""}
                  onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Shop Address</Label>
              <Input
                value={settings.shopAddress || ""}
                onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Receipt Customization */}
        <Card className="p-6 border-amber-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Receipt Customization</h2>
              <p className="text-sm text-muted-foreground">Customize text appearing on printed bills</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Receipt Footer Message</Label>
              <Input
                placeholder="Thank you for visiting!"
                value={settings.receiptFooter || ""}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-slate-200 p-2 rounded-lg">
                  <Bold className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-bold">Bold Text for Thermal Printer</p>
                  <p className="text-xs text-muted-foreground">Makes receipt text thicker for better readability on thermal paper</p>
                </div>
              </div>
              <Switch
                checked={settings.boldReceipt === 'true'}
                onCheckedChange={(checked) => setSettings({ ...settings, boldReceipt: checked ? 'true' : 'false' })}
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
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={settings.taxRate || ""}
                onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Loyalty Rate (1pt = ? LAK)</Label>
              <Input
                type="number"
                value={settings.loyaltyRate || ""}
                onChange={(e) => setSettings({ ...settings, loyaltyRate: e.target.value })}
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
        {
          user?.role === 'ADMIN' && (
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
          )
        }

        {/* Danger Zone */}
        {user?.role === 'ADMIN' && (
          <Card className="p-6 border-red-500/30 bg-red-50/20 shadow-sm mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-500 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-700">Danger Zone</h2>
                <p className="text-sm text-red-600/60">Destructive actions - use with caution</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between p-4 border border-red-200 rounded-xl bg-white gap-4">
              <div>
                <p className="font-bold text-slate-900">Wipe All Transaction Data</p>
                <p className="text-sm text-slate-500">Delete all orders, sales history, and shifts. Keeps menu and staff.</p>
              </div>
              <Button
                variant="destructive"
                className="flex items-center gap-2 px-6"
                onClick={handleWipeData}
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4" />
                Wipe Now
              </Button>
            </div>
          </Card>
        )}
      </div >
    </div >
  )
}
