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
import { getBooksByOwner, deleteBook } from '@/lib/store'
import type { Book } from '@/lib/types'
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, BookOpen } from 'lucide-react'

export default function MyBooksPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const userBooks = getBooksByOwner(user.id)
      setBooks(userBooks)
      setIsLoading(false)
    }
  }, [user])

  const handleDelete = (bookId: string) => {
    const success = deleteBook(bookId)
    if (success) {
      setBooks(books.filter((b) => b.id !== bookId))
    }
  }

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

      <main className="container px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Mening kitoblarim</h1>
          </div>
          <Button asChild>
            <Link href="/books/add">
              <Plus className="h-4 w-4 mr-2" />
              {"Qo'shish"}
            </Link>
          </Button>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{"Siz hali kitob qo'shmagansiz"}</p>
            <Button asChild>
              <Link href="/books/add">
                <Plus className="h-4 w-4 mr-2" />
                Birinchi kitobingizni qo'shing
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link href={`/books/${book.id}`} className="flex-shrink-0">
                      <div className="w-20 h-28 rounded-lg overflow-hidden bg-muted">
                        {book.images.front ? (
                          <img
                            src={book.images.front}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/books/${book.id}`}>
                        <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {book.author}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={book.available ? 'default' : 'secondary'}>
                          {book.available ? "Bo'sh" : 'Ijarada'}
                        </Badge>
                        <Badge variant="outline">{book.rentalDays} kun</Badge>
                      </div>

                      <div className="mt-2">
                        <span className="font-semibold text-foreground">
                          {book.pricePerDay.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground"> {`so'm/kun`}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/books/${book.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">{"Kitobni o'chirish"}</AlertDialogTitle>
                            <AlertDialogDescription>
                              Haqiqatan ham &quot;{book.title}&quot; kitobini o'chirmoqchimisiz?
                              Bu amalni ortga qaytarib bo'lmaydi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(book.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {"O'chirish"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
