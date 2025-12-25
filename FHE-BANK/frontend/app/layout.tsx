import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FHEVM Examples - Encrypted Balance Demo",
  description: "Privacy-preserving smart contracts with FHEVM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
