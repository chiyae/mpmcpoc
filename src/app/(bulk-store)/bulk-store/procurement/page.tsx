'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus2, List, Scale, FileText } from 'lucide-react';

export default function ProcurementPage() {

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
            <Button>
              <FilePlus2 className="mr-2" />
              Identify Items
            </Button>
          </CardFooter>
        </Card>

        {/* Step 2: Compare Vendor Prices */}
        <Card>
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
            <Button disabled>
              Compare Prices (0 items)
            </Button>
          </CardFooter>
        </Card>

        {/* Step 3: Generate & Manage LPOs */}
        <Card>
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
    </div>
  );
}
