import type { User } from "./auth.types";

export enum PartnerType {
  CLIENT = "CLIENT",
  SUPPLIER = "SUPPLIER",
  BOTH = "BOTH",
}

export enum InvoiceType {
  FISCAL = "FISCAL",
  PROFORMA = "PROFORMA",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
  CARD = "CARD",
  OTHER = "OTHER",
}

export enum InvoiceItemSourceType {
  PROJECT_MATERIAL = "PROJECT_MATERIAL",
  PROJECT_SERVICE = "PROJECT_SERVICE",
  VEHICLE_EXPENSE = "VEHICLE_EXPENSE",
  MANUAL = "MANUAL",
}

export interface Partner {
  id: string;
  name: string;
  cui: string;
  regCom?: string | null;
  address: string;
  city: string;
  country: string;
  email?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  partnerType: PartnerType;
  isActive: boolean;
  bankName?: string | null;
  bankAccount?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  amount: number;
  vatAmount: number;
  projectId?: string | null;
  sourceType?: InvoiceItemSourceType | null;
  sourceId?: string | null;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  createdBy: User;
  createdAt: string;
}

export interface Invoice {
  id: string;
  series: string;
  number: number;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  partnerId: string;
  partner: Partner;
  isClientInvoice: boolean;
  issueDate: string;
  dueDate: string;
  deliveryDate?: string | null;
  subtotal: number;
  vatTotal: number;
  total: number;
  paidAmount: number;
  currency: string;
  notes?: string | null;
  projectId?: string | null;
  purchaseOrderId?: string | null;
  purchaseReceiptId?: string | null;
  createdBy: User;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

// Input types for mutations
export interface CreatePartnerInput {
  name: string;
  cui: string;
  regCom?: string;
  address: string;
  city: string;
  country?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  partnerType: PartnerType;
  isActive?: boolean;
  bankName?: string;
  bankAccount?: string;
  notes?: string;
}

export interface UpdatePartnerInput extends Partial<CreatePartnerInput> {
  id: string;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate?: number;
  projectId?: string;
  sourceType?: InvoiceItemSourceType;
  sourceId?: string;
}

export interface CreateInvoiceInput {
  series?: string;
  invoiceType: InvoiceType;
  partnerId: string;
  isClientInvoice?: boolean;
  issueDate?: string;
  dueDate: string;
  deliveryDate?: string;
  currency?: string;
  notes?: string;
  projectId?: string;
  purchaseOrderId?: string;
  purchaseReceiptId?: string;
  items: CreateInvoiceItemInput[];
}

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}
