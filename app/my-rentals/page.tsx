"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getRentalsByRenter, getRentalsByOwner, cancelRental, completeRental, getBookById, getUserById } from '@/lib/store'
import type { Rental, Book, User } from '@/lib/types'
import { ArrowLeft, Calendar, X, Check, Loader2, BookOpen, User as UserIcon } from 'lucide-react'

interface RentalWithDetails extends Rental {
  book: Book | null
  otherUser: User | null
}

export default function MyRentalsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [myRentals, setMyRentals] = useState<RentalWithDetails[]>([])
  const [bookingsForMe, setBookingsForMe] = useState<RentalWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      // Mening bronlarim (men bron qilgan)
      const rentals = getRentalsByRenter(user.id)
      const rentalsWithDetails: RentalWithDetails[] = rentals.map((rental) => ({
        ...rental,
        book: getBookById(rental.bookId) || null,
        otherUser: getUserById(rental.ownerId) || null,
      }))
      setMyRentals(rentalsWithDetails)

      // Menga bron qilingan (mening kitoblarim bron qilingan)
      const ownerRentals = getRentalsByOwner(user.id)
      const ownerRentalsWithDetails: RentalWithDetails[] = ownerRentals.map((rental) => ({
        ...rental,
        book: getBookById(rental.bookId) || null,
        otherUser: getUserById(rental.renterId) || null,
      }))
      setBookingsForMe(ownerRentalsWithDetails)

      setIsLoading(false)
    }
  }, [user])

  const handleCancelRental = (rentalId: string) => {
    const success = cancelRental(rentalId)
    if (success) {
      setMyRentals(
        myRentals.map((r) =>
          r.id === rentalId ? { ...r, status: 'cancelled' as const } : r
        )
      )
    }
  }

  const handleCompleteRental = (rentalId: string) => {
    const success = completeRental(rentalId)
    if (success) {
      setBookingsForMe(
        bookingsForMe.map((r) =>
          r.id === rentalId ? { ...r, status: 'completed' as const } : r
        )
      )
    }
  }

  const getStatusBadge = (status: Rental['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-accent text-accent-foreground">Faol</Badge>
      case 'completed':
        return <Badge variant="secondary">Yakunlangan</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Bekor qilingan</Badge>
    }
  }

  const RentalCard = ({
    rental,
    isOwner,
  }: {
    rental: RentalWithDetails
    isOwner: boolean
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Link href={rental.book ? `/books/${rental.book.id}` : '#'} className="flex-shrink-0">
            <div className="w-16 h-22 rounded-lg overflow-hidden bg-muted">
              {rental.book?.images.front ? (
                <img
                  src={rental.book.images.front}
                  alt={rental.book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={rental.book ? `/books/${rental.book.id}` : '#'}>
              <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                {rental.book?.title || 'Kitob topilmadi'}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {rental.book?.author}
            </p>

            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(rental.status)}
            </div>

            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>
                {isOwner ? 'Bron qilgan: ' : 'Egasi: '}
                {rental.otherUser?.name || "Noma'lum"}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(rental.startDate).toLocaleDateString('uz')} -{' '}
                {new Date(rental.endDate).toLocaleDateString('uz')}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {rental.status === 'active' && !isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <X className="h-4 w-4 mr-1" />
                    Bekor
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Bronni bekor qilish</AlertDialogTitle>
                    <AlertDialogDescription>
                      Haqiqatan ham bu bronni bekor qilmoqchimisiz?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Yo'q</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelRental(rental.id)}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Ha, bekor qilish
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {rental.status === 'active' && isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-accent-foreground">
                    <Check className="h-4 w-4 mr-1" />
                    Yakunlash
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Ijara yakunlash</AlertDialogTitle>
                    <AlertDialogDescription>
                      Kitob qaytarildi va ijarani yakunlaysizmi?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Yo'q</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleCompleteRental(rental.id)}>
                      Ha, yakunlash
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (authLoading || isLoading) {
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
          <h1 className="text-2xl font-bold text-foreground">Bronlar</h1>
        </div>

        <Tabs defaultValue="my-rentals">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-rentals">Men bron qilgan</TabsTrigger>
            <TabsTrigger value="bookings-for-me">Menga bron qilingan</TabsTrigger>
          </TabsList>

          <TabsContent value="my-rentals">
            {myRentals.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Siz hali kitob bron qilmagansiz</p>
                <Button className="mt-4" asChild>
                  <Link href="/">Kitoblarni ko'rish</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRentals.map((rental) => (
                  <RentalCard key={rental.id} rental={rental} isOwner={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings-for-me">
            {bookingsForMe.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Hali sizning kitoblaringiz bron qilinmagan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingsForMe.map((rental) => (
                  <RentalCard key={rental.id} rental={rental} isOwner />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
