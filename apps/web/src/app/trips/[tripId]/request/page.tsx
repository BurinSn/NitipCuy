import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { ServiceMode } from "@nitipcuy/domain";

import {
  formatCapacity,
  formatDateTime,
  formatTripCode,
} from "@/components/presentation";
import { RequestPreview } from "@/components/request-preview";
import { RouteRibbon } from "@/components/route-ribbon";
import { SimulationNote } from "@/components/simulation-note";
import { findPublishedTrip } from "@/server/public-trip";

interface RequestPageProps {
  readonly params: Promise<{ readonly tripId: string }>;
  readonly searchParams: Promise<{ readonly mode?: string | string[] }>;
}

export const metadata: Metadata = {
  title: "Contoh permintaan",
  description:
    "Pratinjau alur permintaan NitipCuy tanpa membuat pesanan atau menyimpan data.",
};

export default async function RequestPage({
  params,
  searchParams,
}: RequestPageProps) {
  const rawTripId = (await params).tripId;
  const trip = await findPublishedTrip(rawTripId);

  if (!trip) {
    notFound();
  }

  const requestedMode = firstValue((await searchParams).mode);
  const preferredMode: ServiceMode =
    requestedMode === "carry" ? "CARRY_MY_ITEM" : "SHOP_FOR_ME";
  const initialMode: ServiceMode | undefined = trip.serviceModes.includes(
    preferredMode,
  )
    ? preferredMode
    : trip.serviceModes[0];

  if (!initialMode) {
    notFound();
  }

  return (
    <main id="main-content">
      <section className="request-page-hero">
        <div className="shell">
          <Link className="back-link" href={`/trips/${trip.id}`}>
            ← Kembali ke detail trip
          </Link>
          <div className="request-hero-grid">
            <div>
              <p className="eyebrow">Pratinjau permintaan</p>
              <h1>Jelaskan barangnya. Jangan berkomitmen dulu.</h1>
              <p>
                Ini contoh bagaimana pelanggan menyusun informasi minimum agar
                jastipper bisa menilai permintaan dengan jelas.
              </p>
            </div>
            <div className="request-route-card">
              <span className="request-route-code">
                {formatTripCode(trip.id)}
              </span>
              <RouteRibbon
                compact
                destination={trip.destinationLabel}
                origin={trip.originLabel}
              />
              <div>
                <span>{formatCapacity(trip.remainingCapacityKg)} tersedia</span>
                <span>
                  Tutup{" "}
                  {formatDateTime(trip.requestDeadline, trip.originTimeZone)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell request-page-layout">
        <div>
          <SimulationNote>
            Formulir ini hanya hidup di browser. Formulir tidak memanggil API,
            menyimpan data, memesan kapasitas, atau memulai pembayaran.
          </SimulationNote>
          <RequestPreview
            availableModes={trip.serviceModes}
            initialMode={initialMode}
            tripId={trip.id}
          />
        </div>
        <aside className="request-side-guide">
          <p className="eyebrow">Yang terjadi kemudian</p>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Penilaian</strong>
                <p>
                  Jastipper memeriksa barang, aturan perjalanan, dan kapasitas.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Penawaran</strong>
                <p>
                  Biaya, substitusi, dan serah terima dijelaskan sebelum
                  persetujuan.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Komitmen terpisah</strong>
                <p>
                  Baru setelah kedua pihak setuju, pesanan dan pembayaran dapat
                  dilanjutkan.
                </p>
              </div>
            </li>
          </ol>
          <div className="side-guide-alert">
            <strong>Jangan masukkan</strong>
            <p>
              Alamat rumah, nomor identitas, detail kartu, atau informasi
              rahasia pada tahap penilaian ini.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
