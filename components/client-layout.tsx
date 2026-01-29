"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { isCollapsed } = useSidebar()

    // Same exclusion logic as Sidebar
    const excludedPaths = ['/login', '/role-select', '/pin-login', '/receipt', '/customer-view', '/kitchen']
    const isSidebarVisible = !excludedPaths.some(path => pathname.startsWith(path))

    return (
        <div className="flex min-h-screen">
            {isSidebarVisible && <Sidebar />}
            <main className={cn(
                "flex-1 min-h-screen bg-slate-50/50 transition-all duration-300",
                isSidebarVisible && (isCollapsed ? "pl-[80px]" : "pl-[260px]")
            )}>
                {children}
            </main>
        </div>
    )
}
