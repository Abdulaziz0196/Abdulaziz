"use client"

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { BookMap } from '@/components/book-map'
import { BookCard } from '@/components/book-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getBooks, getUserById, getOrCreateChat } from '@/lib/store'
import { calculateDistance, type BookWithOwner } from '@/lib/types'
import { Search, Filter, MapPin, Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [books, setBooks] = useState<BookWithOwner[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [daysFilter, setDaysFilter] = useState<string>('all')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)

  // Joylashuvni olish
  useEffect(() => {
    if (user?.location) {
      setUserLocation(user.location)
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Default Tashkent
          setUserLocation({ lat: 41.3111, lng: 69.2797 })
        }
      )
    } else {
      setUserLocation({ lat: 41.3111, lng: 69.2797 })
    }
  }, [user])

  // Kitoblarni yuklash
  useEffect(() => {
    const loadBooks = () => {
      setIsLoadingBooks(true)
      const allBooks = getBooks()
      
      const booksWithOwner: BookWithOwner[] = allBooks.map((book) => {
        const owner = getUserById(book.ownerId)
        let distance: number | undefined
        
        if (userLocation) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            book.location.lat,
            book.location.lng
          )
        }
        
        return {
          ...book,
          owner: {
            id: owner?.id || '',
            name: owner?.name || 'Noma\'lum',
          },
          distance,
        }
      })

      // 10 km radiusda filtrlash
      const nearbyBooks = userLocation
        ? booksWithOwner.filter((book) => (book.distance || 0) <= 10)
        : booksWithOwner

      // Masofaga qarab tartiblash
      nearbyBooks.sort((a, b) => (a.distance || 0) - (b.distance || 0))

      setBooks(nearbyBooks)
      setIsLoadingBooks(false)
    }

    if (userLocation) {
      loadBooks()
    }
  }, [userLocation])

  // Filtrlangan kitoblar
  const filteredBooks = useMemo(() => {
    let result = books

    // Qidiruv
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      )
    }

    // Kunlar bo'yicha filter
    if (daysFilter !== 'all') {
      result = result.filter((book) => book.rentalDays === parseInt(daysFilter))
    }

    return result
  }, [books, searchQuery, daysFilter])

  // Kitob egasi bilan chat boshlash
  const handleStartChat = (book: BookWithOwner) => {
    if (!user) {
      router.push('/auth')
      return
    }

    const chat = getOrCreateChat(user.id, book.ownerId, book.id)
    router.push(`/chat/${chat.id}`)
  }

  const handleBookClick = (bookId: string) => {
    router.push(`/books/${bookId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-6">
        {/* Xarita */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Yaqin atrofdagi kitoblar</h2>
            {userLocation && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>10 km radius</span>
              </div>
            )}
          </div>
          <div className="h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-border">
            <BookMap
              books={filteredBooks}
              userLocation={userLocation}
              onBookClick={handleBookClick}
            />
          </div>
        </div>

        {/* Qidiruv va filterlar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kitob nomi yoki muallif..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={daysFilter} onValueChange={setDaysFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kunlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="7">7 kun</SelectItem>
                <SelectItem value="14">14 kun</SelectItem>
                <SelectItem value="21">21 kun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Natijalar soni */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">
            {filteredBooks.length} ta kitob topildi
          </Badge>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground"
            >
              Tozalash
            </Button>
          )}
        </div>

        {/* Kitoblar ro'yxati */}
        {isLoadingBooks ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? "Hech narsa topilmadi. Boshqa so'z bilan qidiring."
                : "Yaqin atrofda kitob topilmadi."}
            </p>
            {user && (
              <Button className="mt-4" onClick={() => router.push('/books/add')}>
                Kitob qo'shish
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                currentUserId={user?.id}
                onChat={() => handleStartChat(book)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
