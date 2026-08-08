import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "NitipCuy",
    template: "%s | NitipCuy",
  },
  description:
    "Temukan perjalanan jastip berdasarkan tujuan, jadwal, kapasitas, dan ketentuan yang jelas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main-content">
          Lewati ke konten
        </a>
        <header className="site-header">
          <div className="shell header-inner">
            <a className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">
                N
              </span>
              <span>
                <strong>NitipCuy</strong>
                <small>Fondasi marketplace jastip</small>
              </span>
            </a>
            <span className="environment-badge">Data simulasi</span>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell footer-inner">
            <p>
              Fondasi lokal untuk validasi arsitektur. Belum menerima transaksi
              atau data pribadi.
            </p>
            <p>NitipCuy adalah produk mandiri BurinSN.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
