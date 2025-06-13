// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { getUserCart, Cart } from "@/lib/cart";
// import { createOrder, ShippingAddress } from "@/lib/orders";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2, CreditCard, MapPin, Package } from "lucide-react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import ImageWithFallback from "@/components/ui/ImageWithFallback";

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// export default function CheckoutPage() {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const router = useRouter();

//   const [cart, setCart] = useState<Cart | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [placing, setPlacing] = useState(false);
//   const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     street: "",
//     city: "",
//     state: "",
//     zipCode: "",
//     country: "United States",
//   });

//   useEffect(() => {
//     if (!user) {
//       router.push("/auth/login?redirect=/checkout");
//       return;
//     }
//     loadCart();

//     // Pre-fill email from user profile
//     if (user.email) {
//       setShippingAddress((prev) => ({
//         ...prev,
//         email: user.email,
//         firstName: user.displayName?.split(" ")[0] || "",
//         lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
//       }));
//     }
//   }, [user, router]);

//   const loadCart = async () => {
//     if (!user) return;

//     setLoading(true);
//     try {
//       const userCart = await getUserCart(user.uid);
//       if (!userCart || userCart.items.length === 0) {
//         router.push("/cart");
//         return;
//       }
//       setCart(userCart);
//     } catch (error) {
//       console.error("Error loading cart:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load cart. Please try again.",
//         variant: "destructive",
//       });
//       router.push("/cart");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setShippingAddress((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const validateForm = () => {
//     const required = [
//       "firstName",
//       "lastName",
//       "email",
//       "phone",
//       "street",
//       "city",
//       "state",
//       "zipCode",
//     ];
//     for (const field of required) {
//       if (!shippingAddress[field as keyof ShippingAddress]) {
//         toast({
//           title: "Missing Information",
//           description: `Please fill in your ${field
//             .replace(/([A-Z])/g, " $1")
//             .toLowerCase()}.`,
//           variant: "destructive",
//         });
//         return false;
//       }
//     }

//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(shippingAddress.email)) {
//       toast({
//         title: "Invalid Email",
//         description: "Please enter a valid email address.",
//         variant: "destructive",
//       });
//       return false;
//     }

//     return true;
//   };

//   const loadRazorpay = () => {
//     return new Promise((resolve) => {
//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.onload = () => resolve(true);
//       script.onerror = () => resolve(false);
//       document.body.appendChild(script);
//     });
//   };

//   const initiateRazorpayPayment = async () => {
//     if (!user || !cart || !validateForm()) return;

//     setPlacing(true);
//     try {
//       // First create the order in your database
//       const orderData = await createOrder(
//         user.uid,
//         user.email,
//         cart.items,
//         shippingAddress,
//         "razorpay"
//       );

//       // Create Razorpay order
//       const razorpayOrder = await fetch("/api/razorpay/create-order", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           amount: Math.round(orderData.totalAmount * 100), // Convert to paise
//           currency: "INR",
//           receipt: orderData.orderNumber,
//         }),
//       }).then((res) => res.json());

//       if (!razorpayOrder.id) {
//         throw new Error("Failed to create Razorpay order");
//       }

//       // Load Razorpay script
//       const razorpayLoaded = await loadRazorpay();
//       if (!razorpayLoaded) {
//         throw new Error("Razorpay SDK failed to load");
//       }

//       const options = {
//         key: process.env.NEXT_PUBLIC_RZP_KEY,
//         amount: razorpayOrder.amount,
//         currency: razorpayOrder.currency,
//         name: "Your Store Name",
//         description: `Order #${orderData.orderNumber}`,
//         order_id: razorpayOrder.id,
//         handler: async (response: any) => {
//           // Verify payment on your server
//           const verification = await fetch("/api/razorpay/verify", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_signature: response.razorpay_signature,
//               orderId: orderData.id, // Your database order ID
//             }),
//           }).then((res) => res.json());

//           if (verification.success) {
//             toast({
//               title: "Payment Successful!",
//               description: `Your order #${orderData.orderNumber} has been placed.`,
//               className: "bg-green-500 text-white",
//             });
//             router.push(`/profile/orders`);
//           } else {
//             toast({
//               title: "Payment Verification Failed",
//               description: "Please contact support with your order details.",
//               variant: "destructive",
//             });
//           }
//         },
//         prefill: {
//           name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
//           email: shippingAddress.email,
//           contact: shippingAddress.phone,
//         },
//         notes: {
//           orderId: orderData.id,
//           userId: user.uid,
//         },
//         theme: {
//           color: "#6366F1",
//         },
//       };

//       const paymentObject = new window.Razorpay(options);
//       paymentObject.open();
//     } catch (error: any) {
//       console.error("Payment error:", error);
//       toast({
//         title: "Payment Failed",
//         description:
//           error.message || "Failed to process payment. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setPlacing(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex justify-center items-center min-h-[400px]">
//           <div className="text-center">
//             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
//             <p className="text-muted-foreground">Loading checkout...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!user || !cart) {
//     return null;
//   }

