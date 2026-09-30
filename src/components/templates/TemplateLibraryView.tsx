import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Star, 
  Copy, 
  Eye, 
  FileText, 
  Check, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Filter,
  CheckCircle,
  User,
  Zap
} from 'lucide-react';
import { DocumentTemplate, TemplateCategory, CustomerData, CustomerProfile } from '../../types';
import { storageService } from '../../services/storage';
import { templateEngine } from '../../services/templateEngine';
import { DocumentRenderer } from '../builders/DocumentRenderer';
import { SAMPLE_CUSTOMER_DATA } from '../../data/initialData';

interface Props {
  templates: DocumentTemplate[];
  onSelectTemplateForBuilder: (template: DocumentTemplate) => void;
  onShowToast: (msg: string) => void;
}

export const TemplateLibraryView: React.FC<Props> = ({
  templates,
  onSelectTemplateForBuilder,
  onShowToast
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'usage-desc' | 'name-asc' | 'date-desc'>('usage-desc');
  
  // Interactive Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [previewCustomerMode, setPreviewCustomerMode] = useState<string>('sample');
  const [customersList, setCustomersList] = useState<CustomerProfile[]>(() => storageService.getCustomers());

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Semua Template' },
    { id: 'ATS', label: 'ATS-Standard (99% Pass)' },
    { id: 'Modern', label: 'Modern Split-Column' },
    { id: 'Executive', label: 'Executive Serif' },
    { id: 'Creative', label: 'Visual & Kreatif' },
    { id: 'Portfolio', label: 'Portfolio Grid' },
    { id: 'CoverLetter', label: 'Cover Letter Resmi' }
  ];

  // Extract all unique tags
  const allTags = Array.from(new Set(templates.flatMap((t) => t.tags || [])));

  // Filter & Sort
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.style && t.style.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFav = !onlyFavorites || t.isFavorite;
    const matchesTag = selectedTag === 'all' || t.tags.includes(selectedTag);

    return matchesCategory && matchesSearch && matchesFav && matchesTag;
  }).sort((a, b) => {
    if (sortBy === 'usage-desc') return b.usageCount - a.usageCount;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'date-desc') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return 0;
  });

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.toggleTemplateFavorite(id);
    onShowToast('Status favorit template berhasil diperbarui.');
  };

  const handleToggleActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.toggleTemplateActive(id);
    onShowToast('Status aktif template diperbarui.');
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.duplicateTemplate(id);
    onShowToast('Template berhasil diduplikasi ke galeri.');
  };

  // Get active preview customer data
  const getPreviewCustomerData = (): CustomerData => {
    if (previewCustomerMode === 'sample') return SAMPLE_CUSTOMER_DATA;
    const found = customersList.find((c) => c.id === previewCustomerMode);
    return found?.customerData || SAMPLE_CUSTOMER_DATA;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Template Library & Dynamic Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemisahan murni antara Template dan Customer Data: <span className="font-semibold text-slate-800">Customer Data + Template = Generated Document</span>.
          </p>
        </div>

        <button
          onClick={() => {
            const newTpl: DocumentTemplate = {
              id: `TMP-${Date.now().toString().slice(-6)}`,
              name: 'Nordic Clean Architecture',
              category: 'ATS',
              style: 'Minimalis',
              description: 'Format dokumen bersih dengan hierarki tipografi modern untuk engineering dan konsultan.',
              thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=80',
              fontFamily: 'Inter',
              primaryColor: '#0f172a',
              accentColor: '#3b82f6',
              layout: 'single-column',
              sections: [
                { key: 'summary', label: 'Ringkasan Profesional', isVisible: true, order: 1 },
                { key: 'experience', label: 'Pengalaman Kerja', isVisible: true, order: 2 },
                { key: 'education', label: 'Pendidikan', isVisible: true, order: 3 },
                { key: 'skills', label: 'Keahlian & Kemampuan', isVisible: true, order: 4 }
              ],
              isAtsCompliant: true,
              isFavorite: false,
              isActive: true,
              tags: ['Custom', 'Nordic', 'ATS-Friendly', 'Single Column'],
              supportedProducts: ['CV ATS-Friendly'],
              usageCount: 0,
              createdAt: new Date().toISOString()
            };
            storageService.addTemplate(newTpl);
            onShowToast('Template baru berhasil ditambahkan.');
          }}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Tambah Template Baru</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search, Tag, Sort & Favorites Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari template, gaya, tag (misal: Harvard, Serif, Modern)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Semua Tag Desain</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="usage-desc">Paling Sering Digunakan</option>
            <option value="name-asc">Nama Template (A-Z)</option>
            <option value="date-desc">Terbaru Ditambahkan</option>
          </select>

          {/* Favorites Only Toggle */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
              onlyFavorites
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star size={13} className={onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
            <span>Favorit</span>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Tidak ada template yang cocok dengan kriteria filter Anda.
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl border transition-all overflow-hidden flex flex-col justify-between group ${
                template.isActive ? 'border-slate-200 hover:border-indigo-400 hover:shadow-md' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                {/* Thumbnail Container */}
                <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Bar Floating Badges */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleToggleFavorite(template.id, e)}
                      className="p-1.5 bg-white/95 backdrop-blur-xs rounded-full shadow-xs text-slate-600 hover:text-amber-500 transition-colors"
                      title="Tandai Favorit"
                    >
                      <Star size={14} className={template.isFavorite ? 'fill-amber-500 text-amber-500' : ''} />
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5">
                    {template.isAtsCompliant ? (
                      <span className="text-[10px] font-bold bg-emerald-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <CheckCircle size={11} />
                        <span>ATS 99% Verified</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-purple-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded shadow-xs">
                        {template.style || 'Visual Showcase'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {template.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-indigo-600 block mt-0.5">
                        Gaya: {template.style || template.category} · Layout: {template.layout}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">{template.usageCount}x Pakai</span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="pt-2 flex flex-wrap gap-1">
                    {template.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDuplicate(template.id, e)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors"
                    title="Duplikat Template"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => handleToggleActive(template.id, e)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
                      template.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-200'
                    }`}
                  >
                    {template.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye size={13} />
                    <span>Live Preview</span>
                  </button>
                  <button
                    onClick={() => onSelectTemplateForBuilder(template)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <FileText size={13} />
                    <span>Gunakan</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live Interactive Document Preview Modal (Customer Data + Template = Generated Document) */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{previewTemplate.name}</h3>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                    {previewTemplate.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulasi Live Render: Menggabungkan data klien dengan aturan tata letak template.
                </p>
              </div>

              {/* Customer Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Uji Data Klien:</span>
                <select
                  value={previewCustomerMode}
                  onChange={(e) => setPreviewCustomerMode(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="sample">Bagas Aditya (Sample Lead Dev)</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const tpl = previewTemplate;
                    setPreviewTemplate(null);
                    onSelectTemplateForBuilder(tpl);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <FileText size={13} />
                  <span>Buka di CV Builder</span>
                </button>

                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Render Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-200/70 flex justify-center items-start shadow-inner">
              <div className="scale-75 origin-top transition-transform">
                <DocumentRenderer
                  data={getPreviewCustomerData()}
                  customization={templateEngine.resolveCustomization(previewTemplate)}
                  documentType={
                    previewTemplate.category === 'Portfolio'
                      ? 'portfolio'
                      : previewTemplate.category === 'CoverLetter'
                      ? 'cover-letter'
                      : 'cv'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
