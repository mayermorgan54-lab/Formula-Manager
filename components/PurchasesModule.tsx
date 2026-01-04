import React, { useMemo } from 'react';
import { AppData, SupplierGroup, PurchaseItem } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { Download, ShoppingBag, Info } from 'lucide-react';

interface Props {
  data: AppData;
}

export const PurchasesModule: React.FC<Props> = ({ data }) => {
  
  const purchaseData = useMemo(() => {
      // 1. Calculate Needs per material (in Grams first)
      const materialNeeds = new Map<string, number>(); // MaterialName -> Total Grams

      data.production.forEach(prod => {
          if (prod.quantity <= 0 || prod.size <= 0) return;
          
          const batchWeight = prod.quantity * prod.size;
          const formula = data.formulas.filter(f => f.product === prod.product);
          
          formula.forEach(row => {
              const needed = batchWeight * (row.percentage / 100);
              const current = materialNeeds.get(row.material) || 0;
              materialNeeds.set(row.material, current + needed);
          });
      });

      // 2. Group by Supplier and factor in available stock
      const supplierGroups: SupplierGroup[] = [];
      const tempGroup = new Map<string, PurchaseItem[]>();

      materialNeeds.forEach((grams, materialName) => {
          const matInfo = data.materials.find(m => m.name === materialName);
          const stockInfo = data.stock.find(s => s.materialName === materialName);
          
          const supplier = matInfo?.supplier || 'Unknown Supplier';
          const costPerKg = matInfo?.costPerKg || 0;
          const neededKg = grams / 1000;
          const availableKg = stockInfo?.currentStockKg || 0;
          
          // Actual required = needed - available (minimum 0)
          const requiredKg = Math.max(0, neededKg - availableKg);
          const estimatedCost = requiredKg * costPerKg;

          const item: PurchaseItem = {
              material: materialName,
              neededKg,
              availableKg,
              requiredKg,
              estimatedCost
          };

          const list = tempGroup.get(supplier) || [];
          list.push(item);
          tempGroup.set(supplier, list);
      });

      tempGroup.forEach((items, supplier) => {
          const totalCost = items.reduce((sum, i) => sum + i.estimatedCost, 0);
          supplierGroups.push({
              supplier,
              items: items.sort((a,b) => b.estimatedCost - a.estimatedCost),
              totalCost
          });
      });

      return supplierGroups.sort((a,b) => b.totalCost - a.totalCost);

  }, [data]);

  const totalProjectCost = purchaseData.reduce((sum, g) => sum + g.totalCost, 0);

  const handleExport = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Supplier,Material,Needed (kg),Available (kg),Required (kg),Estimated Cost (EGP)\n";

      purchaseData.forEach(group => {
          group.items.forEach(item => {
              const row = `"${group.supplier}","${item.material}",${item.neededKg.toFixed(2)},${item.availableKg.toFixed(2)},${item.requiredKg.toFixed(2)},${item.estimatedCost.toFixed(2)}`;
              csvContent += row + "\n";
          });
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "purchasing_plan.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Procurement Strategy</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Requirements factoring in current stock levels</p>
          </div>
          <div className="flex items-center gap-6">
              <div className="text-right">
                  <span className="block text-[10px] text-gray-400 font-black uppercase tracking-tighter">Total Order Value</span>
                  <span className="text-3xl font-black text-indigo-600">{formatCurrency(totalProjectCost)}</span>
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-md transition-all font-black text-xs uppercase"
              >
                  <Download className="w-4 h-4 mr-2" />
                  Export Plan
              </button>
          </div>
      </div>
      
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-500 mt-0.5" />
        <p className="text-xs text-indigo-900 leading-relaxed">
          <strong>Note:</strong> Required amounts are calculated as: <code>Total Needed - Current Available Stock</code>. 
          Costs are estimated using current material rates. Add quantities in <strong>Production</strong> to generate requirements.
        </p>
      </div>

      <div className="grid gap-6">
        {purchaseData.map((group) => (
          <div key={group.supplier} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <ShoppingBag className="w-4 h-4 text-indigo-600" />
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{group.supplier}</h3>
               </div>
               <span className="text-sm font-black text-indigo-600">{formatCurrency(group.totalCost)}</span>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingredient</th>
                  <th className="px-6 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Needed (kg)</th>
                  <th className="px-6 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Available (kg)</th>
                  <th className="px-6 py-3 text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest">Buy (kg)</th>
                  <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {group.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{item.material}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-500">{formatNumber(item.neededKg)}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-400 italic">{formatNumber(item.availableKg)}</td>
                    <td className="px-6 py-4 text-sm text-center font-black text-indigo-600">{formatNumber(item.requiredKg)}</td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">{formatCurrency(item.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {purchaseData.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-20 text-center text-gray-400 italic">
            No procurement needs detected. Check your active production schedule.
          </div>
        )}
      </div>
    </div>
  );
};