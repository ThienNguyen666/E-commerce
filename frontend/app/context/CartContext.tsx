import React, { createContext, useContext, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { cartAPI } from "../services/api";

interface CartItem {
  product_id: number;
  name?: string;
  price?: number;
  quantity: number;
  stock_quantity?: number;
  subtotal?: number;
}

interface CartData {
  items: CartItem[];
  total: number;
}

interface CartContextType {
  cart: CartData;
  cartCount: number;
  isLoading: boolean;
  refetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cart: { items: [], total: 0 },
  cartCount: 0,
  isLoading: false,
  refetchCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: cartData = { items: [], total: 0 }, isLoading, refetch } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        const res = await cartAPI.get();
        return res.data || { items: [], total: 0 };
      } catch (error) {
        // Silently fail for unauthorized users
        console.debug("Cart fetch failed:", error);
        return { items: [], total: 0 };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Setup polling for periodic cart updates
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refetch();
    }, 30000); // Poll every 30 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch]);

  const cartCount = cartData?.items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) || 0;

  const refetchCart = async () => {
    try {
      await refetch();
    } catch (error) {
      console.debug("Cart refetch failed:", error);
    }
  };

  return (
    <CartContext.Provider value={{ cart: cartData || { items: [], total: 0 }, cartCount, isLoading, refetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
