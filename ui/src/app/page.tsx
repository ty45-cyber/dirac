'use client';

import { useDiracState } from "../hooks/useDiracState";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Hardcoded PDA for the Adevar pre-audit test environment
const DIRAC_PDA = "DRc9Y...YourPDA...111"; 

export default function DashboardPage() {
  const state = useDiracState(DIRAC_PDA);

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto font-mono">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter">Dirac Protocol</h1>
          <p className="text-zinc-500 text-sm mt-1">Autonomous Thermodynamic Quant Engine</p>
        </div>
        <WalletMultiButton className="!bg-zinc-800 hover:!bg-zinc-700 !transition-colors" />
      </header>

      {!state ? (
        <div className="flex items-center justify-center h-64 text-zinc-500 animate-pulse">
          Syncing zero-copy memory buffers from RPC...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            label="Index Mid-Price" 
            value={`$${state.midPrice.toFixed(4)}`} 
          />
          <StatCard 
            label="AS Reservation Price" 
            value={`$${state.reservationPrice.toFixed(4)}`} 
            highlight="text-blue-400"
          />
          <StatCard 
            label="Net Inventory (q)" 
            value={`${state.inventoryQ > 0 ? '+' : ''}${state.inventoryQ} Units`} 
            highlight={state.inventoryQ > 0 ? "text-red-400" : state.inventoryQ < 0 ? "text-emerald-400" : "text-zinc-100"}
          />
          <StatCard 
            label="Optimal Spread (δ)" 
            value={`$${state.spread.toFixed(4)}`} 
            highlight="text-amber-400"
          />
        </div>
      )}
    </main>
  );
}

// DRY UI Helper Component
function StatCard({ label, value, highlight = "text-zinc-100" }: { label: string, value: string, highlight?: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col justify-center">
      <span className="text-zinc-500 text-sm uppercase tracking-wider mb-2">{label}</span>
      <span className={`text-3xl font-semibold ${highlight}`}>{value}</span>
    </div>
  );
}