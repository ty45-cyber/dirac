import { Inter } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import SolanaProviders from "./solana-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dirac Protocol",
  description: "Zero-copy Avellaneda-Stoikov Market Maker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100`}>
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  );
}