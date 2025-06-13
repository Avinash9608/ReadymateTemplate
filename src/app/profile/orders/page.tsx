"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/lib/orders";
import { OrderCard } from "@/components/orders/OrderCard";
import { AdminOrderTable } from "@/components/orders/AdminOrderTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Package,
  ShoppingBag,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Handle both old and new user structures
  const isAdmin = user?.role === "admin" || (user as any)?.isAdmin === true;
  const userId = user?.uid || (user as any)?.id;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/login?redirect=/profile/orders");
      return;
    }

    loadOrders();
  }, [user, authLoading, router]);

  const loadOrders = async () => {
    if (!user) {
      console.log("❌ No user found, cannot load orders");
      return;
    }

    console.log("🔍 Loading orders for user:", {
      uid: user.uid,
      id: (user as any).id,
      userId: userId,
      email: user.email,
      role: user.role,
      isAdmin: isAdmin,
      rawUser: user,
    });

    setLoading(true);
    setError(null);

    try {
      let fetchedOrders: Order[];

      if (isAdmin) {
        console.log("👑 Loading all orders for admin...");
        fetchedOrders = await getAllOrders();
      } else {
        console.log("👤 Loading user orders for:", userId);
        if (!userId) {
          throw new Error(
            "User ID not found. User object may have invalid structure."
          );
        }
        fetchedOrders = await getUserOrders(userId);
      }

      console.log("📦 Raw fetched orders:", fetchedOrders);
      setOrders(fetchedOrders);
      console.log(
        `✅ Loaded ${fetchedOrders.length} orders for ${
          isAdmin ? "admin" : "user"
        }`
      );

      if (fetchedOrders.length === 0) {
        console.log("ℹ️ No orders found. This could be because:");
        console.log("- No orders have been placed yet");
        console.log("- Firestore permissions are blocking access");
        console.log("- User ID mismatch in orders collection");
      }
    } catch (error: any) {
      console.error("❌ Error loading orders:", error);
      setError(error.message || "Failed to load orders");
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus, userId);

      if (updatedOrder) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? updatedOrder : order
          )
        );

        toast({
          title: "Success",
          description: `Order status updated to ${newStatus}`,
        });
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    newStatus: PaymentStatus
  ) => {
    try {
      const updatedOrder = await updatePaymentStatus(
        orderId,
        newStatus,
        userId
      );

      if (updatedOrder) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? updatedOrder : order
          )
        );

        toast({
          title: "Success",
          description: `Payment status updated to ${newStatus}`,
        });
      }
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.orderStatus === "pending").length,
      processing: orders.filter((o) => o.orderStatus === "processing").length,
      shipped: orders.filter((o) => o.orderStatus === "shipped").length,
      delivered: orders.filter((o) => o.orderStatus === "delivered").length,
      totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
    return stats;
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Orders</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadOrders}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? "Order Management" : "My Orders"}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "Manage all customer orders and payments"
                : "Track your order history and status"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {stats.total} {stats.total === 1 ? "Order" : "Orders"}
          </Badge>
          <Button variant="outline" onClick={loadOrders} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Debug Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>User Email:</strong>
              <br />
              {user?.email || "Not logged in"}
            </div>
            <div>
              <strong>User ID:</strong>
              <br />
              {userId || "No UID/ID"}
            </div>
            <div>
              <strong>Role:</strong>
              <br />
              {user?.role === "admin" || (user as any)?.isAdmin === true
                ? "admin"
                : user?.role || "No role"}
            </div>
            <div>
              <strong>Is Admin:</strong>
              <br />
              {isAdmin ? "Yes" : "No"}
            </div>
            <div>
              <strong>Loading:</strong>
              <br />
              {loading ? "Yes" : "No"}
            </div>
            <div>
              <strong>Error:</strong>
              <br />
              {error || "None"}
            </div>
            <div>
              <strong>Orders Count:</strong>
              <br />
              {orders.length}
            </div>
            <div>
              <strong>Auth Loading:</strong>
              <br />
              {authLoading ? "Yes" : "No"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin
                ? "No orders have been placed yet."
                : "You haven't placed any orders yet."}
            </p>
            {!isAdmin && (
              <Link href="/products">
                <Button>Start Shopping</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : isAdmin ? (
        <AdminOrderTable
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onViewOrder={handleViewOrder}
          loading={loading}
        />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={handleViewOrder}
            />
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </Button>
              </div>
              <OrderCard order={selectedOrder} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
