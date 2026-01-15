'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Item, Vendor } from '@/lib/types';

interface ComparePricesStepProps {
  procurementList: Item[];
  onComplete: (vendorQuotes: Record<string, Record<string, number>>) => void;
  onBack: () => void;
}

export function ComparePricesStep({ procurementList, onComplete, onBack }: ComparePricesStepProps) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Step 2: Compare Vendor Prices</CardTitle>
                <CardDescription>
                    This feature is under construction.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>The price comparison grid will be implemented here.</p>
                <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={onBack}>Back</Button>
                    <Button onClick={() => onComplete({})}>Next: Finalize LPO</Button>
                </div>
            </CardContent>
        </Card>
    );
}
