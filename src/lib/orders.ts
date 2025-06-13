import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  FieldValue,
} from "firebase/firestore";
import { db } from "./firebase";
import { CartItem, clearCart } from "./cart";
import { sendOrderStatusEmail } from "./email";

// ========== TYPE DEFINITIONS ==========
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem extends CartItem {
  priceAtTime: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface FirestoreOrder {
  id: string;
  userId: string;
  userEmail: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalItems: number;
  subtotal: number;
  shipping: number;
  tax: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  statusHistory: {
    status: OrderStatus;
    timestamp: Timestamp;
    note?: string;
    updatedBy?: string;
  }[];
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalItems: number;
  subtotal: number;
  shipping: number;
  tax: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }[];
}

// ========== HELPER FUNCTIONS ==========
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-6)}-${random}`;
};

const calculateOrderTotals = (
  items: OrderItem[],
  shippingCost: number = 0,
  taxRate: number = 0.08
) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.priceAtTime * item.quantity,
    0
  );
  const shipping = shippingCost;
  const tax = subtotal * taxRate;
  const totalAmount = subtotal + shipping + tax;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, shipping, tax, totalAmount, totalItems };
};

const convertTimestamps = (order: any): Order => ({
  ...order,
  createdAt:
    order.createdAt instanceof Timestamp
      ? order.createdAt.toDate().toISOString()
      : typeof order.createdAt === "string"
      ? order.createdAt
      : new Date().toISOString(),
  updatedAt:
    order.updatedAt instanceof Timestamp
      ? order.updatedAt.toDate().toISOString()
      : typeof order.updatedAt === "string"
      ? order.updatedAt
      : new Date().toISOString(),
  statusHistory:
    order.statusHistory?.map((h: any) => ({
      ...h,
      timestamp:
        h.timestamp instanceof Timestamp
          ? h.timestamp.toDate().toISOString()
          : h.timestamp,
    })) || [],
});

// ========== CORE ORDER FUNCTIONS ==========
export const createOrder = async (
  userId: string,
  userEmail: string,
  cartItems: CartItem[],
  shippingAddress: ShippingAddress,
  paymentMethod: string = "card"
): Promise<Order> => {
  try {
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    const orderItems: OrderItem[] = cartItems.map((item) => ({
      ...item,
      priceAtTime: item.productPrice,
    }));

    const { subtotal, shipping, tax, totalAmount, totalItems } =
      calculateOrderTotals(orderItems);

    const firestoreOrder: Omit<FirestoreOrder, "id"> = {
      userId,
      userEmail,
      orderNumber,
      items: orderItems,
      shippingAddress,
      totalItems,
      subtotal,
      shipping,
      tax,
      totalAmount,
      orderStatus: "pending",
      paymentStatus: "pending",
      paymentMethod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusHistory: [
        {
          status: "pending",
          timestamp: Timestamp.fromDate(new Date()),
          note: "Order created",
        },
      ],
    };

    const orderRef = await addDoc(collection(db, "orders"), firestoreOrder);

    const clientOrder: Order = {
      ...firestoreOrder,
      id: orderRef.id,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: "pending",
          timestamp: now,
          note: "Order created",
        },
      ],
    };

    await clearCart(userId);

    try {
      await sendOrderStatusEmail(userEmail, clientOrder);
    } catch (emailError) {
      console.error("Email error:", emailError);
    }

    return clientOrder;
  } catch (error) {
    console.error("Order creation failed:", error);
    throw error;
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    if (!userId) return [];

    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map((doc) =>
      convertTimestamps({
        ...doc.data(),
        id: doc.id,
      })
    );
  } catch (error) {
    console.error("Error fetching user orders:", error);

    // Fallback for missing index
    if (error instanceof Error && error.message.includes("requires an index")) {
      try {
        const simpleQuery = query(
          collection(db, "orders"),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(simpleQuery);
        const orders = querySnapshot.docs.map((doc) =>
          convertTimestamps({
            ...doc.data(),
            id: doc.id,
          })
        );
        return orders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
        return [];
      }
    }

    return [];
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map((doc) =>
      convertTimestamps({
        ...doc.data(),
        id: doc.id,
      })
    );
  } catch (error) {
    console.error("Error fetching all orders:", error);

    // Fallback for missing index
    if (error instanceof Error && error.message.includes("requires an index")) {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orders = querySnapshot.docs.map((doc) =>
          convertTimestamps({
            ...doc.data(),
            id: doc.id,
          })
        );
        return orders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
        return [];
      }
    }

    return [];
  }
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    return orderSnap.exists()
      ? convertTimestamps({
          ...orderSnap.data(),
          id: orderSnap.id,
        })
      : null;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus,
  adminUserId?: string,
  note?: string
): Promise<Order | null> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const now = new Date();

    await updateDoc(orderRef, {
      orderStatus: newStatus,
      statusHistory: [
        ...((await getDoc(orderRef)).data()?.statusHistory || []),
        {
          status: newStatus,
          timestamp: Timestamp.fromDate(now),
          note: note || `Status updated to ${newStatus}`,
          updatedBy: adminUserId,
        },
      ],
      updatedAt: serverTimestamp(),
    });

    return await getOrder(orderId);
  } catch (error) {
    console.error("Status update failed:", error);
    throw error;
  }
};

export const updatePaymentStatus = async (
  orderId: string,
  newPaymentStatus: PaymentStatus,
  adminUserId?: string
): Promise<Order | null> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    await updateDoc(orderRef, {
      paymentStatus: newPaymentStatus,
      updatedAt: serverTimestamp(),
    });

    if (
      newPaymentStatus === "paid" &&
      orderSnap.data().orderStatus === "pending"
    ) {
      return await updateOrderStatus(
        orderId,
        "confirmed",
        adminUserId,
        "Payment confirmed"
      );
    }

    return await getOrder(orderId);
  } catch (error) {
    console.error("Payment status update failed:", error);
    throw error;
  }
};
