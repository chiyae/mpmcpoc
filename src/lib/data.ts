import type { Item, Lpo, InternalOrder, Service, Bill } from './types';

const generateUsageHistory = () => {
  const history = [];
  const today = new Date();
  for (let i = 30; i > 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    history.push({
      date: date.toISOString().split('T')[0],
      quantity: Math.floor(Math.random() * 5) + 1,
    });
  }
  return history;
};

export const bulkStoreItems: Item[] = [
  {
    id: 'PAR500',
    name: 'Paracetamol 500mg',
    category: 'Medicine',
    unitOfMeasure: 'tablets',
    batchNumber: 'B12345',
    expiryDate: '2025-12-31',
    reorderLevel: 1000,
    unitCost: 0.02,
    sellingPrice: 0.10,
    quantity: 5000,
    location: 'Bulk Store',
    usageHistory: generateUsageHistory(),
  },
  {
    id: 'IBU200',
    name: 'Ibuprofen 200mg',
    category: 'Medicine',
    unitOfMeasure: 'tablets',
    batchNumber: 'B67890',
    expiryDate: '2026-06-30',
    reorderLevel: 800,
    unitCost: 0.05,
    sellingPrice: 0.15,
    quantity: 3500,
    location: 'Bulk Store',
    usageHistory: generateUsageHistory(),
  },
  {
    id: 'GAUZE-S',
    name: 'Gauze Swabs Small',
    category: 'Medical Supply',
    unitOfMeasure: 'boxes',
    batchNumber: 'GZ-S-001',
    expiryDate: '2027-01-01',
    reorderLevel: 50,
    unitCost: 2.50,
    sellingPrice: 5.00,
    quantity: 200,
    location: 'Bulk Store',
    usageHistory: generateUsageHistory(),
  },
  {
    id: 'SYR-10ML',
    name: 'Syringes 10ml',
    category: 'Consumable',
    unitOfMeasure: 'boxes',
    batchNumber: 'SYR-10-002',
    expiryDate: '2028-05-20',
    reorderLevel: 100,
    unitCost: 5.00,
    sellingPrice: 10.00,
    quantity: 150,
    location: 'Bulk Store',
    usageHistory: generateUsageHistory(),
  },
  {
    id: 'AMO500',
    name: 'Amoxicillin 500mg',
    category: 'Medicine',
    unitOfMeasure: 'capsules',
    batchNumber: 'AMX1122',
    expiryDate: '2024-10-31',
    reorderLevel: 500,
    unitCost: 0.10,
    sellingPrice: 0.25,
    quantity: 200, // Low stock for testing
    location: 'Bulk Store',
    usageHistory: generateUsageHistory(),
  },
];

export const dispensaryItems: Item[] = [
    {
        id: 'PAR500',
        name: 'Paracetamol 500mg',
        category: 'Medicine',
        unitOfMeasure: 'tablets',
        batchNumber: 'B12345',
        expiryDate: '2025-12-31',
        reorderLevel: 200,
        unitCost: 0.02,
        sellingPrice: 0.10,
        quantity: 500,
        location: 'Dispensary',
        usageHistory: generateUsageHistory(),
      },
      {
        id: 'IBU200',
        name: 'Ibuprofen 200mg',
        category: 'Medicine',
        unitOfMeasure: 'tablets',
        batchNumber: 'B67890',
        expiryDate: '2026-06-30',
        reorderLevel: 150,
        unitCost: 0.05,
        sellingPrice: 0.15,
        quantity: 300,
        location: 'Dispensary',
        usageHistory: generateUsageHistory(),
      },
      {
        id: 'GAUZE-S',
        name: 'Gauze Swabs Small',
        category: 'Medical Supply',
        unitOfMeasure: 'boxes',
        batchNumber: 'GZ-S-001',
        expiryDate: '2027-01-01',
        reorderLevel: 10,
        unitCost: 2.50,
        sellingPrice: 5.00,
        quantity: 5, // Low stock for testing
        location: 'Dispensary',
        usageHistory: generateUsageHistory(),
      },
      {
        id: 'VITC1000',
        name: 'Vitamin C 1000mg',
        category: 'Medicine',
        unitOfMeasure: 'tablets',
        batchNumber: 'VITC-001',
        expiryDate: '2024-08-15', // Near expiry
        reorderLevel: 100,
        unitCost: 0.08,
        sellingPrice: 0.20,
        quantity: 120,
        location: 'Dispensary',
        usageHistory: generateUsageHistory(),
      },
];

export const predefinedServices: Service[] = [
    { id: 'CONS-REG', name: 'Regular Consultation', fee: 50 },
    { id: 'CONS-SPEC', name: 'Specialist Consultation', fee: 100 },
    { id: 'LAB-BC', name: 'Blood Count Test', fee: 25 },
    { id: 'PROC-INJ', name: 'Injection Administration', fee: 15 },
];

export const pendingDispensations: Bill[] = [
    {
      id: 'BILL-2024-07-30-001',
      date: new Date().toISOString(),
      patientName: 'John Doe',
      billType: 'OPD',
      prescriptionNumber: 'PN-12345',
      items: [
        { itemId: 'PAR500', itemName: 'Paracetamol 500mg', quantity: 20, unitPrice: 0.1, total: 2.0 },
        { itemId: 'IBU200', itemName: 'Ibuprofen 200mg', quantity: 15, unitPrice: 0.15, total: 2.25 },
      ],
      grandTotal: 4.25,
      paymentDetails: { method: 'Cash', amountTendered: 5.00, change: 0.75, status: 'Paid' },
    },
    {
        id: 'BILL-2024-07-30-002',
        date: new Date().toISOString(),
        patientName: 'Jane Smith',
        billType: 'Walk-in',
        items: [
          { itemId: 'VITC1000', itemName: 'Vitamin C 1000mg', quantity: 10, unitPrice: 0.2, total: 2.0 },
        ],
        grandTotal: 2.00,
        paymentDetails: { method: 'Mobile Money', amountTendered: 2.00, change: 0, status: 'Paid' },
    }
  ];

// Mock LPOs
export const lpos: Lpo[] = [];

// Mock Internal Orders
export const internalOrders: InternalOrder[] = [];

// Mock Bills - This will now be populated from the billing page
export const bills: Bill[] = [];
