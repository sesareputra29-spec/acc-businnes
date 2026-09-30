import React, { useState } from 'react';
import { 
  FolderDown, 
  Search, 
  Download, 
  FileText, 
  ExternalLink, 
  Printer, 
  Check, 
  FileCheck2,
  Eye,
  Plus,
  X,
  MessageSquare,
  Share2,
  Copy,
  Layers,
  Sparkles
} from 'lucide-react';
import { Order, OrderFile, FileStage } from '../../types';
import { formatDateTime, generateWhatsAppLink } from '../../utils/formatters';
import { pdfExportService } from '../../services/pdfExportService';
import { storageService } from '../../services/storage';
import { DocumentRenderer } from '../builders/DocumentRenderer';
import { templateEngine } from '../../services/templateEngine';

interface Props {
  orders: Order[];
  onOpenCvBuilderWithOrder: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const FileExportView: React.FC<Props> = ({
  orders,
  onOpenCvBuilderWithOrder,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [selectedOrderFilter, setSelectedOrderFilter] = useState<string>('all');

  // Preview Modal State
  const [previewFileItem, setPreviewFileItem] = useState<{ order: Order; file: OrderFile } | null>(null);

  // Generate File Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState(orders[0]?.id || '');
  const [generateStage, setGenerateStage] = useState<FileStage>('Preview');

  // Aggregate files across all orders
  const allFiles: { order: Order; file: OrderFile }[] = [];
  orders.forEach((order) => {
    order.files?.forEach((file) => {
      allFiles.push({ order, file });
    });
  });

  const filtered = allFiles.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      item.file.fileName.toLowerCase().includes(term) ||
      item.order.customerName.toLowerCase().includes(term) ||
      item.order.id.toLowerCase().includes(term);

    const matchesStage = filterStage === 'all' || item.file.stage === filterStage;
    const matchesOrder = selectedOrderFilter === 'all' || item.order.id === selectedOrderFilter;

    return matchesSearch && matchesStage && matchesOrder;
  });

  const handleDownload = (file: OrderFile) => {
    pdfExportService.downloadDocument(file.fileName);
    onShowToast(`Mengunduh berkas ${file.fileName}...`);
  };

  const handlePrint = (item: { order: Order; file: OrderFile }) => {
    setPreviewFileItem(item);
    setTimeout(() => {
      pdfExportService.triggerPrint(item.file.fileName);
    }, 300);
  };

