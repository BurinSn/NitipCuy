import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCapacity,
  formatDateTime,
  formatTripCode,
  orderingWindowLabel,
  orderingWindowState,
  serviceModeLabel,
} from "@/components/presentation";
import { RouteRibbon } from "@/components/route-ribbon";
import { SimulationNote } from "@/components/simulation-note";
import { application } from "@/server/composition";
import { findPublishedTrip } from "@/server/public-trip";

interface TripDetailPageProps {
  readonly params: Promise<{ readonly tripId: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const trips = await application.listPublishedTrips.execute();

  return trips.map((trip) => ({ tripId: trip.id }));
}

export async function generateMetadata({
  params,
}: TripDetailPageProps): Promise<Metadata> {
  const trip = await findPublishedTrip((await params).tripId);

  if (!trip) {
    notFound();
  }

  return {
    title: `${trip.originLabel} ke ${trip.destinationLabel}`,
    description: `Lihat jadwal, kapasitas, tarif, dan ketentuan trip simulasi ${trip.jastipperDisplayName}.`,
  };
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const trip = await findPublishedTrip((await params).tripId);

  if (!trip) {
    notFound();
  }

  const windowState = orderingWindowState(
    trip.requestOpenAt,
    trip.requestDeadline,
  );

  return (
    <main id="main-content">
      <section className="trip-detail-hero">
        <div className="shell">
          <Link className="back-link back-link-light" href="/">
            ← Kembali ke semua trip
          </Link>
          <div className="trip-detail-heading">
            <div>
              <div className="trip-detail-kicker">
                <span
                  className={`window-status window-status-${windowState.toLowerCase()}`}
                >
                  {orderingWindowLabel(windowState)}
                </span>
                <span>Trip simulasi</span>
              </div>
              <h1>Satu trip, semua ketentuan penting di satu tempat.</h1>
              <p>
                Dibuka oleh <strong>{trip.jastipperDisplayName}</strong> ·
                rating {trip.rating.average.toFixed(1)} dari {trip.rating.count}{" "}
                transaksi simulasi.
              </p>
            </div>
            <div className="trip-code" aria-label="Kode perjalanan simulasi">
              <span>Kode trip</span>
              <strong>{formatTripCode(trip.id)}</strong>
            </div>
          </div>
          <RouteRibbon
            destination={trip.destinationLabel}
            origin={trip.originLabel}
          />
        </div>
      </section>

      <div className="shell trip-detail-layout">
        <div className="trip-detail-content">
          <SimulationNote>
            Halaman ini memakai data publik simulasi. Tombol permintaan membuka
            prototipe tampilan saja dan tidak menyimpan data atau mengurangi
            kapasitas.
          </SimulationNote>

          <section
            className="content-section"
            aria-labelledby="schedule-heading"
          >
            <div className="content-section-heading">
              <p className="eyebrow">Jadwal lengkap</p>
              <h2 id="schedule-heading">Tahu waktunya sebelum memutuskan.</h2>
            </div>
            <ol className="schedule-track">
              <li>
                <span className="schedule-dot" aria-hidden="true" />
                <div>
                  <span>Pesanan dibuka</span>
                  <strong>
                    {formatDateTime(trip.requestOpenAt, trip.originTimeZone)}
                  </strong>
                  <small>Waktu lokasi asal</small>
                </div>
              </li>
              <li>
                <span className="schedule-dot" aria-hidden="true" />
                <div>
                  <span>Jastipper mulai tersedia</span>
                  <strong>
                    {formatDateTime(
                      trip.serviceWindowStartAt,
                      trip.originTimeZone,
                    )}
                  </strong>
                  <small>{trip.originLabel}</small>
                </div>
              </li>
              <li>
                <span
                  className="schedule-dot schedule-dot-alert"
                  aria-hidden="true"
                />
                <div>
                  <span>Permintaan ditutup</span>
                  <strong>
                    {formatDateTime(trip.requestDeadline, trip.originTimeZone)}
                  </strong>
                  <small>Permintaan baru berhenti</small>
                </div>
              </li>
              <li>
                <span className="schedule-dot" aria-hidden="true" />
                <div>
                  <span>Berangkat</span>
                  <strong>
                    {formatDateTime(trip.departureAt, trip.originTimeZone)}
                  </strong>
                  <small>Dari {trip.originLabel}</small>
                </div>
              </li>
              <li>
                <span className="schedule-dot" aria-hidden="true" />
                <div>
                  <span>Perkiraan tiba</span>
                  <strong>
                    {formatDateTime(
                      trip.estimatedArrivalAt,
                      trip.destinationTimeZone,
                    )}
                  </strong>
                  <small>Waktu {trip.destinationLabel}</small>
                </div>
              </li>
            </ol>
          </section>

          <section
            className="content-section"
            aria-labelledby="service-heading"
          >
            <div className="content-section-heading">
              <p className="eyebrow">Layanan di trip ini</p>
              <h2 id="service-heading">
                Pilih berdasarkan siapa yang memegang barangnya.
              </h2>
            </div>
            <div className="detail-service-grid">
              {trip.serviceModes.map((mode) => (
                <article key={mode}>
                  <div className="service-card-topline">
                    <span aria-hidden="true">
                      {mode === "SHOP_FOR_ME" ? "＋" : "→"}
                    </span>
                    <strong>{serviceModeLabel(mode)}</strong>
                  </div>
                  <p>
                    {mode === "SHOP_FOR_ME"
                      ? "Jastipper menilai rincian barang, jumlah, variasi, substitusi, dan batas anggaran sebelum menerima."
                      : "Jastipper menilai isi, nilai, ukuran, berat, penanganan, dan kelayakan barang di rute ini."}
                  </p>
                  <Link
                    href={`/trips/${trip.id}/request?mode=${mode === "SHOP_FOR_ME" ? "shop" : "carry"}`}
                  >
                    Lihat contoh permintaan
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section
            className="content-section"
            aria-labelledby="protection-heading"
          >
            <div className="content-section-heading">
              <p className="eyebrow">Bukti dan perlindungan</p>
              <h2 id="protection-heading">
                Status tidak berubah hanya karena tombol ditekan.
              </h2>
            </div>
            <div className="protection-list">
              <article>
                <span>01</span>
                <div>
                  <h3>Jastipper menilai dulu</h3>
                  <p>
                    Permintaan yang dikirim belum berarti diterima atau memiliki
                    harga final.
                  </p>
                </div>
              </article>
              <article>
                <span>02</span>
                <div>
                  <h3>Bukti mengikuti jenis layanan</h3>
                  <p>
                    Foto barang aktual untuk pembelian; foto koleksi dan berat
                    terukur untuk barang bawaan.
                  </p>
                </div>
              </article>
              <article>
                <span>03</span>
                <div>
                  <h3>Progres harus punya dasar</h3>
                  <p>
                    Label dibeli, dikoleksi, dikirim, dan selesai membutuhkan
                    transisi serta bukti yang sesuai.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section
            className="content-section"
            aria-labelledby="discussion-heading"
          >
            <div className="content-section-heading discussion-heading">
              <div>
                <p className="eyebrow">Diskusi publik</p>
                <h2 id="discussion-heading">
                  Pertanyaan yang membantu semua orang.
                </h2>
              </div>
              <button disabled type="button">
                Tanya jastipper
              </button>
            </div>
            {trip.publicQuestions.length > 0 ? (
              <ol className="discussion-list">
                {trip.publicQuestions.map((question) => (
                  <li key={question.id}>
                    <div className="discussion-avatar" aria-hidden="true">
                      {question.authorDisplayName.slice(0, 1)}
                    </div>
                    <div className="discussion-body">
                      <div className="discussion-author">
                        <strong>{question.authorDisplayName}</strong>
                        <time dateTime={question.createdAt}>
                          {formatDateTime(
                            question.createdAt,
                            trip.destinationTimeZone,
                          )}
                        </time>
                      </div>
                      <p>{question.message}</p>
                      {question.answer ? (
                        <div className="answer">
                          <span>Jawaban {trip.jastipperDisplayName}</span>
                          <p>{question.answer.message}</p>
                          <time dateTime={question.answer.createdAt}>
                            {formatDateTime(
                              question.answer.createdAt,
                              trip.destinationTimeZone,
                            )}
                          </time>
                        </div>
                      ) : (
                        <span className="awaiting-answer">
                          Menunggu jawaban jastipper
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty-inline">
                <strong>Belum ada pertanyaan publik.</strong>
                <p>
                  Pertanyaan umum tentang rute, toko, kemasan, atau aturan berat
                  akan tampil di sini.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="trip-decision-card" aria-label="Ringkasan keputusan">
          <div className="decision-card-status">
            <span
              className={`window-status window-status-${windowState.toLowerCase()}`}
            >
              {orderingWindowLabel(windowState)}
            </span>
            <small>Data simulasi</small>
          </div>
          <div className="decision-capacity">
            <span>Kapasitas tersedia</span>
            <strong>{formatCapacity(trip.remainingCapacityKg)}</strong>
          </div>
          <dl>
            <div>
              <dt>Tarif</dt>
              <dd>{trip.rateSummary}</dd>
            </div>
            <div>
              <dt>Serah terima</dt>
              <dd>{trip.deliverySummary}</dd>
            </div>
            <div>
              <dt>Lokasi jastipper</dt>
              <dd>{trip.sellerLocationLabel}</dd>
            </div>
          </dl>
          <Link
            className="button button-primary"
            href={`/trips/${trip.id}/request`}
          >
            Buat contoh permintaan
          </Link>
          <p>
            Belum membuat pesanan, menahan pembayaran, atau mengurangi
            kapasitas.
          </p>
        </aside>
      </div>
    </main>
  );
}
