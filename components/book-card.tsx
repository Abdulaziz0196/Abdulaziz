"use client"

import Link from 'next/link'
import Image from 'next/image'
import type { BookWithOwner } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Star, MessageSquare, BookOpen } from 'lucide-react'

interface BookCardProps {
  book: BookWithOwner
  currentUserId?: string
  onChat?: () => void
}

export function BookCard({ book, currentUserId, onChat }: BookCardProps) {
  const isOwner = currentUserId === book.ownerId
  const averageRating =
    book.ratings.length > 0
      ? book.ratings.reduce((sum, r) => sum + r.score, 0) / book.ratings.length
      : 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-border">
      <Link href={`/books/${book.id}`}>
        <div className="relative aspect-[4/3] bg-muted">
          {book.images.front ? (
            <Image
              src={book.images.front}
              alt={book.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {!book.available && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">
                Ijarada
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/books/${book.id}`}>
          <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
          {book.author}
        </p>

        <div className="flex items-center gap-3 mt-3">
          {book.distance !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{book.distance.toFixed(1)} km</span>
            </div>
          )}
          {averageRating > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{averageRating.toFixed(1)}</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {book.rentalDays} kun
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-lg font-bold text-foreground">
              {book.pricePerDay.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground"> {`so'm/kun`}</span>
          </div>

          {!isOwner && book.available && (
            <div className="flex gap-2">
              {onChat && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    onChat()
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href={`/books/${book.id}`}>Bron qilish</Link>
              </Button>
            </div>
          )}

          {isOwner && (
            <Badge variant="secondary">Sizning kitobingiz</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