  const handleCreateFileRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find((o) => o.id === targetOrderId);
    if (order) {
      const currentStageCount = order.files?.filter((f) => f.stage === generateStage).length || 0;
      const nextVer = currentStageCount + 1;

      const newFile = pdfExportService.registerGeneratedFile(
        order.id,
        order.customerName,
        order.productType,
        generateStage,
        nextVer,
        '356 KB',
        'pdf'
      );

      // Auto advance order status if preview or final
      if (generateStage === 'Preview' && (order.status === 'Sedang Dikerjakan' || order.status === 'Data Masuk')) {
        storageService.updateOrderStatus(order.id, 'Preview');
      } else if (generateStage === 'Final') {
        storageService.updateOrderStatus(order.id, 'Finalisasi');
      }

      onShowToast(`Berkas ${generateStage} (${newFile.fileName}) berhasil dibuat dan disimpan.`);
      setIsGenerateModalOpen(false);
    }
  };

  const handleSendViaWhatsApp = (item: { order: Order; file: OrderFile }) => {
    const settings = storageService.getSettings();
    let template = settings.waTemplatePreview;
    if (item.file.stage === 'Final') {
      template = settings.waTemplateFinal;
    }

    const msg = template
      .replace('{nama}', item.order.customerName)
      .replace('{produk}', item.order.productType)
      .replace('{link_file}', item.file.fileName);

    window.open(generateWhatsAppLink(item.order.customerPhone, msg), '_blank');
  };

  // Get active template for preview modal
  const getPreviewCustomization = (order: Order) => {
    const templates = storageService.getTemplates();
    const tpl = templates.find((t) => t.id === order.templateId) || templates[0];
    return templateEngine.resolveCustomization(tpl);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Pusat Berkas Dokumen & Manajemen PDF
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan berkas <span className="font-semibold text-slate-700">Draft, Preview, Revision, dan Final</span> dengan penamaan otomatis standar dan export PDF native.
          </p>
        </div>

        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Generate / Tambah Berkas Baru</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama berkas, nama klien, atau ID pesanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Order filter */}
          <select
            value={selectedOrderFilter}
            onChange={(e) => setSelectedOrderFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Semua Pesanan Klien</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} - {o.customerName}
              </option>
            ))}
          </select>

          {/* Stage filter */}
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Semua Tahap Berkas</option>
            <option value="Draft">Draft Internal</option>
            <option value="Preview">Preview Klien</option>
            <option value="Revision">Revision</option>
            <option value="Final">Final Siap Kirim</option>
          </select>
        </div>
      </div>

      {/* Files Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Berkas Standar Otomatis</th>
                <th className="py-3 px-4">Klien & Order ID</th>
                <th className="py-3 px-4">Tahap / Versi</th>
                <th className="py-3 px-4">Ukuran</th>
                <th className="py-3 px-4">Waktu Generate</th>
                <th className="py-3 px-4 text-right">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada berkas yang ditemukan. Anda dapat membuat berkas baru melalui tombol di atas atau CV Builder.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const { order, file } = item;
                  const isFinal = file.stage === 'Final';
                  const isPreview = file.stage === 'Preview';

                  return (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 max-w-sm truncate">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[9px] uppercase ${
                            isFinal ? 'bg-emerald-100 text-emerald-800' : isPreview ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {file.fileType}
                          </span>
                          <span className="truncate">{file.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{order.customerName}</span>
                        <span className="text-[10px] text-indigo-600 font-mono font-semibold">{order.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isFinal
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isPreview
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : file.stage === 'Revision'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {file.stage} V{file.version}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{file.fileSize}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDateTime(file.uploadedAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewFileItem(item)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                            title="Live Preview PDF A4"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handlePrint(item)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                            title="Cetak / Save PDF"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                            title="Download Berkas"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleSendViaWhatsApp(item)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded hover:bg-emerald-50 transition-colors"
                            title="Kirim Link Berkas via WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            onClick={() => onOpenCvBuilderWithOrder(order)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                            title="Buka di CV Builder"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: LIVE PDF PREVIEW (A4) */}
      {previewFileItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900">{previewFileItem.file.fileName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {previewFileItem.file.stage} V{previewFileItem.file.version}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klien: {previewFileItem.order.customerName} · Order ID: {previewFileItem.order.id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(previewFileItem)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={13} />
                  <span>Cetak / Save PDF</span>
                </button>
                <button
                  onClick={() => handleDownload(previewFileItem.file)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewFileItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Canvas Render */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-200/70 flex justify-center items-start shadow-inner">
              <div className="scale-75 origin-top transition-transform">
                <DocumentRenderer
                  data={previewFileItem.order.customerData}
                  customization={getPreviewCustomization(previewFileItem.order)}
                  documentType={
                    previewFileItem.order.productType.includes('Portfolio')
                      ? 'portfolio'
                      : previewFileItem.order.productType.includes('Cover Letter')
                      ? 'cover-letter'
                      : 'cv'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE BERKAS BARU */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Generate Berkas Versi Baru</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFileRecord} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Pesanan Klien *</label>
                <select
                  value={targetOrderId}
                  onChange={(e) => setTargetOrderId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-xs"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.customerName} ({o.productType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tahap Berkas (File Stage) *</label>
                <select
                  value={generateStage}
                  onChange={(e) => setGenerateStage(e.target.value as FileStage)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-xs"
                >
                  <option value="Draft">Draft (Internal Operator)</option>
                  <option value="Preview">Preview (Draf Persetujuan Klien)</option>
                  <option value="Revision">Revision (Hasil Perbaikan Revisi)</option>
                  <option value="Final">Final (Dokumen Siap Kirim)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 block">Format Penamaan Standar Otomatis:</span>
                <span className="font-mono text-indigo-700 block text-[10px] break-all">
                  {pdfExportService.generateStandardFileName(
                    targetOrderId,
                    orders.find((o) => o.id === targetOrderId)?.customerName || 'Pelanggan',
                    orders.find((o) => o.id === targetOrderId)?.productType || 'CV_ATS',
                    generateStage,
                    (orders.find((o) => o.id === targetOrderId)?.files?.filter((f) => f.stage === generateStage).length || 0) + 1,
                    'pdf'
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Generate & Simpan Berkas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
