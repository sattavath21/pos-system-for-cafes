"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coffee, Delete } from "lucide-react"
import { Suspense } from "react"
import { useTranslation } from "@/hooks/use-translation"

function PinLoginContent() {
    const [pin, setPin] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const role = searchParams.get('role') // Get role from URL
    const { t } = useTranslation()

    const handleNumberClick = (num: string) => {
        if (pin.length < 4 && !isNavigating) {
            const newPin = pin + num
            setPin(newPin)
            setError("")
            if (newPin.length === 4 && !isNavigating) {
                // Use a small timeout to allow UI to update before submitting
                setTimeout(() => {
                    if (!isNavigating) {
                        document.getElementById('pin-submit-btn')?.click()
                    }
                }, 100)
            }
        }
    }

    const handleDelete = () => {
        setPin(pin.slice(0, -1))
        setError("")
    }

    const handleSubmit = async () => {
        if (pin.length < 4) {
            setError("PIN must be at least 4 digits")
            return
        }

        if (!role) {
            setError("Please select a role first")
            return
        }

        setIsLoading(true)
        setIsNavigating(true)
        setError("")

        try {
            const res = await fetch('/api/auth/pin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, role })
            })

            const data = await res.json()

            if (res.ok) {
                // Verify the user's role matches the selected role
                if (data.user.role !== role) {
                    setError(`Invalid PIN for ${role} role`)
                    setPin("")
                    setIsNavigating(false)
                    return
                }

                // Store user data
                localStorage.setItem('user', JSON.stringify(data.user))

                // Redirect based on role - keep isNavigating true until navigation completes
                if (role === 'ADMIN') {
                    router.push('/dashboard')
                } else if (role === 'CASHIER') {
                    router.push('/pos')
                } else if (role === 'KITCHEN') {
                    router.push('/kitchen')
                }
                // Don't reset isNavigating here - let it stay true during navigation
            } else {
                setError(data.error || 'Invalid PIN')
                setPin("")
                setIsNavigating(false)
            }
        } catch (err) {
            setError('Login failed. Please try again.')
            setPin("")
            setIsNavigating(false)
        } finally {
            setIsLoading(false)
        }
    }

    const numbers = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9']
    ]

    const getRoleTitle = () => {
        switch (role) {
            case 'ADMIN': return 'Admin'
            case 'CASHIER': return 'Cashier'
            case 'KITCHEN': return 'Barista'
            default: return 'Staff'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-full mb-4">
                        <Coffee className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-amber-900 mb-2">Cafe POS</h1>
                    <p className="text-muted-foreground">{t.enter_pin_for} {getRoleTitle()}</p>
                </div>

                {/* PIN Display */}
                <div className="mb-8">
                    <div className="flex justify-center gap-3 mb-2">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${i < pin.length
                                    ? 'bg-amber-600 border-amber-600 text-white'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                {i < pin.length ? '•' : ''}
                            </div>
                        ))}
                    </div>
                    {error && (
                        <p className="text-center text-red-600 text-sm mt-2">{error}</p>
                    )}
                </div>

                {/* Number Pad */}
                <div className="space-y-3 mb-4">
                    {numbers.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-3 gap-3">
                            {row.map((num) => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    className="h-16 text-2xl font-semibold hover:bg-amber-100"
                                    onClick={() => handleNumberClick(num)}
                                    disabled={isLoading}
                                >
                                    {num}
                                </Button>
                            ))}
                        </div>
                    ))}
                    {/* Bottom row with 0 in the middle */}
                    <div className="grid grid-cols-3 gap-3">
                        <div></div>
                        <Button
                            variant="outline"
                            className="h-16 text-2xl font-semibold hover:bg-amber-100"
                            onClick={() => handleNumberClick('0')}
                            disabled={isLoading}
                        >
                            0
                        </Button>
                        <div></div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className="h-12"
                        onClick={handleDelete}
                        disabled={isLoading || pin.length === 0}
                    >
                        <Delete className="w-5 h-5 mr-2" />
                        {t.delete}
                    </Button>
                    <Button
                        id="pin-submit-btn"
                        className="h-12 bg-amber-600 hover:bg-amber-700"
                        onClick={handleSubmit}
                        disabled={isLoading || pin.length < 4}
                    >
                        {isLoading ? t.logging_in : t.enter_login}
                    </Button>
                </div>

                <div className="mt-4 text-center">
                    <Button
                        variant="link"
                        className="text-sm text-muted-foreground"
                        onClick={() => router.push('/role-select')}
                    >
                        {t.back_to_role_selection}
                    </Button>
                </div>
            </Card>
        </div>
    )
}

export default function PinLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PinLoginContent />
        </Suspense>
    )
}
