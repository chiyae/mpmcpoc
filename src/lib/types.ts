export type ItemCategory = 'Medicine' | 'Medical Supply' | 'Consumable';
export type Location = 'Bulk Store' | 'Dispensary';
export type OrderStatus = 'Pending' | 'Approved' | 'Issued' | 'Rejected';

export interface Item {
  id: string; // unique item code
  name: string;
  category: ItemCategory;
  unitOfMeasure: string;
  batchNumber: string;
  expiryDate: string; // ISO date string
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  quantity: number;
  location: Location;
  usageHistory: { date: string; quantity: number }[];
}

export interface InternalOrderItem {
  itemId: string;
  quantity: number;
}

export interface InternalOrder {
  id: string; // Order ID
  date: string; // ISO date string
  requestedItems: InternalOrderItem[];
  status: OrderStatus;
  from: 'Dispensary';
  to: 'Bulk Store';
}

export interface BillItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Bill {
  id: string; // Bill Number
  date: string; // ISO date string
  patientName: string;
  receiptNumber?: string;
  consultationFee: number;
  labFee: number;
  items: BillItem[];
  grandTotal: number;
}
