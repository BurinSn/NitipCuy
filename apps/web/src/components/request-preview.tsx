"use client";

import { useState, type FormEvent } from "react";

import type { ServiceMode } from "@nitipcuy/domain";

import { serviceModeLabel } from "./presentation";

interface RequestPreviewProps {
  readonly availableModes: readonly ServiceMode[];
  readonly initialMode: ServiceMode;
  readonly tripId: string;
}

export function RequestPreview({
  availableModes,
  initialMode,
  tripId,
}: RequestPreviewProps) {
  const [mode, setMode] = useState<ServiceMode>(initialMode);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [weight, setWeight] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [previewed, setPreviewed] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreviewed(true);
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <fieldset className="mode-selector">
        <legend>Pilih jenis bantuan</legend>
        <div className="mode-selector-options">
          {availableModes.map((availableMode) => (
            <label key={availableMode}>
              <input
                checked={mode === availableMode}
                name="mode"
                onChange={() => {
                  setMode(availableMode);
                  setPreviewed(false);
                }}
                type="radio"
                value={availableMode}
              />
              <span aria-hidden="true">
                {availableMode === "SHOP_FOR_ME" ? "+" : "→"}
              </span>
              <strong>{serviceModeLabel(availableMode)}</strong>
              <small>
                {availableMode === "SHOP_FOR_ME"
                  ? "Jastipper membeli setelah rincian dan batas biaya disepakati."
                  : "Barang sudah milikmu dan perlu dinilai sebelum diserahkan."}
              </small>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="request-fields">
        <label className="field field-wide">
          <span>Barang apa?</span>
          <input
            maxLength={80}
            onChange={(event) => {
              setItemName(event.target.value);
              setPreviewed(false);
            }}
            placeholder={
              mode === "SHOP_FOR_ME"
                ? "Contoh: sepatu lari seri X"
                : "Contoh: buku koleksi dalam kotak"
            }
            required
            value={itemName}
          />
          <small>
            Nama umum saja. Jangan masukkan alamat atau data pribadi.
          </small>
        </label>

        <label className="field">
          <span>Jumlah</span>
          <input
            min="1"
            onChange={(event) => {
              setQuantity(event.target.value);
              setPreviewed(false);
            }}
            required
            type="number"
            value={quantity}
          />
        </label>

        <label className="field">
          <span>Perkiraan berat total</span>
          <div className="input-suffix">
            <input
              min="0.1"
              onChange={(event) => {
                setWeight(event.target.value);
                setPreviewed(false);
              }}
              placeholder="1.5"
              required
              step="0.1"
              type="number"
              value={weight}
            />
            <span>kg</span>
          </div>
        </label>

        {mode === "SHOP_FOR_ME" && (
          <label className="field field-wide">
            <span>Batas anggaran barang</span>
            <div className="input-prefix">
              <span>Rp</span>
              <input
                min="1"
                onChange={(event) => {
                  setBudget(event.target.value);
                  setPreviewed(false);
                }}
                placeholder="2000000"
                required
                type="number"
                value={budget}
              />
            </div>
            <small>Ini bukan harga final atau otorisasi pembayaran.</small>
          </label>
        )}

        <label className="field field-wide">
          <span>Catatan penilaian</span>
          <textarea
            maxLength={400}
            onChange={(event) => {
              setNotes(event.target.value);
              setPreviewed(false);
            }}
            placeholder={
              mode === "SHOP_FOR_ME"
                ? "Variasi, warna, toko pilihan, dan apakah substitusi diperbolehkan."
                : "Isi, kondisi kemasan, ukuran, nilai, dan kebutuhan penanganan."
            }
            rows={5}
            value={notes}
          />
          <small>{notes.length}/400 karakter</small>
        </label>
      </div>

      <div className="request-form-actions">
        <button className="button button-primary" type="submit">
          Tinjau ringkasan simulasi
        </button>
        <p>Tidak ada data yang dikirim atau disimpan.</p>
      </div>

      {previewed && (
        <section className="request-preview-result" aria-live="polite">
          <div className="preview-result-heading">
            <span aria-hidden="true">✓</span>
            <div>
              <p className="eyebrow">Contoh ringkasan</p>
              <h2>Siap dinilai jastipper—belum menjadi pesanan.</h2>
            </div>
          </div>
          <dl>
            <div>
              <dt>Trip</dt>
              <dd>NC–{tripId.slice(-4).toUpperCase()}</dd>
            </div>
            <div>
              <dt>Layanan</dt>
              <dd>{serviceModeLabel(mode)}</dd>
            </div>
            <div>
              <dt>Barang</dt>
              <dd>
                {quantity} × {itemName}
              </dd>
            </div>
            <div>
              <dt>Perkiraan berat</dt>
              <dd>{weight} kg</dd>
            </div>
            {mode === "SHOP_FOR_ME" && (
              <div>
                <dt>Batas anggaran</dt>
                <dd>
                  Rp
                  {new Intl.NumberFormat("id-ID", {
                    maximumFractionDigits: 0,
                  }).format(Number(budget))}
                </dd>
              </div>
            )}
          </dl>
          <p>
            Pada produk aktif, jastipper masih harus memeriksa kelayakan,
            kapasitas, harga, dan ketentuan sebelum permintaan dapat diterima.
          </p>
        </section>
      )}
    </form>
  );
}
