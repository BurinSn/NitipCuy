import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="shell not-found">
      <p className="eyebrow">Tidak ditemukan</p>
      <h1>Perjalanan ini tidak tersedia.</h1>
      <p>Periksa kembali tautannya atau cari perjalanan lain.</p>
      <Link href="/">Kembali ke pencarian</Link>
    </main>
  );
}
