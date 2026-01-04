import React, { useState, useMemo } from 'react';
import { AppData, FormulaRow, RawMaterial } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { Modal } from './Modal';
import { Plus, Edit2, AlertCircle, Trash2, Search, PlusCircle } from 'lucide-react';

interface Props {
  data: AppData;
  onSaveFormula: (product: string, rows: FormulaRow[]) => void;
}

export const FormulasModule: React.FC<Props> = ({ data, onSaveFormula }) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Editing state
  const [editProductName, setEditProductName] = useState('');
  const [editRows, setEditRows] = useState<FormulaRow[]>([]);
  const [matSearchTerm, setMatSearchTerm] = useState('');

  const products = useMemo(() => {
    return Array.from(new Set(data.formulas.map(f => f.product))).sort();
  }, [data.formulas]);

  const filteredProducts = products.filter(p => 
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentFormula = useMemo(() => {
    if (!selectedProduct) return [];
    return data.formulas.filter(f => f.product === selectedProduct);
  }, [data.formulas, selectedProduct]);

  const formulaDetails = useMemo(() => {
    return currentFormula.map(row => {
      const material = data.materials.find(m => m.name === row.material);
      const costPerKg = material ? material.costPerKg : 0;
      const contribution = (row.percentage / 100) * costPerKg;
      return {
        ...row,
        costPerKg,
        contribution
      };
    });
  }, [currentFormula, data.materials]);

  const totalCostPerKg = formulaDetails.reduce((sum, item) => sum + item.contribution, 0);

  // Suggested materials based on search term in the modal
  const materialSuggestions = useMemo(() => {
    if (!matSearchTerm) return [];
    return data.materials.filter(m => 
      m.name.toLowerCase().includes(matSearchTerm.toLowerCase()) &&
      !editRows.some(row => row.material === m.name)
    ).slice(0, 5);
  }, [data.materials, matSearchTerm, editRows]);

  const handleEditClick = () => {
    if (!selectedProduct) return;
    setEditProductName(selectedProduct);
    setEditRows(JSON.parse(JSON.stringify(currentFormula)));
    setIsEditModalOpen(true);
    setMatSearchTerm('');
  };

  const handleAddClick = () => {
    setEditProductName('');
    setEditRows([]);
    setIsAddModalOpen(true);
    setMatSearchTerm('');
  };

  const handleAddMaterial = (materialName: string) => {
    setEditRows([...editRows, {
      product: editProductName,
      material: materialName,
      percentage: 0,
      notes: ''
    }]);
    setMatSearchTerm('');
  };

  const handleMatSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && materialSuggestions.length > 0) {
      e.preventDefault();
      handleAddMaterial(materialSuggestions[0].name);
    }
  };

  const handleRemoveMaterial = (index: number) => {
    const newRows = [...editRows];
    newRows.splice(index, 1);
    setEditRows(newRows);
  };

  const handleSave = () => {
    const total = editRows.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(total - 100) > 0.001) {
      alert(`Total percentage must be exactly 100%. Current: ${total.toFixed(2)}%`);
      return;
    }
    
    const activeRows = editRows.map(r => ({
        ...r,
        product: editProductName
    }));

    onSaveFormula(editProductName, activeRows);
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedProduct(editProductName);
  };

  const updateEditRow = (index: number, field: keyof FormulaRow, value: string | number) => {
    const newRows = [...editRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setEditRows(newRows);
  };

  const renderEditor = () => {
    const totalPercent = editRows.reduce((sum, r) => sum + (r.percentage || 0), 0);
    const isValid = Math.abs(totalPercent - 100) <= 0.001;

    return (
      <div className="space-y-4">
         {(isAddModalOpen || isEditModalOpen) && (
             <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                 <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2.5 outline-none"
                    value={editProductName}
                    onChange={e => setEditProductName(e.target.value)}
                    placeholder="e.g. Lavender Lotion"
                 />
             </div>
         )}

         {/* Add Material Search Bar */}
         <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Add Ingredients</label>
            <div className="relative">
              <input 
                  type="text"
                  placeholder="Search and press Enter to add..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  value={matSearchTerm}
                  onChange={e => setMatSearchTerm(e.target.value)}
                  onKeyDown={handleMatSearchKeyDown}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            {materialSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg divide-y divide-gray-100">
                {materialSuggestions.map((m, idx) => (
                  <button
                    key={m.name}
                    onClick={() => handleAddMaterial(m.name)}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between group transition-colors ${idx === 0 ? 'bg-indigo-50/50' : 'hover:bg-indigo-50'}`}
                  >
                    <span>{m.name}</span>
                    <div className="flex items-center gap-2">
                      {idx === 0 && <span className="text-[10px] text-gray-400 font-bold uppercase border px-1 rounded">Enter</span>}
                      <PlusCircle className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
         </div>

         <div className="border rounded-md overflow-hidden bg-gray-50">
             <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-100">
                     <tr>
                         <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Material</th>
                         <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-500 uppercase w-32">Amount %</th>
                         <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase w-16"></th>
                     </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-100">
                     {editRows.map((row, idx) => (
                         <tr key={idx}>
                             <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.material}</td>
                             <td className="px-4 py-2">
                                 <div className="flex items-center gap-2">
                                   <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={row.percentage}
                                      onChange={(e) => updateEditRow(idx, 'percentage', parseFloat(e.target.value) || 0)}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-1.5 text-center"
                                   />
                                   <span className="text-gray-400 text-xs">%</span>
                                 </div>
                             </td>
                             <td className="px-4 py-2 text-right">
                                <button 
                                  onClick={() => handleRemoveMaterial(idx)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             </td>
                         </tr>
                     ))}
                     {editRows.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-10 text-center text-gray-400 text-xs italic">
                            Search and add materials using the bar above.
                          </td>
                        </tr>
                     )}
                 </tbody>
             </table>
         </div>

         <div className="flex justify-between items-center pt-4 border-t border-gray-100">
             <div className="flex flex-col">
               <span className="text-[10px] text-gray-400 uppercase font-bold">Total Concentration</span>
               <div className={`text-lg font-black ${isValid ? "text-green-600" : "text-rose-600"}`}>
                   {totalPercent.toFixed(2)}%
               </div>
             </div>
             <button
                onClick={handleSave}
                disabled={!isValid || !editProductName || editRows.length === 0}
                className={`px-6 py-2.5 rounded-md text-white font-bold text-sm shadow-sm transition-all ${isValid && editProductName && editRows.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
             >
                 Update Formula
             </button>
         </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar List */}
      <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex justify-between items-center mb-3">
                 <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Products</h2>
                 <button 
                    onClick={handleAddClick}
                    className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all" 
                    title="Add New Product"
                 >
                     <Plus className="w-4 h-4" />
                 </button>
            </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {filteredProducts.map(p => (
            <button
              key={p}
              onClick={() => setSelectedProduct(p)}
              className={`w-full text-left px-4 py-3.5 text-sm transition-colors ${
                selectedProduct === p ? 'bg-indigo-50 text-indigo-700 font-bold border-r-2 border-indigo-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          {filteredProducts.length === 0 && (
              <div className="p-8 text-xs text-gray-400 text-center italic">No products found</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-9 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedProduct ? (
            <>
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/30">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">{selectedProduct}</h2>
                        <div className="flex gap-4 mt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Standard Cost</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(totalCostPerKg)} <small className="text-gray-400">/ kg</small></span>
                            </div>
                            <div className="flex flex-col border-l border-gray-200 pl-4">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Ingredients</span>
                                <span className="text-sm font-bold text-gray-900">{formulaDetails.length} items</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleEditClick}
                        className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Modify Formula
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ingredient</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Weight %</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rate (EGP/kg)</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contribution</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {formulaDetails.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{row.material}</td>
                                    <td className="px-6 py-4 text-sm text-right text-indigo-600 font-medium">{formatNumber(row.percentage)}%</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-400">{formatCurrency(row.costPerKg)}</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-bold">{formatCurrency(row.contribution)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <AlertCircle className="w-12 h-12 text-gray-300" />
                </div>
                <p className="font-medium">Select a product to explore its chemical composition and cost structure.</p>
            </div>
        )}
      </div>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={`Edit Formula: ${selectedProduct}`}
      >
          {renderEditor()}
      </Modal>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="New Product Formulation"
      >
          {renderEditor()}
      </Modal>
    </div>
  );
};