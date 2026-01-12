
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

export default function GeneralSettingsPage() {
  const { toast } = useToast();

  // Mock state for clinic info
  const [clinicName, setClinicName] = React.useState('MediTrack Pro Clinic');
  const [clinicAddress, setClinicAddress] = React.useState('123 Health St, Wellness City');
  const [clinicPhone, setClinicPhone] = React.useState('+1-202-555-0182');

  // Mock state for currency
  const [currency, setCurrency] = React.useState('USD');

  const handleSaveClinicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would save this to Firestore
    console.log({ clinicName, clinicAddress, clinicPhone });
    toast({
      title: "Clinic Information Updated",
      description: "Your clinic's details have been saved.",
    });
  };

  const handleSaveCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would save this to Firestore
    console.log({ currency });
    toast({
      title: "Currency Settings Updated",
      description: `The default currency has been set to ${currency}.`,
    });
  };

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
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Save Currency</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
