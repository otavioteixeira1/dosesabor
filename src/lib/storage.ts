import type { CartItem, CheckoutFormValues } from '../types/store'

const CART_KEY = 'doce-sabor-cart'
const CHECKOUT_PROFILE_KEY = 'doce-sabor-checkout-profile'

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

export function loadCheckoutProfile(defaultValues: CheckoutFormValues) {
  if (typeof window === 'undefined') return defaultValues

  try {
    const value = window.localStorage.getItem(CHECKOUT_PROFILE_KEY)
    if (!value) return defaultValues

    const parsed = JSON.parse(value) as Partial<CheckoutFormValues>

    return {
      ...defaultValues,
      ...parsed,
      notes: '',
    }
  } catch {
    return defaultValues
  }
}

export function saveCheckoutProfile(values: CheckoutFormValues) {
  if (typeof window === 'undefined') return

  const profile: CheckoutFormValues = {
    ...values,
    notes: '',
  }

  window.localStorage.setItem(CHECKOUT_PROFILE_KEY, JSON.stringify(profile))
}
