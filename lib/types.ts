// Kitobim.uz uchun barcha tiplar

export interface User {
  id: string
  name: string
  phone: string
  location: {
    lat: number
    lng: number
  }
  createdAt: string
}

export interface Book {
  id: string
  ownerId: string
  title: string
  author: string
  description: string
  rentalDays: 7 | 14 | 21
  pricePerDay: number
  images: {
    front: string
    back: string
  }
  location: {
    lat: number
    lng: number
  }
  available: boolean
  ratings: Rating[]
  createdAt: string
}

export interface Rating {
  userId: string
  score: 1 | 2 | 3 | 4 | 5
  comment: string
  createdAt: string
}

export interface Chat {
  id: string // user1_user2 formati
  participants: [string, string]
  bookId: string
  createdAt: string
  lastMessageAt: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  text: string
  createdAt: string
}

export interface Rental {
  id: string
  bookId: string
  renterId: string
  ownerId: string
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
}

// Session uchun
export interface Session {
  userId: string
  expiresAt: string
}

// API response tiplari
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Kitob + egasi ma'lumotlari bilan
export interface BookWithOwner extends Book {
  owner: {
    id: string
    name: string
  }
  distance?: number
}

// Masofani hisoblash uchun yordamchi funksiya
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Yerning radiusi km da
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
