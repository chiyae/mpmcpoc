'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Item } from '@/lib/types';

interface FinalizeLpoStepProps {
  procurementList: Item[];
  vendorQuotes: Record<string, Record<string, number>>;
  onBack: () => void;
  onReset: () => void;
}

export function FinalizeLpoStep({ procurementList, vendorQuotes, onBack, onReset }: FinalizeLpoStepProps) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Step 3: Generate & Finalize LPO</CardTitle>
                <CardDescription>
                    This feature is under construction.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>The LPO review and finalization will be implemented here.</p>
                 <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={onBack}>Back</Button>
                    <Button onClick={onReset}>Start New Procurement</Button>
                </div>
            </CardContent>
        </Card>
    );
}
