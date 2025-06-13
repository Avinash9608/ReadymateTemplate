"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  Cart,
} from "@/lib/cart";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function CartPage() {
  const { user } = useAuth();
  const {
    items: localItems,
    removeItem: removeLocalItem,
    updateQuantity: updateLocalQuantity,
    clearCart: clearLocalCart,
  } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/cart");
      return;
    }
    loadCart();
  }, [user, router]);

  const loadCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userCart = await getUserCart(user.uid);
      setCart(userCart);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!user || !cart) return;

    setUpdating((prev) => new Set(prev).add(itemId));
    try {
      const updatedCart = await updateCartItemQuantity(
        user.uid,
        itemId,
        newQuantity
      );
      setCart(updatedCart);

      // Also update local cart for immediate UI feedback
      const item = cart.items.find((i) => i.id === itemId);
      if (item) {
        updateLocalQuantity(item.productId, newQuantity);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!user || !cart) return;

    setUpdating((prev) => new Set(prev).add(itemId));
    try {
      const updatedCart = await removeFromCart(user.uid, itemId);
      setCart(updatedCart);

      // Also update local cart
      const item = cart.items.find((i) => i.id === itemId);
      if (item) {
        removeLocalItem(item.productId);
      }

      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (!user) return;

    try {
      await clearCart(user.uid);
      setCart(null);
      clearLocalCart();

      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-headline font-bold mb-4">
          Your Cart is Empty
        </h1>
        <p className="text-muted-foreground mb-8">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link href="/products">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-8">
        Your Shopping Cart ({cart.totalItems})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cart.items.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <ImageWithFallback
                src={item.productImage || ""}
                alt={item.productName}
                width={120}
                height={120}
                className="rounded-md object-cover w-full sm:w-32 h-32 sm:h-auto aspect-square"
              />
              <div className="flex-grow">
                <h2 className="text-lg font-semibold">{item.productName}</h2>
                <p className="text-md font-semibold text-primary mt-1">
                  ${item.productPrice.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Added:{" "}
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleUpdateQuantity(item.id, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1 || updating.has(item.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value);
                    if (newQuantity > 0) {
                      handleUpdateQuantity(item.id, newQuantity);
                    }
                  }}
                  className="w-16 text-center h-9"
                  min="1"
                  disabled={updating.has(item.id)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleUpdateQuantity(item.id, item.quantity + 1)
                  }
                  disabled={updating.has(item.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(item.id)}
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive ml-auto sm:ml-4"
                disabled={updating.has(item.id)}
              >
                {updating.has(item.id) ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </Button>
            </Card>
          ))}
          <Button
            variant="outline"
            onClick={handleClearCart}
            className="mt-6 text-destructive border-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
          </Button>
        </div>

        {/* Order Summary */}
        <Card className="lg:col-span-1 sticky top-24 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({cart.totalItems} items)
              </span>
              <span>${cart.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>FREE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${(cart.totalAmount * 0.08).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>
                ${(cart.totalAmount + cart.totalAmount * 0.08).toFixed(2)}
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/checkout" className="w-full">
              <Button size="lg" className="w-full group">
                Proceed to Checkout{" "}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
