import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { FormulasModule } from './components/FormulasModule';
import { ProductionModule } from './components/ProductionModule';
import { PurchasesModule } from './components/PurchasesModule';
import { MaterialsModule } from './components/MaterialsModule';
import { StockModule } from './components/StockModule';
import { TasksModule } from './components/TasksModule';
import { AppData, FormulaRow, RawMaterial, ProductionRow, StockItem, ProductionHistoryItem, Task } from './types';
import { MOCK_DATA } from './mockData';

const getApiUrl = () => {
  try {
    // @ts-ignore
    return (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3000/api';
  } catch (e) {
    return 'http://localhost:3000/api';
  }
};

const API_URL = getApiUrl();

function App() {
  const [currentTab, setCurrentTab] = useState('materials');
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/data`);
      if (!res.ok) throw new Error('Failed to fetch');
      const jsonData = await res.json();
      
      // Migration/Defaulting for Stock Fields
      const processedStock = (jsonData.stock || []).map((s: any) => ({
        materialName: s.materialName,
        startingStockKg: s.startingStockKg ?? s.currentStockKg ?? 0,
        consumptionKg: s.consumptionKg ?? 0
      }));

      setData({
        ...jsonData,
        stock: processedStock,
        history: jsonData.history || [],
        tasks: jsonData.tasks || []
      });
      setIsOffline(false);
    } catch (err) {
      console.warn('Backend not available, using Mock Data.', err);
      setData(MOCK_DATA as AppData);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProduction = async (updatedRow: ProductionRow, oldProductName?: string) => {
    setData(prev => {
        if (!prev) return prev;
        const targetProduct = oldProductName || updatedRow.product;
        const index = prev.production.findIndex(p => p.product === targetProduct);
        const newProduction = [...prev.production];
        if (index >= 0) {
            newProduction[index] = updatedRow;
        } else {
            newProduction.push(updatedRow);
        }
        return { ...prev, production: newProduction };
    });
  };

  const handleFinishProduction = (productName: string) => {
    setData(prev => {
      if (!prev) return prev;
      
      const prod = prev.production.find(p => p.product === productName);
      if (!prod || prod.quantity <= 0) return prev;

      const formula = prev.formulas.filter(f => f.product === productName);
      const totalBatchWeightG = prod.quantity * prod.size;

      // Update Consumption
      const newStock = prev.stock.map(s => {
          const row = formula.find(f => f.material === s.materialName);
          if (row) {
              const neededG = totalBatchWeightG * (row.percentage / 100);
              const neededKg = neededG / 1000;
              return { 
                ...s, 
                consumptionKg: (s.consumptionKg || 0) + neededKg
              };
          }
          return s;
      });

      const historyItem: ProductionHistoryItem = {
        id: Date.now().toString(),
        product: prod.product,
        quantity: prod.quantity,
        size: prod.size,
        date: new Date().toISOString(),
        totalWeightG: totalBatchWeightG
      };

      const newProduction = prev.production.map(p => 
        p.product === productName ? { ...p, quantity: 0 } : p
      );

      return {
        ...prev,
        stock: newStock,
        history: [historyItem, ...prev.history],
        production: newProduction
      };
    });
  };

  const handleSaveStock = (updatedStock: StockItem[]) => {
    setData(prev => prev ? ({ ...prev, stock: updatedStock }) : prev);
  };

  const handleSaveFormula = async (product: string, rows: FormulaRow[]) => {
      setData(prev => {
          if (!prev) return prev;
          const newFormulas = prev.formulas.filter(f => f.product !== product);
          newFormulas.push(...rows);
          
          const newProduction = [...prev.production];
          if (!newProduction.some(p => p.product === product)) {
              newProduction.push({ client: 'New', product: product, quantity: 0, size: 0 });
          }
          
          return { ...prev, formulas: newFormulas, production: newProduction };
      });
  };

  const handleSaveMaterial = async (material: RawMaterial) => {
      setData(prev => {
          if (!prev) return prev;
          const newMaterials = [...prev.materials];
          const index = newMaterials.findIndex(m => m.name === material.name);
          if (index >= 0) {
              newMaterials[index] = material;
          } else {
              newMaterials.push(material);
          }

          const newStock = [...prev.stock];
          if (!newStock.some(s => s.materialName === material.name)) {
            newStock.push({ materialName: material.name, startingStockKg: 0, consumptionKg: 0 });
          }

          return { ...prev, materials: newMaterials, stock: newStock };
      });
  };

  const handleSaveTask = (task: Task) => {
    setData(prev => {
      if (!prev) return prev;
      const index = prev.tasks.findIndex(t => t.id === task.id);
      const newTasks = [...prev.tasks];
      if (index >= 0) {
        newTasks[index] = task;
      } else {
        newTasks.push(task);
      }
      return { ...prev, tasks: newTasks };
    });
  };

  const handleToggleTask = (taskId: string) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t => 
          t.id === taskId ? { ...t, isDone: !t.isDone, doneAt: !t.isDone ? new Date().toISOString() : undefined } : t
        )
      };
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) };
    });
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500 font-medium">Loading Application...</div>;
  if (!data) return <div className="flex h-screen items-center justify-center text-red-500 font-medium">Error loading data.</div>;

  return (
    <>
      {isOffline && (
        <div className="bg-amber-50 text-amber-800 text-xs text-center py-1.5 px-4 border-b border-amber-200 font-medium">
          Demo Mode: Backend not connected. Changes will stay in your browser session only.
        </div>
      )}
      <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
        {currentTab === 'materials' && (
          <MaterialsModule data={data} onSaveMaterial={handleSaveMaterial} />
        )}
        {currentTab === 'formulas' && (
          <FormulasModule data={data} onSaveFormula={handleSaveFormula} />
        )}
        {currentTab === 'production' && (
          <ProductionModule 
            data={data} 
            onUpdateProduction={handleUpdateProduction} 
            onFinishProduction={handleFinishProduction}
          />
        )}
        {currentTab === 'stock' && (
          <StockModule data={data} onSaveStock={handleSaveStock} />
        )}
        {currentTab === 'tasks' && (
          <TasksModule 
            data={data} 
            onSaveTask={handleSaveTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        {currentTab === 'purchases' && (
          <PurchasesModule data={data} />
        )}
      </Layout>
    </>
  );
}

export default App;