//   const subtotal = cart.totalAmount;
//   const shipping: number = 0;
//   const tax = subtotal * 0.08;
//   const total = subtotal + shipping + tax;

//   // const handlePlaceOrder = async () => {
//   //   if (!user || !cart || !validateForm()) return;

//   //   setPlacing(true);
//   //   try {
//   //     const order = await createOrder(
//   //       user.uid,
//   //       user.email,
//   //       cart.items,
//   //       shippingAddress,
//   //       "card"
//   //     );

//   //     toast({
//   //       title: "Order Placed Successfully!",
//   //       description: `Your order #${order.orderNumber} has been placed.`,
//   //       className: "bg-green-500 text-white",
//   //     });

//   //     router.push(`/profile/orders`);
//   //   } catch (error: any) {
//   //     console.error("Error placing order:", error);
//   //     toast({
//   //       title: "Order Failed",
//   //       description:
//   //         error.message || "Failed to place order. Please try again.",
//   //       variant: "destructive",
//   //     });
//   //   } finally {
//   //     setPlacing(false);
//   //   }
//   // };

//   // if (loading) {
//   //   return (
//   //     <div className="container mx-auto px-4 py-8">
//   //       <div className="flex justify-center items-center min-h-[400px]">
//   //         <div className="text-center">
//   //           <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
//   //           <p className="text-muted-foreground">Loading checkout...</p>
//   //         </div>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   // if (!user || !cart) {
//   //   return null;
//   // }

//   // const subtotal = cart.totalAmount;
//   // const shipping: number = 0;
//   // const tax = subtotal * 0.08;
//   // const total = subtotal + shipping + tax;

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-2">Checkout</h1>
//         <p className="text-muted-foreground">Complete your order</p>
//       </div>

//       <div className="grid lg:grid-cols-2 gap-8">
//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <MapPin className="h-5 w-5 mr-2" />
//                 Shipping Information
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="firstName">First Name *</Label>
//                   <Input
//                     id="firstName"
//                     name="firstName"
//                     value={shippingAddress.firstName}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="lastName">Last Name *</Label>
//                   <Input
//                     id="lastName"
//                     name="lastName"
//                     value={shippingAddress.lastName}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//               </div>

//               <div>
//                 <Label htmlFor="email">Email *</Label>
//                 <Input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={shippingAddress.email}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="phone">Phone *</Label>
//                 <Input
//                   id="phone"
//                   name="phone"
//                   type="tel"
//                   value={shippingAddress.phone}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="street">Street Address *</Label>
//                 <Input
//                   id="street"
//                   name="street"
//                   value={shippingAddress.street}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="city">City *</Label>
//                   <Input
//                     id="city"
//                     name="city"
//                     value={shippingAddress.city}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="state">State *</Label>
//                   <Input
//                     id="state"
//                     name="state"
//                     value={shippingAddress.state}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="zipCode">ZIP Code *</Label>
//                   <Input
//                     id="zipCode"
//                     name="zipCode"
//                     value={shippingAddress.zipCode}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="country">Country *</Label>
//                   <Input
//                     id="country"
//                     name="country"
//                     value={shippingAddress.country}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <CreditCard className="h-5 w-5 mr-2" />
//                 Payment Information
//               </CardTitle>
//             </CardHeader>
//             {/* <CardContent>
//               <div className="p-4 bg-muted rounded-lg text-center">
//                 <p className="text-sm text-muted-foreground">
//                   Payment processing will be handled securely.
//                   <br />
//                   <span className="font-medium">
//                     Demo Mode: No actual payment required
//                   </span>
//                 </p>
//               </div>
//             </CardContent> */}
//             <CardContent>
//               <div className="p-4 bg-muted rounded-lg text-center">
//                 <p className="text-sm text-muted-foreground mb-4">
//                   We accept payments via Razorpay (Credit/Debit Cards, UPI, Net
//                   Banking)
//                 </p>
//                 <div className="flex items-center space-x-2">
//                   <div className="flex-1 h-10  rounded-md flex items-center justify-center p-2">
//                     <span className="text-xs font-medium ">
//                       Razorpay Secure
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <div>
//           <Card className="sticky top-24">
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <Package className="h-5 w-5 mr-2" />
//                 Order Summary
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-3">
//                 {cart.items.map((item) => (
//                   <div key={item.id} className="flex items-center space-x-3">
//                     <ImageWithFallback
//                       src={item.productImage || ""}
//                       alt={item.productName}
//                       width={60}
//                       height={60}
//                       className="rounded-md object-cover"
//                     />
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-sm truncate">
//                         {item.productName}
//                       </p>
//                       <p className="text-xs text-muted-foreground">
//                         Qty: {item.quantity}
//                       </p>
//                     </div>
//                     <p className="font-medium text-sm">
//                       ${(item.productPrice * item.quantity).toFixed(2)}
//                     </p>
//                   </div>
//                 ))}
//               </div>

//               <Separator />

//               <div className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span>Subtotal ({cart.totalItems} items)</span>
//                   <span>${subtotal.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span>Shipping</span>
//                   <span>
//                     {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span>Tax</span>
//                   <span>${tax.toFixed(2)}</span>
//                 </div>
//                 <Separator />
//                 <div className="flex justify-between font-bold text-lg">
//                   <span>Total</span>
//                   <span>${total.toFixed(2)}</span>
//                 </div>
//               </div>

