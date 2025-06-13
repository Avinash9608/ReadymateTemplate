'use client';

import React from 'react';
import { OrderStatus } from '@/lib/orders';
import { CheckCircle, Circle, Clock, Package, Truck, Home, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStatusTrackerProps {
  currentStatus: OrderStatus;
  statusHistory?: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Payment Pending',
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  confirmed: {
    label: 'Payment Successful',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  processing: {
    label: 'Order Processing',
    icon: Package,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  delivered: {
    label: 'Delivered',
    icon: Home,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  refunded: {
    label: 'Refunded',
    icon: XCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800'
  }
};

const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  currentStatus,
  statusHistory = [],
  className
}) => {
  const getCurrentStatusIndex = () => {
    if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
      return -1; // Special handling for cancelled/refunded orders
    }
    return statusOrder.indexOf(currentStatus);
  };

  const currentIndex = getCurrentStatusIndex();
  const isCancelledOrRefunded = currentStatus === 'cancelled' || currentStatus === 'refunded';

  const getStatusTimestamp = (status: OrderStatus) => {
    const historyItem = statusHistory.find(h => h.status === status);
    return historyItem?.timestamp;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isCancelledOrRefunded) {
    const config = statusConfig[currentStatus];
    const Icon = config.icon;
    
    return (
      <div className={cn("p-6 rounded-lg border", config.bgColor, config.borderColor, className)}>
        <div className="flex items-center justify-center space-x-3">
          <Icon className={cn("h-8 w-8", config.color)} />
          <div className="text-center">
            <h3 className={cn("text-lg font-semibold", config.color)}>
              Order {config.label}
            </h3>
            {getStatusTimestamp(currentStatus) && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatTimestamp(getStatusTimestamp(currentStatus))}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 bg-card rounded-lg border", className)}>
      <h3 className="text-lg font-semibold mb-6 text-center">Order Status</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-in-out"
            style={{ 
              width: currentIndex >= 0 ? `${(currentIndex / (statusOrder.length - 1)) * 100}%` : '0%' 
            }}
          />
        </div>

        {/* Status Steps */}
        <div className="relative flex justify-between">
          {statusOrder.map((status, index) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const timestamp = getStatusTimestamp(status);

            return (
              <div key={status} className="flex flex-col items-center space-y-2">
                {/* Status Icon */}
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                      ? cn("border-2", config.borderColor.replace('border-', 'border-'), config.bgColor, config.color)
                      : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>

                {/* Status Label */}
                <div className="text-center max-w-20">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      isCompleted || isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {config.label}
                  </p>
                  {timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(timestamp)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Description */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-3">
          {(() => {
            const config = statusConfig[currentStatus];
            const Icon = config.icon;
            return (
              <>
                <Icon className={cn("h-5 w-5", config.color)} />
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentStatus === 'pending' && 'Your payment is being processed.'}
                    {currentStatus === 'confirmed' && 'Payment confirmed. Your order will be processed soon.'}
                    {currentStatus === 'processing' && 'Your order is being prepared for shipment.'}
                    {currentStatus === 'shipped' && 'Your order is on its way to you.'}
                    {currentStatus === 'delivered' && 'Your order has been delivered successfully.'}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
