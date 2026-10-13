import { Buffer } from 'buffer';

const SCALE = 1_000_000_000n;
const DIRAC_MAGIC = 0x4449524143n; // 0x4449524143 (DIRAC)

export interface DiracStateUI {
  midPrice: number;
  inventoryQ: number;
  reservationPrice: number;
  spread: number;
}

/// 1. O(1) Zero-Copy Buffer Mapper
export function parseDiracState(buffer: Buffer): DiracStateUI {
  // Validate struct alignment and memory integrity
  const magic = buffer.readBigUInt64LE(0);
  if (magic !== DIRAC_MAGIC) throw new Error("Invalid memory signature");

  // Skip Pubkeys at offsets 8 (admin), 40 (base), 72 (quote)
  
  // Extract strictly typed 64-bit scalars
  const midPriceRaw = buffer.readBigUInt64LE(104);
  const inventoryQRaw = buffer.readBigInt64LE(112);
  const gammaRaw = buffer.readBigUInt64LE(120);
  const sigmaSqRaw = buffer.readBigUInt64LE(128);

  return computeThermodynamicState(midPriceRaw, inventoryQRaw, gammaRaw, sigmaSqRaw);
}

/// 2. Deterministic UI Quant Engine 
function computeThermodynamicState(
  midPriceRaw: bigint, 
  inventoryQRaw: bigint, 
  gammaRaw: bigint, 
  sigmaSqRaw: bigint
): DiracStateUI {
  const midPrice = Number(midPriceRaw) / Number(SCALE);
  const inventoryQ = Number(inventoryQRaw);
  const gamma = Number(gammaRaw) / Number(SCALE);
  const sigmaSq = Number(sigmaSqRaw) / Number(SCALE);

  // Reconstruct Avellaneda-Stoikov math for visualization
  // Reservation Price: r(s) = s - q * gamma * sigma^2
  const inventoryPenalty = inventoryQ * gamma * sigmaSq;
  const reservationPrice = midPrice - inventoryPenalty;

  // Taylor Expansion Spread: spread = gamma * sigma^2 + 2/gamma
  const baseSpread = gamma * sigmaSq;
  const depthAdjustment = gamma > 0 ? 2 / gamma : 0;
  const spread = baseSpread + depthAdjustment;

  return { midPrice, inventoryQ, reservationPrice, spread };
}