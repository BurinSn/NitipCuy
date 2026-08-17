import type { Metadata } from "next";
import Link from "next/link";

import { SimulationNote } from "@/components/simulation-note";

export const metadata: Metadata = {
  title: "Ruang jastipper",
  description: "Pratinjau ruang kerja jastipper NitipCuy.",
};

const requests = [
  {
    code: "RQ–0318",
    customer: "Ayu",
    item: "2 × tas lipat",
    mode: "Belikan",
    weight: "0,8 kg",
    signal: "Periksa substitusi",
  },
  {
    code: "RQ–0321",
    customer: "Bima",
    item: "1 × buku koleksi",
    mode: "Bawakan",
    weight: "1,2 kg",
    signal: "Periksa kemasan",
  },
  {
    code: "RQ–0326",
    customer: "Nisa",
    item: "3 × produk perawatan",
    mode: "Belikan",
    weight: "1,4 kg",
    signal: "Periksa cairan",
  },
] as const;

export default function JastipperPage() {
  return (
    <main id="main-content">
      <section className="workspace-hero jastipper-workspace-hero">
        <div className="shell workspace-hero-grid">
          <div>
            <p className="eyebrow eyebrow-light">Ruang jastipper</p>
            <h1>Putuskan dengan kapasitas dan risikonya terlihat.</h1>
            <p>
              Permintaan baru, pekerjaan aktif, dan bukti perjalanan dipisahkan
              agar tidak ada komitmen yang terselip.
            </p>
          </div>
          <div className="capacity-board">
            <div className="capacity-board-topline">
              <span>Trip NC–GZA1</span>
              <strong>Guangzhou → Jakarta</strong>
            </div>
            <div
              className="capacity-meter"
              aria-label="8 dari 12 kilogram terencana"
            >
              <span />
            </div>
            <div className="capacity-numbers">
              <strong>8 kg</strong>
              <span>dari 12 kg direncanakan</span>
            </div>
          </div>
        </div>
      </section>

      <div className="shell workspace-layout">
        <SimulationNote>
          Antrean, kapasitas, pelanggan, dan aktivitas di ruang ini adalah
          contoh. Tombol keputusan dinonaktifkan dan tidak mengubah data.
        </SimulationNote>

        <section className="queue-section" aria-labelledby="queue-title">
          <div className="queue-heading">
            <div>
              <p className="eyebrow">Perlu dinilai</p>
              <h2 id="queue-title">3 permintaan baru</h2>
            </div>
            <div className="queue-deadline">
              <span>Penutupan trip</span>
              <strong>17 Agu · 17.00 WIB</strong>
            </div>
          </div>

          <div
            className="request-table"
            role="table"
            aria-label="Permintaan simulasi"
          >
            <div className="request-table-head" role="row">
              <span role="columnheader">Permintaan</span>
              <span role="columnheader">Barang</span>
              <span role="columnheader">Berat</span>
              <span role="columnheader">Sinyal pemeriksaan</span>
              <span role="columnheader">Tindakan</span>
            </div>
            {requests.map((request) => (
              <article
                className="request-table-row"
                key={request.code}
                role="row"
              >
                <div role="cell">
                  <strong>{request.code}</strong>
                  <span>
                    {request.customer} · {request.mode}
                  </span>
                </div>
                <div role="cell">
                  <strong>{request.item}</strong>
                  <span>Rincian tersedia</span>
                </div>
                <div role="cell">
                  <strong>{request.weight}</strong>
                  <span>perkiraan</span>
                </div>
                <div role="cell">
                  <span className="risk-signal">{request.signal}</span>
                </div>
                <div className="queue-actions" role="cell">
                  <button disabled type="button">
                    Nilai
                  </button>
                  <button disabled type="button">
                    Tolak
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="active-work-section"
          aria-labelledby="active-work-title"
        >
          <div className="section-heading section-heading-compact">
            <div>
              <p className="eyebrow">Sedang berjalan</p>
              <h2 id="active-work-title">Pekerjaan aktif</h2>
            </div>
            <p>
              Bukti berikutnya ditentukan oleh jenis layanan dan status pesanan.
            </p>
          </div>
          <div className="active-work-grid">
            <article>
              <span className="status-chip status-chip-action">
                Perlu bukti pembelian
              </span>
              <h3>NC–1842 · Sepatu lari</h3>
              <p>
                Unggah foto barang aktual dan struk setelah pembelian berhasil.
              </p>
              <button disabled type="button">
                Tambah bukti
              </button>
            </article>
            <article>
              <span className="status-chip status-chip-transit">
                Siap dikoleksi
              </span>
              <h3>NC–1860 · Paket buku</h3>
              <p>
                Catat kondisi kemasan dan berat terukur saat barang diterima.
              </p>
              <button disabled type="button">
                Catat koleksi
              </button>
            </article>
            <article className="active-work-summary">
              <span>Nilai pekerjaan simulasi</span>
              <strong>Rp3.850.000</strong>
              <dl>
                <div>
                  <dt>Diterima</dt>
                  <dd>5</dd>
                </div>
                <div>
                  <dt>Butuh tindakan</dt>
                  <dd>2</dd>
                </div>
                <div>
                  <dt>Sengketa</dt>
                  <dd>0</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>

        <div className="workspace-bottom-link">
          <Link className="button button-secondary" href="/">
            Lihat tampilan pelanggan ↗
          </Link>
        </div>
      </div>
    </main>
  );
}
