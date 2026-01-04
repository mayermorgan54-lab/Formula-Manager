import express from 'express';
import cors from 'cors';
import { fetchData, saveNewProductFormula, saveMaterial } from './sheetsService.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors() as any);
app.use(express.json() as any);

// Routes
app.get('/api/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/formula', async (req, res) => {
  try {
    const { product, rows } = req.body;
    if (!product || !rows || !Array.isArray(rows)) {
        res.status(400).json({error: "Invalid payload"});
        return;
    }
    
    await saveNewProductFormula(product, rows);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save formula' });
  }
});

app.post('/api/material', async (req, res) => {
    try {
        const material = req.body;
        if (!material || !material.name) {
            res.status(400).json({error: "Invalid payload"});
            return;
        }
        await saveMaterial(material);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save material' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Ensure 'service-account.json' exists for real Google Sheets connection.`);
});