//               <Button
//                 onClick={initiateRazorpayPayment}
//                 className="w-full mt-6"
//                 size="lg"
//                 disabled={placing}
//               >
//                 {placing ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Processing Payment...
//                   </>
//                 ) : (
//                   `Place Order - $${total.toFixed(2)}`
//                 )}
//               </Button>

//               <div className="text-center">
//                 <Link href="/cart">
//                   <Button variant="link" className="text-sm">
//                     Back to Cart
//                   </Button>
//                 </Link>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserCart, Cart } from "@/lib/cart";
import { createOrder, ShippingAddress } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CreditCard,
  MapPin,
  Package,
  IndianRupee,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  // Load cart and pre-fill user data
  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/checkout");
      return;
    }
    loadCart();

    if (user.email) {
      setShippingAddress((prev) => ({
        ...prev,
        email: user.email,
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
      }));
    }
  }, [user, router]);

  const loadCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userCart = await getUserCart(user.uid);
      if (!userCart || userCart.items.length === 0) {
        router.push("/cart");
        return;
      }
      setCart(userCart);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart. Please try again.",
        variant: "destructive",
      });
      router.push("/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "street",
      "city",
      "state",
      "zipCode",
    ];

    for (const field of required) {
      if (!shippingAddress[field as keyof ShippingAddress]) {
        toast({
          title: "Missing Information",
          description: `Please fill in your ${field
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(shippingAddress.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian phone number.",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        toast({
          title: "Payment Error",
          description: "Failed to load payment gateway. Please try again.",
          variant: "destructive",
        });
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const initiateRazorpayPayment = async () => {
    if (!user || !cart || !validateForm()) return;

    setPlacing(true);
    try {
      // First create order in our database
      const orderData = await createOrder(
        user.uid,
        user.email,
        cart.items,
        shippingAddress,
        "razorpay"
      );

      // Create Razorpay order
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100), // Convert to paise
          currency: "INR",
          receipt: orderData.orderNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const razorpayOrder = await response.json();

      if (!razorpayOrder.id) {
        throw new Error("Failed to create payment order");
      }

      // Load Razorpay script
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error("Payment gateway failed to load");
      }

      // Configure payment options
      const options = {
        key: process.env.NEXT_PUBLIC_RZP_KEY,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Your Store Name",
        description: `Order #${orderData.orderNumber}`,
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          try {
            const verification = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                orderId: orderData.id,
              }),
            });

            const verificationData = await verification.json();
            
            if (verificationData.success) {
              toast({
                title: "Payment Successful!",
                description: `Order #${orderData.orderNumber} confirmed.`,
                className: "bg-green-500 text-white",
              });
              router.push(`/profile/orders/${orderData.id}`);
            } else {
              toast({
                title: "Payment Verification Failed",
                description: verificationData.error || "Please contact support.",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            toast({
              title: "Verification Error",
              description: error.message || "Failed to verify payment.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          email: shippingAddress.email,
          contact: shippingAddress.phone,
        },
        notes: {
          orderId: orderData.id,
          userId: user.uid,
        },
        theme: {
          color: "#6366F1",
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "You can retry the payment anytime",
              variant: "default",
            });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", (response: any) => {
        toast({
          title: "Payment Failed",
          description:
            response.error.description ||
            "Payment failed. Please try another method.",
          variant: "destructive",
        });
      });

    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description:
          error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !cart) return null;

  const subtotal = cart.totalAmount;
  const shipping = 0;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Complete your order</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Shipping Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={shippingAddress.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={shippingAddress.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={shippingAddress.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit Indian number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  name="street"
                  value={shippingAddress.street}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Secure payment via Razorpay. All major payment methods
                  accepted:
                </p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="border rounded-md p-2 text-center">
                    <p className="text-xs">UPI</p>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <p className="text-xs">Cards</p>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <p className="text-xs">Net Banking</p>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <p className="text-xs">Wallets</p>
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <p>100% Secure | PCI DSS Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <ImageWithFallback
                      src={item.productImage || ""}
                      alt={item.productName}
                      width={60}
                      height={60}
                      className="rounded-md object-cover border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-sm">
                      <IndianRupee className="inline h-3 w-3" />
                      {(item.productPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cart.totalItems} items)</span>
                  <span>
                    <IndianRupee className="inline h-3 w-3" />
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      "FREE"
                    ) : (
                      <>
                        <IndianRupee className="inline h-3 w-3" />
                        {(shipping as number).toFixed(2)}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18%)</span>
                  <span>
                    <IndianRupee className="inline h-3 w-3" />
                    {tax.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>
                    <IndianRupee className="inline h-4 w-4" />
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={initiateRazorpayPayment}
                className="w-full mt-6"
                size="lg"
                disabled={placing}
              >
                {placing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ₹{total.toFixed(2)} Securely
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link href="/cart">
                  <Button variant="link" className="text-sm">
                    Back to Cart
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}