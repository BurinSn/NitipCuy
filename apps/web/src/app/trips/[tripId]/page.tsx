import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DomainValidationError, tripId } from "@nitipcuy/domain";

import { application } from "@/server/composition";

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
  const trip = await findTrip((await params).tripId);

  if (!trip) {
    notFound();
  }

  return {
    title: `${trip.originLabel} ke ${trip.destinationLabel}`,
    description: `Perjalanan simulasi oleh ${trip.jastipperDisplayName}.`,
  };
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const trip = await findTrip((await params).tripId);

  if (!trip) {
    notFound();
  }

  return (
    <main id="main-content" className="shell detail-page">
      <Link className="back-link" href="/">
        Kembali ke pencarian
      </Link>

      <section className="detail-hero">
        <div>
          <p className="eyebrow">Detail perjalanan simulasi</p>
          <h1>
            {trip.originLabel} ke {trip.destinationLabel}
          </h1>
          <p>
            Dibuka oleh <strong>{trip.jastipperDisplayName}</strong>. Permintaan
            ditutup {formatDateTime(trip.requestDeadline)}.
          </p>
        </div>
        <div className="capacity-box">
          <span>Kapasitas tersedia</span>
          <strong>{formatCapacity(trip.remainingCapacityKg)}</strong>
          <small>Ketentuan akhir mengikuti persetujuan jastipper.</small>
        </div>
      </section>

      <div className="detail-grid">
        <section className="detail-panel" aria-labelledby="terms-heading">
          <p className="eyebrow">Ketentuan utama</p>
          <h2 id="terms-heading">Sebelum membuat permintaan</h2>
          <dl className="terms-list">
            <div>
              <dt>Tanggal berangkat</dt>
              <dd>{formatDate(trip.departureDate)}</dd>
            </div>
            <div>
              <dt>Perkiraan tiba</dt>
              <dd>{formatDateTime(trip.estimatedArrivalAt)}</dd>
            </div>
            <div>
              <dt>Lokasi jastipper</dt>
              <dd>{trip.sellerLocationLabel}</dd>
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
          <div className="prototype-notice">
            Formulir permintaan dan pembayaran belum diaktifkan. Fondasi ini
            hanya membuktikan alur baca publik tanpa identitas atau layanan
            eksternal.
          </div>
        </section>

        <section className="detail-panel" aria-labelledby="discussion-heading">
          <p className="eyebrow">Diskusi publik</p>
          <h2 id="discussion-heading">
            Pertanyaan yang bisa dibaca semua orang
          </h2>
          {trip.publicQuestions.length > 0 ? (
            <ol className="discussion-list">
              {trip.publicQuestions.map((question) => (
                <li key={question.id}>
                  <div className="discussion-author">
                    <strong>{question.authorDisplayName}</strong>
                    <time dateTime={question.createdAt}>
                      {formatDateTime(question.createdAt)}
                    </time>
                  </div>
                  <p>{question.message}</p>
                  {question.answer ? (
                    <div className="answer">
                      <div className="discussion-author">
                        <strong>{question.answer.authorDisplayName}</strong>
                        <time dateTime={question.answer.createdAt}>
                          {formatDateTime(question.answer.createdAt)}
                        </time>
                      </div>
                      <p>{question.answer.message}</p>
                    </div>
                  ) : (
                    <span className="awaiting-answer">Menunggu jawaban</span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted-copy">Belum ada pertanyaan publik.</p>
          )}
        </section>
      </div>
    </main>
  );
}

async function findTrip(rawTripId: string) {
  try {
    return await application.getPublishedTrip.execute(tripId(rawTripId));
  } catch (error) {
    if (error instanceof DomainValidationError) {
      return null;
    }

    throw error;
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
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
  }).format(value)} kg`;
}
