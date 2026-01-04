import React, { useState, useMemo } from 'react';
import { AppData, ProductionRow, BatchItem } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { AlertCircle, Filter, History, Check, Factory, Circle, CheckCircle2 } from 'lucide-react';

interface Props {
  data: AppData;
  onUpdateProduction: (row: ProductionRow, oldName?: string) => void;
  onFinishProduction: (productName: string) => void;
}

export const ProductionModule: React.FC<Props> = ({ data, onUpdateProduction, onFinishProduction }) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const filteredProductionRows = useMemo(() => {
    const uniqueProds = new Map<string, ProductionRow>();
    data.production.forEach(p => {
      if (!uniqueProds.has(p.product)) {
        uniqueProds.set(p.product, p);
      }
    });

    let prods = Array.from(uniqueProds.values());
    
    if (showActiveOnly) {
      prods = prods.filter(p => p.quantity > 0);
    }

    if (searchTerm) {
      prods = prods.filter(p => p.product.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return prods.sort((a, b) => a.product.localeCompare(b.product));
  }, [data.production, showActiveOnly, searchTerm]);

  const batchData = useMemo(() => {
    if (!selectedProduct) return null;

    const row = data.production.find(p => p.product === selectedProduct);
    if (!row) return null;

    const formulaRows = data.formulas.filter(f => f.product === selectedProduct);
    const totalBatchWeight = row.size * row.quantity;

    const items: BatchItem[] = formulaRows.map(fRow => {
      const material = data.materials.find(m => m.name === fRow.material);
      const costPerKg = material ? material.costPerKg : 0;
      const neededGrams = totalBatchWeight * (fRow.percentage / 100);
      const estimatedCost = (neededGrams / 1000) * costPerKg;

      return {
        material: fRow.material,
        percentage: fRow.percentage,
        neededGrams,
        estimatedCost
      };
    });

    const totalCost = items.reduce((sum, i) => sum + i.estimatedCost, 0);
    const costPerUnit = row.quantity > 0 ? totalCost / row.quantity : 0;

    return { items, totalWeight: totalBatchWeight, totalCost, costPerUnit, row };
  }, [selectedProduct, data.production, data.formulas, data.materials]);

  const handleInputChange = (row: ProductionRow, field: 'quantity' | 'size', value: string) => {
    const numericValue = value === '' ? 0 : parseFloat(value);
    onUpdateProduction({
      ...row,
      [field]: numericValue
    });
  };

  const handleFinish = (productName: string) => {
    if (confirm(`Finish batch for ${productName}?`)) {
      onFinishProduction(productName);
      if (selectedProduct === productName) setSelectedProduct(null);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <div className="col-span-4 bg-white rounded-lg shadow flex flex-col overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-indigo-900 uppercase tracking-wider">Production</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Active Only</span>
              <button 
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showActiveOnly ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showActiveOnly ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 scrollbar-hide">
          {/* Schedule Section */}
          <div className="bg-gray-100/80 px-4 py-2 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5" />
              Schedule List
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {filteredProductionRows.map(row => (
              <div
                key={row.product}
                onClick={() => setSelectedProduct(row.product)}
                className={`group flex flex-col p-4 transition-all cursor-pointer border-l-4 relative ${
                  selectedProduct === row.product ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-gray-50 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-sm font-bold truncate ${selectedProduct === row.product ? 'text-indigo-900' : 'text-gray-800'}`}>
                    {row.product}
                  </span>
                  
                  {row.quantity > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleFinish(row.product); }}
                      className="text-gray-300 hover:text-green-500 transition-colors p-1 -m-1"
                      title="Finish Batch"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex flex-col flex-1">
                    <label className="text-[9px] text-gray-400 uppercase font-black mb-1">QTY</label>
                    <input 
                      type="number"
                      value={row.quantity === 0 ? '' : row.quantity}
                      placeholder="0"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleInputChange(row, 'quantity', e.target.value)}
                      className="w-full text-xs font-bold border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="text-gray-300 self-end mb-2 font-bold">×</div>
                  <div className="flex flex-col flex-1">
                    <label className="text-[9px] text-gray-400 uppercase font-black mb-1">SIZE (ML)</label>
                    <input 
                      type="number"
                      value={row.size === 0 ? '' : row.size}
                      placeholder="0"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleInputChange(row, 'size', e.target.value)}
                      className="w-full text-xs font-bold border border-gray-300 rounded px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
            {filteredProductionRows.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-[10px] italic bg-white">No items scheduled.</div>
            )}
          </div>

          {/* History Section */}
          <div className="bg-gray-100/80 px-4 py-2 border-y border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Production History
            </h3>
          </div>
          <div className="divide-y divide-gray-50 bg-white">
            {data.history.map(item => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-400 line-through truncate italic">{item.product}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 opacity-50" />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold">{formatNumber(item.quantity)} × {formatNumber(item.size)}ml</span>
                  <span className="text-[9px] font-black text-gray-300 uppercase">{formatNumber(item.totalWeightG / 1000)} kg</span>
                </div>
              </div>
            ))}
            {data.history.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-[10px] italic">No production history.</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Detail Area */}
      <div className="col-span-8 flex flex-col gap-6">
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
             {batchData ? (
                 <>
                    <div className="p-6 bg-indigo-900 text-white flex justify-between items-center shadow-lg relative">
                        <div>
                          <h3 className="text-xl font-black">{batchData.row.product}</h3>
                          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">
                            {formatNumber(batchData.row.quantity)} Units × {formatNumber(batchData.row.size)} ml
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="block text-[10px] text-indigo-300 uppercase font-bold">Total Batch Mass</span>
                            <span className="text-3xl font-black">{formatNumber(batchData.totalWeight)} g</span>
                          </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/30">
                        <div className="p-6 text-center">
                            <span className="block text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">Total Batch Cost</span>
                            <span className="text-2xl font-black text-gray-900">{formatCurrency(batchData.totalCost)}</span>
                        </div>
                        <div className="p-6 text-center">
                            <span className="block text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">Unit Cost</span>
                            <span className="text-2xl font-black text-green-600">{formatCurrency(batchData.costPerUnit)}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Ingredient</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">%</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Weight (g)</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Estimated Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {batchData.items.sort((a,b) => b.neededGrams - a.neededGrams).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.material}</td>
                                        <td className="px-6 py-4 text-sm text-center text-gray-500 font-medium">{formatNumber(item.percentage, true)}%</td>
                                        <td className="px-6 py-4 text-sm text-right font-black text-indigo-600">{formatNumber(item.neededGrams)} g</td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-bold">{formatCurrency(item.estimatedCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center bg-gray-50/20">
                    <div className="bg-white p-8 rounded-full shadow-sm border border-gray-100 mb-6">
                      <AlertCircle className="w-16 h-16 text-indigo-200" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600">No Product Selected</h3>
                    <p className="max-w-xs mt-2 text-sm text-gray-400">Select a product from the schedule list to view batch details.</p>
                </div>
             )}
         </div>
      </div>
    </div>
  );
};