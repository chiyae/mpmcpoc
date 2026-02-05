
"use client";

import type { Item, Stock } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { useSettings } from "@/context/settings-provider";
import { formatItemName } from "@/lib/utils";

type ItemDetailsProps = {
  item: Item & { stock?: Stock };
};

export function ItemDetails({ item }: ItemDetailsProps) {
  const { formatCurrency } = useSettings();
  const hasStock = !!item.stock;
  
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold">{formatItemName(item)}</h3>
          <p className="text-sm text-muted-foreground">{item.itemCode}</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Badge variant="secondary">{item.category}</Badge>
          {hasStock && <Badge variant="outline">Location: {item.stock.locationId}</Badge>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Quantity</p>
          <p className="font-medium">{item.stock?.currentStockQuantity ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Dispensary Reorder</p>
          <p className="font-medium">{item.dispensaryReorderLevel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Bulk Store Reorder</p>
          <p className="font-medium">{item.bulkStoreReorderLevel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Unit of Measure</p>
          <p className="font-medium">{item.unitOfMeasure}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Batch No.</p>
          <p className="font-medium">{item.stock?.batchId ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Expiry Date</p>
          <p className="font-medium">
            {item.stock?.expiryDate ? format(new Date(item.stock.expiryDate), "dd/MM/yyyy") : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Unit Cost</p>
          <p className="font-medium">{formatCurrency(item.unitCost)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Selling Price</p>
          <p className="font-medium">{formatCurrency(item.sellingPrice)}</p>
        </div>
      </div>
    </div>
  );
}
