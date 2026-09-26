'use client';

import React, { useState } from 'react';
import { QrCode, CheckCircle, AlertCircle, ArrowLeft, PackageCheck } from 'lucide-react';
import Link from 'next/link';

export default function ManagerRedeemPage() {
  const [code, setCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redeemedOrder, setRedeemedOrder] = useState<any>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length < 6) {
      setStatusMessage('Please enter a valid 6-digit collection code.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setStatusMessage('Verifying code with escrow ledger...');
    setIsError(false);

    try {
      const res = await fetch('/api/fulfillment/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionOtp: code.replaceAll(' ', '') }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Code verification failed or invalid');
      }

      setStatusMessage('Order successfully verified and marked as COLLECTED.');
      setIsError(false);
      setRedeemedOrder(data.order);
      setCode('');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
      setIsError(true);
      setRedeemedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Marketplace</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hub Redemption Portal</h1>
            <p className="text-xs text-slate-500">Soweto Central Hub Dispatch Station</p>
          </div>
        </div>

        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Enter 6-Digit Collection Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 849204"
              className="w-full text-center text-3xl font-mono tracking-widest font-black p-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 placeholder:text-slate-300 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <PackageCheck className="w-5 h-5" />
            <span>{loading ? 'Verifying...' : 'Verify & Release Stock'}</span>
          </button>
        </form>

        {statusMessage && (
          <div
            className={`p-4 text-sm rounded-xl border flex items-start space-x-3 ${
              isError
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{statusMessage}</p>
              {!isError && redeemedOrder && (
                <div className="text-xs text-emerald-700 pt-1 space-y-0.5">
                  <p>Product: <strong>{redeemedOrder.pool?.product?.name}</strong></p>
                  <p>Quantity Released: <strong>{redeemedOrder.quantity} unit(s)</strong></p>
                  <p>Escrow: <strong>DISBURSED to Wholesaler</strong></p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
