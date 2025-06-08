"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, PackageOpen } from 'lucide-react';

// Mock data - in a real app, this would come from an API
const mockOrders = [
  { id: 'ORD001', date: '2023-10-26', total: 2999.99, status: 'Delivered', items: 1 },
  { id: 'ORD002', date: '2023-11-15', total: 799.00, status: 'Shipped', items: 1 },
  { id: 'ORD003', date: '2023-12-01', total: 1250.50, status: 'Processing', items: 2 },
];

export default function OrderHistoryPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
         <div className="flex items-center space-x-3 mb-2">
            <PackageOpen className="h-10 w-10 text-primary" />
            <div>
                <CardTitle className="text-2xl font-headline">Order History</CardTitle>
                <CardDescription>View your past orders and their status.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {mockOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        order.status === 'Delivered' ? 'default' : 
                        order.status === 'Shipped' ? 'secondary' : 
                        'outline'
                      }
                      className={
                        order.status === 'Delivered' ? 'bg-green-500/20 text-green-700 dark:bg-green-700/30 dark:text-green-400 border-green-500/30' :
                        order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-700 dark:bg-blue-700/30 dark:text-blue-400 border-blue-500/30' :
                        ''
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{order.items}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
