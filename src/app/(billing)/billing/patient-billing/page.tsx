
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import type { Bill, BillItem, PaymentMethod, BillType, Service, Item, Stock } from '@/lib/types';
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSettings } from '@/context/settings-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { formatItemName } from '@/lib/utils';


export default function PatientBillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { formatCurrency } = useSettings();

  // --- Data Fetching ---
  const itemsCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'items') : null),
    [firestore]
  );
  const { data: allItems, isLoading: areItemsLoading } = useCollection<Item>(itemsCollectionQuery);

  const servicesCollectionQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'services') : null),
    [firestore]
  );
  const { data: allServices, isLoading: areServicesLoading } = useCollection<Service>(servicesCollectionQuery);
  
  const dispensaryStockQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'stocks'), where('locationId', '==', 'dispensary')) : null,
    [firestore]
  );
  const { data: dispensaryStocks, isLoading: areStocksLoading } = useCollection<Stock>(dispensaryStockQuery);
  
  const isLoading = areItemsLoading || areServicesLoading || areStocksLoading;

  const billingLocationId = 'dispensary';
  
  const availableItems = React.useMemo(() => {
    if (!allItems || !dispensaryStocks) return [];
    return allItems.map(item => {
        const totalQuantity = dispensaryStocks
            .filter(s => s.itemId === item.id)
            .reduce((sum, s) => sum + s.currentStockQuantity, 0);
        
        return {
            ...item,
            stockQuantity: totalQuantity,
        };
    });
  }, [allItems, dispensaryStocks]);


  // --- Form State ---
  const [patientName, setPatientName] = React.useState('');
  const [billItems, setBillItems] = React.useState<BillItem[]>([]);
  const [billType, setBillType] = React.useState<BillType>('Walk-in');
  const [prescriptionNumber, setPrescriptionNumber] = React.useState('');
  
  // --- Autocomplete State ---
  const [selectedMedicine, setSelectedMedicine] = React.useState<string | undefined>();
  const [medicineSearch, setMedicineSearch] = React.useState('');
  const [medicineQuantity, setMedicineQuantity] = React.useState('1');

  const [selectedService, setSelectedService] = React.useState<string | undefined>();
  const [serviceSearch, setServiceSearch] = React.useState('');
  
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = React.useState('');
  const [discount, setDiscount] = React.useState('0');

  const filteredMedicines = React.useMemo(() => {
    if (!medicineSearch) return [];
    return availableItems.filter(item => 
        formatItemName(item).toLowerCase().startsWith(medicineSearch.toLowerCase())
    );
  }, [medicineSearch, availableItems]);
  
  const filteredServices = React.useMemo(() => {
    if (!serviceSearch) return [];
    return allServices?.filter(service => 
        service.name.toLowerCase().startsWith(serviceSearch.toLowerCase())
    ) || [];
  }, [serviceSearch, allServices]);

  const addMedicineToBill = () => {
    if (!selectedMedicine || !medicineQuantity || !availableItems) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a medicine and quantity.' });
      return;
    }

    const item = availableItems.find((i) => i.id === selectedMedicine);
    const quantity = parseInt(medicineQuantity, 10);

    if (!item) {
      toast({ variant: 'destructive', title: 'Error', description: 'Medicine not found.' });
      return;
    }
    
    const existingItem = billItems.find(bi => bi.itemId === item.id);
    const quantityOnBill = existingItem ? existingItem.quantity : 0;
    const requestedTotal = quantityOnBill + quantity;
    
    if (requestedTotal > item.stockQuantity) {
        toast({ 
            variant: 'destructive', 
            title: 'Insufficient Stock', 
            description: `Cannot add ${quantity} of ${formatItemName(item)}. You already have ${quantityOnBill} on the bill, and only ${item.stockQuantity} are available in total.` 
        });
        return;
    }
    
    const existingItemIndex = billItems.findIndex(bi => bi.itemId === item.id);
    if(existingItemIndex > -1) {
        const newQuantity = billItems[existingItemIndex].quantity + quantity;
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
          itemName: formatItemName(item),
          quantity,
          unitPrice: item.sellingPrice,
          total: quantity * item.sellingPrice,
        };
        setBillItems([...billItems, newBillItem]);
    }
    setSelectedMedicine(undefined);
    setMedicineSearch('');
    setMedicineQuantity('1');
  };

  const addServiceToBill = () => {
    if (!selectedService || !allServices) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a service.' });
        return;
    }

    const service = allServices.find(s => s.id === selectedService);

    if (!service) {
        toast({ variant: 'destructive', title: 'Error', description: 'Service not found.' });
        return;
    }

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
    setServiceSearch('');
  };

  const removeItemFromBill = (itemId: string) => {
    setBillItems(billItems.filter((item) => item.itemId !== itemId));
  };
  
  const subtotal = billItems.reduce((total, item) => total + item.total, 0);
  const discountAmount = parseFloat(discount) || 0;
  const grandTotal = subtotal - discountAmount;

  const tenderedAmountValue = parseFloat(amountTendered);
  const change = (paymentMethod === 'Cash' && tenderedAmountValue >= grandTotal) 
    ? tenderedAmountValue - grandTotal 
    : 0;

  const isOpdAndNoPrescription = billType === 'OPD' && !prescriptionNumber;
  const canFinalize = billItems.length > 0 && !!patientName && !isOpdAndNoPrescription &&
    (paymentMethod === 'Invoice' || paymentMethod !== 'Cash' || (paymentMethod === 'Cash' && tenderedAmountValue >= grandTotal));


  const handleFinalizeBill = async () => {
    if (!canFinalize || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields and ensure tendered amount is sufficient.' });
        return;
    }

    const billId = `BILL-${Date.now()}`;
    const billRef = doc(firestore, 'billings', billId);
    
    const newBill: Omit<Bill, 'prescriptionNumber'> & { prescriptionNumber?: string } = {
        id: billId,
        date: new Date().toISOString(),
        patientName,
        billType,
        items: billItems,
        subtotal: subtotal,
        discount: discountAmount,
        grandTotal,
        paymentDetails: {
          method: paymentMethod,
          amountTendered: paymentMethod === 'Cash' ? tenderedAmountValue : grandTotal,
          change,
          status: paymentMethod === 'Invoice' ? 'Unpaid' : 'Paid',
        },
        dispensingLocationId: billingLocationId,
        isDispensed: false,
    };
    
    if (billType === 'OPD' && prescriptionNumber) {
      newBill.prescriptionNumber = prescriptionNumber;
    }

    try {
        const batch = writeBatch(firestore);
        batch.set(billRef, newBill);
        await batch.commit();

        toast({
            title: paymentMethod === 'Invoice' ? "Invoice Finalized" : "Bill Finalized",
            description: `A new document for ${patientName} has been generated.`,
        });

        // Reset state
        setPatientName('');
        setBillItems([]);
        setBillType('Walk-in');
        setPrescriptionNumber('');
        setPaymentMethod('Cash');
        setAmountTendered('');
        setDiscount('0');
    } catch(error) {
        console.error("Error finalizing bill: ", error);
        toast({
            variant: 'destructive',
            title: 'Failed to save bill',
            description: 'Could not save the bill to the database.',
        });
    }
  };
  
  const finalizeButtonText = paymentMethod === 'Invoice' ? 'Finalize & Generate Invoice' : 'Finalize & Generate Bill';

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Patient Billing</h1>
                <p className="text-muted-foreground">Create and finalize new bills or invoices for patients.</p>
            </div>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient & Bill Details</CardTitle>
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
                <div className="space-y-2">
                    <h3 className="font-medium">Add Medicine</h3>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="relative flex-1">
                          <Input
                              placeholder="Search for a medicine..."
                              value={medicineSearch}
                              onChange={(e) => {
                                  setMedicineSearch(e.target.value);
                                  setSelectedMedicine(undefined);
                              }}
                              disabled={isLoading}
                          />
                          {medicineSearch.length > 0 && (
                              <div className="absolute z-10 w-full bg-card border rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                                  {filteredMedicines.length > 0 ? filteredMedicines.map(item => (
                                      <div
                                          key={item.id}
                                          className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                          onMouseDown={(e) => {
                                              e.preventDefault();
                                              if (item.stockQuantity > 0) {
                                                  setSelectedMedicine(item.id);
                                                  setMedicineSearch(formatItemName(item));
                                              } else {
                                                  toast({ variant: 'destructive', title: 'Out of Stock', description: `${formatItemName(item)} cannot be selected.`})
                                              }
                                          }}
                                      >
                                          <span>{formatItemName(item)}</span>
                                          <Badge variant={item.stockQuantity > 0 ? 'secondary' : 'destructive'}>
                                              {item.stockQuantity > 0 ? `Stock: ${item.stockQuantity}` : 'Out of Stock'}
                                          </Badge>
                                      </div>
                                  )) : <div className="p-2 text-sm text-muted-foreground">No matching medicine found.</div>}
                              </div>
                          )}
                      </div>
                        <Input
                            type="number"
                            placeholder="Qty"
                            className="w-full md:w-24"
                            value={medicineQuantity}
                            onChange={(e) => setMedicineQuantity(e.target.value)}
                            min="1"
                        />
                        <Button onClick={addMedicineToBill} disabled={isLoading || !selectedMedicine}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-medium">Add Service</h3>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="relative flex-1">
                        <Input
                              placeholder="Search for a service..."
                              value={serviceSearch}
                              onChange={(e) => {
                                  setServiceSearch(e.target.value);
                                  setSelectedService(undefined);
                              }}
                              disabled={areServicesLoading}
                          />
                          {serviceSearch.length > 0 && (
                              <div className="absolute z-10 w-full bg-card border rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                                {filteredServices.length > 0 ? filteredServices.map(service => (
                                      <div
                                          key={service.id}
                                          className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                          onMouseDown={(e) => {
                                              e.preventDefault();
                                              setSelectedService(service.id);
                                              setServiceSearch(service.name);
                                          }}
                                      >
                                          <span>{service.name} - {formatCurrency(service.fee)}</span>
                                      </div>
                                  )) : <div className="p-2 text-sm text-muted-foreground">No matching service found.</div>}
                              </div>
                          )}
                      </div>
                        <Button onClick={addServiceToBill} disabled={areServicesLoading || !selectedService}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                        </Button>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Bill Details */}
        <div className="lg:col-span-3">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Bill Preview</CardTitle>
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
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
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
                <div className="space-y-2 w-full max-w-sm self-end">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <Label htmlFor='discount'>Discount</Label>
                        <Input
                            id="discount"
                            type="number"
                            placeholder='0.00'
                            className="w-32 h-8 text-right"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                        />
                    </div>
                    <hr/>
                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>Grand Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm self-end">
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
                                    {formatCurrency(change)}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <Button size="lg" onClick={handleFinalizeBill} disabled={!canFinalize}>
                    {finalizeButtonText}
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
