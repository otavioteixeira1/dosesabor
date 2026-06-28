import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadCart, saveCart } from '../lib/storage'
import type { CartItem, Product } from '../types/store'

type CartContextValue = {
  items: CartItem[]
  addItem: (product: Product) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateNotes: (productId: string, notes: string) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart())

  useEffect(() => {
    saveCart(items)
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      addItem(product) {
        setItems((currentItems) => {
          const existingItem = currentItems.find((item) => item.productId === product.id)
          if (existingItem) {
            return currentItems.map((item) =>
              item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            )
          }

          return [
            ...currentItems,
            {
              productId: product.id,
              name: product.name,
              unitPrice: product.price,
              quantity: 1,
              notes: '',
              imageUrl: product.imageUrl,
            },
          ]
        })
      },
      updateQuantity(productId, quantity) {
        setItems((currentItems) =>
          currentItems
            .map((item) => (item.productId === productId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        )
      },
      updateNotes(productId, notes) {
        setItems((currentItems) =>
          currentItems.map((item) => (item.productId === productId ? { ...item, notes } : item)),
        )
      },
      removeItem(productId) {
        setItems((currentItems) => currentItems.filter((item) => item.productId !== productId))
      },
      clearCart() {
        setItems([])
      },
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)

  if (!value) {
    throw new Error('useCart precisa ser usado dentro de CartProvider.')
  }

  return value
}
