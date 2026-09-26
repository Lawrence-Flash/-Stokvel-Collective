'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PoolProgress } from '../components/PoolProgress';
import { Users, ShieldCheck, Sparkles, Phone, ArrowRight, Clock, MapPin, CheckCircle } from 'lucide-react';

interface Pool {
  id: string;
  status: string;
  targetQuantity: number;
  currentQuantity: number;
  targetAmount: string | number;
  currentAmount: string | number;
  expiresAt: string;
  product: {
    id: string;
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
  group?: {
    name: string;
    code: string;
  };
}

export default function HomePage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('+27820000002');
  const [otpCode, setOtpCode] = useState('');
  const [authStep, setAuthStep] = useState<'idle' | 'otp_sent' | 'authenticated'>('idle');
  const [authMsg, setAuthMsg] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pools')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch pools');
        return res.json();
      })
      .then((data) => setPools(data))
      .catch((err) => {
        console.warn('API not ready yet, using initial showcase data', err);
        setPools([
          {
            id: 'mock-maize-pool',
            status: 'OPEN',
            targetQuantity: 100,
            currentQuantity: 35,
            targetAmount: 8999.00,
            currentAmount: 3149.65,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            product: {
              id: 'p1',
              name: 'Ace Super Maize Meal',
              description: '10kg Premium Quality Maize Meal',
              unitPrice: 89.99,
              retailPrice: 119.99,
              unitQuantity: '10kg',
            },
            hub: {
              name: 'Soweto Central Hub',
              address: '7482 Vilakazi St, Orlando West',
              city: 'Johannesburg',
            },
            group: {
              name: 'Orlando East Buying Club',
              code: 'ORL-EAST-01',
            },
          },
          {
            id: 'mock-oil-pool',
            status: 'OPEN',
            targetQuantity: 50,
            currentQuantity: 28,
            targetAmount: 7250.00,
            currentAmount: 4060.00,
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            product: {
              id: 'p2',
              name: 'Sunfoil Sunflower Oil',
              description: '5L Pure Sunflower Cooking Oil',
              unitPrice: 145.00,
              retailPrice: 189.99,
              unitQuantity: '5L',
            },
            hub: {
              name: 'Soweto Central Hub',
              address: '7482 Vilakazi St, Orlando West',
              city: 'Johannesburg',
            },
            group: {
              name: 'Orlando East Buying Club',
              code: 'ORL-EAST-01',
            },
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg('Dispatching SMS OTP...');
    try {
      const res = await fetch('/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setAuthStep('otp_sent');
      setAuthMsg('OTP sent to ' + phoneNumber);
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
        setOtpCode(data.debugOtp);
      }
    } catch (err: any) {
      setAuthMsg(`Error: ${err.message}`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg('Verifying code...');
    try {
      const res = await fetch('/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setAuthStep('authenticated');
      setAuthMsg(`Logged in as ${data.user.fullName} (${data.user.role})`);
    } catch (err: any) {
      setAuthMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-10 py-2">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-700/60 backdrop-blur-sm border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Wholesale Bulk-Buying for Townships</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Pool purchasing power. <br />
            <span className="text-amber-400">Save up to 30% on groceries.</span>
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Join your local Soweto stokvel collective to purchase maize meal, sunflower oil, and everyday staples at direct wholesale distributor tiers. Guaranteed safe with smart escrow protection.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium text-emerald-200">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Full Escrow Protection</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Verified Township Stokvels</span>
            </div>
          </div>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Phone OTP Quick-Auth Banner */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center sm:justify-start space-x-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Quick Member Authentication (SMS OTP)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Low-friction login tailored for 2G/3G mobile devices. No password needed.
            </p>
          </div>

          {authStep === 'authenticated' ? (
            <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>{authMsg}</span>
            </div>
          ) : authStep === 'otp_sent' ? (
            <form onSubmit={handleVerifyOtp} className="flex items-center space-x-2">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="6-digit OTP"
                className="w-28 text-center text-sm font-mono font-bold p-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                Verify OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestOtp} className="flex items-center space-x-2">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+27..."
                className="w-36 text-xs font-mono p-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                Request OTP
              </button>
            </form>
          )}
        </div>
        {debugOtp && authStep === 'otp_sent' && (
          <p className="text-[11px] text-amber-600 mt-2 font-mono">
            Debug OTP: <strong>{debugOtp}</strong> (automatically filled)
          </p>
        )}
      </section>

      {/* Active Buying Pools Listing */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Collective Buying Pools</h2>
            <p className="text-xs text-slate-500">Live order progress, wholesale pricing, and pickup hub details</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
            {pools.length} Live Pool{pools.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading active pools...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pools.map((pool) => {
              const unitPrice = Number(pool.product.unitPrice);
              const retailPrice = Number(pool.product.retailPrice);

              return (
                <div
                  key={pool.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {pool.group?.name || 'Township Open Pool'}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">{pool.product.name}</h3>
                        <p className="text-xs text-slate-500">{pool.product.description} ({pool.product.unitQuantity})</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>7d left</span>
                      </span>
                    </div>

                    {/* Low-Bandwidth Pool Progress Component */}
                    <PoolProgress
                      currentQty={pool.currentQuantity}
                      targetQty={pool.targetQuantity}
                      unitPrice={unitPrice}
                      retailPrice={retailPrice}
                    />

                    {/* Hub Location */}
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Pickup at: <strong className="text-slate-700">{pool.hub.name}</strong> ({pool.hub.city})</span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/checkout/${pool.id}`}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <span>Join Pool • Order at R{unitPrice.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
