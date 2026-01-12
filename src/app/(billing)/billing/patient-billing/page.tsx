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
import { dispensaryItems, predefinedServices, bills, pendingDispensations } from '@/lib/data';
import type { Bill, BillItem, PaymentMethod, BillType, Service } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function PatientBillingPage() {
  const { toast } = useToast();
  const [patientName, setPatientName] = React.useState('');
  const [billItems, setBillItems] = React.useState<BillItem[]>([]);
  const [billType, setBillType] = React.useState<BillType>('Walk-in');
  const [prescriptionNumber, setPrescriptionNumber] = React.useState('');
  
  const [selectedMedicine, setSelectedMedicine] = React.useState<string | undefined>();
  const [medicineQuantity, setMedicineQuantity] = React.useState('1');
  const [selectedService, setSelectedService] = React.useState<string | undefined>();

  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = React.useState('');

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
    if (!selectedService) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a service.' });
        return;
    }

    const service = predefinedServices.find(s => s.id === selectedService);

    if (!service) {
        toast({ variant: 'destructive', title: 'Error', description: 'Service not found.' });
        return;
    }

    // Prevent adding the same service multiple times
    if (billItems.some(item => item.itemId === service.id)) {
        toast({ variant: 'destructive', title: 'Service Already Added', description: `${service.name} is already on the bill.`});
        return;
    }

    const newBillItem: BillItem = {
      itemId: service.id,
      itemName: service.name,
      quantity: 1,
      unitPrice: service.fee,
      total: service.fee,
    };
    setBillItems([...billItems, newBillItem]);
    setSelectedService(undefined);
  };

  const removeItemFromBill = (itemId: string) => {
    setBillItems(billItems.filter((item) => item.itemId !== itemId));
  };
  
  const grandTotal = billItems.reduce((total, item) => total + item.total, 0);

  const tenderedAmountValue = parseFloat(amountTendered);
  const change = (paymentMethod === 'Cash' && tenderedAmountValue >= grandTotal) 
    ? tenderedAmountValue - grandTotal 
    : 0;

  const isOpdAndNoPrescription = billType === 'OPD' && !prescriptionNumber;
  const canFinalize = billItems.length > 0 && !!patientName && !isOpdAndNoPrescription &&
    (paymentMethod === 'Invoice' || paymentMethod !== 'Cash' || (paymentMethod === 'Cash' && tenderedAmountValue >= grandTotal));


  const handleFinalizeBill = () => {
    if (!canFinalize) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields and ensure tendered amount is sufficient.' });
        return;
    }

    const newBill: Bill = {
        id: `BILL-${Date.now()}`,
        date: new Date().toISOString(),
        patientName,
        billType,
        prescriptionNumber: billType === 'OPD' ? prescriptionNumber : undefined,
        items: billItems,
        grandTotal,
        paymentDetails: {
          method: paymentMethod,
          amountTendered: paymentMethod === 'Cash' ? tenderedAmountValue : grandTotal,
          change,
          status: paymentMethod === 'Invoice' ? 'Unpaid' : 'Paid',
        }
    };

    // Add to the main bills history
    bills.unshift(newBill); 

    // If it was paid, add it to the dispensary queue
    if (newBill.paymentDetails.status === 'Paid') {
        pendingDispensations.unshift(newBill);
    }

    toast({
        title: "Bill Finalized",
        description: `Bill for ${patientName} has been generated.`,
    });

    // Reset state
    setPatientName('');
    setBillItems([]);
    setBillType('Walk-in');
    setPrescriptionNumber('');
    setPaymentMethod('Cash');
    setAmountTendered('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Patient Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Bill Type</Label>
                <RadioGroup
                  value={billType}
                  onValueChange={(value: BillType) => setBillType(value)}
                  className="flex items-center gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Walk-in" id="walk-in" />
                    <Label htmlFor="walk-in">Walk-in</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OPD" id="opd" />
                    <Label htmlFor="opd">OPD (Out-Patient)</Label>
                  </div>
                </RadioGroup>
              </div>

            {billType === 'OPD' && (
              <div>
                <Label htmlFor="prescriptionNumber">Prescription Number</Label>
                <Input
                  id="prescriptionNumber"
                  placeholder="Enter prescription number"
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
           <div>
            <Label htmlFor="patientName">Patient Name</Label>
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
                     <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                            {predefinedServices.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                    {service.name} - ${service.fee.toFixed(2)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
        <CardFooter className="flex flex-col items-end space-y-4">
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm self-end">
                <div className="col-span-2 text-right text-2xl font-bold">
                    Grand Total: ${grandTotal.toFixed(2)}
                </div>

                <div className="col-span-2">
                    <Label htmlFor='paymentMethod'>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger id="paymentMethod">
                            <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                            <SelectItem value="Bank">Bank Transfer / Card</SelectItem>
                            <SelectItem value="Invoice">Send as Invoice</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {paymentMethod === 'Cash' && (
                    <>
                         <div>
                            <Label htmlFor='amountTendered'>Amount Tendered</Label>
                            <Input
                                id="amountTendered"
                                type="number"
                                placeholder='0.00'
                                value={amountTendered}
                                onChange={(e) => setAmountTendered(e.target.value)}
                            />
                        </div>
                        <div>
                             <Label>Change</Label>
                             <div className="text-2xl font-bold p-2 border rounded-md bg-muted text-right">
                                ${change.toFixed(2)}
                             </div>
                        </div>
                    </>
                )}
            </div>
            <Button size="lg" onClick={handleFinalizeBill} disabled={!canFinalize}>
                Finalize & Generate Bill
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
