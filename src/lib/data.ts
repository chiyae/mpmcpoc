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

// Mock LPOs
export const lpos: Lpo[] = [];

// Mock Internal Orders
export const internalOrders: InternalOrder[] = [];

// Mock Bills
export const bills: Bill[] = [];
