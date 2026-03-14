export enum FuelType {
  DIESEL = 'DIESEL',
  PETROL = 'PETROL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum DocumentType {
  ITP = 'ITP',
  RCA = 'RCA',
  CASCO = 'CASCO',
  ROVINIETA = 'ROVINIETA',
}

export enum ExpenseType {
  FUEL = 'FUEL',
  REPAIR = 'REPAIR',
  OTHER = 'OTHER',
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  expiryDate: string;
  issuedDate?: string | null;
  provider?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MileageLog {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  notes?: string | null;
  createdAt: string;
}

export interface VehicleLease {
  id: string;
  vehicleId: string;
  provider: string;
  startDate: string;
  endDate: string;
  monthlyRate: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleExpense {
  id: string;
  vehicleId: string;
  type: ExpenseType;
  amount: number;
  date: string;
  description?: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  chassisNumber: string;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
  documents?: VehicleDocument[];
  mileageLogs?: MileageLog[];
  leases?: VehicleLease[];
  expenses?: VehicleExpense[];
}

export interface ExpiringDocumentSummary {
  type: DocumentType;
  count: number;
}
