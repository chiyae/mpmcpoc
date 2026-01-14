'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus2, List, Scale, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BuildProcurementListDialog } from '@/components/build-procurement-list-dialog';
import type { Item, Vendor } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { CompareVendorPricesDialog } from '@/components/compare-vendor-prices-dialog';

export default function ProcurementPage() {
  const firestore = useFirestore();
  const [procurementList, setProcurementList] = React.useState<Item[]>([]);
  const [isBuildListOpen, setIsBuildListOpen] = React.useState(false);
  const [isComparePricesOpen, setIsComparePricesOpen] = React.useState(false);

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsQuery);

  const handleListBuilt = (selectedItems: Item[]) => {
    setProcurementList(selectedItems);
    setIsBuildListOpen(false);
  }

  const handleOpenCompareDialog = () => {
    if (procurementList.length > 0) {
      setIsComparePricesOpen(true);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Procurement Workflow</h1>
        <p className="text-muted-foreground">
          A step-by-step tool to identify procurement needs, compare vendor prices, and generate LPOs.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Build Procurement List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <List className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Step 1</p>
                <CardTitle>Build Procurement List</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Identify items that need to be purchased, either from low-stock alerts or by manual selection.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsBuildListOpen(true)}>
              <FilePlus2 className="mr-2" />
              {procurementList.length > 0 ? `Edit List (${procurementList.length})` : 'Identify Items'}
            </Button>
          </CardFooter>
        </Card>

        {/* Step 2: Compare Vendor Prices */}
        <Card className={procurementList.length === 0 ? 'bg-muted/50' : ''}>
          <CardHeader>
             <div className="flex items-center gap-4">
               <div className="bg-primary/10 p-3 rounded-full">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Step 2</p>
                <CardTitle>Compare Vendor Prices</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Enter and compare quotes from different suppliers for the items on your procurement list.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button onClick={handleOpenCompareDialog} disabled={procurementList.length === 0}>
              Compare Prices ({procurementList.length} items)
            </Button>
          </CardFooter>
        </Card>

        {/* Step 3: Generate & Manage LPOs */}
        <Card className="bg-muted/50">
          <CardHeader>
             <div className="flex items-center gap-4">
               <div className="bg-primary/10 p-3 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Step 3</p>
                <CardTitle>Generate & Manage LPOs</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Automatically create purchase orders based on the best prices and manage their lifecycle.
            </CardDescription>
          </CardContent>
           <CardFooter>
            <Button disabled>
              Generate LPOs
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* LPO Management Table */}
      <Card id="pending-lpos">
        <CardHeader>
          <CardTitle>Generated LPOs</CardTitle>
          <CardDescription>
            Manage, edit, and track the status of your generated Local Purchase Orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Generated LPOs will appear here once you complete the workflow.</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isBuildListOpen} onOpenChange={setIsBuildListOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Build Procurement List</DialogTitle>
                <DialogDescription>
                    Select items to add to your procurement list. Items below their reorder level are pre-selected.
                </DialogDescription>
            </DialogHeader>
            <BuildProcurementListDialog 
                onConfirm={handleListBuilt} 
                initialSelectedItems={procurementList}
            />
        </DialogContent>
      </Dialog>

      <Dialog open={isComparePricesOpen} onOpenChange={setIsComparePricesOpen}>
        <DialogContent className="max-w-6xl">
            <DialogHeader>
                <DialogTitle>Compare Vendor Prices</DialogTitle>
                <DialogDescription>
                    Enter the unit price from each vendor for the items below. The best price will be highlighted.
                </DialogDescription>
            </DialogHeader>
            <CompareVendorPricesDialog 
                items={procurementList}
                vendors={vendors || []}
                isLoading={areVendorsLoading}
                onConfirm={() => setIsComparePricesOpen(false)}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
