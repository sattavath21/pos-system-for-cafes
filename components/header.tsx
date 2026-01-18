"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, ShoppingCart, List, Package, Tag, Settings, Wallet, Store, Users, Receipt, DollarSign } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/hooks/use-translation"
import { formatLAK } from "@/lib/currency"

import { ShiftDialog } from "@/components/shift-dialog"
import { useShift } from "@/components/shift-provider"

export function Header({ title, children }: { title?: string, children?: React.ReactNode }) {
    const { t } = useTranslation()
    const [user, setUser] = useState<any>(null)
    const { status, activeShiftId, startCash, cashPayments } = useShift()
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setUser(data.user))
            .catch(() => { })
    }, [])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/role-select'
    }

    const currentCash = (startCash || 0) + (cashPayments || 0)

    return (
        <header className="border-b bg-white sticky top-0 z-50">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                            <Store className="w-6 h-6" />
                            <span className="hidden lg:inline">Cafe POS</span>
                        </h1>
                    </Link>
                    <span className="text-slate-300">|</span>
                    <h2 className="text-lg font-semibold text-slate-700">{title || t.dashboard}</h2>
                    {children}

                    <nav className="hidden xl:flex items-center gap-1 ml-4 border-l pl-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-1.5"><LayoutDashboard className="w-4 h-4" /> {t.dashboard}</Button>
                        </Link>
                        <Link href="/pos">
                            <Button variant="ghost" size="sm" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> {t.pos}</Button>
                        </Link>
                        <Link href="/orders">
                            <Button variant="ghost" size="sm" className="gap-1.5"><Receipt className="w-4 h-4" /> {t.orders}</Button>
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {status === 'OPEN' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                            <Wallet className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-bold text-amber-900">{formatLAK(currentCash)}</span>
                            <Link href="/shifts">
                                <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px] cursor-pointer hover:bg-amber-100 uppercase tracking-wider">Shift / Close</Badge>
                            </Link>
                        </div>
                    )}

                    {status === 'CLOSED' && (
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 animate-pulse font-bold"
                            onClick={() => setIsShiftDialogOpen(true)}
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Open Shift
                        </Button>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold leading-none">{user?.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                        {user?.role === 'ADMIN' && (
                            <Link href="/settings">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-50">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8">
                            {t.logout}
                        </Button>
                    </div>
                </div>
            </div>
            <ShiftDialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen} />
        </header >
    )
}
