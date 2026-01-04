
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { AppData, RawMaterial, FormulaRow, ProductionRow, StockItem } from '../types';

// Configuration
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE_PATH = path.join(__dirname, '..', 'service-account.json');

async function getAuth() {
  if (!fs.existsSync(KEY_FILE_PATH)) {
    console.warn("⚠️ service-account.json not found! Running in Mock mode.");
    return null;
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
  });
  return auth.getClient();
}

export async function fetchData(): Promise<AppData> {
  const authClient = await getAuth();
  if (!authClient || !SPREADSHEET_ID) {
    // If no credentials, we would ideally throw or return defaults
    throw new Error("Google Sheets configuration missing.");
  }

  const sheets = google.sheets({ version: 'v4', auth: authClient as any });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2:R', 
    });

    const rows = response.data.values || [];
    
    const materials: RawMaterial[] = [];
    const formulas: FormulaRow[] = [];
    const production: ProductionRow[] = [];
    const stock: StockItem[] = [];

    rows.forEach((row) => {
      // 1. Materials (Cols A, B, C)
      if (row[0]) {
        materials.push({
          name: row[0],
          costPerKg: parseFloat(row[1] || '0'),
          supplier: row[2] || '',
        });
        
        // Populate stock based on what we find in the sheet or default
        // In a real app, stock might be its own sheet
        stock.push({
          materialName: row[0],
          startingStockKg: parseFloat(row[3] || '0'),
          consumptionKg: parseFloat(row[4] || '0')
        });
      }

      // 2. Formulas (Cols F, G, H, I)
      if (row[5]) {
        formulas.push({
          product: row[5],
          material: row[6] || '',
          percentage: parseFloat(row[7] || '0'),
          notes: row[8] || '',
        });
      }

      // 3. Production (Cols L, M, N, O)
      if (row[11]) {
        production.push({
          client: row[11] || '',
          product: row[12],
          quantity: parseFloat(row[13] || '0'),
          size: parseFloat(row[14] || '0'),
        });
      }
    });

    return { 
      materials, 
      formulas, 
      production, 
      stock, 
      history: [], // History could be fetched from another sheet
      tasks: [] 
    };

  } catch (error) {
    console.error("Error fetching from sheets:", error);
    throw error;
  }
}

export async function saveNewProductFormula(productName: string, formulaRows: FormulaRow[]) {
    const authClient = await getAuth();
    if (!authClient || !SPREADSHEET_ID) return;

    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const values = formulaRows.map(f => [
        '', '', '', '', '', // Padding for cols A-E
        f.product,
        f.material,
        f.percentage,
        f.notes || ''
    ]);

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!F:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
    });
}

export async function saveMaterial(material: RawMaterial) {
    const authClient = await getAuth();
    if (!authClient || !SPREADSHEET_ID) return;

    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    
    // Simple implementation: check if exists, if not append
    const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:A',
    });

    const names = existing.data.values?.flat() || [];
    const index = names.indexOf(material.name);

    if (index !== -1) {
        // Update
        const range = `Sheet1!A${index + 1}:C${index + 1}`;
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[material.name, material.costPerKg, material.supplier]] }
        });
    } else {
        // Append
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:C',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[material.name, material.costPerKg, material.supplier]] }
        });
    }
}
