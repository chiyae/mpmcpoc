import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, AlertTriangle, Truck } from "lucide-react";
import { bulkStoreItems } from "@/lib/data";

export default function BulkStoreDashboard() {
  const totalItems = bulkStoreItems.length;
  const lowStockItems = bulkStoreItems.filter(item => item.quantity < item.reorderLevel).length;
  const pendingOrders = 5; // Mock data for now

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Unique items in bulk store
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items below reorder level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Internal orders from dispensary
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for more dashboard components */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <p>Chart or recent activity will be here.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>
              Stock transferred to the dispensary.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p>A list of recent transfers will be shown here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
