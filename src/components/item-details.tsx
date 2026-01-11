"use client";

import type { Item } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

type ItemDetailsProps = {
  item: Item;
};

export function ItemDetails({ item }: ItemDetailsProps) {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.id}</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Badge variant="secondary">{item.category}</Badge>
          <Badge variant="outline">Location: {item.location}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Quantity</p>
          <p className="font-medium">{item.quantity}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Reorder Level</p>
          <p className="font-medium">{item.reorderLevel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Unit of Measure</p>
          <p className="font-medium">{item.unitOfMeasure}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Batch No.</p>
          <p className="font-medium">{item.batchNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Expiry Date</p>
          <p className="font-medium">
            {format(new Date(item.expiryDate), "dd/MM/yyyy")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Unit Cost</p>
          <p className="font-medium">${item.unitCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Selling Price</p>
          <p className="font-medium">${item.sellingPrice.toFixed(2)}</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>
            Recent usage for the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Quantity Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.usageHistory.length > 0 ? (
                  [...item.usageHistory].reverse().map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(record.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.quantity}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="h-24 text-center"
                    >
                      No usage history available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
