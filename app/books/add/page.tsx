"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { BookMap } from '@/components/book-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createBook } from '@/lib/store'
import { ArrowLeft, Upload, MapPin, Loader2, X } from 'lucide-react'
import Link from 'next/link'

export default function AddBookPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [rentalDays, setRentalDays] = useState<'7' | '14' | '21'>('14')
  const [pricePerDay, setPricePerDay] = useState('')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // Foydalanuvchi joylashuvini olish
    if (user?.location) {
      setLocation(user.location)
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          setLocation({ lat: 41.3111, lng: 69.2797 })
        }
      )
    }
  }, [user])

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 2MB dan katta bo'lsa xato
    if (file.size > 2 * 1024 * 1024) {
      setError("Rasm hajmi 2MB dan oshmasligi kerak")
      return
    }

    // Faqat rasm formatlari
    if (!file.type.startsWith('image/')) {
      setError("Faqat rasm fayllari yuklash mumkin")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (type === 'front') {
        setFrontImage(result)
      } else {
        setBackImage(result)
      }
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      router.push('/auth')
      return
    }

    if (!location) {
      setError("Iltimos, joylashuvni tanlang")
      return
    }

    if (!frontImage) {
      setError("Iltimos, kitobning old betini yuklang")
      return
    }

    setIsSubmitting(true)

    try {
      const book = createBook({
        ownerId: user.id,
        title,
        author,
        description,
        rentalDays: parseInt(rentalDays) as 7 | 14 | 21,
        pricePerDay: parseInt(pricePerDay),
        images: {
          front: frontImage,
          back: backImage || frontImage,
        },
        location,
        available: true,
      })

      router.push(`/books/${book.id}`)
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.")
      setIsSubmitting(false)
    }
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
          <h1 className="text-2xl font-bold text-foreground">{"Kitob qo'shish"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{"Kitob ma'lumotlari"}</CardTitle>
              <CardDescription>
                {"Kitobingiz haqida to'liq ma'lumot kiriting"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Kitob nomi</Label>
                <Input
                  id="title"
                  placeholder="Masalan: Ikki eshik orasi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-foreground">Muallif</Label>
                <Input
                  id="author"
                  placeholder="Masalan: O'tkir Hoshimov"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Tavsif</Label>
                <Textarea
                  id="description"
                  placeholder="Kitob haqida qisqacha..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentalDays" className="text-foreground">Ijara muddati</Label>
                  <Select
                    value={rentalDays}
                    onValueChange={(v) => setRentalDays(v as '7' | '14' | '21')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 kun</SelectItem>
                      <SelectItem value="14">14 kun</SelectItem>
                      <SelectItem value="21">21 kun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-foreground">{"Narx (so'm/kun)"}</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="3000"
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    required
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Rasmlar</CardTitle>
              <CardDescription>
                {"Kitobning old va orqa betini yuklang (har biri maks 2MB)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Old bet */}
                <div className="space-y-2">
                  <Label className="text-foreground">Old bet *</Label>
                  {frontImage ? (
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
                      <img
                        src={frontImage}
                        alt="Old bet"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => setFrontImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[3/4] rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Yuklash</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'front')}
                      />
                    </label>
                  )}
                </div>

                {/* Orqa bet */}
                <div className="space-y-2">
                  <Label className="text-foreground">Orqa bet</Label>
                  {backImage ? (
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
                      <img
                        src={backImage}
                        alt="Orqa bet"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => setBackImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[3/4] rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Yuklash</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'back')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Joylashuv</CardTitle>
              <CardDescription>
                {"Xaritadan kitob joylashgan joyni tanlang"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </span>
                </div>
              )}
              <div className="h-[300px] rounded-xl overflow-hidden border border-border">
                <BookMap
                  books={[]}
                  userLocation={user.location}
                  selectable
                  selectedLocation={location}
                  onMapClick={(lat, lng) => setLocation({ lat, lng })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {"Xaritaga bosib joylashuvni o'zgartiring"}
              </p>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              "Kitobni qo'shish"
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
