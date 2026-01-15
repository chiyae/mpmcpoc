
import { z } from 'zod';

export type ItemCategory = 'Medicine' | 'Medical Supply' | 'Consumable';
export type Formulation = "Tablet" | "Capsule" | "Syrup" | "Injection" | "Cream" | "Lotion" | "Medical Supply" | "Consumable";

export type Location = 'Bulk Store' | 'Dispensary' | 'Billing';
export type OrderStatus = 'Pending' | 'Approved' | 'Issued' | 'Rejected';
export type LpoStatus = 'Draft' | 'Sent' | 'Completed' | 'Rejected';
export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank' | 'Invoice';
export type PaymentStatus = 'Paid' | 'Unpaid';
export type BillType = 'Walk-in' | 'OPD';
export type UserRole = 'admin' | 'cashier' | 'pharmacy';


export interface Item {
  id: string; // unique item code, auto-generated
  itemCode: string;
  genericName: string;
  brandName?: string;
  formulation: Formulation;
  strengthValue?: number;
  strengthUnit?: string;
  concentrationValue?: number;
  concentrationUnit?: string;
  packageSizeValue?: number;
  packageSizeUnit?: string;
  category: ItemCategory;
  unitOfMeasure: string;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
}

export interface Stock {
    id: string;
    itemId: string;
    batchId: string;
    locationId: string;
    currentStockQuantity: number;
    expiryDate: string; // ISO String
}

export interface User {
  id: string; // Firebase Auth UID
  username: string; // email
  displayName: string;
  role: UserRole;
  locationId: string; // e.g. 'bulk-store', 'dispensary', 'billing', 'all'
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
}

export interface InternalOrderItem {
  itemId: string;
  quantity: number;
}

export interface InternalOrder {
  id: string; // Order ID
  date: string; // ISO date string
  requestingLocationId: string;
  items: InternalOrderItem[];
  status: OrderStatus;
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
  dispensingLocationId: string;
  isDispensed: boolean;
}

export interface Service {
    id: string;
    name: string;
    fee: number;
}

// Procurement Tool Types
export interface ProcurementSession {
    id: string;
    createdAt: string; // ISO date-time string
    status: 'Draft' | 'Completed';
    procurementList: string[]; // Array of item IDs
    vendorQuotes: Record<string, Record<string, number>>; // { [itemId]: { [vendorId]: price } }
    lpoQuantities: Record<string, number>; // { [itemId]: quantity }
}
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

const VendorForLpoSchema = z.object({
  id: z.string().describe('The unique vendor ID.'),
  name: z.string().describe('The name of the vendor.'),
});

export const GenerateLpoInputSchema = z.object({
  lowStockItems: z.array(LowStockItemSchema).describe('A list of items that are below their reorder level.'),
  vendors: z.array(VendorForLpoSchema).describe('A list of available vendors.'),
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

    