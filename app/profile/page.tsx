"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { BookMap } from '@/components/book-map'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Library,
  BookOpen,
  LogOut,
  Loader2,
  Shield,
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading, logout, updateUserLocation } = useAuth()
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [showLocationMap, setShowLocationMap] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  const handleUpdateLocation = (lat: number, lng: number) => {
    setIsUpdatingLocation(true)
    updateUserLocation({ lat, lng })
    setIsUpdatingLocation(false)
    setShowLocationMap(false)
  }

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  // Telefon raqamini maskalizatsiya qilish
  const maskPhone = (phone: string) => {
    if (phone.length < 6) return phone
    return phone.slice(0, 4) + '****' + phone.slice(-3)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Profil</h1>
        </div>

        <div className="space-y-6">
          {/* Foydalanuvchi ma'lumotlari */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">{user.name}</CardTitle>
                  <CardDescription>
                    {`A'zo bo'lgan: ${new Date(user.createdAt).toLocaleDateString('uz')}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefon raqam</p>
                  <p className="font-medium text-foreground">{maskPhone(user.phone)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Joylashuv</p>
                  <p className="font-medium text-foreground">
                    {user.location.lat.toFixed(4)}, {user.location.lng.toFixed(4)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLocationMap(!showLocationMap)}
                >
                  Yangilash
                </Button>
              </div>

              {showLocationMap && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {"Xaritaga bosib yangi joylashuvni tanlang"}
                  </p>
                  <div className="h-[250px] rounded-xl overflow-hidden border border-border">
                    <BookMap
                      books={[]}
                      userLocation={user.location}
                      selectable
                      selectedLocation={user.location}
                      onMapClick={handleUpdateLocation}
                    />
                  </div>
                  {isUpdatingLocation && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Yangilanmoqda...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maxfiylik haqida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" />
                Maxfiylik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {"Telefon raqamingiz faqat siz bilan chat boshlagan foydalanuvchilarga ko'rsatiladi. Boshqa foydalanuvchilar telefon raqamingizni ko'ra olmaydi."}
              </p>
            </CardContent>
          </Card>

          {/* Havolalar */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/my-books" className="flex flex-col items-center gap-2">
                <Library className="h-6 w-6" />
                <span>Mening kitoblarim</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/my-rentals" className="flex flex-col items-center gap-2">
                <BookOpen className="h-6 w-6" />
                <span>Mening bronlarim</span>
              </Link>
            </Button>
          </div>

          {/* Chiqish */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Chiqish
          </Button>
        </div>
      </main>
    </div>
  )
}
