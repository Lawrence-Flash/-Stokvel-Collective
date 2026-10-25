import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MapPin, Shield, Copy } from 'lucide-react';

async function getOrder(orderId: string) {
  try {
    const res = await fetch(`http://localhost:4000/api/orders/${orderId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function VoucherPage(
  props: {
    params: Promise<{ orderId: string }>;
  }
) {
  const params = await props.params;
  const order = await getOrder(params.orderId);

  // Fallback mock data if server isn't reached yet or order isn't found
  const orderData = order || {
    id: params.orderId,
    collectionOtp: '849 204',
    status: 'PAID',
    quantity: 1,
    totalAmount: '89.99',
    pool: {
      product: {
        name: 'Ace Super Maize Meal (10kg)',
        unitQuantity: '10kg',
      },
    },
    hub: {
      name: 'Soweto Central Hub',
      address: '7482 Vilakazi St, Orlando West',
      city: 'Johannesburg',
    },
    escrow: {
      status: 'HELD_IN_ESCROW',
      amount: '89.99',
    },
  };

  const formattedOtp = orderData.collectionOtp
    ? (orderData.collectionOtp.length === 6
        ? `${orderData.collectionOtp.slice(0, 3)} ${orderData.collectionOtp.slice(3)}`
        : orderData.collectionOtp)
    : '849 204';

  const isCollected = orderData.status === 'COLLECTED';

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Marketplace</span>
      </Link>

      <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center space-y-5 shadow-sm relative overflow-hidden">
        {/* Status Badge */}
        <div className="flex justify-center">
          {isCollected ? (
            <span className="inline-flex items-center space-x-1 px-3.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Collected & Complete</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-3.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              <span>Ready for Pickup</span>
            </span>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h2 className="text-xl font-black text-slate-900 leading-snug">
            {orderData.pool?.product?.name || 'Ace Super Maize Meal (10kg)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quantity: {orderData.quantity} unit(s) • Total: R{Number(orderData.totalAmount).toFixed(2)}
          </p>
        </div>

        {/* Pickup Hub Details */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-600 bg-slate-50 py-2 px-3 rounded-lg">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>{orderData.hub?.name || 'Soweto Central Hub'}</strong> — {orderData.hub?.address || '7482 Vilakazi St'}, {orderData.hub?.city || 'Johannesburg'}
          </span>
        </div>

        {/* Passcode Card */}
        <div className="py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <span className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold">
            Collection Passcode
          </span>
          <span className="text-4xl font-mono font-black tracking-wider text-slate-900 block select-all">
            {formattedOtp}
          </span>
        </div>

        {/* Escrow badge */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-blue-800 bg-blue-50 py-1.5 px-3 rounded-md">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>
            Escrow Status: <strong>{orderData.escrow?.status || 'HELD_IN_ESCROW'}</strong>
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Present this passcode or barcode to the manager at the pickup hub to verify and receive your goods.
        </p>

        {/* Quick test link for hub manager */}
        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/manager/redeem"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline"
          >
            Go to Hub Manager Portal to Redeem Code →
          </Link>
        </div>
      </div>
    </div>
  );
}
