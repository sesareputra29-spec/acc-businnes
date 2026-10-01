import React, { useState, useEffect } from 'react';
import { Order, CustomerData, ProjectItem, TestimonialItem, DocumentTemplate } from '../../types';
import { DocumentRenderer } from './DocumentRenderer';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Save, 
  ExternalLink, 
  Printer, 
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  User,
  MessageSquare,
  Code,
  Palette,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { generateStandardFileName } from '../../utils/formatters';

interface Props {
  activeOrder?: Order | null;
  allOrders: Order[];
  templates?: DocumentTemplate[];
  onShowToast: (msg: string) => void;
}

export const PortfolioBuilderView: React.FC<Props> = ({
  activeOrder,
  allOrders,
  templates = [],
  onShowToast
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState(activeOrder?.id || allOrders[0]?.id || '');
  const currentOrder = allOrders.find((o) => o.id === selectedOrderId) || activeOrder || allOrders[0];

  useEffect(() => {
    if (activeOrder) {
      setSelectedOrderId(activeOrder.id);
    }
  }, [activeOrder]);
  const [customerData, setCustomerData] = useState<CustomerData>(
    currentOrder?.customerData || {
      id: 'CUST-PORT',
      fullName: 'Bagas Aditya Pratama',
      professionalTitle: 'Lead Frontend Engineer & UI/UX Specialist',
      email: 'bagas.aditya@gmail.com',
      phone: '0812-9844-3210',
      city: 'Jakarta Selatan',
      country: 'Indonesia',
      summary: 'Spesialis perancangan arsitektur antarmuka modern dengan pengalaman membangun aplikasi web berskala enterprise.',
      educations: [],
      experiences: [],
      skills: [],
      certifications: [],
      projects: [],
      testimonials: [
        {
          id: 'TESTI-1',
          clientName: 'Ir. Hendra Gunawan',
          clientRole: 'VP of Product',
          company: 'LinkAja',
          feedback: 'Bagas menunjukkan kepemimpinan teknis yang luar biasa dalam memangkas waktu load aplikasi dan mendesain modular design system.'
        }
      ],
      languages: [],
      socialLinks: [],
      lastUpdated: new Date().toISOString()
    }
  );

  const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'skills' | 'testimonials' | 'style'>('projects');
  const [zoomScale, setZoomScale] = useState(0.85);

  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [accentColor, setAccentColor] = useState('#0284c7');

  React.useEffect(() => {
    if (currentOrder) {
      setCustomerData({
        ...currentOrder.customerData,
        testimonials: currentOrder.customerData.testimonials || [
          {
            id: 'TESTI-1',
            clientName: 'Ir. Hendra Gunawan',
            clientRole: 'VP of Engineering',
            company: 'PT Fintech Karya Nusantara',
            feedback: 'Bagas sangat mahir dalam mentransformasikan requirement kompleks menjadi UI produk digital yang scalable dan user-friendly.'
          }
        ]
      });
    }
  }, [selectedOrderId]);

  const addProject = () => {
    const newProj: ProjectItem = {
      id: `PRJ-${Date.now()}`,
      title: 'Proyek Portofolio Baru',
      category: 'Web Application',
      description: 'Deskripsi tantangan bisnis, solusi yang diimplementasikan, dan hasil terukur.',
      technologies: ['React', 'TypeScript', 'Tailwind'],
      link: 'https://demo.portfolio.id',
      date: '2024'
    };
    setCustomerData({
      ...customerData,
      projects: [newProj, ...(customerData.projects || [])]
    });
  };

  const removeProject = (id: string) => {
    setCustomerData({
      ...customerData,
      projects: customerData.projects.filter((p) => p.id !== id)
    });
  };

  const addTestimonial = () => {
    const newTesti: TestimonialItem = {
      id: `TESTI-${Date.now()}`,
      clientName: 'Nama Klien / Rekan',
      clientRole: 'Head of Engineering',
      company: 'Tech Corp',
      feedback: 'Ulasan performa kerja dan kontribusi profesional...'
    };
    setCustomerData({
      ...customerData,
      testimonials: [...(customerData.testimonials || []), newTesti]
    });
  };

  const removeTestimonial = (id: string) => {
    setCustomerData({
      ...customerData,
      testimonials: customerData.testimonials?.filter((t) => t.id !== id)
    });
  };

  const handleSave = () => {
    if (currentOrder) {
      storageService.updateOrderCustomerData(currentOrder.id, customerData);
      onShowToast(`Portfolio untuk pesanan ${currentOrder.id} berhasil disimpan.`);
    }
  };

  const handleGeneratePreview = () => {
    if (currentOrder) {
      storageService.updateOrderCustomerData(currentOrder.id, customerData);
      const nextVer = (currentOrder.files?.filter((f) => f.stage === 'Preview').length || 0) + 1;
      const fileName = generateStandardFileName(
        currentOrder.id,
        customerData.fullName || currentOrder.customerName,
        'Portfolio Profesional',
        'Preview',
        nextVer,
        'pdf'
      );

      storageService.addFileToOrder(currentOrder.id, {
        fileName,
        stage: 'Preview',
        version: nextVer,
        uploadedAt: new Date().toISOString(),
        fileSize: '420 KB',
        fileType: 'pdf'
      });

      storageService.updateOrderStatus(currentOrder.id, 'Preview');
      onShowToast(`✓ Berkas Preview (${fileName}) dibuat & status pesanan beralih ke "Preview"!`);
    }
  };

  const handlePrintPdf = () => {
    if (currentOrder) {
      storageService.updateOrderCustomerData(currentOrder.id, customerData);
      const nextVer = (currentOrder.files?.filter((f) => f.stage === 'Final').length || 0) + 1;
      const fileName = generateStandardFileName(
        currentOrder.id,
        customerData.fullName || currentOrder.customerName,
        'Portfolio Profesional',
        'Final',
        nextVer,
        'pdf'
      );

      storageService.addFileToOrder(currentOrder.id, {
        fileName,
        stage: 'Final',
        version: nextVer,
        uploadedAt: new Date().toISOString(),
        fileSize: '480 KB',
        fileType: 'pdf'
      });

      storageService.updateOrderStatus(currentOrder.id, 'Finalisasi');
      onShowToast(`✓ Berkas Final (${fileName}) tersimpan di pesanan.`);
    }

    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Portfolio Project Showcase Builder</h1>
          <span className="text-slate-300">|</span>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800 text-xs"
          >
            {allOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} - {o.customerName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
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
            title="Simpan perubahan data portfolio ke pesanan"
          >
            <Save size={13} />
            <span>Simpan</span>
          </button>

          <button
            onClick={handleGeneratePreview}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-lg flex items-center gap-1.5"
            title="Buat berkas draf preview untuk dikirim ke klien"
          >
            <FileCheck size={13} className="text-amber-600" />
            <span>Buat Preview</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
            title="Finalisasi & Cetak berkas PDF final"
          >
            <Printer size={13} />
            <span>Cetak PDF Final</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Portfolio Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[82vh] overflow-hidden text-xs">
          {/* Sub Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-2 py-1.5 gap-1 shrink-0 font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'profile' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <User size={13} />
              <span>Profil</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'projects' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <Briefcase size={13} />
              <span>Proyek ({customerData.projects?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'skills' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <Code size={13} />
              <span>Tech Stack</span>
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'testimonials' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <MessageSquare size={13} />
              <span>Testimoni</span>
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'style' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:bg-slate-100'}`}
            >
              <Palette size={13} />
              <span>Warna</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* TAB: PROFIL */}
            {activeTab === 'profile' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="font-bold text-slate-900 block text-xs">Nama Lengkap & Title</label>
                  <input
                    type="text"
                    value={customerData.fullName}
                    onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded font-semibold"
                  />
                  <input
                    type="text"
                    value={customerData.professionalTitle}
                    onChange={(e) => setCustomerData({ ...customerData, professionalTitle: e.target.value })}
                    placeholder="Headline Portfolio"
                    className="w-full p-2 bg-white border border-slate-300 rounded"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="font-bold text-slate-900 block text-xs">About / Deskripsi Portofolio</label>
                  <textarea
                    rows={4}
                    value={customerData.summary}
                    onChange={(e) => setCustomerData({ ...customerData, summary: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded leading-relaxed text-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Showcase Proyek</h3>
                  <button
                    onClick={addProject}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Tambah Proyek</span>
                  </button>
                </div>

                {customerData.projects?.map((proj) => (
                  <div key={proj.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = customerData.projects.map((p) =>
                            p.id === proj.id ? { ...p, title: e.target.value } : p
                          );
                          setCustomerData({ ...customerData, projects: updated });
                        }}
                        className="font-bold text-xs p-1.5 bg-white border border-slate-300 rounded w-full mr-2"
                      />
                      <button onClick={() => removeProject(proj.id)} className="text-slate-400 hover:text-rose-600 p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={proj.category}
                        onChange={(e) => {
                          const updated = customerData.projects.map((p) =>
                            p.id === proj.id ? { ...p, category: e.target.value } : p
                          );
                          setCustomerData({ ...customerData, projects: updated });
                        }}
                        placeholder="Kategori"
                        className="text-xs p-1.5 bg-white border border-slate-300 rounded"
                      />
                      <input
                        type="text"
                        value={proj.technologies?.join(', ')}
                        onChange={(e) => {
                          const list = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                          const updated = customerData.projects.map((p) =>
                            p.id === proj.id ? { ...p, technologies: list } : p
                          );
                          setCustomerData({ ...customerData, projects: updated });
                        }}
                        placeholder="Tech Stack (React, TS...)"
                        className="text-xs p-1.5 bg-white border border-slate-300 rounded"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => {
                        const updated = customerData.projects.map((p) =>
                          p.id === proj.id ? { ...p, description: e.target.value } : p
                        );
                        setCustomerData({ ...customerData, projects: updated });
                      }}
                      placeholder="Deskripsi proyek..."
                      className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                    />

                    <input
                      type="text"
                      value={proj.link || ''}
                      onChange={(e) => {
                        const updated = customerData.projects.map((p) =>
                          p.id === proj.id ? { ...p, link: e.target.value } : p
                        );
                        setCustomerData({ ...customerData, projects: updated });
                      }}
                      placeholder="https://link-demo-proyek.com"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB: TECH STACK */}
            {activeTab === 'skills' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900">Kompetensi & Software Stack</h4>
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

            {/* TAB: TESTIMONIALS */}
            {activeTab === 'testimonials' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Ulasan & Rekomendasi Klien</h3>
                  <button
                    onClick={addTestimonial}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Tambah Ulasan</span>
                  </button>
                </div>

                {customerData.testimonials?.map((testi) => (
                  <div key={testi.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={testi.clientName}
                        onChange={(e) => {
                          const updated = customerData.testimonials?.map((t) =>
                            t.id === testi.id ? { ...t, clientName: e.target.value } : t
                          );
                          setCustomerData({ ...customerData, testimonials: updated });
                        }}
                        placeholder="Nama Klien / Atasan"
                        className="font-bold text-xs p-1.5 bg-white border rounded w-full mr-2"
                      />
                      <button onClick={() => removeTestimonial(testi.id)} className="text-slate-400 hover:text-rose-600 p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={testi.clientRole}
                        onChange={(e) => {
                          const updated = customerData.testimonials?.map((t) =>
                            t.id === testi.id ? { ...t, clientRole: e.target.value } : t
                          );
                          setCustomerData({ ...customerData, testimonials: updated });
                        }}
                        placeholder="Jabatan"
                        className="text-xs p-1.5 bg-white border rounded"
                      />
                      <input
                        type="text"
                        value={testi.company}
                        onChange={(e) => {
                          const updated = customerData.testimonials?.map((t) =>
                            t.id === testi.id ? { ...t, company: e.target.value } : t
                          );
                          setCustomerData({ ...customerData, testimonials: updated });
                        }}
                        placeholder="Perusahaan"
                        className="text-xs p-1.5 bg-white border rounded"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={testi.feedback}
                      onChange={(e) => {
                        const updated = customerData.testimonials?.map((t) =>
                          t.id === testi.id ? { ...t, feedback: e.target.value } : t
                        );
                        setCustomerData({ ...customerData, testimonials: updated });
                      }}
                      placeholder="Isi testimoni..."
                      className="w-full p-1.5 bg-white border rounded text-xs leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB: STYLE */}
            {activeTab === 'style' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900">Aksen Warna Dokumen Portfolio</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { primary: '#0f172a', accent: '#0284c7', label: 'Tech Cyan' },
                    { primary: '#1e1b4b', accent: '#6366f1', label: 'Indigo Noir' },
                    { primary: '#064e3b', accent: '#10b981', label: 'Emerald Forest' },
                    { primary: '#581c87', accent: '#a855f7', label: 'Deep Purple' }
                  ].map((p, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrimaryColor(p.primary);
                        setAccentColor(p.accent);
                      }}
                      className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-2 hover:bg-slate-100"
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                      <span className="font-semibold text-slate-800">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Preview (7 cols) */}
        <div className="lg:col-span-7 bg-slate-200/70 rounded-xl p-4 md:p-6 flex justify-center items-start overflow-auto h-[82vh] border border-slate-300/80 shadow-inner">
          <div className="transition-transform duration-200 origin-top">
            <DocumentRenderer
              data={customerData}
              customization={{
                templateId: 'TMP-PORT-01',
                fontFamily: 'Plus Jakarta Sans',
                primaryColor,
                accentColor,
                layout: 'grid-portfolio',
                fontSize: 'normal',
                sectionsOrder: [],
                sectionsVisibility: {},
                showPhoto: false
              }}
              scale={zoomScale}
              documentType="portfolio"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
