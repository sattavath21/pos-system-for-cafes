"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Search, UserCheck, UserX } from "lucide-react"
import Link from "next/link"

type Staff = {
  id: string
  name: string
  email: string
  role: "admin" | "cashier" | "barista"
  isActive: boolean
  joinedDate: string
}

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const [staff, setStaff] = useState<Staff[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@cafe.com",
      role: "admin",
      isActive: true,
      joinedDate: "2024-01-15",
    },
    {
      id: "2",
      name: "John Cashier",
      email: "john@cafe.com",
      role: "cashier",
      isActive: true,
      joinedDate: "2024-03-20",
    },
    {
      id: "3",
      name: "Sarah Barista",
      email: "sarah@cafe.com",
      role: "barista",
      isActive: true,
      joinedDate: "2024-02-10",
    },
    {
      id: "4",
      name: "Mike Cashier",
      email: "mike@cafe.com",
      role: "cashier",
      isActive: true,
      joinedDate: "2024-04-05",
    },
    {
      id: "5",
      name: "Emily Barista",
      email: "emily@cafe.com",
      role: "barista",
      isActive: false,
      joinedDate: "2023-11-12",
    },
  ])

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeStaff = staff.filter((s) => s.isActive).length

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-600 hover:bg-purple-700">Admin</Badge>
      case "cashier":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Cashier</Badge>
      case "barista":
        return <Badge className="bg-amber-600 hover:bg-amber-700">Barista</Badge>
    }
  }

  const handleEdit = (member: Staff) => {
    setEditingStaff(member)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingStaff(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-amber-900">Staff Management</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
            <p className="text-3xl font-bold">{staff.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">{activeStaff}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Admins</p>
            <p className="text-3xl font-bold text-purple-600">{staff.filter((s) => s.role === "admin").length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Cashiers</p>
            <p className="text-3xl font-bold text-blue-600">{staff.filter((s) => s.role === "cashier").length}</p>
          </Card>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search staff by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="staffName">Full Name</Label>
                  <Input id="staffName" placeholder="John Doe" defaultValue={editingStaff?.name} />
                </div>
                <div>
                  <Label htmlFor="staffEmail">Email</Label>
                  <Input id="staffEmail" type="email" placeholder="john@cafe.com" defaultValue={editingStaff?.email} />
                </div>
                <div>
                  <Label htmlFor="staffRole">Role</Label>
                  <select
                    id="staffRole"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    defaultValue={editingStaff?.role || "cashier"}
                  >
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                    <option value="barista">Barista</option>
                  </select>
                </div>
                {!editingStaff && (
                  <div>
                    <Label htmlFor="staffPassword">Password</Label>
                    <Input id="staffPassword" type="password" placeholder="Create a password" />
                  </div>
                )}
                <div>
                  <Label htmlFor="staffStatus">Status</Label>
                  <select
                    id="staffStatus"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    defaultValue={editingStaff?.isActive ? "active" : "inactive"}
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
                  {editingStaff ? "Update Staff" : "Add Staff"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Staff List */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">All Staff Members</h2>
          <div className="space-y-3">
            {filteredStaff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-full ${member.isActive ? "bg-green-100" : "bg-gray-100"} flex items-center justify-center`}
                  >
                    {member.isActive ? (
                      <UserCheck className="w-6 h-6 text-green-600" />
                    ) : (
                      <UserX className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{member.name}</h3>
                      {getRoleBadge(member.role)}
                      {!member.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-semibold text-sm">{member.joinedDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(member)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 bg-transparent">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
