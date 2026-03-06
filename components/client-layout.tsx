"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"

export function ClientLayout({ children, isMonitor }: { children: React.ReactNode; isMonitor?: boolean }) {
    const pathname = usePathname()
    const { isCollapsed } = useSidebar()

    // Same exclusion logic as Sidebar
    const excludedPaths = ['/login', '/role-select', '/pin-login', '/receipt', '/customer-view', '/kitchen']
    const isSidebarVisible = !isMonitor && !excludedPaths.some(path => pathname.startsWith(path))

    return (
        <div className={cn("flex min-h-screen", isMonitor && "no-sidebar-context")}>
            {isSidebarVisible && <Sidebar />}
            <main className={cn(
                "flex-1 min-h-screen transition-all duration-300",
                !isMonitor && "bg-slate-50/50",
                isSidebarVisible ? (isCollapsed ? "pl-[80px]" : "pl-[260px]") : "pl-0"
            )}>
                {children}
            </main>
        </div>
    )
}
