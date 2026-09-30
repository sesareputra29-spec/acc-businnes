import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  MessageSquare, 
  FileCheck2,
  Workflow,
  AlertTriangle
} from 'lucide-react';

export const GuideView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
          Panduan Standar Operasional Prosedur (SOP) & Mutu
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pedoman kerja operator dan desainer Arise Career Craft dalam menghasilkan dokumen berstandar tinggi.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="space-y-4 text-xs">
        {/* SOP 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>1. Standar Format CV ATS-Friendly (Tingkat Kelolosan &gt; 95%)</span>
          </div>
          <ul className="space-y-2 text-slate-700 list-disc list-inside leading-relaxed pl-1">
            <li>Gunakan struktur standar: <strong>Data Pribadi → Ringkasan Profil → Pengalaman Kerja → Pendidikan → Keahlian → Sertifikasi</strong>.</li>
            <li>Gunakan kata kerja aksi (action verbs) berorientasi hasil pada setiap bullet point pengalaman (misal: <em>Memimpin, Mengembangkan, Mengoptimalkan, Merestrukturisasi</em>).</li>
            <li>Sertakan metrik kuantitatif terukur (angka, persentase %, efisiensi biaya Rp) pada minimal 2 bullet point per pekerjaan.</li>
            <li>Hindari elemen visual berat seperti tabel bertingkat, ikon grafis, text-box terpisah, atau foto pada format murni ATS untuk korporat BUMN dan MNC.</li>
          </ul>
        </div>

        {/* SOP 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Workflow size={16} className="text-indigo-600" />
            <span>2. Alur SLA & Versioning File Dokumen</span>
          </div>
          <ul className="space-y-2 text-slate-700 list-disc list-inside leading-relaxed pl-1">
            <li><strong>SLA Pengiriman Draf Preview:</strong> Maksimal 24–48 jam setelah klien melengkapi formulir data karier.</li>
            <li><strong>Penamaan Berkas Baku:</strong> Selalu gunakan format otomatis <code>[ORDER_ID]_[Customer_Name]_[Product]_[Version].[ext]</code>.</li>
            <li><strong>Kebijakan Revisi:</strong> Setiap paket mencakup revisi minor (penyesuaian data/kalimat). Jangan pernah menghapus file versi lama (pertahankan riwayat versi V1, V2, dst).</li>
          </ul>
        </div>

        {/* SOP 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <MessageSquare size={16} className="text-blue-600" />
            <span>3. Etika Komunikasi & Layanan Pelanggan</span>
          </div>
          <ul className="space-y-2 text-slate-700 list-disc list-inside leading-relaxed pl-1">
            <li>Sapa klien dengan ramah dan profesional menggunakan template pesan WhatsApp yang telah disediakan di sistem.</li>
            <li>Saat mengirimkan draf preview, mintalah feedback dengan poin spesifik agar revisi dapat diselesaikan dalam 1 putaran kerja.</li>
            <li>Pastikan file final telah diverifikasi kualitas cetak dan kelengkapan teks sebelum status pesanan diubah ke <strong>Selesai</strong>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
