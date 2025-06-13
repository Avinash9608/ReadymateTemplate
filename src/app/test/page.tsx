"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  runCompleteSystemTest,
  getTestInstructions,
  TEST_CREDENTIALS,
} from "@/lib/test-system";
import { diagnoseFirebaseIssues } from "@/lib/firebase-check";
import { clearOldUserCache } from "@/lib/clear-cache";
import {
  fixUserData,
  forceLogoutAndClearData,
  diagnoseUserIssue,
} from "@/lib/fix-user-data";
import { createOrder, getAllOrders, getUserOrders } from "@/lib/orders";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Info,
  AlertTriangle,
  Trash2,
  RefreshCw,
  LogOut,
  Package,
} from "lucide-react";

export default function TestPage() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [checkingOrders, setCheckingOrders] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await runCompleteSystemTest();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Test execution failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagnosing(true);
    setDiagnostics(null);

    try {
      const result = await diagnoseFirebaseIssues();
      setDiagnostics(result);
    } catch (error) {
      setDiagnostics({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDiagnosing(false);
    }
  };

  const createTestOrder = async () => {
    if (!user) {
      alert("Please login first to create a test order");
      return;
    }

    // Handle both old and new user structures
    const userId = user.uid || (user as any).id;
    const userEmail = user.email || "";

    if (!userId) {
      alert("User ID not found. Please fix user data first.");
      return;
    }

    setCreatingOrder(true);

    try {
      console.log("🧪 Creating test order for user:", userId);

      // Create test cart items
      const testCartItems = [
        {
          id: "test-item-1",
          productId: "test-product-1",
          productName: "Test Sofa",
          productSlug: "test-sofa", // Add this
          productPrice: 999.99,
          productImage: "https://placehold.co/300x300.png?text=Test+Sofa",
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
        {
          id: "test-item-2",
          productId: "test-product-2",
          productName: "Test Chair",
          productSlug: "test-chair", // Add this
          productPrice: 299.99,
          productImage: "https://placehold.co/300x300.png?text=Test+Chair",
          quantity: 2,
          addedAt: new Date().toISOString(),
        },
      ];
      // Create test shipping address
      const testShippingAddress = {
        firstName: "Test",
        lastName: "User",
        email: userEmail,
        phone: "+1234567890",
        street: "123 Test Street",
        city: "Test City",
        state: "Test State",
        zipCode: "12345",
        country: "United States",
      };

      const order = await createOrder(
        userId,
        userEmail,
        testCartItems,
        testShippingAddress,
        "card"
      );

      console.log("✅ Test order created:", order);
      alert(`Test order created successfully! Order ID: ${order.id}`);
    } catch (error) {
      console.error("❌ Error creating test order:", error);
      alert(`Error creating test order: ${error}`);
    } finally {
      setCreatingOrder(false);
    }
  };

  const checkOrders = async () => {
    setCheckingOrders(true);

    try {
      console.log("🔍 Checking orders in database...");

      // Check all orders
      const allOrders = await getAllOrders();
      console.log("📊 All orders in database:", allOrders);

      if (user) {
        // Check user-specific orders
        const userId = user.uid || (user as any).id;
        if (userId) {
          const userOrders = await getUserOrders(userId);
          console.log("👤 User orders:", userOrders);

          alert(`Database Check Results:

Total Orders: ${allOrders.length}
Your Orders: ${userOrders.length}

Check browser console for detailed order data.`);
        } else {
          alert("User ID not found. Cannot check user-specific orders.");
        }
      } else {
        alert(`Database Check Results:

Total Orders: ${allOrders.length}

Please login to check user-specific orders.
Check browser console for detailed order data.`);
      }
    } catch (error) {
      console.error("❌ Error checking orders:", error);
      alert(`Error checking orders: ${error}`);
    } finally {
      setCheckingOrders(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">🧪 System Test Suite</h1>
          <p className="text-muted-foreground">
            Test the complete e-commerce functionality including authentication,
            cart, orders, and admin features.
          </p>
        </div>

        {/* Test Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Test Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">👤 Test User</h3>
                <p className="text-sm">Email: {TEST_CREDENTIALS.user.email}</p>
                <p className="text-sm">
                  Password: {TEST_CREDENTIALS.user.password}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {TEST_CREDENTIALS.user.role}
                </Badge>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">🛠️ Test Admin</h3>
                <p className="text-sm">Email: {TEST_CREDENTIALS.admin.email}</p>
                <p className="text-sm">
                  Password: {TEST_CREDENTIALS.admin.password}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {TEST_CREDENTIALS.admin.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Firebase Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-400">
                <strong>🚨 CRITICAL ISSUES DETECTED:</strong>
                <br />
                1. <strong>Firestore Index Missing:</strong>{" "}
                <a
                  href="https://console.firebase.google.com/v1/r/project/furnish-view/firestore/indexes/?create_composite=Clxwcm9qZWN0cy9mdXJuaXNoLXZpZXcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Byb2R1Y3RzL2luZGV4ZXMvXxABGgoKBnN0YXR1cxABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI"
                  target="_blank"
                  className="underline text-blue-600"
                >
                  Click here to create index
                </a>
                <br />
                2. <strong>User Data Structure:</strong> Old format detected (id
                instead of uid)
                <br />
                3. <strong>Firestore Rules:</strong> Need to allow authenticated
                access
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <Button
                onClick={async () => {
                  try {
                    await fixUserData();
                    alert("User data fixed! Please refresh the page.");
                  } catch (error) {
                    alert(`Error: ${error}`);
                  }
                }}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Fix User Data
              </Button>

              <Button
                onClick={() => {
                  forceLogoutAndClearData();
                }}
                variant="outline"
                size="sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Force Logout
              </Button>

              <Button
                onClick={() => {
                  const cleared = clearOldUserCache();
                  alert(
                    `Cleared ${cleared} old cache entries. Please refresh the page.`
                  );
                }}
                variant="outline"
                size="sm"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cache
              </Button>

              <Button
                onClick={() => {
                  window.open(
                    "https://console.firebase.google.com/v1/r/project/furnish-view/firestore/indexes/?create_composite=Clxwcm9qZWN0cy9mdXJuaXNoLXZpZXcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Byb2R1Y3RzL2luZGV4ZXMvXxABGgoKBnN0YXR1cxABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI",
                    "_blank"
                  );
                }}
                variant="outline"
                size="sm"
              >
                <Info className="mr-2 h-4 w-4" />
                Create Index
              </Button>

              <Button
                onClick={createTestOrder}
                disabled={creatingOrder || !user}
                variant="outline"
                size="sm"
              >
                {creatingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Create Test Order
                  </>
                )}
              </Button>

              <Button
                onClick={checkOrders}
                disabled={checkingOrders}
                variant="outline"
                size="sm"
              >
                {checkingOrders ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Check Orders
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={runDiagnostics}
              disabled={diagnosing}
              variant="outline"
              className="w-full"
            >
              {diagnosing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Run Firebase Diagnostics
                </>
              )}
            </Button>

            {/* Diagnostics Results */}
            {diagnostics && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Diagnostics Results:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    {diagnostics.connection.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span>
                      Firebase Connection: {diagnostics.connection.message}
                    </span>
                  </div>

                  {diagnostics.permissions && (
                    <div className="flex items-center">
                      {diagnostics.permissions.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span>
                        Firestore Permissions: {diagnostics.permissions.message}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 p-2 bg-background rounded text-xs">
                    <strong>Config:</strong> Project ID:{" "}
                    {diagnostics.config.projectId || "Not set"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Runner */}
        <Card>
          <CardHeader>
            <CardTitle>Automated Test Runner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={runTests} disabled={testing} className="flex-1">
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Complete System Test
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <Info className="mr-2 h-4 w-4" />
                {showInstructions ? "Hide" : "Show"} Instructions
              </Button>
            </div>

            {/* Test Results */}
            {testResult && (
              <div
                className={`p-4 rounded-lg border ${
                  testResult.success
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                }`}
              >
                <div className="flex items-center mb-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <h3
                    className={`font-semibold ${
                      testResult.success
                        ? "text-green-800 dark:text-green-400"
                        : "text-red-800 dark:text-red-400"
                    }`}
                  >
                    {testResult.message}
                  </h3>
                </div>

                {testResult.success && testResult.cart && testResult.order && (
                  <div className="space-y-2 text-sm">
                    <p>✅ Cart Items: {testResult.cart.totalItems}</p>
                    <p>✅ Order Number: {testResult.order.orderNumber}</p>
                    <p>
                      ✅ Order Total: ${testResult.order.totalAmount.toFixed(2)}
                    </p>
                    <p>✅ All Firebase operations completed successfully</p>
                  </div>
                )}

                {testResult.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Error: {testResult.error}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Test Instructions */}
        {showInstructions && (
          <Card>
            <CardHeader>
              <CardTitle>Manual Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                {getTestInstructions()}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Test Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/auth/login" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  🔐 Login
                </Button>
              </a>
              <a href="/products" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  🛍️ Products
                </Button>
              </a>
              <a href="/cart" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  🛒 Cart
                </Button>
              </a>
              <a
                href="/profile/orders"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  📦 Orders
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Components Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Authentication</p>
                <p className="text-xs text-muted-foreground">Firebase Auth</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">Firestore</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Cart System</p>
                <p className="text-xs text-muted-foreground">Real-time</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Order Management</p>
                <p className="text-xs text-muted-foreground">Full lifecycle</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
