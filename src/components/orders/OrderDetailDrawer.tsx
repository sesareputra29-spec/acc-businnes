import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ExternalLink, 
  Copy, 
  Send, 
  FileText, 
  Upload, 
  Clock, 
  Check, 
  User, 
  History, 
  FileCheck, 
  Plus,
  AlertCircle,
  Download,
  Edit
} from 'lucide-react';
import { 
  Order, 
  ProductionStatus, 
  StaffMember, 
  DocumentTemplate, 
  FileStage 
} from '../../types';
import { 
  formatRupiah, 
  formatDateTime, 
  formatDate, 
  getStatusBadgeClass, 
  getPaymentBadgeClass,
  generateWhatsAppLink,
  generateStandardFileName,
  generateClientFormUrl,
  WORKFLOW_STAGES 
} from '../../utils/formatters';
import { storageService } from '../../services/storage';
import { EditOrderModal } from './EditOrderModal';

interface Props {
  order: Order | null;
  onClose: () => void;
  staffList: StaffMember[];
  templates: DocumentTemplate[];
  onOpenCvBuilderWithOrder: (order: Order) => void;
  onOpenCustomerFormPortal: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const OrderDetailDrawer: React.FC<Props> = ({
  order,
  onClose,
  staffList,
  templates,
  onOpenCvBuilderWithOrder,
  onOpenCustomerFormPortal,
  onShowToast
}) => {
  if (!order) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'workflow' | 'customer' | 'files' | 'revisions'>('workflow');
  const [newRevisionText, setNewRevisionText] = useState('');
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(order.assignedStaffId || '');
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);


  const badge = getStatusBadgeClass(order.status);
  const paymentBadge = getPaymentBadgeClass(order.paymentStatus);
  const currentTemplate = templates.find((t) => t.id === order.templateId);
  const assignedStaff = staffList.find((s) => s.id === order.assignedStaffId);
  const settings = storageService.getSettings();

  const handleStatusChange = (newStatus: ProductionStatus) => {
    storageService.updateOrderStatus(order.id, newStatus);
    onShowToast(`Status pesanan ${order.id} diubah menjadi "${newStatus}"`);
  };

