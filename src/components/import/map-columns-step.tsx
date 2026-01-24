
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ParsedItem } from '../item-import-dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Formulation, ItemCategory } from '@/lib/types';


interface MapColumnsStepProps {
  headers: string[];
  data: Record<string, string>[];
  onComplete: (parsedItems: ParsedItem[]) => void;
  onBack: () => void;
}

const itemFields: (keyof ParsedItem)[] = [
    'genericName', 'brandName', 'formulation', 'strengthValue', 'strengthUnit', 
    'concentrationValue', 'concentrationUnit', 'packageSizeValue', 'packageSizeUnit', 
    'category', 'unitOfMeasure', 'dispensaryReorderLevel', 'bulkStoreReorderLevel', 'unitCost', 'sellingPrice'
];

// Simple fuzzy matching to suggest a column
const getSuggestedMapping = (field: string, headers: string[]): string => {
    const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const header of headers) {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedHeader === normalizedField) {
            return header;
        }
    }
    return '';
}

export function MapColumnsStep({ headers, data, onComplete, onBack }: MapColumnsStepProps) {
  const [mapping, setMapping] = React.useState<Record<string, string>>(() => {
    const initialMapping: Record<string, string> = {};
    itemFields.forEach(field => {
        initialMapping[field] = getSuggestedMapping(field, headers);
    });
    return initialMapping;
  });

  const handleMappingChange = (field: keyof ParsedItem, csvHeader: string) => {
    setMapping(prev => ({ ...prev, [field]: csvHeader }));
  };
  
  const handleNext = () => {
    const parsedData: ParsedItem[] = data.map(row => {
        const newItem: ParsedItem = {};
        for (const field of itemFields) {
            const csvHeader = mapping[field];
            if (csvHeader && row[csvHeader] !== undefined && row[csvHeader] !== null) {
                const value = row[csvHeader];
                
                const numericFields: (keyof ParsedItem)[] = [
                    'strengthValue', 'concentrationValue', 'packageSizeValue', 'dispensaryReorderLevel', 
                    'bulkStoreReorderLevel', 'unitCost', 'sellingPrice'
                ];
                
                if (numericFields.includes(field)) {
                    (newItem as any)[field] = parseFloat(value) || 0;
                } else if (field === 'formulation') {
                    (newItem as any)[field] = Object.values(Formulation).includes(value as Formulation) ? value : undefined;
                } else if (field === 'category') {
                     (newItem as any)[field] = Object.values(ItemCategory).includes(value as ItemCategory) ? value : undefined;
                } else {
                    (newItem as any)[field] = value;
                }
            }
        }
        return newItem;
    });
    onComplete(parsedData);
  }

  return (
    <div>
        <p className="text-sm text-muted-foreground mb-4">
            Match the columns from your CSV file to the corresponding fields in the application. We've tried to guess for you.
        </p>
      <ScrollArea className="h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
            {itemFields.map(field => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="capitalize">
                    {field.replace(/([A-Z])/g, ' $1')}
                    {['genericName', 'formulation', 'category', 'unitOfMeasure'].includes(field) && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={mapping[field]}
                  onValueChange={(value) => handleMappingChange(field, value)}
                >
                  <SelectTrigger id={field}>
                    <SelectValue placeholder="Select CSV column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">- Do not import -</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
      </ScrollArea>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next: Review & Import</Button>
      </div>
    </div>
  );
}

