// Kitobim.uz - Ma'lumotlar bazasi (localStorage asosida)
// Bu fayl barcha CRUD operatsiyalarini boshqaradi

import type { User, Book, Chat, Message, Rental, Session } from './types'

const STORAGE_KEYS = {
  USERS: 'kitobimuz_users',
  BOOKS: 'kitobimuz_books',
  CHATS: 'kitobimuz_chats',
  MESSAGES: 'kitobimuz_messages',
  RENTALS: 'kitobimuz_rentals',
  SESSION: 'kitobimuz_session',
}

// LocalStorage bilan ishlash
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

// ===== USERS =====
export function getUsers(): User[] {
  return getFromStorage<User>(STORAGE_KEYS.USERS)
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id)
}

export function getUserByPhone(phone: string): User | undefined {
  return getUsers().find((u) => u.phone === phone)
}

export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers()
  const newUser: User = {
    ...user,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  saveToStorage(STORAGE_KEYS.USERS, users)
  return newUser
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) return null
  users[index] = { ...users[index], ...updates }
  saveToStorage(STORAGE_KEYS.USERS, users)
  return users[index]
}

// ===== BOOKS =====
export function getBooks(): Book[] {
  return getFromStorage<Book>(STORAGE_KEYS.BOOKS)
}

export function getBookById(id: string): Book | undefined {
  return getBooks().find((b) => b.id === id)
}

export function getBooksByOwner(ownerId: string): Book[] {
  return getBooks().filter((b) => b.ownerId === ownerId)
}

export function createBook(book: Omit<Book, 'id' | 'ratings' | 'createdAt'>): Book {
  const books = getBooks()
  const newBook: Book = {
    ...book,
    id: crypto.randomUUID(),
    ratings: [],
    createdAt: new Date().toISOString(),
  }
  books.push(newBook)
  saveToStorage(STORAGE_KEYS.BOOKS, books)
  return newBook
}

export function updateBook(id: string, updates: Partial<Book>): Book | null {
  const books = getBooks()
  const index = books.findIndex((b) => b.id === id)
  if (index === -1) return null
  books[index] = { ...books[index], ...updates }
  saveToStorage(STORAGE_KEYS.BOOKS, books)
  return books[index]
}

export function deleteBook(id: string): boolean {
  const books = getBooks()
  const filtered = books.filter((b) => b.id !== id)
  if (filtered.length === books.length) return false
  saveToStorage(STORAGE_KEYS.BOOKS, filtered)
  return true
}

export function addRating(
  bookId: string,
  userId: string,
  score: 1 | 2 | 3 | 4 | 5,
  comment: string
): Book | null {
  const books = getBooks()
  const index = books.findIndex((b) => b.id === bookId)
  if (index === -1) return null
  
  // Agar foydalanuvchi allaqachon baho bergan bo'lsa, yangilash
  const existingRatingIndex = books[index].ratings.findIndex((r) => r.userId === userId)
  if (existingRatingIndex !== -1) {
    books[index].ratings[existingRatingIndex] = {
      userId,
      score,
      comment,
      createdAt: new Date().toISOString(),
    }
  } else {
    books[index].ratings.push({
      userId,
      score,
      comment,
      createdAt: new Date().toISOString(),
    })
  }
  
  saveToStorage(STORAGE_KEYS.BOOKS, books)
  return books[index]
}

// ===== CHATS =====
export function getChats(): Chat[] {
  return getFromStorage<Chat>(STORAGE_KEYS.CHATS)
}

export function getChatById(id: string): Chat | undefined {
  return getChats().find((c) => c.id === id)
}

export function getChatsByUser(userId: string): Chat[] {
  return getChats().filter((c) => c.participants.includes(userId))
}

export function getOrCreateChat(user1Id: string, user2Id: string, bookId: string): Chat {
  // Chat ID'sini yaratish (kichik_katta format)
  const sortedIds = [user1Id, user2Id].sort()
  const chatId = `${sortedIds[0]}_${sortedIds[1]}`
  
  const chats = getChats()
  const existingChat = chats.find((c) => c.id === chatId)
  
  if (existingChat) {
    return existingChat
  }
  
  const newChat: Chat = {
    id: chatId,
    participants: [sortedIds[0], sortedIds[1]],
    bookId,
    createdAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
  }
  chats.push(newChat)
  saveToStorage(STORAGE_KEYS.CHATS, chats)
  return newChat
}

export function updateChatLastMessage(chatId: string): void {
  const chats = getChats()
  const index = chats.findIndex((c) => c.id === chatId)
  if (index !== -1) {
    chats[index].lastMessageAt = new Date().toISOString()
    saveToStorage(STORAGE_KEYS.CHATS, chats)
  }
}

// ===== MESSAGES =====
export function getMessages(): Message[] {
  return getFromStorage<Message>(STORAGE_KEYS.MESSAGES)
}

