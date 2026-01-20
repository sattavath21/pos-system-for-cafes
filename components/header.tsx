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
                            <span className="hidden lg:inline">{t.cafe_pos}</span>
                        </h1>
                    </Link>
                    <span className="text-slate-300">|</span>
                    <h2 className="text-lg font-semibold text-slate-700 ">{title || t.dashboard}</h2>
                    {children}

                    <nav className="hidden xl:flex items-center gap-2 ml-4 border-l pl-4">
                        <Link href="/dashboard">
                            <Button variant="outline" size="lg" className="gap-1.5 text-md"><LayoutDashboard className="w-4 h-4" /> {t.dashboard}</Button>
                        </Link>
                        <Link href="/pos">
                            <Button variant="outline" size="lg" className="gap-1.5 text-md"><ShoppingCart className="w-4 h-4" /> {t.pos}</Button>
                        </Link>
                        <Link href="/orders">
                            <Button variant="outline" size="lg" className="gap-1.5 text-md"><Receipt className="w-4 h-4" /> {t.orders}</Button>
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {status === 'OPEN' && (
                        <Link href="/shifts">

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-full border border-amber-200">
                                <Wallet className="w-4 h-4 text-amber-600" />
                                <span className="text-md font-bold text-amber-900">{formatLAK(currentCash)}</span>
                                <Badge variant="outline" className="ml-1 px-2 py-1.5 text-[14px] cursor-pointer uppercase tracking-wider">Shift</Badge>
                            </div>
                        </Link>

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
                            <p className="text-md font-bold leading-none">{user?.name}</p>
                            <p className="text-[12px] text-muted-foreground mt-1 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                        {user?.role === 'ADMIN' && (
                            <Link href="/settings">
                                <Button
                                    variant="outline"
                                    className="h-12 w-12 text-slate-600 hover:bg-slate-50"
                                >
                                    <Settings className="!w-6 !h-6" />
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" size="lg" onClick={handleLogout} className="bg-red-600 hover:bg-red-700 hover:text-white h-8 text-md h-10 text-white">
                            {t.logout}
                        </Button>
                    </div>
                </div>
            </div>
            <ShiftDialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen} />
        </header >
    )
}
