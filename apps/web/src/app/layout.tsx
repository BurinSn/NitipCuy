import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "NitipCuy",
    template: "%s | NitipCuy",
  },
  description:
    "Temukan perjalanan jastip, baca ketentuannya, dan ikuti progres dengan lebih jelas.",
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
            <Link className="brand" href="/" aria-label="NitipCuy, beranda">
              <span className="brand-mark" aria-hidden="true">
                NC
              </span>
              <span>
                <strong>NitipCuy</strong>
                <small>Jastip dengan jalur yang jelas</small>
              </span>
            </Link>
            <nav className="site-nav" aria-label="Navigasi utama">
              <Link href="/">Cari trip</Link>
              <Link href="/orders">Pesanan saya</Link>
              <Link href="/jastipper">Ruang jastipper</Link>
            </nav>
            <div className="header-actions">
              <span className="environment-badge">Mode simulasi</span>
              <button disabled type="button" title="Masuk belum diaktifkan">
                Masuk
              </button>
            </div>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div className="footer-brand">
              <strong>NitipCuy</strong>
              <p>Temukan trip. Sepakati dengan jelas. Ikuti setiap langkah.</p>
            </div>
            <div className="footer-status">
              <span>Prototipe lokal</span>
              <p>Belum menerima transaksi, akun, atau data pribadi.</p>
            </div>
            <p className="footer-owner">Produk mandiri BurinSN.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
