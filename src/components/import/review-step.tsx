
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { z } from 'zod';
import { ScrollArea } from '../ui/scroll-area';
import { ParsedItem } from '../item-import-dialog';
import { Formulation, ItemCategory } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface ReviewStepProps {
  items: ParsedItem[];
  onImport: () => void;
  onBack: () => void;
}

const itemSchema = z.object({
  genericName: z.string().min(1, 'Generic Name is required'),
  formulation: z.nativeEnum(Formulation),
  category: z.nativeEnum(ItemCategory),
  unitOfMeasure: z.string().min(1, 'Unit of Measure is required'),
  dispensaryReorderLevel: z.number().nonnegative(),
  bulkStoreReorderLevel: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  brandName: z.string().optional(),
  strengthValue: z.number().optional(),
  strengthUnit: z.string().optional(),
  concentrationValue: z.number().optional(),
  concentrationUnit: z.string().optional(),
  packageSizeValue: z.number().optional(),
  packageSizeUnit: z.string().optional(),
});


export function ReviewStep({ items, onImport, onBack }: ReviewStepProps) {
  const validationResults = React.useMemo(() => {
    return items.map(item => itemSchema.safeParse(item));
  }, [items]);
  
  const validItemsCount = validationResults.filter(r => r.success).length;
  const invalidItemsCount = items.length - validItemsCount;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Review the items to be imported. Items with errors will be skipped. You have{' '}
        <span className="font-bold text-green-600">{validItemsCount} valid</span> items and{' '}
        <span className="font-bold text-destructive">{invalidItemsCount} invalid</span> items.
      </p>

      {invalidItemsCount > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
                Some rows have errors and will be skipped. Hover over the red icons in the table below to see why.
            </AlertDescription>
          </Alert>
      )}

      <ScrollArea className="h-96 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Brand Name</TableHead>
              <TableHead>Formulation</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const result = validationResults[index];
              return (
                <TableRow key={index} className={!result.success ? 'bg-destructive/10' : ''}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {result.success ? <p>This item is valid.</p> :
                            <ul>
                                {(result as z.SafeParseError<any>).error.errors.map(err => (
                                    <li key={err.path.join('.')}>- {err.path.join('.')}: {err.message}</li>
                                ))}
                            </ul>
                          }
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>{item.genericName || '-'}</TableCell>
                  <TableCell>{item.brandName || '-'}</TableCell>
                  <TableCell>{item.formulation || '-'}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onImport} disabled={validItemsCount === 0}>
          Import {validItemsCount} Valid Items
        </Button>
      </div>
    </div>
  );
}
