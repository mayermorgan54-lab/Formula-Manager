export interface RawMaterial {
  name: string;
  costPerKg: number;
  supplier: string;
}

export interface StockItem {
  materialName: string;
  startingStockKg: number; // The "Total" amount entered by user
  consumptionKg: number;   // The amount used in production batches
}

export interface FormulaRow {
  product: string;
  material: string;
  percentage: number; // 0-100
  notes?: string;
}

export interface ProductionRow {
  client: string;
  product: string;
  quantity: number;
  size: number;
}

export interface ProductionHistoryItem {
  id: string;
  product: string;
  quantity: number;
  size: number;
  date: string;
  totalWeightG: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  createdAt: string;
  doneAt?: string;
}

export interface AppData {
  materials: RawMaterial[];
  formulas: FormulaRow[];
  production: ProductionRow[];
  stock: StockItem[];
  history: ProductionHistoryItem[];
  tasks: Task[];
}

export interface BatchItem {
  neededGrams: number;
  percentage: number;
  material: string;
  estimatedCost: number;
}

export interface PurchaseItem {
  material: string;
  neededKg: number;
  availableKg: number;
  requiredKg: number;
  estimatedCost: number;
}

export interface SupplierGroup {
  supplier: string;
  items: PurchaseItem[];
  totalCost: number;
}