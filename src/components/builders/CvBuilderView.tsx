import React, { useState } from 'react';
import { 
  Order, 
  CustomerData, 
  DocumentTemplate, 
  EducationItem, 
  ExperienceItem, 
  SkillCategory, 
  CertificationItem,
  ProjectItem,
  LanguageItem 
} from '../../types';
import { 
  DocumentRenderer, 
  DocumentCustomization 
} from './DocumentRenderer';
import { 
  Printer, 
  Download, 
  Eye, 
  Layers, 
  Type, 
  Palette, 
  Layout, 
  MoveUp, 
  MoveDown, 
  EyeOff, 
  Save, 
  Sparkles, 
  Plus, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  FolderDown, 
  CheckCircle2, 
  FileCheck,
  ShieldCheck,
  Info,
  SlidersHorizontal,
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Globe
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { templateEngine } from '../../services/templateEngine';
import { generateStandardFileName } from '../../utils/formatters';

interface Props {
  activeOrder?: Order | null;
  allOrders: Order[];
  templates: DocumentTemplate[];
  onOrderUpdated?: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const CvBuilderView: React.FC<Props> = ({
  activeOrder,
  allOrders,
  templates,
  onOrderUpdated,
  onShowToast
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(activeOrder?.id || allOrders[0]?.id || '');

  const currentOrder = allOrders.find((o) => o.id === selectedOrderId) || activeOrder || allOrders[0];

  const [customerData, setCustomerData] = useState<CustomerData>(
    currentOrder?.customerData || {
      id: 'CUST-BUILDER',
      fullName: 'Bagas Aditya Pratama, S.Kom.',
      professionalTitle: 'Senior Frontend Engineer',
      email: 'bagas.aditya@gmail.com',
      phone: '0812-9844-3210',
      city: 'Jakarta Selatan',
      country: 'Indonesia',
      summary: 'Frontend Engineer berpengalaman 4+ tahun dalam membangun aplikasi web enterprise dengan React dan TypeScript.',
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

  const [customization, setCustomization] = useState<DocumentCustomization>({
    templateId: currentOrder?.templateId || 'TMP-ATS-01',
    fontFamily: 'Inter',
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
    layout: 'single-column',
    fontSize: 'normal',
    sectionsOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
    sectionsVisibility: {
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      languages: true
    },
    showPhoto: false
  });

  const [activeSideTab, setActiveSideTab] = useState<'editor' | 'sections' | 'style' | 'templates'>('editor');
  const [editorSubTab, setEditorSubTab] = useState<'pribadi' | 'pengalaman' | 'pendidikan' | 'keahlian' | 'proyek' | 'lainnya'>('pribadi');
  const [zoomScale, setZoomScale] = useState(0.85);

  const activeTemplate = templates.find((t) => t.id === customization.templateId) || templates[0];
  const atsAnalysis = templateEngine.calculateAtsReadiness(customerData, activeTemplate);

  // Sync when selected order changes
  React.useEffect(() => {
    if (currentOrder) {
      setCustomerData(currentOrder.customerData);
      const tpl = templates.find((t) => t.id === currentOrder.templateId);
      if (tpl) {
        setCustomization((prev) => ({
          ...prev,
          templateId: tpl.id,
          fontFamily: tpl.fontFamily,
          primaryColor: tpl.primaryColor,
          accentColor: tpl.accentColor,
          layout: tpl.layout as any
        }));
      }
    }
  }, [selectedOrderId]);

  // Apply template preset
  const handleApplyTemplate = (tpl: DocumentTemplate) => {
    setCustomization({
      ...customization,
      templateId: tpl.id,
      fontFamily: tpl.fontFamily,
      primaryColor: tpl.primaryColor,
      accentColor: tpl.accentColor,
      layout: tpl.layout as any
    });
    onShowToast(`Template "${tpl.name}" diterapkan.`);
  };

  // Section visibility toggle
  const toggleSectionVisibility = (sectionKey: string) => {
    setCustomization({
      ...customization,
      sectionsVisibility: {
        ...customization.sectionsVisibility,
        [sectionKey]: !customization.sectionsVisibility[sectionKey]
      }
    });
  };

  // Reorder section
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...customization.sectionsOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setCustomization({
      ...customization,
      sectionsOrder: newOrder
    });
  };

  // Experience handlers
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: `EXP-${Date.now()}`,
      company: 'Nama Perusahaan Baru',
      position: 'Posisi / Jabatan',
      startDate: '2023-01',
      endDate: 'Sekarang',
      isCurrent: true,
      bulletPoints: ['Pencapaian utama dan tanggung jawab kerja...']
    };
    setCustomerData({
      ...customerData,
      experiences: [newItem, ...(customerData.experiences || [])]
    });
  };

  const removeExperience = (id: string) => {
    setCustomerData({
      ...customerData,
      experiences: customerData.experiences.filter((exp) => exp.id !== id)
    });
  };

  // Education handlers
  const addEducation = () => {
    const newItem: EducationItem = {
      id: `EDU-${Date.now()}`,
      institution: 'Universitas Indonesia',
      degree: 'Sarjana (S1)',
      major: 'Jurusan Studi',
      startYear: '2018',
      endYear: '2022',
      gpa: '3.75'
    };
    setCustomerData({
      ...customerData,
      educations: [...(customerData.educations || []), newItem]
    });
  };

  const removeEducation = (id: string) => {
    setCustomerData({
      ...customerData,
      educations: customerData.educations.filter((edu) => edu.id !== id)
    });
  };

  // Save changes back to order
  const handleSaveToOrder = () => {
    if (currentOrder) {
      storageService.updateOrderCustomerData(currentOrder.id, customerData);
      onShowToast(`Data dokumen berhasil disimpan ke pesanan ${currentOrder.id}`);
    }
  };

  // Export PDF via Browser Print
  const handlePrintPdf = () => {
    if (currentOrder) {
      const fileName = generateStandardFileName(
        currentOrder.id,
        customerData.fullName || currentOrder.customerName,
        currentOrder.productType,
        'Final',
        (currentOrder.files?.length || 0) + 1,
        'pdf'
      );

      storageService.addFileToOrder(currentOrder.id, {
        fileName,
        stage: 'Final',
        version: (currentOrder.files?.length || 0) + 1,
        uploadedAt: new Date().toISOString(),
        fileSize: '352 KB',
        fileType: 'pdf'
      });
    }

    onShowToast('Membuka dialog cetak PDF browser...');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-4">
      {/* Top Builder Control Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">CV Builder Engine</h1>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Pesanan:</span>
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
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-2">
          {/* ATS Score Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
            <ShieldCheck size={14} className={atsAnalysis.score >= 80 ? 'text-emerald-600' : 'text-amber-500'} />
            <span>Skor ATS: {atsAnalysis.score}%</span>
          </div>

          {/* Zoom buttons */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs text-slate-600">
            <button
              onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))}
              className="p-1 hover:bg-white rounded transition-colors"
              title="Perkecil"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 font-mono text-[11px] font-semibold">{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale((prev) => Math.min(1.2, prev + 0.1))}
              className="p-1 hover:bg-white rounded transition-colors"
              title="Perbesar"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            onClick={handleSaveToOrder}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save size={13} />
            <span>Simpan</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer size={13} />
            <span>Cetak / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Builder Grid: Left Editor & Right Live A4 Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Controls & Editor Tabs (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[82vh] overflow-hidden">
          {/* Main Subtab Switcher */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-2 py-1.5 gap-1 shrink-0 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveSideTab('editor')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeSideTab === 'editor' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <Type size={13} />
              <span>Data Teks</span>
            </button>
            <button
              onClick={() => setActiveSideTab('sections')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeSideTab === 'sections' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <Layout size={13} />
              <span>Susunan Seksi</span>
            </button>
            <button
              onClick={() => setActiveSideTab('style')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeSideTab === 'style' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <Palette size={13} />
              <span>Gaya & Font</span>
            </button>
            <button
              onClick={() => setActiveSideTab('templates')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeSideTab === 'templates' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <Layers size={13} />
              <span>Template</span>
            </button>
          </div>

          {/* Subtab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 text-xs space-y-4">
            {/* SUBTAB 1: EDITOR WITH SUB-SECTIONS */}
            {activeSideTab === 'editor' && (
              <div className="space-y-4">
                {/* Editor sub navigation pills */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {[
                    { id: 'pribadi', label: 'Pribadi' },
                    { id: 'pengalaman', label: 'Pengalaman' },
                    { id: 'pendidikan', label: 'Pendidikan' },
                    { id: 'keahlian', label: 'Keahlian' },
                    { id: 'proyek', label: 'Proyek' },
                    { id: 'lainnya', label: 'Lainnya' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setEditorSubTab(sub.id as any)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        editorSubTab === sub.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* EDIT SECTION: PRIBADI & RINGKASAN */}
                {editorSubTab === 'pribadi' && (
                  <div className="space-y-3">
                    <div className="space-y-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Data Kontak</h4>
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Nama Lengkap & Gelar</label>
                        <input
                          type="text"
                          value={customerData.fullName}
                          onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Judul Profesional / Headline</label>
                        <input
                          type="text"
                          value={customerData.professionalTitle}
                          onChange={(e) => setCustomerData({ ...customerData, professionalTitle: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Email</label>
                          <input
                            type="text"
                            value={customerData.email}
                            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-700 block mb-1">WhatsApp / Phone</label>
                          <input
                            type="text"
                            value={customerData.phone}
                            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Kota & Negara</label>
                        <input
                          type="text"
                          value={customerData.city}
                          onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Ringkasan Profesional</h4>
                      <textarea
                        rows={4}
                        value={customerData.summary}
                        onChange={(e) => setCustomerData({ ...customerData, summary: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded leading-relaxed text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* EDIT SECTION: PENGALAMAN */}
                {editorSubTab === 'pengalaman' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900">Pengalaman Kerja ({customerData.experiences?.length || 0})</h4>
                      <button
                        type="button"
                        onClick={addExperience}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-semibold flex items-center gap-1"
                      >
                        <Plus size={12} />
                        <span>Tambah Pekerjaan</span>
                      </button>
                    </div>

                    {customerData.experiences?.map((exp) => (
                      <div key={exp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => {
                              const updated = customerData.experiences.map((item) =>
                                item.id === exp.id ? { ...item, position: e.target.value } : item
                              );
                              setCustomerData({ ...customerData, experiences: updated });
                            }}
                            placeholder="Jabatan"
                            className="font-bold text-xs p-1.5 border rounded w-full mr-2 bg-white"
                          />
                          <button
                            onClick={() => removeExperience(exp.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = customerData.experiences.map((item) =>
                                item.id === exp.id ? { ...item, company: e.target.value } : item
                              );
                              setCustomerData({ ...customerData, experiences: updated });
                            }}
                            placeholder="Nama Perusahaan"
                            className="text-xs p-1.5 border rounded bg-white"
                          />
                          <input
                            type="text"
                            value={`${exp.startDate} - ${exp.endDate}`}
                            onChange={(e) => {
                              const parts = e.target.value.split('-');
                              const updated = customerData.experiences.map((item) =>
                                item.id === exp.id ? { ...item, startDate: parts[0]?.trim() || '', endDate: parts[1]?.trim() || '' } : item
                              );
                              setCustomerData({ ...customerData, experiences: updated });
                            }}
                            placeholder="Periode (e.g. 2022 - Sekarang)"
                            className="text-xs p-1.5 border rounded bg-white"
                          />
                        </div>
                        <textarea
                          rows={3}
                          value={exp.bulletPoints?.join('\n')}
                          onChange={(e) => {
                            const updated = customerData.experiences.map((item) =>
                              item.id === exp.id ? { ...item, bulletPoints: e.target.value.split('\n') } : item
                            );
                            setCustomerData({ ...customerData, experiences: updated });
                          }}
                          placeholder="Pencapaian (1 baris per poin)..."
                          className="text-[11px] p-1.5 border rounded w-full leading-normal bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* EDIT SECTION: PENDIDIKAN */}
                {editorSubTab === 'pendidikan' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900">Riwayat Pendidikan ({customerData.educations?.length || 0})</h4>
                      <button
                        type="button"
                        onClick={addEducation}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-semibold flex items-center gap-1"
                      >
                        <Plus size={12} />
                        <span>Tambah Kampus</span>
                      </button>
                    </div>

                    {customerData.educations?.map((edu) => (
                      <div key={edu.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => {
                              const updated = customerData.educations.map((item) =>
                                item.id === edu.id ? { ...item, institution: e.target.value } : item
                              );
                              setCustomerData({ ...customerData, educations: updated });
                            }}
                            placeholder="Nama Kampus / Sekolah"
                            className="font-bold text-xs p-1.5 border rounded w-full mr-2 bg-white"
                          />
                          <button
                            onClick={() => removeEducation(edu.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={edu.major}
                            onChange={(e) => {
                              const updated = customerData.educations.map((item) =>
                                item.id === edu.id ? { ...item, major: e.target.value } : item
                              );
                              setCustomerData({ ...customerData, educations: updated });
                            }}
                            placeholder="Gelar & Jurusan"
                            className="text-xs p-1.5 border rounded bg-white"
                          />
                          <input
                            type="text"
                            value={`${edu.startYear} - ${edu.endYear}`}
                            onChange={(e) => {
                              const parts = e.target.value.split('-');
                              const updated = customerData.educations.map((item) =>
                                item.id === edu.id ? { ...item, startYear: parts[0]?.trim() || '', endYear: parts[1]?.trim() || '' } : item
                              );
                              setCustomerData({ ...customerData, educations: updated });
                            }}
                            placeholder="Tahun (e.g. 2017 - 2021)"
                            className="text-xs p-1.5 border rounded bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* EDIT SECTION: KEAHLIAN */}
                {editorSubTab === 'keahlian' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900">Keahlian & Kemampuan Teknis</h4>
                    {customerData.skills?.map((cat) => (
                      <div key={cat.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                        <span className="font-bold text-slate-800">{cat.categoryName}</span>
                        <input
                          type="text"
                          value={cat.skills.join(', ')}
                          onChange={(e) => {
                            const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            const updated = customerData.skills.map((c) =>
                              c.id === cat.id ? { ...c, skills: list } : c
                            );
                            setCustomerData({ ...customerData, skills: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* EDIT SECTION: PROYEK */}
                {editorSubTab === 'proyek' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900">Proyek Unggulan</h4>
                    {customerData.projects?.map((proj) => (
                      <div key={proj.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const updated = customerData.projects.map((p) =>
                              p.id === proj.id ? { ...p, title: e.target.value } : p
                            );
                            setCustomerData({ ...customerData, projects: updated });
                          }}
                          className="font-bold text-xs p-1.5 border rounded w-full bg-white"
                        />
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={(e) => {
                            const updated = customerData.projects.map((p) =>
                              p.id === proj.id ? { ...p, description: e.target.value } : p
                            );
                            setCustomerData({ ...customerData, projects: updated });
                          }}
                          className="text-xs p-1.5 border rounded w-full bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* EDIT SECTION: LAINNYA */}
                {editorSubTab === 'lainnya' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <h4 className="font-bold text-slate-900">Bahasa</h4>
                      <input
                        type="text"
                        value={customerData.languages?.map((l) => `${l.language} (${l.proficiency})`).join(', ')}
                        onChange={(e) => {
                          const items = e.target.value.split(',').map((item, idx) => ({
                            id: `LNG-${idx}`,
                            language: item.trim().replace(/\(.*\)/, '').trim(),
                            proficiency: 'Fasih' as any
                          }));
                          setCustomerData({ ...customerData, languages: items });
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2: SECTIONS REORDER & VISIBILITY */}
            {activeSideTab === 'sections' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Susun urutan seksi dokumen CV dan tampilkan/sembunyikan seksi sesuai kebutuhan klien:
                </p>

                <div className="space-y-2">
                  {customization.sectionsOrder.map((sectionKey, idx) => {
                    const isVisible = customization.sectionsVisibility[sectionKey] !== false;
                    const sectionLabels: Record<string, string> = {
                      summary: 'Ringkasan Profesional',
                      experience: 'Pengalaman Kerja',
                      education: 'Pendidikan',
                      skills: 'Keahlian & Kemampuan',
                      projects: 'Proyek Unggulan',
                      certifications: 'Sertifikasi & Lisensi',
                      languages: 'Bahasa'
                    };

                    return (
                      <div
                        key={sectionKey}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                          isVisible ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <span className="font-mono text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                          <span className={isVisible ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                            {sectionLabels[sectionKey] || sectionKey}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                            title="Pindah ke Atas"
                          >
                            <MoveUp size={13} />
                          </button>
                          <button
                            onClick={() => moveSection(idx, 'down')}
                            disabled={idx === customization.sectionsOrder.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                            title="Pindah ke Bawah"
                          >
                            <MoveDown size={13} />
                          </button>
                          <button
                            onClick={() => toggleSectionVisibility(sectionKey)}
                            className={`p-1 rounded ${isVisible ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-200'}`}
                            title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB 3: STYLE & TYPOGRAPHY */}
            {activeSideTab === 'style' && (
              <div className="space-y-4">
                {/* Typography */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-900 block text-xs">Pilihan Tipografi / Font</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { font: 'Inter', label: 'Inter (Standar ATS)' },
                      { font: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
                      { font: 'Merriweather', label: 'Merriweather (Serif)' },
                      { font: 'JetBrains Mono', label: 'JetBrains Mono' }
                    ].map((f) => (
                      <button
                        key={f.font}
                        onClick={() => setCustomization({ ...customization, fontFamily: f.font as any })}
                        className={`p-2 rounded border text-left text-xs font-semibold ${
                          customization.fontFamily === f.font
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary & Accent Color */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <label className="font-bold text-slate-900 block text-xs">Skema Warna Dokumen</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { primary: '#0f172a', accent: '#334155', name: 'Monochrome Slate' },
                      { primary: '#1e293b', accent: '#2563eb', name: 'Classic Navy' },
                      { primary: '#064e3b', accent: '#059669', name: 'Forest Emerald' },
                      { primary: '#581c87', accent: '#7c3aed', name: 'Royal Violet' },
                      { primary: '#451a03', accent: '#b45309', name: 'Warm Amber' }
                    ].map((palette, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setCustomization({
                            ...customization,
                            primaryColor: palette.primary,
                            accentColor: palette.accent
                          })
                        }
                        className="p-1 rounded-lg border border-slate-200 hover:border-slate-400 flex flex-col items-center gap-1 bg-white"
                        title={palette.name}
                      >
                        <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: palette.primary }} />
                        <span className="text-[9px] text-slate-500 truncate w-full text-center">{palette.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Density */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-900 block text-xs">Kepadatan Baris / Spasi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['compact', 'normal', 'spacious'] as const).map((density) => (
                      <button
                        key={density}
                        onClick={() => setCustomization({ ...customization, fontSize: density })}
                        className={`p-2 rounded border text-center capitalize text-xs font-semibold ${
                          customization.fontSize === density
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: TEMPLATES PRESET */}
            {activeSideTab === 'templates' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Pilih template tata letak dokumen:</p>
                <div className="space-y-2.5">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => handleApplyTemplate(tpl)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        customization.templateId === tpl.id
                          ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{tpl.name}</h4>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{tpl.category}</span>
                          <span>·</span>
                          <span>{tpl.layout}</span>
                        </div>
                      </div>
                      {customization.templateId === tpl.id && (
                        <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE A4 DOCUMENT PREVIEW (7 cols) */}
        <div className="lg:col-span-7 bg-slate-200/70 rounded-xl p-4 md:p-6 flex justify-center items-start overflow-auto h-[82vh] border border-slate-300/80 shadow-inner">
          <div className="transition-transform duration-200 origin-top">
            <DocumentRenderer
              data={customerData}
              customization={customization}
              scale={zoomScale}
              documentType="cv"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
