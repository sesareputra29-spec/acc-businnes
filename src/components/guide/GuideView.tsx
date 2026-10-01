import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  MessageSquare, 
  FileCheck2,
  Workflow,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileSpreadsheet,
  FileText,
  Clock,
  History,
  FolderDown,
  UserCheck
} from 'lucide-react';

export const GuideView: React.FC = () => {
  const workflowSteps = [
    { num: '01', title: 'Order Dibuat', desc: 'Customer + Produk + Harga + SLA terdaftar dengan Order ID unik', icon: Workflow, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { num: '02', title: 'Portal Form Klien', desc: 'Tautan unik dikirim ke klien, form menyesuaikan jenis produk secara dinamis', icon: FileSpreadsheet, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { num: '03', title: 'Validasi Data', desc: 'Status menjadi Data Masuk / Validasi Data setelah klien submit formulir', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { num: '04', title: 'Template Library', desc: 'Pilih template relevan (ATS, Modern, Portfolio, Cover Letter) untuk order', icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { num: '05', title: 'Builder Engine', desc: 'Data klien digabung ke template engine tanpa duplikasi data', icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { num: '06', title: 'Antrian Produksi', desc: 'Order di-assign ke staff (Designer/Operator) dengan deadline prioritas', icon: UserCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { num: '07', title: 'Draf Preview', desc: 'File preview diexport & dikirim ke WhatsApp klien untuk diperiksa', icon: Clock, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { num: '08', title: 'Revisi & Versi', desc: 'Jika ada masukan klien, revisi dicatat dengan versioning (V1, V2, dst)', icon: History, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { num: '09', title: 'Finalisasi File', desc: 'Dokumen final di-generate dan tersimpan di riwayat file pesanan', icon: FolderDown, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { num: '10', title: 'Order Selesai', desc: 'File final dikirim ke klien, status order tuntas & masuk laporan omzet', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
          Panduan Standar Operasional Prosedur (SOP) & Alur Kerja Terpadu
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Satu alur kerja tunggal tanpa data duplikat yang menghubungkan seluruh modul dari Pelanggan hingga Berkas Final.
        </p>
      </div>

      {/* 10-Step Interactive Workflow Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow size={16} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Alur Utama Integrasi Sistem (Single Source of Truth)</h2>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            100% Terhubung
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-400">{step.num}</span>
                    <div className={`p-1 rounded-md border ${step.color}`}>
                      <Icon size={13} />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mt-1">{step.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
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
