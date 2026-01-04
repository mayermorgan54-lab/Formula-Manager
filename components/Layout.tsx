import React from 'react';
import { Beaker, Factory, ShoppingCart, Database, Package, Boxes, CheckSquare } from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onTabChange, children }) => {
  const tabs = [
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'formulas', label: 'Formulas', icon: Beaker },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Database className="h-6 w-6 text-indigo-600 mr-2" />
                <span className="font-bold text-xl text-gray-900">Formula Manager</span>
              </div>
              <nav className="ml-8 flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={clsx(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};