import Link from "next/link";

import type { PublishedTrip } from "@nitipcuy/domain";

import {
  formatCapacity,
  formatDateTime,
  formatDateTimeRange,
  orderingWindowLabel,
  orderingWindowState,
  serviceModeShortLabel,
} from "@/components/presentation";
import { RouteRibbon } from "@/components/route-ribbon";
import { SimulationNote } from "@/components/simulation-note";
import { application } from "@/server/composition";

interface HomePageProps {
  readonly searchParams: Promise<{
    readonly destination?: string | string[];
    readonly from?: string | string[];
    readonly to?: string | string[];
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const destination = firstValue(params.destination);
  const departureFrom = validDateValue(firstValue(params.from));
  const departureTo = validDateValue(firstValue(params.to));
  const trips = await application.listPublishedTrips.execute({
    ...(destination ? { destination } : {}),
    ...(departureFrom ? { departureFrom } : {}),
    ...(departureTo ? { departureTo } : {}),
  });

  return (
    <main id="main-content">
      <section className="home-hero">
        <div className="shell home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow eyebrow-light">
              Marketplace jastip berbasis trip
            </p>
            <h1>
              Barang titipan,
              <span>jalurnya kelihatan.</span>
            </h1>
            <p className="hero-lead">
              Cari orang yang memang sedang bepergian. Lihat tenggat pesanan,
              kapasitas, tarif, dan cara serah terimanya sebelum kamu meminta
              bantuan.
            </p>
            <ol
              className="journey-steps"
              aria-label="Cara menggunakan NitipCuy"
            >
              <li>
                <span>1</span>
                <p>
                  <strong>Cari trip</strong> berdasarkan tujuan dan waktu.
                </p>
              </li>
              <li>
                <span>2</span>
                <p>
                  <strong>Baca ketentuan</strong> dari jastipper.
                </p>
              </li>
              <li>
                <span>3</span>
                <p>
                  <strong>Kirim permintaan</strong> lewat platform.
                </p>
              </li>
            </ol>
          </div>

          <div className="hero-route-tag" aria-label="Contoh rute NitipCuy">
            <div className="tag-topline">
              <span>Rute pilihan minggu ini</span>
              <strong>NC / 0826</strong>
            </div>
            <RouteRibbon destination="Jakarta" origin="Guangzhou" />
            <div className="tag-facts">
              <div>
                <span>Pesanan tutup</span>
                <strong>17 Agu · 17.00 WIB</strong>
              </div>
              <div>
                <span>Kapasitas</span>
                <strong>12 kg tersedia</strong>
              </div>
            </div>
            <div className="tag-perforation" aria-hidden="true" />
            <p>
              Belikan barang <span>atau</span> bawakan barang milikmu.
            </p>
          </div>
        </div>
      </section>

      <section className="finder-section" aria-labelledby="finder-title">
        <div className="shell finder-shell">
          <div className="finder-heading">
            <p className="eyebrow">Mulai dari tujuan</p>
            <h2 id="finder-title">Kamu mau barangnya tiba di mana?</h2>
          </div>
          <form className="trip-finder" method="get">
            <label className="field field-destination">
              <span>Kota tujuan</span>
              <input
                defaultValue={destination}
                name="destination"
                placeholder="Jakarta, Surabaya, Bandung…"
                type="search"
              />
            </label>
            <label className="field">
              <span>Berangkat mulai</span>
              <input defaultValue={departureFrom} name="from" type="date" />
            </label>
            <label className="field">
              <span>Sampai</span>
              <input defaultValue={departureTo} name="to" type="date" />
            </label>
            <button
              className="button button-primary finder-button"
              type="submit"
            >
              Cari trip
            </button>
          </form>
          <div className="finder-meta">
            <strong>{trips.length} trip ditemukan</strong>
            {(destination || departureFrom || departureTo) && (
              <Link href="/">Hapus semua filter</Link>
            )}
          </div>
        </div>
      </section>

      <section className="shell results-section" aria-labelledby="trip-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trip yang bisa kamu cek</p>
            <h2 id="trip-heading">
              Pilih berdasarkan jalurnya, bukan tebak-tebakan.
            </h2>
          </div>
          <p>
            Jastipper menentukan tarif dan ketentuannya sendiri. NitipCuy
            membantu membuat detail pentingnya terbaca sebelum ada komitmen.
          </p>
        </div>

        <SimulationNote>
          Semua nama, trip, kapasitas, dan aktivitas di layar ini adalah data
          simulasi untuk penilaian desain. Belum ada transaksi nyata.
        </SimulationNote>

        {trips.length > 0 ? (
          <div className="trip-grid">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-mark" aria-hidden="true">
              ↗
            </span>
            <div>
              <h3>Belum ada trip yang searah.</h3>
              <p>Coba kota tujuan atau rentang tanggal yang berbeda.</p>
            </div>
            <Link className="button button-secondary" href="/">
              Lihat semua trip
            </Link>
          </div>
        )}
      </section>

      <section className="service-explainer">
        <div className="shell service-explainer-grid">
          <div>
            <p className="eyebrow eyebrow-light">Dua kebutuhan, satu jalur</p>
            <h2>Pilih bantuan yang memang kamu perlukan.</h2>
          </div>
          <article>
            <span className="service-icon" aria-hidden="true">
              ＋
            </span>
            <h3>Belikan barang</h3>
            <p>
              Jastipper membeli sesuai rincian, batas anggaran, dan aturan
              substitusi yang kamu ajukan.
            </p>
          </article>
          <article>
            <span className="service-icon" aria-hidden="true">
              →
            </span>
            <h3>Bawakan barang</h3>
            <p>
              Kamu sudah memiliki barangnya; jastipper menilai isi, ukuran,
              berat, dan kelayakan rutenya.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

function TripCard({ trip }: Readonly<{ trip: PublishedTrip }>) {
  const windowState = orderingWindowState(
    trip.requestOpenAt,
    trip.requestDeadline,
  );

  return (
    <article className="trip-card">
      <div className="trip-card-topline">
        <div className="mode-tags">
          {trip.serviceModes.map((mode) => (
            <span key={mode}>{serviceModeShortLabel(mode)}</span>
          ))}
        </div>
        <span
          className={`window-status window-status-${windowState.toLowerCase()}`}
        >
          {orderingWindowLabel(windowState)}
        </span>
      </div>

      <RouteRibbon
        compact
        destination={trip.destinationLabel}
        origin={trip.originLabel}
      />

      <div className="trip-card-decision">
        <div>
          <span className="fact-label">Batas permintaan</span>
          <strong>
            {formatDateTime(trip.requestDeadline, trip.originTimeZone)}
          </strong>
          <small>mengikuti waktu lokasi asal</small>
        </div>
        <div className="capacity-fact">
          <span className="fact-label">Kapasitas tersisa</span>
          <strong>{formatCapacity(trip.remainingCapacityKg)}</strong>
        </div>
      </div>

      <dl className="trip-card-terms">
        <div>
          <dt>Jastipper</dt>
          <dd>
            {trip.jastipperDisplayName} · {trip.rating.average.toFixed(1)} (
            {trip.rating.count})
          </dd>
        </div>
        <div>
          <dt>Di lokasi asal</dt>
          <dd>
            {formatDateTimeRange(
              trip.serviceWindowStartAt,
              trip.serviceWindowEndAt,
              trip.originTimeZone,
            )}
          </dd>
        </div>
        <div>
          <dt>Tarif</dt>
          <dd>{trip.rateSummary}</dd>
        </div>
        <div>
          <dt>Serah terima</dt>
          <dd>{trip.deliverySummary}</dd>
        </div>
      </dl>

      <div className="trip-card-footer">
        <span>
          Lokasi jastipper: <strong>{trip.sellerLocationLabel}</strong>
        </span>
        <Link className="button button-secondary" href={`/trips/${trip.id}`}>
          Lihat detail <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function validDateValue(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? undefined : value;
}
