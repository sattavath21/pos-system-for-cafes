"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Eye, PowerOff, ShieldCheck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"

type Staff = {
    id: string
    name: string
    username: string
    role: string
    isActive: boolean
    createdAt: string
}

export function StaffTab() {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        role: "STAFF",
        pin: "",
        isActive: true
    })

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                setStaffList(data)
            }
        } catch (e) { console.error(e) }
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const url = selectedStaff ? `/api/users/${selectedStaff.id}` : '/api/users'
            const method = selectedStaff ? 'PUT' : 'POST'

            // Prepare payload
            const payload: any = { ...formData }
            if (selectedStaff && !payload.pin) {
                // If editing and no PIN provided, don't send it so backend ignores
                delete payload.pin
            }

            const res = await fetch(url, {
                method,
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setIsDialogOpen(false)
                setSelectedStaff(null)
                setFormData({ name: "", username: "", role: "STAFF", pin: "", isActive: true })
                fetchStaff()
            } else {
                const err = await res.json()
                alert(err.error || "Failed to save staff")
            }
        } catch (e) { console.error(e) }
        finally { setIsLoading(false) }
    }

    const filteredStaff = staffList.filter(
        (staff) =>
            staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
                    <p className="text-3xl font-bold">{staffList.length}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground mb-1">Active Staff</p>
                    <p className="text-3xl font-bold text-green-600">
                        {staffList.filter((s) => s.isActive).length}
                    </p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground mb-1">Admins</p>
                    <p className="text-3xl font-bold text-purple-600">
                        {staffList.filter((s) => s.role === 'ADMIN').length}
                    </p>
                </Card>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search staff by name or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-700 font-bold" onClick={() => {
                            setSelectedStaff(null)
                            setFormData({ name: "", username: "", role: "STAFF", pin: "", isActive: true })
                        }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedStaff ? "Edit Staff Details" : "Add New Staff"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="staffName">Full Name</Label>
                                <Input
                                    id="staffName"
                                    placeholder="Jane Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="staffUsername">Username</Label>
                                <Input
                                    id="staffUsername"
                                    placeholder="janedoe"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="staffRole">Role</Label>
                                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                    <SelectTrigger id="staffRole">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STAFF">Staff (POS Access)</SelectItem>
                                        <SelectItem value="ADMIN">Admin (Full Access)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="staffPin">PIN Password (4-digits)</Label>
                                <Input
                                    id="staffPin"
                                    type="password"
                                    placeholder={selectedStaff ? "Leave blank to keep unchanged" : "e.g. 1234"}
                                    value={formData.pin}
                                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                    maxLength={4}
                                />
                            </div>
                            <div className="space-y-2 flex items-center justify-between p-3 bg-muted rounded-lg">
                                <Label htmlFor="staffActive">Account Active</Label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-amber-600 hover:bg-amber-700 font-bold" onClick={handleSave} disabled={isLoading || (!selectedStaff && formData.pin.length < 4)}>
                                {isLoading ? "Processing..." : "Save Staff"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">All Staff Members</h2>
                <div className="space-y-3">
                    {filteredStaff.length === 0 ? <p className="text-muted-foreground">No staff members found.</p> :
                        filteredStaff.map((staff) => (
                            <div
                                key={staff.id}
                                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${!staff.isActive ? 'bg-slate-50 opacity-60' : 'hover:bg-muted/50'}`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-slate-800">{staff.name}</h3>
                                        {staff.role === 'ADMIN' ? (
                                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200"><ShieldCheck className="w-3 h-3 mr-1" /> Admin</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-600 border-slate-300">Staff</Badge>
                                        )}
                                        {!staff.isActive && (
                                            <Badge variant="destructive" className="ml-2">Inactive</Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-4 text-sm text-muted-foreground font-mono">
                                        <span>@{staff.username}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        setSelectedStaff(staff);
                                        setFormData({
                                            name: staff.name,
                                            username: staff.username,
                                            role: staff.role,
                                            pin: "",
                                            isActive: staff.isActive
                                        });
                                        setIsDialogOpen(true);
                                    }}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        ))}
                </div>
            </Card>
        </div>
    )
}
