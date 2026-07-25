import Link from "next/link";

import type { PublishedTrip, ServiceMode } from "@nitipcuy/domain";

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
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Cari berdasarkan perjalanan</p>
            <h1>Jastip yang jelas dari tujuan sampai serah terima.</h1>
            <p className="hero-lead">
              Lihat siapa yang bepergian, kapan permintaan ditutup, layanan apa
              yang tersedia, kapasitas tersisa, dan cara barang sampai ke kamu.
            </p>
            <div className="mode-grid" aria-label="Mode layanan">
              <article>
                <span className="mode-index">01</span>
                <div>
                  <h2>Belikan barang</h2>
                  <p>
                    Jastipper membeli sesuai permintaan dan bukti transaksi.
                  </p>
                </div>
              </article>
              <article>
                <span className="mode-index">02</span>
                <div>
                  <h2>Bawakan barang</h2>
                  <p>
                    Kamu sudah punya barang dan membutuhkan bantuan membawa.
                  </p>
                </div>
              </article>
            </div>
          </div>

          <form className="search-panel" method="get">
            <div className="panel-heading">
              <p className="eyebrow">Pencarian perjalanan</p>
              <p className="result-count">
                {trips.length} perjalanan ditemukan
              </p>
            </div>
            <label>
              Kota tujuan
              <input
                defaultValue={destination}
                name="destination"
                placeholder="Contoh: Jakarta"
                type="search"
              />
            </label>
            <div className="date-grid">
              <label>
                Berangkat mulai
                <input defaultValue={departureFrom} name="from" type="date" />
              </label>
              <label>
                Sampai
                <input defaultValue={departureTo} name="to" type="date" />
              </label>
            </div>
            <button type="submit">Cari perjalanan</button>
            <Link className="clear-link" href="/">
              Hapus filter
            </Link>
          </form>
        </div>
      </section>

      <section className="shell results-section" aria-labelledby="trip-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Perjalanan aktif</p>
            <h2 id="trip-heading">Pilih rute yang sesuai</h2>
          </div>
          <p>
            Semua harga, jadwal, dan kapasitas di halaman ini adalah data
            simulasi untuk menguji fondasi aplikasi.
          </p>
        </div>

        {trips.length > 0 ? (
          <div className="trip-list">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Belum ada perjalanan yang cocok.</h3>
            <p>Coba kota tujuan atau rentang tanggal yang berbeda.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function TripCard({ trip }: Readonly<{ trip: PublishedTrip }>) {
  return (
    <article className="trip-card">
      <div className="trip-route">
        <div>
          <span>Asal</span>
          <strong>{trip.originLabel}</strong>
        </div>
        <span className="route-line" aria-hidden="true" />
        <div>
          <span>Tujuan</span>
          <strong>{trip.destinationLabel}</strong>
        </div>
      </div>

      <div className="trip-meta-grid">
        <div>
          <span>Berangkat</span>
          <strong>{formatDate(trip.departureDate)}</strong>
        </div>
        <div>
          <span>Tutup permintaan</span>
          <strong>{formatDateTime(trip.requestDeadline)}</strong>
        </div>
        <div>
          <span>Kapasitas</span>
          <strong>{formatCapacity(trip.remainingCapacityKg)}</strong>
        </div>
        <div>
          <span>Lokasi jastipper</span>
          <strong>{trip.sellerLocationLabel}</strong>
        </div>
      </div>

      <div className="mode-tags">
        {trip.serviceModes.map((mode) => (
          <span key={mode}>{serviceModeLabel(mode)}</span>
        ))}
      </div>

      <div className="trip-commercial">
        <p>
          <span>Ketentuan tarif</span>
          <strong>{trip.rateSummary}</strong>
        </p>
        <p>
          <span>Serah terima</span>
          <strong>{trip.deliverySummary}</strong>
        </p>
      </div>

      <div className="trip-footer">
        <div>
          <strong>{trip.jastipperDisplayName}</strong>
          <span>
            {trip.rating.average.toFixed(1)} dari {trip.rating.count} transaksi
          </span>
        </div>
        <Link href={`/trips/${trip.id}`}>Lihat perjalanan</Link>
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

function serviceModeLabel(mode: ServiceMode): string {
  return mode === "SHOP_FOR_ME" ? "Belikan barang" : "Bawakan barang";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatCapacity(value: number): string {
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value)} kg tersisa`;
}
