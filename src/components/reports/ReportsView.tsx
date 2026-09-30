import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  Users, 
  Store, 
  Layers, 
  ArrowUpRight,
  CheckCircle2,
  Download,
  Calendar,
  Filter,
  UserCheck,
  Flame,
  Award
} from 'lucide-react';
import { Order, DocumentTemplate, StaffMember } from '../../types';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { storageService } from '../../services/storage';

interface Props {
  orders: Order[];
  templates: DocumentTemplate[];
}

export const ReportsView: React.FC<Props> = ({ orders, templates }) => {
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '7days'>('all');
  const staffList: StaffMember[] = storageService.getStaff();

  // Filter orders by date range
  const now = Date.now();
  const filteredOrders = orders.filter((o) => {
    if (dateFilter === '7days') {
      return (now - new Date(o.orderDate).getTime()) <= 7 * 24 * 3600 * 1000;
    }
    if (dateFilter === '30days') {
      return (now - new Date(o.orderDate).getTime()) <= 30 * 24 * 3600 * 1000;
    }
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.price, 0);
  const completedOrders = filteredOrders.filter((o) => o.status === 'Selesai').length;
  const inProgressOrders = filteredOrders.filter((o) => ['Sedang Dikerjakan', 'Preview', 'Revisi', 'Finalisasi'].includes(o.status)).length;
  const completionRate = Math.round((completedOrders / (filteredOrders.length || 1)) * 100);
  const avgOrderValue = Math.round(totalRevenue / (filteredOrders.length || 1));

  // Marketplace distribution
  const marketplaceCounts = filteredOrders.reduce((acc, o) => {
    acc[o.marketplace] = (acc[o.marketplace] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Product revenue & count
  const productStats = filteredOrders.reduce((acc, o) => {
    if (!acc[o.productType]) {
      acc[o.productType] = { count: 0, revenue: 0 };
    }
    acc[o.productType].count += 1;
    acc[o.productType].revenue += o.price;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  // Staff productivity stats
  const staffStats = staffList.map((s) => {
    const assigned = filteredOrders.filter((o) => o.assignedStaffId === s.id);
    const finished = assigned.filter((o) => o.status === 'Selesai').length;
    const active = assigned.filter((o) => o.status !== 'Selesai').length;
    return {
      staff: s,
      assignedCount: assigned.length,
      finishedCount: finished,
      activeCount: active
    };
  });

  // Export CSV Report
  const handleExportCsv = () => {
    const headers = ['Order ID', 'Tanggal', 'Klien', 'Telepon', 'Layanan', 'Marketplace', 'Harga', 'Status', 'Prioritas'];
    const rows = filteredOrders.map((o) => [
      o.id,
      formatDate(o.orderDate),
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.productType}"`,
      o.marketplace,
      o.price,
      o.status,
      o.priority
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Penjualan_AriseCareerCraft_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Laporan Kinerja Bisnis & Analisis Data
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis metrik pendapatan, volume penjualan per layanan, performa desainer, dan efisiensi produksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-xs"
          >
            <option value="all">Semua Periode Transaksi</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="7days">7 Hari Terakhir</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Pendapatan (Omzet)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatRupiah(totalRevenue)}</div>
          <p className="text-[10px] text-emerald-600 font-medium mt-1">Dari {filteredOrders.length} transaksi terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tingkat Penyelesaian (SLA)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{completionRate}%</div>
          <p className="text-[10px] text-slate-500 mt-1">{completedOrders} selesai · {inProgressOrders} sedang berjalan</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Rata-rata Nilai Order (AOV)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatRupiah(avgOrderValue)}</div>
          <p className="text-[10px] text-slate-500 mt-1">Rata-rata pengeluaran per pesanan</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Desainer Aktif</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{staffList.length} Staff</div>
          <p className="text-[10px] text-indigo-600 font-medium mt-1">Tim produksi & operator</p>
        </div>
      </div>

      {/* Grid: 2 Columns Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplace Source Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Distribusi Saluran Penjualan (Marketplace)</h3>
            <span className="text-xs text-slate-400 font-medium">{filteredOrders.length} Total</span>
          </div>

          <div className="space-y-3">
            {Object.entries(marketplaceCounts).map(([channel, count]) => {
              const percentage = Math.round((count / (filteredOrders.length || 1)) * 100);
              return (
                <div key={channel} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800">{channel}</span>
                    <span className="text-slate-600 font-mono">{count} Pesanan ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue & Volume by Product */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Performa & Omzet per Jenis Layanan</h3>
            <span className="text-xs text-emerald-600 font-semibold">{formatRupiah(totalRevenue)}</span>
          </div>

          <div className="space-y-3">
            {Object.entries(productStats).map(([prod, stat]) => {
              const percentage = Math.round((stat.revenue / (totalRevenue || 1)) * 100);
              return (
                <div key={prod} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800 truncate max-w-[200px]">{prod}</span>
                    <span className="text-slate-600 font-mono">{formatRupiah(stat.revenue)} ({stat.count} unit)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff & Designer Productivity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Produktivitas & Beban Kerja Tim Desainer</h3>
          <p className="text-xs text-slate-500">Jumlah pengerjaan dokumen yang diselesaikan dan sedang aktif per staff</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Desainer</th>
                <th className="py-3 px-4">Peran / Role</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Tugas Aktif</th>
                <th className="py-3 px-4">Tuntas Dikerjakan</th>
                <th className="py-3 px-4">Status Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffStats.map(({ staff, activeCount, finishedCount }) => (
                <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <img src={staff.avatar} alt={staff.name} className="w-6 h-6 rounded-full object-cover" />
                    <span>{staff.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{staff.role}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{staff.phone}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {activeCount} pesanan
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {finishedCount + staff.completedOrdersCount} tuntas
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {staff.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
