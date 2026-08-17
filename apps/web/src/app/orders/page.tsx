import type { Metadata } from "next";
import Link from "next/link";

import { SimulationNote } from "@/components/simulation-note";

export const metadata: Metadata = {
  title: "Pesanan saya",
  description: "Pratinjau progres pesanan pelanggan NitipCuy.",
};

const timeline = [
  {
    label: "Permintaan diterima",
    detail: "Rincian, harga, dan titik serah sudah disepakati.",
    time: "12 Agu · 19.42 WIB",
    state: "complete",
  },
  {
    label: "Barang dibeli",
    detail: "Bukti barang aktual dan struk tersedia untuk diperiksa.",
    time: "14 Agu · 16.20 WIB",
    state: "complete",
  },
  {
    label: "Dalam perjalanan",
    detail: "Jastipper dijadwalkan berangkat dari Guangzhou pada 20 Agu.",
    time: "Tahap berikutnya",
    state: "current",
  },
  {
    label: "Tiba dan siap diserahkan",
    detail:
      "Pelanggan mendapat petunjuk serah terima setelah kedatangan terbukti.",
    time: "Belum dimulai",
    state: "upcoming",
  },
  {
    label: "Selesai",
    detail:
      "Penyelesaian memerlukan konfirmasi atau bukti serah terima yang berlaku.",
    time: "Belum dimulai",
    state: "upcoming",
  },
] as const;

export default function OrdersPage() {
  return (
    <main id="main-content">
      <section className="workspace-hero customer-workspace-hero">
        <div className="shell workspace-hero-grid">
          <div>
            <p className="eyebrow eyebrow-light">Ruang pelanggan</p>
            <h1>Satu pesanan, satu jejak yang bisa dibaca.</h1>
            <p>
              Jadwal, bukti, keputusan, dan langkah berikutnya tetap terhubung
              pada pesanan yang sama.
            </p>
          </div>
          <div className="workspace-stat-grid">
            <div>
              <strong>1</strong>
              <span>aktif</span>
            </div>
            <div>
              <strong>0</strong>
              <span>perlu tindakan</span>
            </div>
            <div>
              <strong>2</strong>
              <span>bukti tersedia</span>
            </div>
          </div>
        </div>
      </section>

      <div className="shell workspace-layout">
        <SimulationNote>
          Pesanan, waktu, status, dan bukti di halaman ini sepenuhnya simulasi.
          Tidak ada akun pelanggan atau pembayaran nyata.
        </SimulationNote>

        <section
          className="order-focus-card"
          aria-labelledby="active-order-title"
        >
          <div className="order-focus-topline">
            <div>
              <span className="status-chip status-chip-transit">
                Menunggu keberangkatan
              </span>
              <p>Pesanan NC–1842 · Guangzhou → Jakarta</p>
            </div>
            <Link href="/trips/guangzhou-jakarta-august">Lihat trip ↗</Link>
          </div>
          <div className="order-focus-heading">
            <div>
              <p className="eyebrow">Belikan barang</p>
              <h2 id="active-order-title">Sepatu lari, warna biru tua</h2>
            </div>
            <div className="next-action">
              <span>Tindakan kamu</span>
              <strong>Belum ada</strong>
              <small>Pantau pembaruan keberangkatan.</small>
            </div>
          </div>

          <div className="order-timeline-wrap">
            <ol className="order-timeline">
              {timeline.map((item) => (
                <li className={`timeline-${item.state}`} key={item.label}>
                  <span className="timeline-marker" aria-hidden="true" />
                  <div className="timeline-copy">
                    <div>
                      <strong>{item.label}</strong>
                      <time>{item.time}</time>
                    </div>
                    <p>{item.detail}</p>
                    {item.label === "Barang dibeli" && (
                      <button className="text-button" type="button">
                        Lihat 2 bukti simulasi
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="workspace-support-grid">
          <article>
            <span className="support-index">01</span>
            <h3>Ada masalah dengan barang?</h3>
            <p>
              Catat masalah pada pesanan yang tepat agar bukti dan batas
              waktunya tetap terhubung.
            </p>
            <button disabled type="button">
              Buka bantuan
            </button>
          </article>
          <article>
            <span className="support-index">02</span>
            <h3>Kenali statusnya</h3>
            <p>
              Setiap perubahan status membutuhkan aktor dan bukti yang
              sesuai—bukan sekadar klik.
            </p>
            <Link href="/">Cari trip lain</Link>
          </article>
        </section>
      </div>
    </main>
  );
}
