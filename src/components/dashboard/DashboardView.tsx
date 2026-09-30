import React from 'react';
import { 
  ShoppingBag, 
  Clock, 
  Workflow, 
  RotateCcw, 
  CheckCircle2, 
  Users, 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  Store,
  ChevronRight,
  ExternalLink,
  Plus,
  Flame,
  MessageSquare
} from 'lucide-react';
import { Order, DocumentTemplate, ProductionStatus } from '../../types';
import { formatRupiah, formatDate, formatDateTime, getStatusBadgeClass, generateWhatsAppLink } from '../../utils/formatters';
import { storageService } from '../../services/storage';

interface Props {
  orders: Order[];
  templates: DocumentTemplate[];
  onSelectOrder: (order: Order) => void;
  onNavigateTab: (tab: any) => void;
  onOpenCreateOrder: () => void;
}

export const DashboardView: React.FC<Props> = ({
  orders,
  templates,
  onSelectOrder,
  onNavigateTab,
  onOpenCreateOrder
}) => {
  // Real calculations
  const totalOrders = orders.length;
  const waitingData = orders.filter((o) => o.status === 'Menunggu Data').length;
  const inProduction = orders.filter((o) => 
    ['Data Masuk', 'Validasi Data', 'Menunggu Produksi', 'Sedang Dikerjakan'].includes(o.status)
  ).length;
  const inRevision = orders.filter((o) => o.status === 'Revisi').length;
  const completed = orders.filter((o) => o.status === 'Selesai').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.price, 0);

  // Today orders
  const todayStr = new Date().toISOString().split('T')[0];
  const ordersToday = orders.filter((o) => o.orderDate.startsWith(todayStr)).length;

  // Customers
  const customers = storageService.getCustomers();
  const totalCustomers = customers.length || new Set(orders.map((o) => o.customerPhone || o.customerName)).size;

  // Recent 5 orders
  const recentOrders = [...orders].slice(0, 5);

  // Active production queue
  const productionQueue = orders.filter((o) => 
    ['Menunggu Produksi', 'Sedang Dikerjakan', 'Preview', 'Revisi'].includes(o.status)
  ).slice(0, 5);

  // Real Template usage counts from orders
  const templateUsageMap = orders.reduce((acc, o) => {
    const tId = o.templateId || 'TMP-ATS-01';
    acc[tId] = (acc[tId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort templates by real usage
  const topTemplates = [...templates].sort((a, b) => {
    const usageA = (templateUsageMap[a.id] || 0) + a.usageCount;
    const usageB = (templateUsageMap[b.id] || 0) + b.usageCount;
    return usageB - usageA;
  }).slice(0, 4);

  // Workflow distribution
  const allStages: ProductionStatus[] = [
    'Menunggu Data',
    'Data Masuk',
    'Validasi Data',
    'Menunggu Produksi',
    'Sedang Dikerjakan',
    'Preview',
    'Revisi',
    'Finalisasi',
    'Selesai'
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Ringkasan Operasional Jasa Karir
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring pesanan marketplace, jalur produksi dokumen, kepuasan klien, dan omzet real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('produksi')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
          >
            Antrian Produksi
          </button>
          <button
            onClick={onOpenCreateOrder}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Tambah Pesanan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Real Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Pesanan Hari Ini</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{ordersToday}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Real-time sync</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-amber-600 uppercase tracking-wide">Menunggu Data</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{waitingData}</div>
          <div className="text-[10px] text-slate-500 mt-1">Perlu kirim form WA</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-indigo-600 uppercase tracking-wide">Sedang Produksi</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{inProduction}</div>
          <div className="text-[10px] text-slate-500 mt-1">Dalam pengerjaan desainer</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-rose-600 uppercase tracking-wide">Dalam Revisi</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{inRevision}</div>
          <div className="text-[10px] text-slate-500 mt-1">Prioritas revisi klien</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide">Selesai</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{completed}</div>
          <div className="text-[10px] text-slate-500 mt-1">File final terkirim</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Omzet</div>
          <div className="text-lg font-bold text-slate-900 mt-1 truncate">{formatRupiah(totalRevenue)}</div>
          <div className="text-[10px] text-slate-500 mt-1">{totalOrders} pesanan ({totalCustomers} klien)</div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Production Snippet & Recent Orders (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Production Queue Snippet */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Antrian Pengerjaan Desainer Aktif</h2>
                <p className="text-xs text-slate-500">Pesanan yang sedang dikerjakan dan butuh tindakan segera</p>
              </div>
              <button
                onClick={() => onNavigateTab('produksi')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Lihat Kanban</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-2.5">
              {productionQueue.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada pesanan yang sedang aktif di antrian produksi.
                </div>
              ) : (
                productionQueue.map((order) => {
                  const badge = getStatusBadgeClass(order.status);
                  const isUrgent = order.priority === 'Urgent';

                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-lg border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-700">{order.id}</span>
                            <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {order.customerName}
                            </span>
                            {isUrgent && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Flame size={10} />
                                <span>Urgent</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{order.productType}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {order.status}
                        </span>
                        <div className="text-right text-[11px] text-slate-500 hidden sm:block">
                          <span className="font-medium text-slate-700 block">{formatDate(order.deadlineDate)}</span>
                          <span className="text-[10px] text-slate-400">{order.marketplace}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Pesanan Masuk Terbaru</h2>
                <p className="text-xs text-slate-500">Daftar transaksi terakhir dari seluruh saluran penjualan</p>
              </div>
              <button
                onClick={() => onNavigateTab('pesanan')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Semua Pesanan</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Klien</th>
                    <th className="py-2.5 px-4">Layanan</th>
                    <th className="py-2.5 px-4">Biaya</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => {
                    const badge = getStatusBadgeClass(order.status);
                    return (
                      <tr
                        key={order.id}
                        onClick={() => onSelectOrder(order)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{order.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{order.customerName}</td>
                        <td className="py-3 px-4 text-slate-600">{order.productType}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{formatRupiah(order.price)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Template Popularity & Status Breakdown (1 col) */}
        <div className="space-y-6">
          {/* Order Status Distribution Overview */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Distribusi Alur Produksi</h2>
            <div className="space-y-2">
              {allStages.map((stage) => {
                const count = orders.filter((o) => o.status === stage).length;
                const percentage = Math.round((count / (orders.length || 1)) * 100);
                const badge = getStatusBadgeClass(stage);

                return (
                  <div key={stage} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{stage}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{count} order ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${badge.dot}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Template Usage Statistics */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Popularitas Template Dokumen</h2>
                <p className="text-xs text-slate-500">Format yang paling sering dipilih klien</p>
              </div>
              <button
                onClick={() => onNavigateTab('templates')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Galeri
              </button>
            </div>

            <div className="space-y-3">
              {topTemplates.map((tpl) => {
                const totalUsed = (templateUsageMap[tpl.id] || 0) + tpl.usageCount;
                return (
                  <div key={tpl.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-slate-200 overflow-hidden shrink-0">
                        <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{tpl.name}</h4>
                        <span className="text-[10px] text-slate-500">{tpl.category} · {tpl.layout}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 shrink-0 font-mono">
                      {totalUsed}x
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Customer CRM Snippet */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Klien Terbaru</h2>
                <p className="text-xs text-slate-500">Database profil terdaftar</p>
              </div>
              <button
                onClick={() => onNavigateTab('pelanggan')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                CRM
              </button>
            </div>

            <div className="space-y-2">
              {customers.slice(0, 3).map((c) => (
                <div key={c.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{c.fullName}</span>
                    <span className="text-[10px] text-slate-500">{c.customerData?.professionalTitle || c.email}</span>
                  </div>
                  <a
                    href={generateWhatsAppLink(c.phone, `Halo ${c.fullName}, kami dari tim Arise Career Craft...`)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="Chat WhatsApp"
                  >
                    <MessageSquare size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