  const handleAssignStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    storageService.assignStaff(order.id, staffId);
    const staff = staffList.find((s) => s.id === staffId);
    onShowToast(`Pesanan ditugaskan kepada ${staff?.name || 'Staff'}`);
  };

  const handleAddRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevisionText.trim()) return;

    const currentRevCount = order.revisions?.length || 0;
    storageService.addRevisionToOrder(order.id, {
      version: currentRevCount + 1,
      requestedAt: new Date().toISOString(),
      clientNotes: newRevisionText,
      status: 'Menunggu'
    });

    setNewRevisionText('');
    setShowAddRevision(false);
    onShowToast(`Revisi V${currentRevCount + 1} berhasil dicatat.`);
  };

  const handleGenerateAndAddFile = (stage: FileStage) => {
    const version = (order.files?.filter((f) => f.stage === stage).length || 0) + 1;
    const standardName = generateStandardFileName(
      order.id,
      order.customerName,
      order.productType,
      stage,
      version,
      'pdf'
    );

    storageService.addFileToOrder(order.id, {
      fileName: standardName,
      stage,
      version,
      uploadedAt: new Date().toISOString(),
      fileSize: '348 KB',
      fileType: 'pdf'
    });

    onShowToast(`File ${stage} (${standardName}) berhasil ditambahkan ke pesanan.`);
  };

  const customerPortalUrl = generateClientFormUrl(
    order.id,
    order.customerName,
    order.productType,
    order.customerPhone
  );

  const copyCustomerFormLink = () => {
    navigator.clipboard.writeText(customerPortalUrl);
    onShowToast('Tautan Form Klien berhasil disalin ke clipboard!');
  };

  const sendWhatsAppWelcome = () => {
    const msg = settings.waTemplateWelcome
      .replace('{nama}', order.customerName)
      .replace('{produk}', order.productType)
      .replace('{link_form}', customerPortalUrl);
    window.open(generateWhatsAppLink(order.customerPhone, msg), '_blank');
  };

  const sendWhatsAppPreview = () => {
    const previewFile = order.files?.find((f) => f.stage === 'Preview') || order.files?.[0];
    const previewUrl = previewFile ? previewFile.fileName : customerPortalUrl;
    const msg = settings.waTemplatePreview
      .replace('{nama}', order.customerName)
      .replace('{produk}', order.productType)
      .replace('{link_preview}', previewUrl);
    window.open(generateWhatsAppLink(order.customerPhone, msg), '_blank');
  };

  const sendWhatsAppFinal = () => {
    const finalFile = order.files?.find((f) => f.stage === 'Final') || order.files?.[0];
    const finalUrl = finalFile ? finalFile.fileName : customerPortalUrl;
    const msg = settings.waTemplateFinal
      .replace('{nama}', order.customerName)
      .replace('{produk}', order.productType)
      .replace('{link_final}', finalUrl);
    window.open(generateWhatsAppLink(order.customerPhone, msg), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-indigo-700">{order.id}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-700">{order.marketplace}</span>
              {order.marketplaceOrderId && (
                <span className="text-[11px] text-slate-400 font-mono">({order.marketplaceOrderId})</span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">{order.customerName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditOrderOpen(true)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Edit size={13} />
              <span>Edit Pesanan</span>
            </button>
            <button
              onClick={() => onOpenCvBuilderWithOrder(order)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <FileText size={14} />
              <span>Buka CV Builder</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex gap-6 text-xs font-medium text-slate-500 bg-white">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'workflow' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            Alur Workflow & Status
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'info' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            Detail Pesanan
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'customer' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            Data Klien ({order.customerData?.experiences?.length || 0} Pengalaman)
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'files' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            Berkas ({order.files?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('revisions')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'revisions' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            Revisi ({order.revisions?.length || 0})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB: WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              {/* Current Status Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tahapan Saat Ini</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                    <span className="text-sm font-bold text-slate-900">{order.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Tenggat Waktu:</span>
                  <p className="text-xs font-semibold text-slate-800">{formatDate(order.deadlineDate)}</p>
                </div>
              </div>

              {/* Workflow Stepper */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3 text-xs">Perbarui Progres Pengerjaan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {WORKFLOW_STAGES.map((stage, idx) => {
                    const isCurrent = order.status === stage;
                    const stageIndex = WORKFLOW_STAGES.indexOf(order.status);
                    const isPassed = WORKFLOW_STAGES.indexOf(stage) < stageIndex;

                    return (
                      <button
                        key={stage}
                        onClick={() => handleStatusChange(stage)}
                        className={`p-2.5 rounded-lg border text-left transition-all text-xs font-medium flex items-center justify-between ${
                          isCurrent
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold ring-1 ring-indigo-500'
                            : isPassed
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 block">Tahap {idx + 1}</span>
                          <span className="truncate">{stage}</span>
                        </div>
                        {isPassed && <Check size={14} className="text-emerald-600 shrink-0" />}
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignment Box */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 mb-2">Penugasan Desainer / Operator</h4>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => handleAssignStaff(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Belum Ditugaskan --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role} - {s.activeOrdersCount} aktif)
                      </option>
                    ))}
                  </select>
                  {assignedStaff && (
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs text-slate-700">
                      <User size={14} />
                      <span className="font-medium">{assignedStaff.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp Quick Actions */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-bold text-slate-900">Komunikasi Klien WhatsApp</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={sendWhatsAppWelcome}
                    className="p-2.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send size={13} />
                    <span>Kirim Link Form</span>
                  </button>
                  <button
                    onClick={sendWhatsAppPreview}
                    className="p-2.5 bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send size={13} />
                    <span>Kirim Draf Preview</span>
                  </button>
                  <button
                    onClick={sendWhatsAppFinal}
                    className="p-2.5 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-800 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send size={13} />
                    <span>Kirim Berkas Final</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Produk Jasa</span>
                  <p className="font-bold text-slate-900 mt-0.5">{order.productType}</p>
                  <p className="text-slate-500 text-[11px]">{order.variation}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Biaya & Pembayaran</span>
                  <p className="font-bold text-slate-900 mt-0.5">{formatRupiah(order.price)}</p>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mt-1 border ${paymentBadge.bg}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal Transaksi</span>
                  <span className="font-medium text-slate-900">{formatDateTime(order.orderDate)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Batas Waktu (SLA)</span>
                  <span className="font-medium text-rose-600">{formatDateTime(order.deadlineDate)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Template Terpilih</span>
                  <span className="font-medium text-slate-900">{currentTemplate?.name || order.templateId}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Prioritas Antrian</span>
                  <span className="font-medium text-slate-900">{order.priority}</span>
                </div>
              </div>

              {order.internalNotes && (
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg">
                  <span className="font-bold text-amber-900 block mb-0.5">Catatan Operator:</span>
                  <p className="text-amber-800">{order.internalNotes}</p>
                </div>
              )}

              {/* Dynamic Customer Form Link Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Tautan Pengisian Form Mandiri Klien</span>
                  <button
                    onClick={() => onOpenCustomerFormPortal(order)}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    Buka Form <ExternalLink size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={customerPortalUrl}
                    className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] text-slate-600 font-mono select-all"
                  />
                  <button
                    onClick={copyCustomerFormLink}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 transition-colors"
                    title="Salin Link Form"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMER DATA SNAPSHOT */}
          {activeTab === 'customer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{order.customerData?.fullName || order.customerName}</h4>
                  <p className="text-slate-500 text-[11px]">{order.customerData?.professionalTitle || 'Belum diisi'}</p>
                </div>
                <button
                  onClick={() => onOpenCustomerFormPortal(order)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-md transition-colors"
                >
                  Edit Data Formulir
                </button>
              </div>

              {order.customerData?.summary ? (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-[10px] uppercase text-slate-400">Ringkasan Profil</span>
                  <p className="text-slate-700 mt-1 leading-relaxed">{order.customerData.summary}</p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-lg text-amber-800 text-center">
                  Data customer belum lengkap atau belum diisi via Form.
                </div>
              )}

              {/* Experiences count */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="font-bold text-slate-900 block">Riwayat Pengalaman ({order.customerData?.experiences?.length || 0})</span>
                {order.customerData?.experiences?.map((exp) => (
                  <div key={exp.id} className="p-2.5 bg-white border border-slate-200 rounded-md">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{exp.position}</span>
                      <span className="text-slate-400 font-normal">{exp.startDate} - {exp.endDate}</span>
                    </div>
                    <div className="text-indigo-600 font-medium text-[11px]">{exp.company}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: FILES */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">Daftar Berkas Versi Pesanan</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateAndAddFile('Preview')}
                    className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-semibold rounded text-xs transition-colors"
                  >
                    + Tambah Draf Preview
                  </button>
                  <button
                    onClick={() => handleGenerateAndAddFile('Final')}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold rounded text-xs transition-colors"
                  >
                    + Tambah Berkas Final
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(!order.files || order.files.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 border border-dashed rounded-lg">
                    Belum ada berkas yang diunggah. Anda dapat membuat file PDF melalui CV Builder.
                  </div>
                ) : (
                  order.files.map((file) => (
                    <div key={file.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{file.fileName}</p>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-slate-600">{file.stage} V{file.version}</span>
                            <span>·</span>
                            <span>{file.fileSize}</span>
                            <span>·</span>
                            <span>{formatDateTime(file.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onOpenCvBuilderWithOrder(order)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded"
                          title="Lihat & Edit di Builder"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: REVISIONS */}
          {activeTab === 'revisions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">Riwayat Revisi Klien</h4>
                <button
                  onClick={() => setShowAddRevision(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} />
                  <span>Tambah Catatan Revisi</span>
                </button>
              </div>

              {showAddRevision && (
                <form onSubmit={handleAddRevision} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <label className="font-semibold text-slate-800 block">Detail Permintaan Revisi Klien:</label>
                  <textarea
                    rows={3}
                    required
                    value={newRevisionText}
                    onChange={(e) => setNewRevisionText(e.target.value)}
                    placeholder="Contoh: Klien minta perbaiki tahun kelulusan di UI jadi 2021 dan ganti format bullet points pengalaman..."
                    className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRevision(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                    >
                      Simpan Revisi
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {(!order.revisions || order.revisions.length === 0) ? (
                  <div className="text-center py-6 text-slate-400">Belum ada revisi untuk pesanan ini.</div>
                ) : (
                  order.revisions.map((rev) => (
                    <div key={rev.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-700">Revisi Versi #{rev.version}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(rev.requestedAt)}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{rev.clientNotes}</p>
                      {rev.completedAt && (
                        <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium mt-1">
                          <Check size={12} />
                          <span>Selesai diproses pada {formatDateTime(rev.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Order Modal */}
      {isEditOrderOpen && (
        <EditOrderModal
          isOpen={isEditOrderOpen}
          order={order}
          templates={templates}
          onClose={() => setIsEditOrderOpen(false)}
          onSaved={(updated) => {
            onShowToast(`Pesanan ${updated.id} berhasil diperbarui.`);
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
