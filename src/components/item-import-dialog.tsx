
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Stepper, StepperItem, StepperIndicator, StepperSeparator, StepperLabel, StepperDescription } from '@/components/ui/stepper';
import { UploadStep } from './import/upload-step';
import { MapColumnsStep } from './import/map-columns-step';
import { ReviewStep } from './import/review-step';
import { Item, Formulation, ItemCategory } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { z } from 'zod';

export type ParsedItem = Partial<Omit<Item, 'id' | 'itemCode'>>;

type ItemImportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

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


export function ItemImportDialog({ isOpen, onOpenChange }: ItemImportDialogProps) {
  const [step, setStep] = React.useState(0);
  const [csvData, setCsvData] = React.useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([]);
  const [parsedItems, setParsedItems] = React.useState<ParsedItem[]>([]);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleReset = () => {
    setStep(0);
    setCsvData([]);
    setCsvHeaders([]);
    setParsedItems([]);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      handleReset();
    }
    onOpenChange(open);
  };
  
  const handleImport = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
        return;
    }
    const batch = writeBatch(firestore);
    const itemsCollection = collection(firestore, 'items');

    const validItems = parsedItems.filter(item => itemSchema.safeParse(item).success);

    validItems.forEach(item => {
        const codePrefix = item.genericName!.substring(0, 3).toUpperCase();
        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        const itemCode = `${codePrefix}${codeSuffix}`;
        const itemRef = doc(itemsCollection, itemCode);
        batch.set(itemRef, { ...item, id: itemCode, itemCode });
    });
    
    try {
        await batch.commit();
        toast({
            title: 'Import Successful',
            description: `${validItems.length} items have been added to the master list.`,
        });
        handleClose(false);
    } catch(error) {
        console.error('Failed to import items:', error);
        toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'An error occurred while saving the items to the database.',
        });
    }

  };


  const steps = [
    { label: 'Upload CSV', description: 'Select your file.', content: <UploadStep onComplete={(data, headers) => {
        setCsvData(data);
        setCsvHeaders(headers);
        setStep(1);
    }} /> },
    { label: 'Map Columns', description: 'Match CSV fields.', content: <MapColumnsStep headers={csvHeaders} data={csvData} onComplete={(items) => {
        setParsedItems(items);
        setStep(2);
    }} onBack={() => setStep(0)} /> },
    { label: 'Review & Import', description: 'Verify and save.', content: <ReviewStep items={parsedItems} onImport={handleImport} onBack={() => setStep(1)} /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Items from CSV</DialogTitle>
          <DialogDescription>
            Follow these steps to bulk-add items to your master list.
          </DialogDescription>
        </DialogHeader>
        <Stepper currentStep={step} className="p-4">
            {steps.map((stepInfo, index) => (
                <StepperItem key={stepInfo.label}>
                    <StepperIndicator>{index + 1}</StepperIndicator>
                    <div>
                        <StepperLabel>{stepInfo.label}</StepperLabel>
                        <StepperDescription>{stepInfo.description}</StepperDescription>
                    </div>
                    <StepperSeparator />
                </StepperItem>
            ))}
        </Stepper>

        <div className="mt-4 min-h-[300px]">
            {steps[step].content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

