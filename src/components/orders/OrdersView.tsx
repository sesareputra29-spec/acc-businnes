import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowUpDown, 
  MoreHorizontal, 
  Store, 
  Calendar,
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';
import { Order, MarketplaceSource, ProductionStatus, DocumentTemplate } from '../../types';
import { formatRupiah, formatDate, getStatusBadgeClass, getPaymentBadgeClass } from '../../utils/formatters';

interface Props {
  orders: Order[];
  templates: DocumentTemplate[];
  onSelectOrder: (order: Order) => void;
  onOpenCreateOrder: () => void;
  onOpenCvBuilderWithOrder: (order: Order) => void;
}

export const OrdersView: React.FC<Props> = ({
  orders,
  templates,
  onSelectOrder,
  onOpenCreateOrder,
  onOpenCvBuilderWithOrder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarketplace, setFilterMarketplace] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'deadline'>('date-desc');

  // Filter and sort logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.marketplaceOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);

    const matchesMarketplace = filterMarketplace === 'all' || order.marketplace === filterMarketplace;
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesMarketplace && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    if (sortBy === 'date-asc') return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'deadline') return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
    return 0;
  });

  return (
    <div className="space-y-5">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Daftar Manajemen Pesanan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola transaksi masuk dari Shopee, Tokopedia, TikTok Shop, WhatsApp, dan Manual.
          </p>
        </div>

        <button
          onClick={onOpenCreateOrder}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Tambah Pesanan Baru</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID Pesanan (ORD-), nama klien, no. WhatsApp, resi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Marketplace Filter */}
          <select
            value={filterMarketplace}
            onChange={(e) => setFilterMarketplace(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Marketplace</option>
            <option value="Shopee">Shopee</option>
            <option value="Tokopedia">Tokopedia</option>
            <option value="TikTok Shop">TikTok Shop</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Manual">Manual</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Status Produksi</option>
            <option value="Menunggu Data">Menunggu Data</option>
            <option value="Data Masuk">Data Masuk</option>
            <option value="Validasi Data">Validasi Data</option>
            <option value="Menunggu Produksi">Menunggu Produksi</option>
            <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
            <option value="Preview">Preview</option>
            <option value="Revisi">Revisi</option>
            <option value="Finalisasi">Finalisasi</option>
            <option value="Selesai">Selesai</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="date-desc">Terbaru</option>
            <option value="date-asc">Terlama</option>
            <option value="deadline">Mendekati Deadline</option>
            <option value="price-desc">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">ID Pesanan</th>
                <th className="py-3 px-4 font-semibold">Klien & Kontak</th>
                <th className="py-3 px-4 font-semibold">Marketplace</th>
                <th className="py-3 px-4 font-semibold">Produk & Variasi</th>
                <th className="py-3 px-4 font-semibold">Harga & Bayar</th>
                <th className="py-3 px-4 font-semibold">Status Alur</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada pesanan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadgeClass(order.status);
                  const paymentBadge = getPaymentBadgeClass(order.paymentStatus);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectOrder(order)}
                    >
                      {/* ID Pesanan */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-700 block">{order.id}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatDate(order.orderDate)}</span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{order.customerPhone}</div>
                      </td>

                      {/* Marketplace */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 block">{order.marketplace}</span>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] block">
                          {order.marketplaceOrderId}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="font-medium text-slate-900 block truncate">{order.productType}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{order.variation}</span>
                      </td>

                      {/* Price & Payment */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{formatRupiah(order.price)}</div>
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 border ${paymentBadge.bg}`}>
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenCvBuilderWithOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Buka di CV Builder"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => onSelectOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Lihat Detail Pesanan"
                          >
                            <ChevronRight size={15} />
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

        {/* Footer info count */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Menampilkan {filteredOrders.length} dari {orders.length} total transaksi</span>
        </div>
      </div>
    </div>
  );
};
