"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface LanguageContextType {
    lang: "en" | "lo"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<"en" | "lo">("en")

    useEffect(() => {
        const fetchLang = async () => {
            try {
                const res = await fetch("/api/settings")
                if (res.ok) {
                    const settings = await res.json()
                    if (settings.language === "lo") setLang("lo")
                    else setLang("en")
                }
            } catch (e) { }
        }

        fetchLang()

        // Poll every 30 seconds to keep in sync if changed on another tab/device
        const interval = setInterval(fetchLang, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <LanguageContext.Provider value={{ lang }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
