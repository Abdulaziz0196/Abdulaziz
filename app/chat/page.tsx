"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getChatsByUser, getUserById, getBookById, getMessagesByChatId } from '@/lib/store'
import type { Chat, User, Book, Message } from '@/lib/types'
import { ArrowLeft, MessageSquare, User as UserIcon, Loader2 } from 'lucide-react'

interface ChatWithDetails extends Chat {
  otherUser: User | null
  book: Book | null
  lastMessage: Message | null
}

export default function ChatsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [chats, setChats] = useState<ChatWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const userChats = getChatsByUser(user.id)
      
      const chatsWithDetails: ChatWithDetails[] = userChats.map((chat) => {
        const otherUserId = chat.participants.find((p) => p !== user.id)
        const otherUser = otherUserId ? getUserById(otherUserId) : null
        const book = getBookById(chat.bookId)
        const messages = getMessagesByChatId(chat.id)
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null

        return {
          ...chat,
          otherUser: otherUser || null,
          book: book || null,
          lastMessage,
        }
      })

      // Oxirgi xabarga qarab tartiblash
      chatsWithDetails.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
        return bTime - aTime
      })

      setChats(chatsWithDetails)
      setIsLoading(false)
    }
  }, [user])

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
          <h1 className="text-2xl font-bold text-foreground">Chatlar</h1>
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Hali chatlar yo'q</p>
            <p className="text-sm text-muted-foreground">
              Kitob egasi bilan bog'lanish uchun kitob sahifasidan &quot;Yozish&quot; tugmasini bosing
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <Link key={chat.id} href={`/chat/${chat.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {chat.otherUser?.name || "Foydalanuvchi"}
                          </h3>
                          {chat.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(chat.lastMessage.createdAt).toLocaleTimeString('uz', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        {chat.book && (
                          <p className="text-sm text-primary line-clamp-1">
                            {chat.book.title}
                          </p>
                        )}

                        {chat.lastMessage && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {chat.lastMessage.senderId === user?.id ? 'Siz: ' : ''}
                            {chat.lastMessage.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
