import React from 'react';

interface PoolProgressProps {
  currentQty: number;
  targetQty: number;
  unitPrice: number;
  retailPrice: number;
}

export const PoolProgress: React.FC<PoolProgressProps> = ({
  currentQty,
  targetQty,
  unitPrice,
  retailPrice,
}) => {
  const percentage = Math.min(Math.round((currentQty / targetQty) * 100), 100);
  const savings = Math.round(((retailPrice - unitPrice) / retailPrice) * 100);

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          Save {savings}% vs Retail
        </span>
        <span className="text-xs text-slate-500 font-medium">
          {currentQty} / {targetQty} units ordered
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
        <div
          className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-baseline text-xs">
        <span className="text-slate-600">
          Bulk: <strong className="text-slate-900 font-bold">R{unitPrice.toFixed(2)}</strong>
        </span>
        <span className="line-through text-slate-400">R{retailPrice.toFixed(2)}</span>
      </div>
    </div>
  );
};
