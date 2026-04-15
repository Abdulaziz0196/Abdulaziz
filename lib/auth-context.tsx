"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from './types'
import { getSession, setSession, clearSession, getUserById, getUserByPhone, createUser, initDemoData } from './store'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (phone: string) => { success: boolean; error?: string }
  register: (name: string, phone: string, location: { lat: number; lng: number }) => { success: boolean; error?: string }
  logout: () => void
  updateUserLocation: (location: { lat: number; lng: number }) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Demo ma'lumotlarni yaratish
    initDemoData()
    
    // Sessiyani tekshirish
    const session = getSession()
    if (session) {
      const currentUser = getUserById(session.userId)
      if (currentUser) {
        setUser(currentUser)
      }
    }
    setIsLoading(false)
  }, [])

  const login = (phone: string): { success: boolean; error?: string } => {
    const existingUser = getUserByPhone(phone)
    if (!existingUser) {
      return { success: false, error: "Bu telefon raqami ro'yxatdan o'tmagan" }
    }
    
    setSession(existingUser.id)
    setUser(existingUser)
    return { success: true }
  }

  const register = (
    name: string,
    phone: string,
    location: { lat: number; lng: number }
  ): { success: boolean; error?: string } => {
    // Telefon raqamini tekshirish
    const existingUser = getUserByPhone(phone)
    if (existingUser) {
      return { success: false, error: "Bu telefon raqami allaqachon ro'yxatdan o'tgan" }
    }

    // Yangi foydalanuvchi yaratish
    const newUser = createUser({
      name,
      phone,
      location,
    })

    setSession(newUser.id)
    setUser(newUser)
    return { success: true }
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  const updateUserLocation = (location: { lat: number; lng: number }) => {
    if (!user) return
    
    // Store'da yangilash
    const { updateUser } = require('./store')
    const updatedUser = updateUser(user.id, { location })
    if (updatedUser) {
      setUser(updatedUser)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateUserLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
