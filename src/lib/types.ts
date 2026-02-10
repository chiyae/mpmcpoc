
import { z } from 'zod';

export const FormulationEnum = z.enum(["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Lotion", "Medical Supply", "Consumable"]);
export const ItemCategoryEnum = z.enum(["Medicine", "Medical Supply", "Consumable"]);

export type ItemCategory = z.infer<typeof ItemCategoryEnum>;
export type Formulation = z.infer<typeof FormulationEnum>;

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
  dispensaryReorderLevel: number;
  bulkStoreReorderLevel: number;
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
  disabled?: boolean;
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
  subtotal: number;
  discount?: number;
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

export interface StockTakeItem {
    id: string; // Document ID
    itemId: string;
    itemName: string;
    batchId: string;
    expiryDate: string;
    systemQty: number;
    physicalQty: number;
    variance: number;
}

export interface StockTakeSession {
    id: string; // Session ID
    date: string; // ISO date-time string
    locationId: string;
    status: 'Ongoing' | 'Completed';
    // items will be a subcollection
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

export interface Log {
    id: string;
    timestamp: string; // ISO date-time string
    userId: string;
    userDisplayName: string;
    action: string;
    details: Record<string, any>;
}

export interface PriceHistory {
    id: string;
    date: string; // ISO date-time string
    type: 'unitCost' | 'sellingPrice';
    price: number;
}
