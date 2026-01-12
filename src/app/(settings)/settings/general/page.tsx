
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface ClinicSettings {
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    currency: string;
}

const defaultSettings: ClinicSettings = {
    clinicName: 'MediTrack Pro Clinic',
    clinicAddress: '123 Health St, Wellness City',
    clinicPhone: '+1-555-123-4567',
    currency: 'USD',
};

export default function GeneralSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);


  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'clinic') : null),
    [firestore]
  );
  const { data: settingsData, isLoading, error } = useDoc<ClinicSettings>(settingsDocRef);

  // Form state
  const [clinicName, setClinicName] = React.useState('');
  const [clinicAddress, setClinicAddress] = React.useState('');
  const [clinicPhone, setClinicPhone] = React.useState('');
  const [currency, setCurrency] = React.useState('USD');

  // Effect to seed the database with initial data if none exists
  React.useEffect(() => {
    if (!isLoading && !settingsData && settingsDocRef) {
        setDoc(settingsDocRef, defaultSettings, { merge: true }).then(() => {
            toast({
                title: "Initial Settings Created",
                description: "Default clinic settings have been saved.",
            });
        }).catch(err => {
            console.error("Failed to create initial settings:", err);
        });
    }
  }, [isLoading, settingsData, settingsDocRef, toast]);


  // React.useEffect to update form state when data loads from Firestore
  React.useEffect(() => {
    const dataToDisplay = settingsData || defaultSettings;
    setClinicName(dataToDisplay.clinicName || '');
    setClinicAddress(dataToDisplay.clinicAddress || '');
    setClinicPhone(dataToDisplay.clinicPhone || '');
    setCurrency(dataToDisplay.currency || 'USD');
  }, [settingsData]);


  const handleSaveClinicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsDocRef) return;
    try {
        await setDoc(settingsDocRef, {
            clinicName,
            clinicAddress,
            clinicPhone
        }, { merge: true });

        toast({
            title: "Clinic Information Updated",
            description: "Your clinic's details have been saved.",
        });
    } catch (error) {
        console.error("Failed to save clinic info:", error);
        toast({
            variant: "destructive",
            title: "Error Saving",
            description: "Could not save clinic information.",
        });
    }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsDocRef) return;
     try {
        await setDoc(settingsDocRef, { currency }, { merge: true });
        toast({
            title: "Currency Settings Updated",
            description: `The default currency has been set to ${currency}.`,
        });
    } catch (error) {
        console.error("Failed to save currency:", error);
        toast({
            variant: "destructive",
            title: "Error Saving",
            description: "Could not save currency settings.",
        });
    }
  };

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view or edit general settings.</p>
      </div>
    );
  }

  if (isLoading || !isClient) {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
             <header className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
                <p className="text-muted-foreground">
                    Manage general information and configurations for the application.
                </p>
            </header>
            <Card>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
            <p className="text-muted-foreground">
                Manage general information and configurations for the application.
            </p>
        </header>

      {/* Clinic Information Card */}
      <Card>
        <form onSubmit={handleSaveClinicInfo}>
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
            <CardDescription>
              This information will appear on bills and other official documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicAddress">Address</Label>
              <Input
                id="clinicAddress"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicPhone">Phone Number</Label>
              <Input
                id="clinicPhone"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Save Clinic Info</Button>
          </CardFooter>
        </form>
      </Card>

      {/* Currency Settings Card */}
      <Card>
        <form onSubmit={handleSaveCurrency}>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Set the default currency used for all financial transactions and reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {isClient && (
                <div className="space-y-2 max-w-xs">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency">
                            <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD - United States Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                            <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                            <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                            <SelectItem value="MWK">MWK - Malawian Kwacha</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             )}
          </CardContent>
          <CardFooter className="flex justify-end">
             {isClient && <Button type="submit">Save Currency</Button>}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    