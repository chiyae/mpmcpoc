import { z } from 'zod';

export type ItemCategory = 'Medicine' | 'Medical Supply' | 'Consumable';
export type Location = 'Bulk Store' | 'Dispensary';
export type OrderStatus = 'Pending' | 'Approved' | 'Issued' | 'Rejected';
export type LpoStatus = 'Draft' | 'Sent' | 'Completed' | 'Rejected';
export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank' | 'Invoice';
export type PaymentStatus = 'Paid' | 'Unpaid';
export type BillType = 'Walk-in' | 'OPD';


export interface Item {
  id: string; // unique item code
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  unitOfMeasure: string;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  // Deprecated fields from mock data - will be handled in subcollections
  batchNumber?: string;
  expiryDate?: string; // ISO date string
  quantity?: number;
  location?: Location;
  usageHistory?: { date: string; quantity: number }[];
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  supplies: string[]; // Array of item IDs they supply
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
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentDetails {
    method: PaymentMethod;
    amountTendered: number;
    change: number;
    transactionId?: string;
    status: PaymentStatus;
}

export interface Bill {
  id: string; // Bill Number
  date: string; // ISO date string
  patientName: string;
  billType: BillType;
  prescriptionNumber?: string;
  receiptNumber?: string;
  items: BillItem[];
  grandTotal: number;
  paymentDetails: PaymentDetails;
}

export interface Service {
    id: string;
    name: string;
    fee: number;
}

// Procurement Tool Types
export interface ProcurementItemDetail extends Item {
  vendorPrices: { vendorId: string; price: number }[];
}

export interface LocalPurchaseOrderItem {
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface LocalPurchaseOrder {
    id: string;
    lpoNumber: string;
    vendorId: string;
    vendorName: string;
    date: string; // ISO String
    items: LocalPurchaseOrderItem[];
    grandTotal: number;
    status: LpoStatus;
}


// AI LPO Generation Schemas
const LowStockItemSchema = z.object({
  id: z.string().describe('The unique item code.'),
  name: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The current stock quantity.'),
  reorderLevel: z.number().describe('The reorder level for the item.'),
  usageHistory: z.array(z.object({
    date: z.string(),
    quantity: z.number(),
  })).describe('Last 30 days of usage history.'),
});

const VendorSchema = z.object({
  id: z.string().describe('The unique vendor ID.'),
  name: z.string().describe('The name of the vendor.'),
  supplies: z.array(z.string()).describe('An array of item IDs that this vendor supplies.'),
});

export const GenerateLpoInputSchema = z.object({
  lowStockItems: z.array(LowStockItemSchema).describe('A list of items that are below their reorder level.'),
  vendors: z.array(VendorSchema).describe('A list of available vendors.'),
});
export type GenerateLpoInput = z.infer<typeof GenerateLpoInputSchema>;

const LpoItemSchema = z.object({
  itemId: z.string().describe('The ID of the item to order.'),
  itemName: z.string().describe('The name of the item.'),
  quantityToOrder: z.number().describe('The suggested quantity to order based on usage and stock levels.'),
  selectedVendorId: z.string().describe('The ID of the recommended vendor for this item.'),
  reasoning: z.string().describe('A brief justification for the recommended quantity and vendor choice.'),
});

export const GenerateLpoOutputSchema = z.object({
  lpoId: z.string().describe('A generated unique ID for the LPO, e.g., LPO-YYYYMMDD-XXXX.'),
  generatedDate: z.string().describe('The ISO date string for when the LPO was generated.'),
  items: z.array(LpoItemSchema).describe('The list of items to be included in the LPO.'),
  summary: z.string().describe('A brief overall summary of the generated LPO.'),
});
export type GenerateLpoOutput = z.infer<typeof GenerateLpoOutputSchema>;

// Interface for saved LPOs, extending the AI output with a status
export interface Lpo extends GenerateLpoOutput {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
}
