"use client"

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  getChatById,
  getUserById,
  getBookById,
  getMessagesByChatId,
  createMessage,
} from '@/lib/store'
import type { Chat, User, Book, Message } from '@/lib/types'
import { ArrowLeft, Send, User as UserIcon, Phone, BookOpen, Loader2 } from 'lucide-react'

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [chat, setChat] = useState<Chat | null>(null)
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (params.id && user) {
      const chatData = getChatById(params.id as string)
      
      if (!chatData) {
        router.push('/chat')
        return
      }

      // Foydalanuvchi bu chatning ishtirokchisi ekanligini tekshirish
      if (!chatData.participants.includes(user.id)) {
        router.push('/chat')
        return
      }

      setChat(chatData)

      const otherUserId = chatData.participants.find((p) => p !== user.id)
      if (otherUserId) {
        const userData = getUserById(otherUserId)
        setOtherUser(userData || null)
      }

      const bookData = getBookById(chatData.bookId)
      setBook(bookData || null)

      const chatMessages = getMessagesByChatId(chatData.id)
      setMessages(chatMessages)

      setIsLoading(false)
    }
  }, [params.id, user, authLoading, router])

  // Xabarlarni har 2 sekundda yangilash
  useEffect(() => {
    if (!chat) return

    const interval = setInterval(() => {
      const chatMessages = getMessagesByChatId(chat.id)
      setMessages(chatMessages)
    }, 2000)

    return () => clearInterval(interval)
  }, [chat])

  // Yangi xabar kelganda pastga scroll qilish
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !chat || !user) return

    setIsSending(true)

    const message = createMessage(chat.id, user.id, newMessage.trim())
    setMessages((prev) => [...prev, message])
    setNewMessage('')
    setIsSending(false)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!chat) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Chat header */}
      <div className="border-b border-border bg-card">
        <div className="container px-4 py-3 max-w-2xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/chat">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground line-clamp-1">
                {otherUser?.name || "Foydalanuvchi"}
              </h2>
              {book && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {book.title}
                </p>
              )}
            </div>

            {otherUser && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <Phone className="h-4 w-4" />
                <span>{otherUser.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kitob info */}
      {book && (
        <div className="border-b border-border bg-muted/50">
          <div className="container px-4 py-2 max-w-2xl">
            <Link href={`/books/${book.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                {book.images.front ? (
                  <img
                    src={book.images.front}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground line-clamp-1">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-foreground">
                  {book.pricePerDay.toLocaleString()} {`so'm`}
                </p>
                <p className="text-xs text-muted-foreground">{book.rentalDays} kun</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Xabarlar */}
      <div className="flex-1 overflow-y-auto">
        <div className="container px-4 py-4 max-w-2xl">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{"Hali xabarlar yo'q"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Birinchi xabarni yuboring!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card
                      className={`max-w-[80%] px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card'
                      }`}
                    >
                      <p className={isOwnMessage ? 'text-primary-foreground' : 'text-foreground'}>{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('uz', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </Card>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Xabar yuborish formasi */}
      <div className="border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="container px-4 py-3 max-w-2xl">
          <div className="flex gap-2">
            <Input
              placeholder="Xabar yozing..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" disabled={!newMessage.trim() || isSending}>
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
