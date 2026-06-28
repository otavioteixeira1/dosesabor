import type { CartItem } from '../types/store'

const CART_KEY = 'doce-sabor-cart'

export function loadCart() {
  if (typeof window === 'undefined') return [] as CartItem[]

  try {
    const value = window.localStorage.getItem(CART_KEY)
    if (!value) return [] as CartItem[]
    return JSON.parse(value) as CartItem[]
  } catch {
    return [] as CartItem[]
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
}
