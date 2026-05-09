import type { User } from "./auth.types";

export enum StockMovementType {
  IN = "IN",
  OUT = "OUT",
  ADJUSTMENT = "ADJUSTMENT",
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  category?: string | null;
  minimumStock: number;
  currentStock: number;
  unitPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStockBreakdown {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  warehouse: Warehouse;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number | null;
  reference?: string | null;
  notes?: string | null;
  performedAt: string;
  createdById: string;
  product: Product;
  warehouse: Warehouse;
  createdBy: User;
  createdAt: string;
}

export interface StockOverview {
  totalProducts: number;
  totalWarehouses: number;
  lowStockProducts: number;
  totalStockUnits: number;
}
