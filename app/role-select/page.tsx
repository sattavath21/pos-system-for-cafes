"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coffee, DollarSign, Settings } from "lucide-react"

import Link from "next/link"

export default function RoleSelectPage() {
  const roles = [
    {
      title: "Admin",
      description: "Full access to all features",
      icon: Settings,
      color: "bg-purple-500 hover:bg-purple-600",
      href: "/dashboard",
    },
    {
      title: "Cashier",
      description: "Take orders and process payments",
      icon: DollarSign,
      color: "bg-blue-500 hover:bg-blue-600",
      href: "/pos",
    },
    {
      title: "Barista",
      description: "View and prepare orders",
      icon: Coffee,
      color: "bg-amber-500 hover:bg-amber-600",
      href: "/kitchen",
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Select Your Role</h1>
          <p className="text-muted-foreground">Choose how you want to access the system</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Link key={role.title} href={role.href}>
                <Card className="p-6 hover:shadow-xl transition-shadow cursor-pointer h-full">
                  <div className="flex flex-col items-center text-center space-y-4 h-full justify-between">
                    <div className="flex flex-col items-center space-y-4">
                      <div className={`${role.color} w-16 h-16 rounded-full flex items-center justify-center text-white`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{role.title}</h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                    <Button className={`w-full ${role.color} text-white`}>Continue as {role.title}</Button>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
