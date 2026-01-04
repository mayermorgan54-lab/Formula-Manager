import React, { useState, useMemo } from 'react';
import { AppData, RawMaterial } from '../types';
import { formatCurrency } from '../utils';
import { Modal } from './Modal';
import { Plus, Edit2, Search } from 'lucide-react';

interface Props {
  data: AppData;
  onSaveMaterial: (material: RawMaterial) => void;
}

export const MaterialsModule: React.FC<Props> = ({ data, onSaveMaterial }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Editing State
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState<RawMaterial>({ name: '', costPerKg: 0, supplier: '' });

  const filteredMaterials = useMemo(() => {
    return data.materials.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.materials, searchTerm]);

  const handleAddClick = () => {
    setEditingMaterial(null);
    setFormData({ name: '', costPerKg: 0, supplier: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (material: RawMaterial) => {
    setEditingMaterial(material);
    setFormData({ ...material });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    onSaveMaterial(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost per Kg</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMaterials.map((material, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.supplier}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(material.costPerKg)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleEditClick(material)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No materials found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? "Edit Material" : "Add New Material"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Material Name</label>
            <input
              type="text"
              value={formData.name}
              // If editing, lock the name to prevent breaking relations in this simple version
              disabled={!!editingMaterial} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 ${editingMaterial ? 'bg-gray-100 text-gray-500' : ''}`}
              placeholder="e.g., Ethanol"
            />
            {editingMaterial && <p className="text-xs text-gray-500 mt-1">Name cannot be changed to ensure formulas remain valid.</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              placeholder="e.g., ChemSupply"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cost per Kg (EGP)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costPerKg}
              onChange={(e) => setFormData({ ...formData, costPerKg: parseFloat(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={!formData.name}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm disabled:bg-gray-400"
            >
              Save Material
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};