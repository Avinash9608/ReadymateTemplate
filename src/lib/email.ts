import { Order, OrderStatus } from "./orders";

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  user: process.env.EMAIL_USER || "avinash25di@gmail.com",
  pass: process.env.EMAIL_PASS || "hhifpzryhoidvbtm",
};

// Email templates
const getOrderStatusEmailTemplate = (
  order: Order,
  isNewOrder: boolean = false
) => {
  const statusMessages = {
    pending: "Your order has been received and is being processed.",
    confirmed: "Your order has been confirmed and will be processed soon.",
    processing: "Your order is currently being prepared for shipment.",
    shipped: "Your order has been shipped and is on its way to you.",
    delivered: "Your order has been delivered successfully.",
    cancelled: "Your order has been cancelled.",
    refunded: "Your order has been refunded.",
  };

  const statusColors = {
    pending: "#f59e0b",
    confirmed: "#10b981",
    processing: "#3b82f6",
    shipped: "#8b5cf6",
    delivered: "#059669",
    cancelled: "#ef4444",
    refunded: "#6b7280",
  };

  const subject = isNewOrder
    ? `Order Confirmation - ${order.orderNumber}`
    : `Order Update - ${
        order.orderNumber
      } (${order.orderStatus.toUpperCase()})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; color: #2d3748; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛍️ FurnishVerse</h1>
          <h2>${isNewOrder ? "Order Confirmation" : "Order Update"}</h2>
        </div>
        
        <div class="content">
          <h3>Hello ${order.shippingAddress.firstName}!</h3>
          
          <div class="status-badge" style="background-color: ${
            statusColors[order.orderStatus]
          };">
            ${order.orderStatus.toUpperCase()}
          </div>
          
          <p>${statusMessages[order.orderStatus]}</p>
          
          <div class="order-details">
            <h4>Order Details</h4>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(
              order.createdAt
            ).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(
              2
            )}</p>
            
            <h4>Items Ordered</h4>
            ${order.items
              .map(
                (item) => `
              <div class="item">
                <div>
                  <strong>${item.productName}</strong><br>
                  <small>Quantity: ${item.quantity}</small>
                </div>
                <div>$${(item.priceAtTime * item.quantity).toFixed(2)}</div>
              </div>
            `
              )
              .join("")}
            
            <div class="item total">
              <div>Total</div>
              <div>$${order.totalAmount.toFixed(2)}</div>
            </div>
          </div>
          
          <div class="order-details">
            <h4>Shipping Address</h4>
            <p>
              ${order.shippingAddress.firstName} ${
    order.shippingAddress.lastName
  }<br>
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${
    order.shippingAddress.zipCode
  }<br>
              ${order.shippingAddress.country}
            </p>
          </div>
          
          ${
            !isNewOrder && order.orderStatus === "shipped"
              ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="#" class="button">Track Your Order</a>
            </div>
          `
              : ""
          }
          
          <div class="footer">
            <p>Thank you for shopping with FurnishVerse!</p>
            <p>If you have any questions, please contact our support team.</p>
            <p><small>This is an automated email. Please do not reply to this message.</small></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};

// Send email using API route
export const sendOrderStatusEmail = async (
  email: string,
  order: Order,
  isNewOrder: boolean = false
): Promise<void> => {
  try {
    const { subject, html } = getOrderStatusEmailTemplate(order, isNewOrder);

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject,
        html,
        orderNumber: order.orderNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Email API error: ${error}`);
    }

    console.log("✅ Order status email sent to:", email);
  } catch (error) {
    console.error("❌ Failed to send order status email:", error);
    throw error;
  }
};

// Send admin notification email
export const sendAdminNotificationEmail = async (
  order: Order,
  isNewOrder: boolean = true
): Promise<void> => {
  try {
    const subject = isNewOrder
      ? `New Order Received - ${order.orderNumber}`
      : `Order Updated - ${order.orderNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2d3748; color: white; padding: 20px; text-align: center; }
          .content { background: #f7fafc; padding: 20px; }
          .order-info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Admin Notification</h2>
            <h3>${subject}</h3>
          </div>
          
          <div class="content">
            <div class="order-info">
              <h4>Order Information</h4>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Customer:</strong> ${
                order.shippingAddress.firstName
              } ${order.shippingAddress.lastName}</p>
              <p><strong>Email:</strong> ${order.userEmail}</p>
              <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(
                2
              )}</p>
              <p><strong>Status:</strong> ${order.orderStatus.toUpperCase()}</p>
              <p><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
            </div>
            
            <div class="order-info">
              <h4>Items (${order.totalItems})</h4>
              ${order.items
                .map(
                  (item) => `
                <p>• ${item.productName} (Qty: ${item.quantity}) - $${(
                    item.priceAtTime * item.quantity
                  ).toFixed(2)}</p>
              `
                )
                .join("")}
            </div>
            
            <div class="order-info">
              <h4>Shipping Address</h4>
              <p>
                ${order.shippingAddress.firstName} ${
      order.shippingAddress.lastName
    }<br>
                ${order.shippingAddress.street}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${
      order.shippingAddress.zipCode
    }<br>
                ${order.shippingAddress.country}<br>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${
      order.id
    }" 
                 style="background: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Order Details
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: EMAIL_CONFIG.user, // Send to admin email
        subject,
        html,
        orderNumber: order.orderNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Admin email API error: ${error}`);
    }

    console.log("✅ Admin notification email sent");
  } catch (error) {
    console.error("❌ Failed to send admin notification email:", error);
    // Don't throw error for admin notifications to avoid breaking order flow
  }
};
