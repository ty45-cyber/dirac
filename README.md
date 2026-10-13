# Dirac Protocol
**Autonomous Thermodynamic Quant Engine | Solana Virtual Machine**

## 1. Executive Summary
The Dirac Protocol is a decentralized, deterministic Avellaneda-Stoikov market maker built for the Solana Virtual Machine (SVM)[cite: 1]. Designed to qualify for the Adevar Labs Pre-Audit, this architecture deliberately discards generic serialization and floating-point math in favor of zero-copy memory mapping, hardware-accelerated bitwise operations, and fixed-point integer approximations[cite: 1]. The result is an autonomous, ultra-low latency execution engine that manages inventory risk without relying on external AI or off-chain oracles[cite: 1].

## 2. Architecture & Data Structures
*   **Zero-Copy Memory Mapping:** To eliminate the ~5000 Compute Unit (CU) overhead associated with Borsh deserialization, Dirac treats Solana PDA byte arrays as raw physical RAM[cite: 1]. By utilizing `bytemuck` and strictly enforcing `#[repr(C, align(8))]` on structs, the protocol achieves O(1) state hydration, dropping state-load compute costs to ~15 CUs[cite: 1].
*   **O(1) Tick Resolution:** Order book traversal is abstracted away from iterative arrays. Liquidity ticks are mapped to a flat 256-word bitmap (`[u64; 256]`)[cite: 1]. Finding the next initialized price bin utilizes the hardware-level `tzcnt` (Trailing Zero Count) instruction, reducing lookup complexity from O(N) to strict O(1) constant time[cite: 1].
*   **Lock-Free SPSC Ring Buffer:** High-frequency trade logging bypasses expensive BPF system calls[cite: 1]. The protocol utilizes a lock-free Single-Producer Single-Consumer (SPSC) ring buffer mapped directly to a PDA[cite: 1]. By constraining buffer capacity to 1024, modulo arithmetic is replaced by bitwise AND masking (`& 1023`), reducing index calculations to a single CPU clock cycle[cite: 1]. Off-chain MEV searchers track a monotonic `head_sequence` pointer, converting off-chain parsing from a full sweep to an O(K) targeted load[cite: 1].

## 3. Quantitative Engine: Math & Physics
*   **Avellaneda-Stoikov Model:** Dirac implements the Avellaneda-Stoikov model entirely on-chain to dynamically adjust the bid-ask spread and skew based on inventory accumulation and risk aversion, functioning as a thermodynamic energy matching engine[cite: 1].
*   **Fixed-Point Integer Math:** To maintain absolute determinism and bypass Solana's computationally expensive and non-deterministic floating-point (FPU) operations, all fractional variables are scaled by a constant factor of 10^9[cite: 1].
*   **Taylor Series Spread Approximation:** Because the SVM lacks native logarithmic functions, calculating the optimal spread is performed using a first-order Taylor series approximation[cite: 1]. This provides sufficient micro-adjustment precision for the spread expansion while keeping compute time strictly O(1)[cite: 1].

## 4. Threat Model & Security (Adevar Focus)
In alignment with Adevar Labs' focus on strict memory safety and control-plane analysis, the architecture incorporates the following defenses[cite: 1]:
*   **Deterministic PDA Sandboxing:** Validation of seeds, bumps, and static memory bounds occurs before any pointer casting or state hydration[cite: 1]. Buffer overflows are mathematically impossible as all data structures are statically sized with no dynamic allocations (`Vec<T>`)[cite: 1].
*   **Fail-Fast Eager Validation:** Signature verification, account owner assertions, and basic instruction data validation occur as the absolute first step in the execution pipeline, preventing Compute Unit (CU) spam attacks[cite: 1].
*   **Arithmetic Overflow Traps:** The entire protocol compiles with `#![forbid(arithmetic_overflow)]`[cite: 1]. All mathematical operations on the tick pipeline and inventory state utilize strict `checked_add`, `checked_sub`, and `checked_mul` constraints to prevent integer exploitation[cite: 1].
*   **Reentrancy Immunity:** State mutations occur strictly after all cross-program invocations (CPIs)[cite: 1]. Mutable references to the zero-copy state are explicitly dropped prior to any external context switch[cite: 1].

---

## 5. Repository Structure
Following pragmatic programmer principles, the protocol operates on a simple, 13-file codebase.

```text
dirac-protocol/
├── program/                       # --- BACKEND: Solana Rust SVM ---
│   ├── Cargo.toml                 # Build flags & dependency limits
│   └── src/
│       ├── lib.rs                 # Program entrypoint & eager fail-fast validation
│       ├── state.rs               # #[repr(C)] zero-copy topologies
│       ├── loader.rs              # Zero-copy hydration & Avellaneda-Stoikov math
│       └── security.rs            # PDA sandboxing & constraint verification
│
└── ui/                            # --- FRONTEND: Next.js + React ---
    ├── package.json               # Wallet adapters & web3.js deps
    ├── tsconfig.json              # Strict typing rules
    ├── next.config.mjs            # Buffer polyfills for Webpack
    └── src/
        ├── app/
        │   ├── layout.tsx         # Solana provider injection
        │   └── page.tsx           # Dashboard visualizations
        ├── hooks/
        │   └── useDiracState.ts   # WebSocket RPC sink
        └── utils/
            └── diracParser.ts     # TypeScript byte-offset mapper