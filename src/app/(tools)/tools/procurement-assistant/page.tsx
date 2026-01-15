
'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Stepper, StepperItem, StepperIndicator, StepperSeparator, StepperLabel, StepperDescription } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { BuildProcurementListStep } from '@/components/procurement/build-procurement-list-step';
import type { Item, ProcurementSession } from '@/lib/types';
import { ComparePricesStep } from '@/components/procurement/compare-prices-step';
import { FinalizeLpoStep } from '@/components/procurement/finalize-lpo-step';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProcurementAssistantPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const sessionId = searchParams.get('session');

  // Fetch the session data if a session ID is present
  const sessionDocRef = useMemoFirebase(() => (firestore && sessionId ? doc(firestore, 'procurementSessions', sessionId) : null), [firestore, sessionId]);
  const { data: sessionData, isLoading: isSessionLoading } = useDoc<ProcurementSession>(sessionDocRef);
  
  const [currentStep, setCurrentStep] = React.useState(0);
  
  // Local state for the assistant's data
  const [procurementList, setProcurementList] = React.useState<string[]>([]);
  const [vendorQuotes, setVendorQuotes] = React.useState<Record<string, Record<string, number>>>({});
  const [lpoQuantities, setLpoQuantities] = React.useState<Record<string, number>>({});


  // Effect to populate local state from fetched session data
  React.useEffect(() => {
    if (sessionData) {
      setProcurementList(sessionData.procurementList || []);
      setVendorQuotes(sessionData.vendorQuotes || {});
      setLpoQuantities(sessionData.lpoQuantities || {});
    }
  }, [sessionData]);

  // Function to save the current state to Firestore
  const saveSession = async (data: Partial<ProcurementSession>, showToast: boolean = false) => {
    if (!sessionDocRef) return;
    try {
      await setDoc(sessionDocRef, data, { merge: true });
      if (showToast) {
        toast({ title: "Progress Saved", description: "Your procurement session has been saved." });
      }
    } catch (error) {
      console.error("Failed to save session:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your progress." });
    }
  };

  const steps = [
    {
      label: 'Build List',
      description: 'Select items for procurement.',
      content: (
        <BuildProcurementListStep
            key={`step1-${sessionId}`} // Add key to force re-render on session change
            initialList={procurementList}
            onComplete={async (list) => {
              const itemIds = list.map(item => item.id);
              setProcurementList(itemIds);
              await saveSession({ procurementList: itemIds }, true);
              setCurrentStep(1);
            }}
        />
      ),
    },
    {
      label: 'Compare Prices',
      description: 'Enter and compare vendor quotes.',
      content: <ComparePricesStep
        key={`step2-${sessionId}`}
        procurementListIds={procurementList}
        initialQuotes={vendorQuotes}
        onComplete={async (quotes) => {
            setVendorQuotes(quotes);
            await saveSession({ vendorQuotes: quotes }, true);
            setCurrentStep(2);
        }}
        onBack={() => setCurrentStep(0)}
       />,
    },
    {
      label: 'Generate LPO',
      description: 'Review and finalize the LPO.',
      content: <FinalizeLpoStep
        key={`step3-${sessionId}`}
        procurementListIds={procurementList}
        vendorQuotes={vendorQuotes}
        initialQuantities={lpoQuantities}
        onQuantitiesChange={async (quantities) => {
            setLpoQuantities(quantities);
            await saveSession({ lpoQuantities: quantities }, false); // Do not show toast on quantity change
        }}
        onBack={() => setCurrentStep(1)}
        onReset={() => {
            router.push('/tools/procurement-sessions');
        }}
      />,
    },
  ];

  if (!sessionId) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg text-muted-foreground">No procurement session selected.</p>
            <Button onClick={() => router.push('/tools/procurement-sessions')} className="mt-4">
                Go to Procurement Sessions
            </Button>
        </div>
      );
  }

  if (isSessionLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-6">
       <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Procurement Assistant</h1>
            <p className="text-muted-foreground">
                Session ID: <span className="font-mono text-sm bg-muted p-1 rounded">{sessionId}</span>
            </p>
        </header>

        <Stepper initialStep={0} currentStep={currentStep} onStepClick={setCurrentStep} className='w-full'>
            {steps.map((step, index) => (
                <StepperItem key={step.label} >
                    <StepperIndicator>{index + 1}</StepperIndicator>
                    <div>
                        <StepperLabel>{step.label}</StepperLabel>
                        <StepperDescription>{step.description}</StepperDescription>
                    </div>
                     <StepperSeparator />
                </StepperItem>
            ))}
        </Stepper>

        <div className="mt-8">
            {steps[currentStep].content}
        </div>
    </div>
  );
}

    