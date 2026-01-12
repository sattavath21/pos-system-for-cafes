"use client"

import { useState, useEffect } from "react"
import { translations } from "@/lib/translations"

export function useTranslation() {
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

        // Listen for changes (e.g. from settings page)
        const interval = setInterval(fetchLang, 5000)
        return () => clearInterval(interval)
    }, [])

    const t = translations[lang]

    return { t, lang }
}
