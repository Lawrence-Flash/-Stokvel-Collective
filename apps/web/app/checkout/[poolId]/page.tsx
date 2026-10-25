'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, CheckCircle2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface PoolData {
  id: string;
  targetQuantity: number;
  currentQuantity: number;
  expiresAt: string;
  product: {
    name: string;
    description: string;
    unitPrice: string | number;
    retailPrice: string | number;
    unitQuantity: string;
  };
  hub: {
    name: string;
    address: string;
    city: string;
  };
}

export default function CheckoutPage(props: { params: Promise<{ poolId: string }> }) {
  const params = use(props.params);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pool, setPool] = useState<PoolData | null>(null);
  const [loadingPool, setLoadingPool] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/pools/${params.poolId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load pool');
        return res.json();
      })
      .then((data) => setPool(data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingPool(false));
  }, [params.poolId]);

  const unitPrice = pool ? Number(pool.product.unitPrice) : 89.99;
  const retailPrice = pool ? Number(pool.product.retailPrice) : 119.99;
  const totalCost = (unitPrice * quantity).toFixed(2);
  const totalRetail = (retailPrice * quantity).toFixed(2);
  const totalSaved = (Number(totalRetail) - Number(totalCost)).toFixed(2);

  const handleSimulatedPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId: params.poolId, quantity }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Order creation failed');
      }
      const data = await res.json();
      router.push(`/portal/voucher/${data.id}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-4 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Active Pools</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Confirm Order & Payment</h1>
          <p className="text-xs text-slate-500 mt-1">Pool Order Checkout • FMCG Direct Collective</p>
        </div>

        {/* Selected Pool Overview */}
        {pool && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-bold text-slate-900">{pool.product.name}</h2>
                <p className="text-xs text-slate-500">{pool.product.description} ({pool.product.unitQuantity})</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                R{unitPrice.toFixed(2)}/unit
              </span>
            </div>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex justify-between">
              <span>Pickup Hub: <strong className="text-slate-700">{pool.hub.name}</strong></span>
              <span>{pool.hub.city}</span>
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700">Select Quantity</label>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 bg-white border border-slate-300 rounded-lg font-bold text-xl text-slate-800 hover:bg-slate-100 active:scale-95 transition flex items-center justify-center shadow-sm"
              >
                -
              </button>
              <span className="text-xl font-bold w-10 text-center text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-11 bg-white border border-slate-300 rounded-lg font-bold text-xl text-slate-800 hover:bg-slate-100 active:scale-95 transition flex items-center justify-center shadow-sm"
              >
                +
              </button>
            </div>

            <div className="text-right">
              <div className="text-xl font-black text-slate-900">R{totalCost}</div>
              <div className="text-xs text-emerald-600 font-semibold">Save R{totalSaved}</div>
            </div>
          </div>
        </div>

        {/* Escrow Protection Guarantee */}
        <div className="p-4 border border-blue-200 bg-blue-50/80 rounded-xl flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
              Escrow Protection Guarantee
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Funds are securely held in escrow. If the group order threshold is not met, your payment will be automatically refunded.
            </p>
          </div>
        </div>

        {/* Payment CTA Button */}
        <button
          onClick={handleSimulatedPayment}
          disabled={loading || loadingPool}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2 text-base"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{loading ? 'Processing Escrow...' : `Pay R${totalCost} via Instant EFT / Capitec Pay`}</span>
        </button>
      </div>
    </div>
  );
}
