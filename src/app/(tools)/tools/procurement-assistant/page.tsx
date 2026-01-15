'use client';

import * as React from 'react';
import { Stepper, StepperItem, StepperIndicator, StepperSeparator, StepperContent, StepperLabel, StepperDescription } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { BuildProcurementListStep } from '@/components/procurement/build-procurement-list-step';
import type { Item } from '@/lib/types';
import { ComparePricesStep } from '@/components/procurement/compare-prices-step';
import { FinalizeLpoStep } from '@/components/procurement/finalize-lpo-step';


export default function ProcurementAssistantPage() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [procurementList, setProcurementList] = React.useState<Item[]>([]);
  const [vendorQuotes, setVendorQuotes] = React.useState<Record<string, Record<string, number>>>({});


  const steps = [
    {
      label: 'Build List',
      description: 'Select items for procurement.',
      content: (
        <BuildProcurementListStep
            initialList={procurementList}
            onComplete={(list) => {
                setProcurementList(list);
                setCurrentStep(1);
            }}
        />
      ),
    },
    {
      label: 'Compare Prices',
      description: 'Enter and compare vendor quotes.',
      content: <ComparePricesStep
        procurementList={procurementList}
        onComplete={(quotes) => {
            setVendorQuotes(quotes);
            setCurrentStep(2);
        }}
        onBack={() => setCurrentStep(0)}
       />,
    },
    {
      label: 'Generate LPO',
      description: 'Review and finalize the LPO.',
      content: <FinalizeLpoStep
        procurementList={procurementList}
        vendorQuotes={vendorQuotes}
        onBack={() => setCurrentStep(1)}
        onReset={() => {
            setProcurementList([]);
            setVendorQuotes({});
            setCurrentStep(0);
        }}
      />,
    },
  ];

  return (
    <div className="space-y-6">
       <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Procurement Assistant</h1>
            <p className="text-muted-foreground">
                A step-by-step tool to help you build, price, and generate purchase orders.
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
