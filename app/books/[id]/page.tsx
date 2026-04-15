"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  getBookById,
  getUserById,
  createRental,
  addRating,
  getOrCreateChat,
  getActiveRentalByBookId,
} from '@/lib/store'
import type { Book, User, Rental } from '@/lib/types'
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  Loader2,
  BookOpen,
  User as UserIcon,
} from 'lucide-react'

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [book, setBook] = useState<Book | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
  const [activeRental, setActiveRental] = useState<Rental | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isRenting, setIsRenting] = useState(false)
  const [ratingScore, setRatingScore] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)

  useEffect(() => {
    if (params.id) {
      const bookData = getBookById(params.id as string)
      if (bookData) {
        setBook(bookData)
        const ownerData = getUserById(bookData.ownerId)
        setOwner(ownerData || null)
        const rental = getActiveRentalByBookId(bookData.id)
        setActiveRental(rental || null)
      }
      setIsLoading(false)
    }
  }, [params.id])

  const isOwner = user?.id === book?.ownerId
  const isRenter = activeRental?.renterId === user?.id
  const averageRating =
    book && book.ratings.length > 0
      ? book.ratings.reduce((sum, r) => sum + r.score, 0) / book.ratings.length
      : 0

  const images = book ? [book.images.front, book.images.back].filter(Boolean) : []

  const handleRent = async () => {
    if (!user || !book) {
      router.push('/auth')
      return
    }

    setIsRenting(true)
    const rental = createRental(book.id, user.id, book.ownerId, book.rentalDays)
    
    if (rental) {
      // Kitobni yangilash
      const updatedBook = getBookById(book.id)
      if (updatedBook) {
        setBook(updatedBook)
        setActiveRental(rental)
      }
    }
    setIsRenting(false)
  }

  const handleStartChat = () => {
    if (!user || !book) {
      router.push('/auth')
      return
    }

    const chat = getOrCreateChat(user.id, book.ownerId, book.id)
    router.push(`/chat/${chat.id}`)
  }

  const handleSubmitRating = async () => {
    if (!user || !book || ratingScore === 0) return

    setIsSubmittingRating(true)
    const updatedBook = addRating(
      book.id,
      user.id,
      ratingScore as 1 | 2 | 3 | 4 | 5,
      ratingComment
    )
    
    if (updatedBook) {
      setBook(updatedBook)
      setRatingScore(0)
      setRatingComment('')
    }
    setIsSubmittingRating(false)
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-12 text-center">
          <p className="text-muted-foreground">Kitob topilmadi</p>
          <Button className="mt-4" asChild>
            <Link href="/">Bosh sahifaga qaytish</Link>
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground line-clamp-1">{book.title}</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Rasmlar */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-border">
              {images[currentImageIndex] ? (
                <img
                  src={images[currentImageIndex]}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              {!book.available && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Ijarada
                  </Badge>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 justify-center">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? 'border-primary'
                        : 'border-border'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${book.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-6">
            <div>
              <p className="text-lg text-muted-foreground">{book.author}</p>
              <div className="flex items-center gap-3 mt-2">
                {averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({book.ratings.length} ta baho)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {book.description && (
              <div>
                <h3 className="font-medium mb-2 text-foreground">Tavsif</h3>
                <p className="text-muted-foreground">{book.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>{book.rentalDays} kun</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>Toshkent</span>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-xl">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {book.pricePerDay.toLocaleString()}
                </span>
                <span className="text-muted-foreground">{`so'm/kun`}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Jami: {(book.pricePerDay * book.rentalDays).toLocaleString()} {`so'm`} ({book.rentalDays} kun)
              </p>
            </div>

            {/* Egasi */}
            {owner && (
              <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{owner.name}</p>
                  <p className="text-sm text-muted-foreground">Kitob egasi</p>
                </div>
                {!isOwner && (
                  <Button variant="outline" size="sm" onClick={handleStartChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Yozish
                  </Button>
                )}
              </div>
            )}

            {/* Harakatlar */}
            <div className="space-y-3">
              {isOwner && (
                <div className="p-4 bg-primary/10 rounded-xl">
                  <p className="text-primary font-medium">Bu sizning kitobingiz</p>
                  <Button className="mt-2" variant="outline" asChild>
                    <Link href={`/books/${book.id}/edit`}>Tahrirlash</Link>
                  </Button>
                </div>
              )}

              {isRenter && (
                <div className="p-4 bg-accent/20 rounded-xl">
                  <p className="text-accent-foreground font-medium">
                    Siz bu kitobni bron qilgansiz
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tugash sanasi: {new Date(activeRental!.endDate).toLocaleDateString('uz')}
                  </p>
                </div>
              )}

              {!isOwner && !isRenter && book.available && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRent}
                  disabled={isRenting || !user}
                >
                  {isRenting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bron qilinmoqda...
                    </>
                  ) : !user ? (
                    'Bron qilish uchun kiring'
                  ) : (
                    'Bron qilish'
                  )}
                </Button>
              )}

              {!isOwner && !book.available && !isRenter && (
                <Button className="w-full" size="lg" variant="secondary" disabled>
                  Kitob ijarada
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Baholar */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-foreground">Baholar va sharhlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Baho qo'shish */}
            {user && !isOwner && (
              <div className="p-4 bg-muted rounded-xl space-y-4">
                <p className="font-medium text-foreground">Bahoingizni qoldiring</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => setRatingScore(score)}
                      className="p-1"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          score <= ratingScore
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Sharh yozing (ixtiyoriy)"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={handleSubmitRating}
                  disabled={ratingScore === 0 || isSubmittingRating}
                >
                  {isSubmittingRating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Baho qo'yish"
                  )}
                </Button>
              </div>
            )}

            {/* Mavjud baholar */}
            {book.ratings.length > 0 ? (
              <div className="space-y-4">
                {book.ratings.map((rating, index) => {
                  const rater = getUserById(rating.userId)
                  return (
                    <div key={index} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{rater?.name || "Foydalanuvchi"}</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((score) => (
                              <Star
                                key={score}
                                className={`h-4 w-4 ${
                                  score <= rating.score
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rating.comment && (
                          <p className="text-muted-foreground mt-1">{rating.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(rating.createdAt).toLocaleDateString('uz')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Hali baho qo'yilmagan
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
