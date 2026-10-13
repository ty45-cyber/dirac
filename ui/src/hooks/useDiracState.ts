import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { parseDiracState, DiracStateUI } from './diracParser';
import { Buffer } from 'buffer';

/// 1. Real-Time Memory Mutation Hook
export function useDiracState(pdaAddress: string) {
  const { connection } = useConnection();
  const [state, setState] = useState<DiracStateUI | null>(null);

  useEffect(() => {
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(pdaAddress);
    } catch {
      return; // Fail silently if the PDA string is not yet valid
    }

    // Eager load initial memory state
    connection.getAccountInfo(pubkey).then((info) => {
      if (info?.data) {
        setState(parseDiracState(Buffer.from(info.data)));
      }
    }).catch(console.error);

    // 2. Lock-Free WebSocket Event Sink
    const subscriptionId = connection.onAccountChange(
      pubkey,
      (accountInfo) => {
        try {
          // Immediately cast the incoming raw buffer without JSON deserialization
          setState(parseDiracState(Buffer.from(accountInfo.data)));
        } catch (err) {
          console.error("Memory parsing error:", err);
        }
      },
      'processed' // Use lowest latency commitment level
    );

    // Cleanup memory leak on unmount
    return () => {
      connection.removeAccountChangeListener(subscriptionId).catch(console.error);
    };
  }, [connection, pdaAddress]);

  return state;
}