import React, { useState, useMemo, useEffect } from 'react';
import { AppData, StockItem } from '../types';
import { formatNumber } from '../utils';
import { Search, Save, AlertTriangle, MinusCircle, PlusCircle, CheckCircle, Database, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  data: AppData;
  onSaveStock: (updatedStock: StockItem[]) => void;
}

type SortField = 'materialName' | 'startingStockKg' | 'consumptionKg' | 'remainingStockKg' | 'status';
type SortDirection = 'asc' | 'desc';

export const StockModule: React.FC<Props> = ({ data, onSaveStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localStock, setLocalStock] = useState<StockItem[]>([]);
  const [sortField, setSortField] = useState<SortField>('materialName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sync with main data
  useEffect(() => {
    setLocalStock(data.stock.map(s => ({
      ...s,
      startingStockKg: s.startingStockKg || 0,
      consumptionKg: s.consumptionKg || 0
    })));
  }, [data.stock]);

  const handleUpdateField = (materialName: string, field: keyof StockItem, value: string | number) => {
    const numericValue = typeof value === 'string' ? (value === '' ? 0 : parseFloat(value)) : value;
    setLocalStock(prev => prev.map(s => 
      s.materialName === materialName ? { ...s, [field]: Math.max(0, numericValue) } : s
    ));
  };

  const adjustStartingStock = (materialName: string, amount: number) => {
    const item = localStock.find(s => s.materialName === materialName);
    if (item) {
      handleUpdateField(materialName, 'startingStockKg', item.startingStockKg + amount);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedStock = useMemo(() => {
    let result = localStock.filter(item => 
      item.materialName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let valA: any, valB: any;
      
      const getRemaining = (s: StockItem) => s.startingStockKg - s.consumptionKg;
      const getStatusRank = (s: StockItem) => getRemaining(s) <= 5 ? 0 : 1;

      switch(sortField) {
        case 'materialName': valA = a.materialName; valB = b.materialName; break;
        case 'startingStockKg': valA = a.startingStockKg; valB = b.startingStockKg; break;
        case 'consumptionKg': valA = a.consumptionKg; valB = b.consumptionKg; break;
        case 'remainingStockKg': valA = getRemaining(a); valB = getRemaining(b); break;
        case 'status': valA = getStatusRank(a); valB = getStatusRank(b); break;
        default: valA = 0; valB = 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [localStock, searchTerm, sortField, sortDirection]);

  const handleSave = () => {
    onSaveStock(localStock);
    alert("Inventory data updated.");
  };

  const SortHeader = ({ field, label, align = 'left' }: { field: SortField, label: string, align?: 'left' | 'center' | 'right' }) => (
    <th 
      className={`px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => toggleSort(field)}
    >
      <div className={`flex items-center gap-1 inline-flex ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
        {sortField === field ? (
          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </th>
  );

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      {/* Header Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Material Stock Control</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Manage physical inventory levels</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <input
              type="text"
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          <button 
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md flex items-center gap-2 font-black uppercase text-xs shadow-md transform active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <SortHeader field="materialName" label="Material Name" />
                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Quick Adjust</th>
                <SortHeader field="startingStockKg" label="Starting Stock" align="right" />
                <SortHeader field="consumptionKg" label="Consumption" align="right" />
                <SortHeader field="remainingStockKg" label="Remaining Stock" align="right" />
                <SortHeader field="status" label="Status" align="center" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAndSortedStock.map(item => {
                const remaining = item.startingStockKg - item.consumptionKg;
                const isLow = remaining <= 5;
                
                return (
                  <tr key={item.materialName} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.materialName}</td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => adjustStartingStock(item.materialName, -1)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => adjustStartingStock(item.materialName, 1)}
                          className="p-1 text-gray-300 hover:text-green-500 transition-colors"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <input 
                          type="number"
                          step="0.1"
                          value={item.startingStockKg === 0 ? '' : item.startingStockKg}
                          placeholder="0"
                          onChange={(e) => handleUpdateField(item.materialName, 'startingStockKg', e.target.value)}
                          className="w-24 text-right font-black text-gray-700 border border-gray-200 rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                        />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">KG</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-indigo-400">{formatNumber(item.consumptionKg)} <small className="text-[9px] uppercase font-bold">KG</small></span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black ${isLow ? 'text-red-600' : 'text-indigo-600'}`}>
                        {formatNumber(remaining)} <small className="text-[9px] uppercase font-bold">KG</small>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {isLow ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3" />
                          Low
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" />
                          OK
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedStock.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Database className="w-12 h-12 mb-2" />
                      <p className="text-sm italic">No materials matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};