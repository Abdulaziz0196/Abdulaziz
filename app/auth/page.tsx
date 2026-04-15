"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { BookOpen, MapPin, Phone, User, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const { user, isLoading, login, register } = useAuth()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // Login form
  const [loginPhone, setLoginPhone] = useState('')

  // Register form
  const [registerName, setRegisterName] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const requestLocation = () => {
    setLocationLoading(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationLoading(false)
        },
        () => {
          // Default Tashkent location
          setLocation({ lat: 41.3111, lng: 69.2797 })
          setLocationLoading(false)
        }
      )
    } else {
      setLocation({ lat: 41.3111, lng: 69.2797 })
      setLocationLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = login(loginPhone)
    if (!result.success) {
      setError(result.error || 'Xatolik yuz berdi')
      setIsSubmitting(false)
      return
    }

    router.push('/')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!location) {
      setError("Iltimos, joylashuvingizni ulashing")
      return
    }

    setIsSubmitting(true)

    const result = register(registerName, registerPhone, location)
    if (!result.success) {
      setError(result.error || 'Xatolik yuz berdi')
      setIsSubmitting(false)
      return
    }

    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Kitobim.uz</h1>
          <p className="text-muted-foreground mt-2 text-center">
            Yaqin atrofdagi kitoblarni ijaraga oling
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-foreground">Xush kelibsiz</CardTitle>
            <CardDescription className="text-center">
              Kitoblar dunyosiga kiring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Kirish</TabsTrigger>
                <TabsTrigger value="register">{"Ro'yxatdan o'tish"}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone" className="text-foreground">Telefon raqam</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-phone"
                        type="tel"
                        placeholder="+998901234567"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kirish...
                      </>
                    ) : (
                      'Kirish'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-foreground">Ism</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Ismingiz"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone" className="text-foreground">Telefon raqam</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="+998901234567"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Joylashuv</Label>
                    {location ? (
                      <div className="flex items-center gap-2 p-3 bg-accent/20 rounded-lg">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="text-sm text-foreground">
                          Joylashuv aniqlandi ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                        </span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={requestLocation}
                        disabled={locationLoading}
                      >
                        {locationLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Aniqlanmoqda...
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-2 h-4 w-4" />
                            Joylashuvni ulashish
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting || !location}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {"Ro'yxatdan o'tish..."}
                      </>
                    ) : (
                      "Ro'yxatdan o'tish"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Platformaga kirish orqali siz foydalanish shartlariga rozilik bildirasiz
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo ma'lumotlar */}
        <div className="mt-6 p-4 bg-card rounded-lg border border-border">
          <p className="text-sm font-medium text-foreground mb-2">Demo foydalanuvchilar:</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>+998901234567 (Aziz Karimov)</p>
            <p>+998907654321 (Malika Rahimova)</p>
            <p>+998911112233 (Jasur Toshmatov)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