export function getMessagesByChatId(chatId: string): Message[] {
  return getMessages()
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function createMessage(chatId: string, senderId: string, text: string): Message {
  const messages = getMessages()
  const newMessage: Message = {
    id: crypto.randomUUID(),
    chatId,
    senderId,
    text,
    createdAt: new Date().toISOString(),
  }
  messages.push(newMessage)
  saveToStorage(STORAGE_KEYS.MESSAGES, messages)
  updateChatLastMessage(chatId)
  return newMessage
}

// ===== RENTALS =====
export function getRentals(): Rental[] {
  return getFromStorage<Rental>(STORAGE_KEYS.RENTALS)
}

export function getRentalsByRenter(renterId: string): Rental[] {
  return getRentals().filter((r) => r.renterId === renterId)
}

export function getRentalsByOwner(ownerId: string): Rental[] {
  return getRentals().filter((r) => r.ownerId === ownerId)
}

export function getActiveRentalByBookId(bookId: string): Rental | undefined {
  return getRentals().find((r) => r.bookId === bookId && r.status === 'active')
}

export function createRental(
  bookId: string,
  renterId: string,
  ownerId: string,
  days: number
): Rental | null {
  const book = getBookById(bookId)
  if (!book || !book.available) return null
  
  const rentals = getRentals()
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)
  
  const newRental: Rental = {
    id: crypto.randomUUID(),
    bookId,
    renterId,
    ownerId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  rentals.push(newRental)
  saveToStorage(STORAGE_KEYS.RENTALS, rentals)
  
  // Kitobni ijarada deb belgilash
  updateBook(bookId, { available: false })
  
  return newRental
}

export function cancelRental(rentalId: string): boolean {
  const rentals = getRentals()
  const index = rentals.findIndex((r) => r.id === rentalId)
  if (index === -1) return false
  
  const rental = rentals[index]
  rentals[index].status = 'cancelled'
  saveToStorage(STORAGE_KEYS.RENTALS, rentals)
  
  // Kitobni qayta mavjud qilish
  updateBook(rental.bookId, { available: true })
  
  return true
}

export function completeRental(rentalId: string): boolean {
  const rentals = getRentals()
  const index = rentals.findIndex((r) => r.id === rentalId)
  if (index === -1) return false
  
  const rental = rentals[index]
  rentals[index].status = 'completed'
  saveToStorage(STORAGE_KEYS.RENTALS, rentals)
  
  // Kitobni qayta mavjud qilish
  updateBook(rental.bookId, { available: true })
  
  return true
}

// ===== SESSION =====
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(STORAGE_KEYS.SESSION)
  if (!data) return null
  const session: Session = JSON.parse(data)
  
  // Session muddati tugaganmi tekshirish
  if (new Date(session.expiresAt) < new Date()) {
    clearSession()
    return null
  }
  
  return session
}

export function setSession(userId: string): Session {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 kunlik session
  
  const session: Session = {
    userId,
    expiresAt: expiresAt.toISOString(),
  }
  
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
  return session
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.SESSION)
}

// ===== DEMO DATA =====
export function initDemoData(): void {
  if (typeof window === 'undefined') return
  
  // Agar ma'lumotlar mavjud bo'lsa, demo yaratmaslik
  if (getUsers().length > 0) return
  
  // Demo foydalanuvchilar
  const demoUsers: User[] = [
    {
      id: 'user-1',
      name: 'Aziz Karimov',
      phone: '+998901234567',
      location: { lat: 41.3111, lng: 69.2797 },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-2',
      name: 'Malika Rahimova',
      phone: '+998907654321',
      location: { lat: 41.3150, lng: 69.2850 },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-3',
      name: 'Jasur Toshmatov',
      phone: '+998911112233',
      location: { lat: 41.3050, lng: 69.2700 },
      createdAt: new Date().toISOString(),
    },
  ]
  
  saveToStorage(STORAGE_KEYS.USERS, demoUsers)
  
  // Demo kitoblar
  const demoBooks: Book[] = [
    {
      id: 'book-1',
      ownerId: 'user-2',
      title: 'Ikki eshik orasi',
      author: "O'tkir Hoshimov",
      description: "O'zbek adabiyotining nodir asari. Hayot haqiqatlarini aks ettiruvchi roman.",
      rentalDays: 14,
      pricePerDay: 3000,
      images: {
        front: '/placeholder-book.jpg',
        back: '/placeholder-book.jpg',
      },
      location: { lat: 41.3150, lng: 69.2850 },
      available: true,
      ratings: [
        { userId: 'user-1', score: 5, comment: "Ajoyib kitob!", createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book-2',
      ownerId: 'user-3',
      title: "O'tkan kunlar",
      author: 'Abdulla Qodiriy',
      description: "O'zbek romanchiligining asoschisi tomonidan yozilgan tarixiy roman.",
      rentalDays: 21,
      pricePerDay: 2500,
      images: {
        front: '/placeholder-book.jpg',
        back: '/placeholder-book.jpg',
      },
      location: { lat: 41.3050, lng: 69.2700 },
      available: true,
      ratings: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book-3',
      ownerId: 'user-2',
      title: 'Sariq devni minib',
      author: "Xudoyberdi To'xtaboyev",
      description: "Bolalar uchun qiziqarli sarguzasht romani.",
      rentalDays: 7,
      pricePerDay: 2000,
      images: {
        front: '/placeholder-book.jpg',
        back: '/placeholder-book.jpg',
      },
      location: { lat: 41.3145, lng: 69.2840 },
      available: true,
      ratings: [],
      createdAt: new Date().toISOString(),
    },
  ]
  
  saveToStorage(STORAGE_KEYS.BOOKS, demoBooks)
}
