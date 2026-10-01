import React, { useState } from 'react';
import { Order, CustomerData } from '../../types';
import { 
  FileCheck2, 
  Linkedin, 
  Copy, 
  Check, 
  Sparkles, 
  Save, 
  Printer, 
  UserCheck 
} from 'lucide-react';
import { storageService } from '../../services/storage';

interface Props {
  activeOrder?: Order | null;
  allOrders: Order[];
  onShowToast: (msg: string) => void;
}

export const OtherDocsView: React.FC<Props> = ({
  activeOrder,
  allOrders,
  onShowToast
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState(activeOrder?.id || allOrders[0]?.id || '');
  const currentOrder = allOrders.find((o) => o.id === selectedOrderId) || activeOrder || allOrders[0];
  const [customerData, setCustomerData] = useState<CustomerData>(currentOrder?.customerData);
  const [activeDocType, setActiveDocType] = useState<'linkedin' | 'bio' | 'references'>('linkedin');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  React.useEffect(() => {
    if (activeOrder) {
      setSelectedOrderId(activeOrder.id);
    }
  }, [activeOrder]);

  React.useEffect(() => {
    if (currentOrder) {
      setCustomerData(currentOrder.customerData);
    }
  }, [selectedOrderId, allOrders]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast('Teks berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveDocToOrder = () => {
    if (currentOrder) {
      const typeLabel = activeDocType === 'linkedin' ? 'LinkedIn Optimization' :
        activeDocType === 'bio' ? 'Executive Bio' : 'Professional References';
      
      const nextVer = (currentOrder.files?.filter((f) => f.fileName.includes(activeDocType)).length || 0) + 1;
      const fileName = `${currentOrder.id}_${(customerData?.fullName || currentOrder.customerName).replace(/\s+/g, '_')}_${typeLabel.replace(/\s+/g, '_')}_V${nextVer}.pdf`;

      storageService.addFileToOrder(currentOrder.id, {
        fileName,
        stage: 'Final',
        version: nextVer,
        uploadedAt: new Date().toISOString(),
        fileSize: '240 KB',
        fileType: 'pdf'
      });

      onShowToast(`✓ Berkas "${fileName}" berhasil disimpan ke Pesanan ${currentOrder.id}.`);
    }
  };

  const headline = `${customerData?.professionalTitle || 'Software Engineer'} | Ex-${customerData?.experiences?.[0]?.company || 'Tech Corp'} | ${customerData?.skills?.[0]?.skills.slice(0, 3).join(' • ') || 'Agile • Cloud'}`;

  const linkedInAbout = `Halo! Saya ${customerData?.fullName || 'Profesional'}, seorang ${customerData?.professionalTitle || 'Spesialis'} yang berdedikasi menciptakan dampak bisnis terukur.\n\n✨ Keahlian Utama:\n${customerData?.skills?.map((s) => `• ${s.categoryName}: ${s.skills.join(', ')}`).join('\n') || '• Fullstack Engineering\n• Team Leadership'}\n\n💼 Pengalaman & Pencapaian:\n${customerData?.summary || 'Berpengalaman memimpin inisiatif transformasi digital berskala enterprise.'}\n\n📬 Terbuka untuk diskusi kolaborasi & peluang karir melalui email: ${customerData?.email || 'kontak@email.com'}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Dokumen Karir Tambahan & Optimasi LinkedIn
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generator copywriting headline LinkedIn, bio eksekutif, dan lembar referensi kerja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Pilih Klien:</span>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs shadow-xs"
          >
            {allOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} - {o.customerName}
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveDocToOrder}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            title="Simpan dokumen ini sebagai berkas pada pesanan klien"
          >
            <Save size={13} />
            <span>Simpan ke Pesanan</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveDocType('linkedin')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeDocType === 'linkedin' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Linkedin size={14} />
          <span>Optimasi Profil LinkedIn</span>
        </button>
        <button
          onClick={() => setActiveDocType('bio')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeDocType === 'bio' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck size={14} />
          <span>Biografi Eksekutif Singkat</span>
        </button>
        <button
          onClick={() => setActiveDocType('references')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeDocType === 'references' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileCheck2 size={14} />
          <span>Lembar Referensi Kerja</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
        {activeDocType === 'linkedin' && (
          <div className="space-y-5">
            {/* LinkedIn Headline */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-xs">Optimized LinkedIn Headline</span>
                <button
                  onClick={() => handleCopy(headline, 'hl')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-1"
                >
                  {copiedKey === 'hl' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>Salin Headline</span>
                </button>
              </div>
              <p className="font-medium text-slate-800 bg-white p-3 rounded border border-slate-200 font-mono text-xs">
                {headline}
              </p>
            </div>

            {/* LinkedIn About */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-xs">LinkedIn About / Summary Copywriting</span>
                <button
                  onClick={() => handleCopy(linkedInAbout, 'abt')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-1"
                >
                  {copiedKey === 'abt' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>Salin About</span>
                </button>
              </div>
              <div className="whitespace-pre-line bg-white p-3 rounded border border-slate-200 text-slate-700 leading-relaxed">
                {linkedInAbout}
              </div>
            </div>
          </div>
        )}

        {activeDocType === 'bio' && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs">Executive Speaker / Panelist Bio</h3>
            <p className="text-slate-700 leading-relaxed bg-white p-4 rounded border border-slate-200">
              {customerData?.fullName} adalah seorang {customerData?.professionalTitle} dengan pengalaman lebih dari 4 tahun dalam industri teknologi dan manajemen produk digital. Saat ini memimpin berbagai inisiatif di {customerData?.experiences?.[0]?.company || 'perusahaan ternama'}, {customerData?.fullName.split(' ')[0]} berfokus pada inovasi berorientasi data dan efisiensi eksekusi tim lintas fungsional.
            </p>
          </div>
        )}

        {activeDocType === 'references' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-xs">Lembar Referensi Profesional Klien</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-900">Dr. Ir. Hendra Gunawan</span>
                <p className="text-slate-600">VP of Engineering — {customerData?.experiences?.[0]?.company || 'PT Tech'}</p>
                <p className="text-slate-400 font-mono text-[11px]">hendra.gunawan@company.com · 0812-9900-1122</p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-900">Ratna Sari, M.M.</span>
                <p className="text-slate-600">Head of Human Capital — Universitas Indonesia</p>
                <p className="text-slate-400 font-mono text-[11px]">ratna.sari@ui.ac.id · 0811-2233-4455</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
