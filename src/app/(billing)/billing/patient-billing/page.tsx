'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { dispensaryItems } from '@/lib/data';
import type { Bill, BillItem } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function PatientBillingPage() {
  const { toast } = useToast();
  const [patientName, setPatientName] = React.useState('');
  const [billItems, setBillItems] = React.useState<BillItem[]>([]);
  const [serviceName, setServiceName] = React.useState('');
  const [serviceFee, setServiceFee] = React.useState('');

  const [selectedMedicine, setSelectedMedicine] = React.useState<string | undefined>();
  const [medicineQuantity, setMedicineQuantity] = React.useState('1');

  const addMedicineToBill = () => {
    if (!selectedMedicine || !medicineQuantity) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a medicine and quantity.' });
      return;
    }

    const item = dispensaryItems.find((i) => i.id === selectedMedicine);
    const quantity = parseInt(medicineQuantity, 10);

    if (!item) {
      toast({ variant: 'destructive', title: 'Error', description: 'Medicine not found.' });
      return;
    }

    if (quantity > item.quantity) {
      toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Only ${item.quantity} units of ${item.name} available.` });
      return;
    }
    
    // Check if item already exists in bill
    const existingItemIndex = billItems.findIndex(bi => bi.itemId === item.id);
    if(existingItemIndex > -1) {
        const newQuantity = billItems[existingItemIndex].quantity + quantity;
        if (newQuantity > item.quantity) {
            toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Cannot add ${quantity} more units. Only ${item.quantity - billItems[existingItemIndex].quantity} more available.` });
            return;
        }
        const newBillItems = [...billItems];
        newBillItems[existingItemIndex] = {
            ...newBillItems[existingItemIndex],
            quantity: newQuantity,
            total: newQuantity * item.sellingPrice,
        };
        setBillItems(newBillItems);

    } else {
        const newBillItem: BillItem = {
          itemId: item.id,
          itemName: item.name,
          quantity,
          unitPrice: item.sellingPrice,
          total: quantity * item.sellingPrice,
        };
        setBillItems([...billItems, newBillItem]);
    }
    setSelectedMedicine(undefined);
    setMedicineQuantity('1');
  };

  const addServiceToBill = () => {
    if (!serviceName || !serviceFee) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a service name and fee.' });
      return;
    }

    const fee = parseFloat(serviceFee);
    if (isNaN(fee) || fee <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid service fee.' });
      return;
    }

    const newBillItem: BillItem = {
      itemId: `SERVICE-${serviceName.replace(/\s+/g, '-').toUpperCase()}`,
      itemName: serviceName,
      quantity: 1,
      unitPrice: fee,
      total: fee,
    };
    setBillItems([...billItems, newBillItem]);
    setServiceName('');
    setServiceFee('');
  };

  const removeItemFromBill = (itemId: string) => {
    setBillItems(billItems.filter((item) => item.itemId !== itemId));
  };
  
  const grandTotal = billItems.reduce((total, item) => total + item.total, 0);

  const handleFinalizeBill = () => {
    if (!patientName) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a patient name.' });
        return;
    }
    if (billItems.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot create an empty bill.' });
        return;
    }

    // In a real app, you would send this to a backend to be processed
    // and then pushed to the dispensary for dispensing.
    // For now, we just show a success toast and clear the form.

    const newBill: Partial<Bill> = {
        id: `BILL-${Date.now()}`,
        patientName,
        items: billItems,
        grandTotal,
    };

    console.log("Finalized Bill:", newBill);

    toast({
        title: "Bill Finalized",
        description: `Bill for ${patientName} has been generated and sent for dispensation.`,
    });

    setPatientName('');
    setBillItems([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Patient Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
            <Input
              id="patientName"
              placeholder="Enter patient's full name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Billable Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Add Medicine */}
            <div className="space-y-2">
                <h3 className="font-medium">Add Medicine</h3>
                <div className="flex flex-col md:flex-row gap-2">
                    <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a medicine" />
                        </SelectTrigger>
                        <SelectContent>
                            {dispensaryItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.name} (In Stock: {item.quantity})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        placeholder="Qty"
                        className="w-full md:w-24"
                        value={medicineQuantity}
                        onChange={(e) => setMedicineQuantity(e.target.value)}
                        min="1"
                    />
                    <Button onClick={addMedicineToBill}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
                </div>
            </div>

            {/* Add Service */}
            <div className="space-y-2">
                 <h3 className="font-medium">Add Service</h3>
                <div className="flex flex-col md:flex-row gap-2">
                    <Input
                        placeholder="Service Name (e.g. Consultation)"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        className="flex-1"
                    />
                    <Input
                        type="number"
                        placeholder="Fee"
                        className="w-full md:w-32"
                        value={serviceFee}
                        onChange={(e) => setServiceFee(e.target.value)}
                        min="0"
                    />
                    <Button onClick={addServiceToBill}><PlusCircle className="mr-2 h-4 w-4" /> Add Service</Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">No items added to the bill yet.</TableCell>
                </TableRow>
              ) : (
                billItems.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItemFromBill(item.itemId)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col items-end space-y-2">
            <div className="text-xl font-bold">
                Grand Total: ${grandTotal.toFixed(2)}
            </div>
            <Button size="lg" onClick={handleFinalizeBill} disabled={billItems.length === 0 || !patientName}>
                Finalize & Generate Bill
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Extend BillItem to include an optional itemName
declare module '@/lib/types' {
    interface BillItem {
        itemName?: string;
    }
}
