"use client";

import React from "react";
import { Timestamp } from "firebase/firestore";
import { Order } from "@/lib/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusTracker } from "./OrderStatusTracker";
import { Calendar, Package, CreditCard, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

interface OrderCardProps {
  order: Order;
  onViewDetails?: (order: Order) => void;
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "confirmed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "shipped":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    case "refunded":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    case "refunded":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  className,
}) => {
  const formatDate = (date: string | Timestamp) => {
    const dateObj = typeof date === "string" ? new Date(date) : date.toDate(); // Convert Firebase Timestamp to JS Date

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">
              Order #{order.orderNumber}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={getStatusColor(order.orderStatus)}>
              {order.orderStatus.charAt(0).toUpperCase() +
                order.orderStatus.slice(1)}
            </Badge>
            <Badge
              variant="outline"
              className={getPaymentStatusColor(order.paymentStatus)}
            >
              {order.paymentStatus.charAt(0).toUpperCase() +
                order.paymentStatus.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Order Items */}
        <div>
          <h4 className="font-medium mb-3 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Items ({order.totalItems})
          </h4>
          <div className="space-y-3">
            {order.items.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <ImageWithFallback
                    src={item.productImage || ""}
                    alt={item.productName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  ${(item.priceAtTime * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                +{order.items.length - 3} more items
              </p>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>${order.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t">
              <span>Total:</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
            {order.paymentMethod && (
              <div className="flex justify-between pt-2">
                <span>Payment Method:</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Tracker */}
        <OrderStatusTracker
          currentStatus={order.orderStatus}
          statusHistory={order.statusHistory}
        />

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {onViewDetails && (
            <Button
              variant="outline"
              onClick={() => onViewDetails(order)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
          {order.orderStatus === "delivered" && (
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
          )}
        </div>

        {/* Shipping Address */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Shipping Address</h4>
          <div className="text-sm text-muted-foreground">
            <p>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
            {order.shippingAddress.phone && (
              <p className="mt-1">Phone: {order.shippingAddress.phone}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
