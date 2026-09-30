import React, { useState } from 'react';
import { 
  History, 
  Search, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  FileText, 
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { Order } from '../../types';
import { formatDateTime, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { storageService } from '../../services/storage';

interface Props {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onOpenCvBuilderWithOrder: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const RevisionsView: React.FC<Props> = ({
  orders,
  onSelectOrder,
  onOpenCvBuilderWithOrder,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrderIdForRev, setSelectedOrderIdForRev] = useState(orders[0]?.id || '');
  const [revisionNotesText, setRevisionNotesText] = useState('');

  // Collect all revisions across orders
  const allRevisionsList: {
    order: Order;
    revisionId: string;
    version: number;
    requestedAt: string;
    clientNotes: string;
    operatorNotes?: string;
    status: 'Menunggu' | 'Dikerjakan' | 'Selesai';
    completedAt?: string;
  }[] = [];

  orders.forEach((order) => {
    order.revisions?.forEach((rev) => {
      allRevisionsList.push({
        order,
        revisionId: rev.id,
        version: rev.version,
        requestedAt: rev.requestedAt,
        clientNotes: rev.clientNotes,
        operatorNotes: rev.operatorNotes,
        status: rev.status,
        completedAt: rev.completedAt
      });
    });
  });

  const filtered = allRevisionsList.filter((item) => {
    const matchesSearch = 
      item.order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientNotes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'pending' && item.status !== 'Selesai') ||
      (filterStatus === 'completed' && item.status === 'Selesai');

    return matchesSearch && matchesStatus;
  });

  const handleCompleteRevision = (orderId: string, revId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      const rev = targetOrder.revisions.find((r) => r.id === revId);
      if (rev) {
        rev.status = 'Selesai';
        rev.completedAt = new Date().toISOString();
        targetOrder.status = 'Preview';
        storageService.updateOrder(targetOrder);
        onShowToast(`Revisi V${rev.version} untuk pesanan ${orderId} selesai. Status order berganti ke Preview.`);
      }
    }
  };

  const handleCreateNewRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotesText.trim()) return;

    const order = orders.find((o) => o.id === selectedOrderIdForRev);
    if (order) {
      const nextVer = (order.revisions?.length || 0) + 1;
      storageService.addRevisionToOrder(order.id, {
        version: nextVer,
        requestedAt: new Date().toISOString(),
        clientNotes: revisionNotesText,
        status: 'Menunggu'
      });

      onShowToast(`Revisi V${nextVer} untuk pesanan ${order.id} berhasil dicatat.`);
      setRevisionNotesText('');
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Pusat Manajemen Revisi & Catatan Klien
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau seluruh permintaan perbaikan, feedback klien, dan riwayat versioning dokumen.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Tambah Catatan Revisi</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari catatan revisi, nama klien, atau ID pesanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Semua Status Revisi</option>
            <option value="pending">Menunggu Pengerjaan</option>
            <option value="completed">Sudah Selesai</option>
          </select>
        </div>
      </div>

      {/* Revisions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
            Tidak ada permintaan revisi yang sesuai dengan filter.
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-700">{item.order.id}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-bold text-slate-900 text-xs">{item.order.customerName}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 text-xs">{item.order.productType}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-indigo-700 block mb-1">Catatan Revisi Versi #{item.version}:</span>
                  {item.clientNotes}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Diajukan: {formatDateTime(item.requestedAt)}</span>
                  {item.completedAt && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-600 font-semibold">
                        Selesai pada: {formatDateTime(item.completedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {item.status !== 'Selesai' && (
                  <button
                    onClick={() => handleCompleteRevision(item.order.id, item.revisionId)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <CheckCircle size={13} />
                    <span>Tandai Selesai</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenCvBuilderWithOrder(item.order)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <FileText size={13} />
                  <span>Buka di Builder</span>
                </button>

                <button
                  onClick={() => onSelectOrder(item.order)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
                  title="Lihat Detail Pesanan"
                >
                  <ExternalLink size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah Revisi */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Catat Permintaan Revisi Klien</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewRevision} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Pesanan Klien *</label>
                <select
                  value={selectedOrderIdForRev}
                  onChange={(e) => setSelectedOrderIdForRev(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-xs"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.customerName} ({o.productType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Uraian Catatan Revisi / Perubahan *</label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotesText}
                  onChange={(e) => setRevisionNotesText(e.target.value)}
                  placeholder="Contoh: Klien minta ubah deskripsi pekerjaan di PT ABC dan ganti warna template menjadi Classic Navy..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Catatan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
