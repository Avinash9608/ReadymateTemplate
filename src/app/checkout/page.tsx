"use client";

import { useState, Suspense } from 'react'; // Import Suspense
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit: SubmitHandler<CheckoutFormValues> = async (data) => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Order placed:", data, items);
    toast({
      title: "Order Placed!",
      description: "Your order has been successfully placed. Thank you for shopping with FurnishVerse!",
      variant: "default",
      className: "bg-primary text-primary-foreground"
    });
    clearCart();
    router.push('/profile/orders'); // Or a thank you page
    setIsProcessing(false);
  };

  if (items.length === 0 && !isProcessing) {
     router.push('/cart'); // Redirect if cart is empty and not processing
     return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-12 items-start">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Please enter your shipping details.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" {...register("postalCode")} />
                {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea id="notes" {...register("notes")} placeholder="Any special instructions for your order?" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>This is a simplified checkout. No real payment will be processed.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">
                    In a real application, this section would contain payment method selection (Credit Card, PayPal, etc.)
                    and input fields for payment information, integrated with a payment gateway.
                </p>
                <div className="mt-4 p-4 bg-secondary/50 rounded-md border border-dashed flex items-center">
                    <ShieldCheck className="h-8 w-8 text-primary mr-3" />
                    <p className="text-sm">Your (simulated) transaction is secure.</p>
                </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full group" disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-5 w-5" />
            )}
            {isProcessing ? 'Processing Order...' : `Place Order - $${cartTotal.toFixed(2)}`}
          </Button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-24 shadow-lg">
                <CardHeader>
                    <CardTitle>Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Image src={item.imageUrl} alt={item.name} data-ai-hint={item.dataAiHint || 'checkout item'} width={40} height={40} className="rounded object-cover" />
                                <div>
                                    <p className="font-medium line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            <p>${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                    <hr />
                    <div className="flex justify-between font-semibold">
                        <p>Subtotal</p>
                        <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between font-semibold">
                        <p>Shipping</p>
                        <p>FREE</p>
                    </div>
                     <hr />
                    <div className="flex justify-between text-xl font-bold text-primary">
                        <p>Total</p>
                        <p>${cartTotal.toFixed(2)}</p>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Link href="/cart" className="w-full">
                        <Button variant="outline" className="w-full">Edit Cart</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
