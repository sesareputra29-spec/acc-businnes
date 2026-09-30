import React, { useState } from 'react';
import { Order, CustomerData } from '../../types';
import { DocumentRenderer } from './DocumentRenderer';
import { 
  Mail, 
  Printer, 
  Save, 
  Sparkles, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut,
  Building,
  Target,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';
import { storageService } from '../../services/storage';

interface Props {
  allOrders: Order[];
  onShowToast: (msg: string) => void;
}

export const CoverLetterBuilderView: React.FC<Props> = ({
  allOrders,
  onShowToast
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState(allOrders[0]?.id || '');
  const currentOrder = allOrders.find((o) => o.id === selectedOrderId) || allOrders[0];
  const [customerData, setCustomerData] = useState<CustomerData>(
    currentOrder?.customerData || {
      id: 'CUST-CL',
      fullName: 'Bagas Aditya Pratama, S.Kom.',
      professionalTitle: 'Senior Frontend Engineer',
      email: 'bagas.aditya@gmail.com',
      phone: '0812-9844-3210',
      city: 'Jakarta Selatan',
      country: 'Indonesia',
      summary: 'Software Engineer dengan 4+ tahun pengalaman dalam arsitektur web modern React & TypeScript.',
      targetCompany: 'PT Bank Central Asia Tbk',
      targetJobTitle: 'Lead Frontend Developer',
      jobVacancySource: 'LinkedIn Job Board',
      coverLetterNotes: 'Tekankan kepemimpinan squad 5 engineer dan optimasi load time 40%.',
      educations: [],
      experiences: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      socialLinks: [],
      lastUpdated: new Date().toISOString()
    }
  );

  const [coverLetterTone, setCoverLetterTone] = useState<'formal' | 'modern' | 'confident'>('formal');
  const [zoomScale, setZoomScale] = useState(0.85);

  const generateLetterText = (tone: 'formal' | 'modern' | 'confident', data: CustomerData) => {
    const pos = data.targetJobTitle || 'Lead Software Engineer';
    const comp = data.targetCompany || 'PT Perusahaan Tujuan';
    const source = data.jobVacancySource || 'portal karir resmi';
    const highlight = data.coverLetterNotes || (data.skills?.[0]?.skills.slice(0, 4).join(', ') || 'manajemen proyek dan pengembangan sistem digital');
    const exp = data.experiences?.[0]?.position || data.professionalTitle || 'profesional di bidang terkait';

    if (tone === 'formal') {
      return `Dengan hormat,\n\nSehubungan dengan informasi lowongan pekerjaan untuk posisi ${pos} di ${comp} yang saya peroleh melalui ${source}, dengan ini saya bermaksud mengajukan surat lamaran kerja.\n\nMemiliki pengalaman profesional sebagai ${exp}, saya telah terbiasa memimpin inisiatif strategis, menjaga standar kualitas teknis yang tinggi, dan berkolaborasi erat dengan tim lintas divisi. ${data.summary || ''}\n\nSecara khusus, kompetensi saya berfokus pada: ${highlight}. Saya meyakini bahwa latar belakang dan dedikasi saya akan memberikan kontribusi positif bagi pencapaian target bisnis ${comp}.\n\nBesar harapan saya untuk diberikan kesempatan wawancara agar dapat menjelaskan kualifikasi saya secara lebih rinci. Bersama surat ini, saya lampirkan dokumen CV dan portofolio sebagai bahan pertimbangan Bapak/Ibu.\n\nAtas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.`;
    } else if (tone === 'modern') {
      return `Kepada Tim Rekrutmen ${comp},\n\nSaya menulis surat ini untuk menyatakan ketertarikan mendalam saya pada posisi ${pos}. Mengikuti pertumbuhan pesat industri dan inovasi berkelanjutan yang dihadirkan oleh ${comp}, saya sangat termotivasi untuk dapat bergabung dan berkontribusi langsung.\n\nSebagai seorang ${exp}, saya memiliki rekam jejak dalam ${highlight}. ${data.summary || 'Saya percaya bahwa pendekatan kerja yang kolaboratif dan berbasis solusi nyata akan melengkapi ritme kerja tim Anda yang dinamis.'}\n\nSaya sangat menyambut kesempatan untuk mendiskusikan bagaimana pengalaman dan antusiasme saya dapat mendukung sasaran pertumbuhan ${comp} ke depan.\n\nTerima kasih atas waktu dan pertimbangan Bapak/Ibu.`;
    } else {
      return `Yth. Hiring Manager & Tim Manajemen ${comp},\n\nSebagai ${exp} yang berorientasi pada pencapaian terukur (data-driven results), saya sangat antusias melamar posisi ${pos} di ${comp}.\n\nSelama perjalanan karir saya, saya telah berhasil mengoptimalkan efisiensi proses, memimpin pemecahan masalah krusial, dan menghasilkan dampak bisnis yang signifikan. Keahlian utama saya mencakup: ${highlight}.\n\nDengan komitmen terhadap keunggulan dan kapabilitas eksekusi yang teruji, saya siap mempercepat pencapaian target ${comp}.\n\nSaya siap untuk menghadiri sesi wawancara sesuai waktu yang Bapak/Ibu tentukan. Terima kasih atas kesempatan dan pertimbangan yang diberikan.`;
    }
  };

  const [letterBody, setLetterBody] = useState<string>(() => generateLetterText('formal', customerData));

  React.useEffect(() => {
    if (currentOrder) {
      setCustomerData(currentOrder.customerData);
      setLetterBody(generateLetterText(coverLetterTone, currentOrder.customerData));
    }
  }, [selectedOrderId]);

  // Handle tone change
  const applyToneTemplate = (tone: 'formal' | 'modern' | 'confident') => {
    setCoverLetterTone(tone);
    setLetterBody(generateLetterText(tone, customerData));
    onShowToast(`Gaya bahasa surat diubah ke "${tone}".`);
  };

  const handleRegenerate = () => {
    setLetterBody(generateLetterText(coverLetterTone, customerData));
    onShowToast('Isi surat lamaran diperbarui sesuai data terbaru.');
  };

  const handleSave = () => {
    if (currentOrder) {
      storageService.updateOrderCustomerData(currentOrder.id, customerData);
      onShowToast(`Surat lamaran untuk ${currentOrder.id} berhasil disimpan.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Cover Letter / Surat Lamaran Generator</h1>
          <span className="text-slate-300">|</span>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
          >
            {allOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} - {o.customerName} ({o.productType})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs text-slate-600">
            <button onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))} className="p-1">
              <ZoomOut size={13} />
            </button>
            <span className="px-2 font-mono text-[11px] font-semibold">{Math.round(zoomScale * 100)}%</span>
            <button onClick={() => setZoomScale((prev) => Math.min(1.2, prev + 0.1))} className="p-1">
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg flex items-center gap-1.5"
          >
            <Save size={13} />
            <span>Simpan</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Printer size={13} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Form Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-4 h-[82vh] overflow-y-auto space-y-4 text-xs">
          {/* Target inputs */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Data Target Lamaran & Perusahaan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Perusahaan Tujuan *</label>
                <input
                  type="text"
                  value={customerData.targetCompany || ''}
                  onChange={(e) => setCustomerData({ ...customerData, targetCompany: e.target.value })}
                  placeholder="Contoh: PT Bank Central Asia Tbk"
                  className="w-full p-2 bg-white border border-slate-300 rounded font-semibold text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Posisi yang Dilamar *</label>
                <input
                  type="text"
                  value={customerData.targetJobTitle || ''}
                  onChange={(e) => setCustomerData({ ...customerData, targetJobTitle: e.target.value })}
                  placeholder="Contoh: Lead Frontend Developer"
                  className="w-full p-2 bg-white border border-slate-300 rounded font-semibold text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Sumber Info Lowongan</label>
                <input
                  type="text"
                  value={customerData.jobVacancySource || ''}
                  onChange={(e) => setCustomerData({ ...customerData, jobVacancySource: e.target.value })}
                  placeholder="Contoh: LinkedIn / JobStreet / Website"
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Poin Keunggulan Utama</label>
                <input
                  type="text"
                  value={customerData.coverLetterNotes || ''}
                  onChange={(e) => setCustomerData({ ...customerData, coverLetterNotes: e.target.value })}
                  placeholder="Contoh: 4+ thn React & arsitektur scalable"
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Tone Selector & Regenerate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-900 block text-xs">Pilihan Gaya Bahasa Surat</label>
              <button
                onClick={handleRegenerate}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Sparkles size={12} />
                <span>Susun Ulang Teks</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyToneTemplate('formal')}
                className={`p-2 rounded border text-center font-semibold transition-colors ${
                  coverLetterTone === 'formal' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                Formal / Korporat
              </button>
              <button
                onClick={() => applyToneTemplate('modern')}
                className={`p-2 rounded border text-center font-semibold transition-colors ${
                  coverLetterTone === 'modern' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                Modern / Startup
              </button>
              <button
                onClick={() => applyToneTemplate('confident')}
                className={`p-2 rounded border text-center font-semibold transition-colors ${
                  coverLetterTone === 'confident' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                Percaya Diri
              </button>
            </div>
          </div>

          {/* Body Content Editor */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 block text-xs">Isi Surat Lamaran (Dapat Diedit Bebas)</label>
            <textarea
              rows={13}
              value={letterBody}
              onChange={(e) => setLetterBody(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-xs leading-relaxed font-sans bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right Live Preview (7 cols) */}
        <div className="lg:col-span-7 bg-slate-200/70 rounded-xl p-4 md:p-6 flex justify-center items-start overflow-auto h-[82vh] border border-slate-300/80 shadow-inner">
          <div className="transition-transform duration-200 origin-top">
            <DocumentRenderer
              data={customerData}
              customization={{
                templateId: 'TMP-CL-01',
                fontFamily: 'Inter',
                primaryColor: '#0f172a',
                accentColor: '#2563eb',
                layout: 'single-column',
                fontSize: 'normal',
                sectionsOrder: [],
                sectionsVisibility: {},
                showPhoto: false
              }}
              scale={zoomScale}
              documentType="cover-letter"
              coverLetterContent={letterBody}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
