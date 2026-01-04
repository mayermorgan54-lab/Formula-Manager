import { AppData } from './types';

export const MOCK_DATA: AppData = {
  materials: [
    { name: "Water", costPerKg: 0.5, supplier: "City Utility" },
    { name: "Fragrance Rose", costPerKg: 450, supplier: "AromaCo" },
    { name: "Ethanol", costPerKg: 45, supplier: "ChemSupply" },
    { name: "Glycerin", costPerKg: 80, supplier: "ChemSupply" },
    { name: "Colorant Red", costPerKg: 1200, supplier: "DyeWorks" },
  ],
  formulas: [
    { product: "Rose Perfume", material: "Ethanol", percentage: 80, notes: "Base" },
    { product: "Rose Perfume", material: "Fragrance Rose", percentage: 15, notes: "Heart" },
    { product: "Rose Perfume", material: "Water", percentage: 5, notes: "Dilutant" },
    { product: "Hand Sanitizer", material: "Ethanol", percentage: 70, notes: "Active" },
    { product: "Hand Sanitizer", material: "Water", percentage: 28, notes: "Base" },
    { product: "Hand Sanitizer", material: "Glycerin", percentage: 2, notes: "Moisturizer" },
  ],
  production: [
    { client: "Hotel A", product: "Rose Perfume", quantity: 100, size: 50 },
    { client: "Hotel B", product: "Hand Sanitizer", quantity: 500, size: 250 },
  ],
  stock: [
    { materialName: "Water", startingStockKg: 1000, consumptionKg: 120 },
    { materialName: "Fragrance Rose", startingStockKg: 5, consumptionKg: 0.5 },
    { materialName: "Ethanol", startingStockKg: 50, consumptionKg: 12 },
    { materialName: "Glycerin", startingStockKg: 20, consumptionKg: 2 },
    { materialName: "Colorant Red", startingStockKg: 2, consumptionKg: 0 },
  ],
  history: [],
  tasks: []
};