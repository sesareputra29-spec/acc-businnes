import React, { useState } from 'react';
import { 
  Workflow, 
  Clock, 
  User, 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  Filter,
  Flame,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileSpreadsheet,
  Edit3,
  Save,
  X,
  Send,
  UserCheck,
  Building,
  Check
} from 'lucide-react';
import { Order, StaffMember, ProductionStatus, DocumentTemplate, ProductType } from '../../types';
import { formatDate, formatDateTime, getStatusBadgeClass, generateWhatsAppLink, WORKFLOW_STAGES } from '../../utils/formatters';
import { storageService } from '../../services/storage';

interface Props {
  orders: Order[];
  staffList: StaffMember[];
  templates?: DocumentTemplate[];
  onSelectOrder: (order: Order) => void;
  onOpenCvBuilderWithOrder: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const ProductionQueueView: React.FC<Props> = ({
  orders,
  staffList,
  templates = [],
  onSelectOrder,
  onOpenCvBuilderWithOrder,
  onShowToast
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Modals state
  const [notesModalOrder, setNotesModalOrder] = useState<Order | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [statusConfirmOrder, setStatusConfirmOrder] = useState<Order | null>(null);
  const [targetNextStatus, setTargetNextStatus] = useState<ProductionStatus>('Sedang Dikerjakan');
  const [statusChangeNote, setStatusChangeNote] = useState<string>('');

  // Active production stages
  const activeStages: ProductionStatus[] = [
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

  // Helper for deadline and overdue calculation
  const getDeadlineStatus = (deadlineDateStr: string, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        label: 'Tuntas',
        isOverdue: false,
        isUrgent: false,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }

    if (!deadlineDateStr) {
      return {
        label: 'Tanpa Deadline',
        isOverdue: false,
        isUrgent: false,
        badgeClass: 'bg-slate-50 text-slate-500 border-slate-200'
      };
    }

    const now = new Date().getTime();
    const deadline = new Date(deadlineDateStr).getTime();
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      const lateDays = Math.abs(Math.floor(diffHours / 24));
      const lateHours = Math.abs(Math.floor(diffHours % 24));
      const lateText = lateDays > 0 ? `${lateDays}h ${lateHours}j lalu` : `${lateHours} jam lalu`;
      return {
        label: `Terlambat (${lateText})`,
        isOverdue: true,
        isUrgent: true,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse'
      };
    }

    if (diffHours <= 12) {
      const remHours = Math.floor(diffHours);
      return {
        label: `Sisa ${remHours} jam`,
        isOverdue: false,
        isUrgent: true,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
      };
    }

    if (diffHours <= 24) {
      return {
        label: 'Sisa < 24 jam',
        isOverdue: false,
        isUrgent: false,
        badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200 font-medium'
      };
    }

    const remDays = Math.ceil(diffHours / 24);
    return {
      label: `Sisa ${remDays} hari`,
      isOverdue: false,
      isUrgent: false,
      badgeClass: 'bg-slate-50 text-slate-600 border-slate-200'
    };
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    // Search
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      (o.marketplaceOrderId && o.marketplaceOrderId.toLowerCase().includes(q));

    // Status
    const matchesStatus = selectedStatusFilter === 'all' || o.status === selectedStatusFilter;

    // Staff
    const matchesStaff =
      selectedStaffFilter === 'all' ||
      (selectedStaffFilter === 'unassigned' && !o.assignedStaffId) ||
      o.assignedStaffId === selectedStaffFilter;

    // Priority
    const matchesPriority = selectedPriorityFilter === 'all' || o.priority === selectedPriorityFilter;

    // Product
    const matchesProduct = selectedProductFilter === 'all' || o.productType === selectedProductFilter;

    // Template
    const matchesTemplate = selectedTemplateFilter === 'all' || o.templateId === selectedTemplateFilter;

    return matchesSearch && matchesStatus && matchesStaff && matchesPriority && matchesProduct && matchesTemplate;
  });

  // Summary Metrics
  const activeOrdersCount = orders.filter((o) => o.status !== 'Selesai').length;
  const waitingDataCount = orders.filter((o) => o.status === 'Menunggu Data').length;
  const inProductionCount = orders.filter((o) => ['Menunggu Produksi', 'Sedang Dikerjakan', 'Finalisasi'].includes(o.status)).length;
  const inRevisionCount = orders.filter((o) => o.status === 'Revisi').length;
  const overdueCount = orders.filter((o) => {
    if (o.status === 'Selesai') return false;
    const now = new Date().getTime();
    const deadline = new Date(o.deadlineDate).getTime();
    return deadline < now;
  }).length;

  // Handle Quick Advance or Status Modal
  const handleOpenStatusModal = (order: Order, nextStage?: ProductionStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIndex = WORKFLOW_STAGES.indexOf(order.status);
    const defaultNext = nextStage || (currentIndex < WORKFLOW_STAGES.length - 1 ? WORKFLOW_STAGES[currentIndex + 1] : order.status);
    setTargetNextStatus(defaultNext);
    setStatusConfirmOrder(order);
    setStatusChangeNote('');
  };

  const handleConfirmStatusChange = () => {
    if (!statusConfirmOrder) return;
    storageService.updateOrderStatus(statusConfirmOrder.id, targetNextStatus);
    
    // Save audit log note if provided
    if (statusChangeNote.trim()) {
      const currentNotes = statusConfirmOrder.internalNotes || '';
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const updatedNotes = `${currentNotes}\n[${timeStr}] Status diubah ke ${targetNextStatus}: ${statusChangeNote.trim()}`.trim();
      storageService.updateOrderNotes(statusConfirmOrder.id, updatedNotes);
    }

    onShowToast(`Pesanan ${statusConfirmOrder.id} dialihkan ke tahap "${targetNextStatus}".`);
    setStatusConfirmOrder(null);
  };

  // Staff Assignment
  const handleAssignStaff = (orderId: string, staffId: string, e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    storageService.assignStaff(orderId, staffId);
    const staff = staffList.find((s) => s.id === staffId);
    onShowToast(`Pesanan ${orderId} ditugaskan kepada ${staff?.name || 'Staff'}.`);
  };

  // Internal Notes Editor
  const handleOpenNotesModal = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotesModalOrder(order);
    setTempNotes(order.internalNotes || '');
  };

  const handleSaveNotes = () => {
    if (!notesModalOrder) return;
    storageService.updateOrderNotes(notesModalOrder.id, tempNotes);
    onShowToast(`Catatan produksi pesanan ${notesModalOrder.id} berhasil disimpan.`);
    setNotesModalOrder(null);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatusFilter('all');
    setSelectedPriorityFilter('all');
    setSelectedProductFilter('all');
    setSelectedTemplateFilter('all');
    setSelectedStaffFilter('all');
    onShowToast('Filter antrian produksi diatur ulang.');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatusFilter !== 'all' ||
    selectedPriorityFilter !== 'all' ||
    selectedProductFilter !== 'all' ||
    selectedTemplateFilter !== 'all' ||
    selectedStaffFilter !== 'all';

  // Get WhatsApp message link for quick follow-up
  const getWaQuickLink = (order: Order) => {
    const settings = storageService.getSettings();
    let message = '';
    if (order.status === 'Menunggu Data') {
      const formUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/form-${order.id}`;
      message = settings.waTemplateWelcome
        .replace('{nama}', order.customerName)
        .replace('{produk}', order.productType)
        .replace('{link_form}', formUrl);
    } else if (order.status === 'Preview' || order.status === 'Revisi') {
      const previewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/preview-${order.id}`;
      message = settings.waTemplatePreview
        .replace('{nama}', order.customerName)
        .replace('{produk}', order.productType)
        .replace('{link_preview}', previewUrl);
    } else if (order.status === 'Selesai') {
      const finalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/final-${order.id}`;
      message = settings.waTemplateFinal
        .replace('{nama}', order.customerName)
        .replace('{produk}', order.productType)
        .replace('{link_final}', finalUrl);
    } else {
      message = `Halo Kak ${order.customerName}, kami dari tim Arise Career Craft ingin mengabarkan bahwa pesanan ${order.productType} (${order.id}) saat ini berstatus "${order.status}".`;
    }
    return generateWhatsAppLink(order.customerPhone, message);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              Pusat Antrian Produksi Dokumen
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {activeOrdersCount} Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat kontrol pengerjaan desainer dari pesanan masuk, validasi data, pembuatan dokumen, draf preview, hingga finalisasi.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Workflow size={13} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>Tabel Rinci</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Antrian Aktif</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{activeOrdersCount}</div>
          <span className="text-[10px] text-slate-400">Total belum tuntas</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide block">Menunggu Data</span>
          <div className="text-xl font-bold text-amber-700 mt-0.5">{waitingDataCount}</div>
          <span className="text-[10px] text-slate-400">Butuh form klien</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide block">Sedang Dikerjakan</span>
          <div className="text-xl font-bold text-indigo-700 mt-0.5">{inProductionCount}</div>
          <span className="text-[10px] text-slate-400">Dalam desainer</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide block">Dalam Revisi</span>
          <div className="text-xl font-bold text-rose-700 mt-0.5">{inRevisionCount}</div>
          <span className="text-[10px] text-slate-400">Prioritas perbaikan</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide block">Terlambat / Overdue</span>
          <div className="text-xl font-bold text-rose-700 mt-0.5">{overdueCount}</div>
          <span className="text-[10px] text-slate-400">Melewati SLA</span>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Order ID, Nama Klien, No. WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status</option>
              {activeStages.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Prioritas</option>
              <option value="Urgent">🔥 Urgent</option>
              <option value="Tinggi">⚡ Tinggi</option>
              <option value="Normal">Normal</option>
              <option value="Rendah">Rendah</option>
            </select>

            {/* Product Filter */}
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Layanan</option>
              <option value="CV ATS-Friendly">CV ATS-Friendly</option>
              <option value="CV Kreatif / Desain">CV Kreatif</option>
              <option value="Paket Komplit (CV + Portfolio + CL)">Paket Komplit</option>
              <option value="Portfolio Profesional">Portfolio</option>
              <option value="Cover Letter / Surat Lamaran">Cover Letter</option>
              <option value="Optimasi Profil LinkedIn">LinkedIn</option>
              <option value="Executive Resume & Bio">Executive Bio</option>
            </select>

            {/* Template Filter */}
            <select
              value={selectedTemplateFilter}
              onChange={(e) => setSelectedTemplateFilter(e.target.value)}
              className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Staff Filter */}
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Desainer</option>
              <option value="unassigned">Belum Ditugaskan</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>

          {/* Reset button if filter active */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1 shrink-0"
              title="Reset semua filter"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[72vh]">
          {activeStages.map((stage) => {
            const stageOrders = filteredOrders.filter((o) => o.status === stage);
            const badge = getStatusBadgeClass(stage);

            return (
              <div
                key={stage}
                className="w-80 shrink-0 bg-slate-100/90 rounded-xl p-3 flex flex-col border border-slate-200 max-h-[82vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">{stage}</h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                    {stageOrders.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {stageOrders.length === 0 ? (
                    <div className="py-10 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-lg bg-white/40">
                      Tidak ada pesanan di tahap ini.
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const staff = staffList.find((s) => s.id === order.assignedStaffId);
                      const isUrgent = order.priority === 'Urgent';
                      const isHigh = order.priority === 'Tinggi';
                      const template = templates.find((t) => t.id === order.templateId);
                      const deadlineInfo = getDeadlineStatus(order.deadlineDate, order.status === 'Selesai');

                      return (
                        <div
                          key={order.id}
                          onClick={() => onSelectOrder(order)}
                          className={`bg-white rounded-lg p-3.5 border transition-all cursor-pointer shadow-xs hover:border-indigo-400 hover:shadow-md space-y-2.5 group ${
                            deadlineInfo.isOverdue
                              ? 'border-rose-400 ring-1 ring-rose-300 bg-rose-50/10'
                              : isUrgent
                              ? 'border-amber-400 ring-1 ring-amber-300 bg-amber-50/20'
                              : 'border-slate-200'
                          }`}
                        >
                          {/* Card Top: Order ID, Priority, Marketplace */}
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-mono text-xs font-bold text-indigo-700 group-hover:underline">
                              {order.id}
                            </span>
                            <div className="flex items-center gap-1">
                              {isUrgent ? (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Flame size={10} />
                                  <span>Urgent</span>
                                </span>
                              ) : isHigh ? (
                                <span className="text-[9px] font-bold text-orange-800 bg-orange-100 border border-orange-300 px-1.5 py-0.5 rounded">
                                  Tinggi
                                </span>
                              ) : null}
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {order.marketplace}
                              </span>
                            </div>
                          </div>

                          {/* Customer & Product */}
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs truncate">{order.customerName}</h4>
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">{order.productType}</p>
                            {template && (
                              <span className="text-[10px] text-indigo-600 font-medium block truncate mt-0.5">
                                📐 {template.name}
                              </span>
                            )}
                          </div>

                          {/* Deadline & SLA Indicator */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 truncate text-slate-500">
                              <Clock size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{formatDate(order.deadlineDate)}</span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${deadlineInfo.badgeClass}`}>
                              {deadlineInfo.label}
                            </span>
                          </div>

                          {/* Staff Assignment & Production Notes Shortcut */}
                          <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            {/* Staff Dropdown or Avatar */}
                            <div className="flex-1">
                              <select
                                value={order.assignedStaffId || ''}
                                onChange={(e) => handleAssignStaff(order.id, e.target.value, e)}
                                className="w-full text-[10px] py-1 px-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium"
                              >
                                <option value="">+ Tugaskan Desainer</option>
                                {staffList.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    👤 {s.name} ({s.role})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Internal Notes Icon Button */}
                            <button
                              onClick={(e) => handleOpenNotesModal(order, e)}
                              className={`p-1 rounded text-xs transition-colors shrink-0 ${
                                order.internalNotes
                                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                              }`}
                              title={order.internalNotes ? `Catatan: ${order.internalNotes}` : 'Tambah Catatan Produksi'}
                            >
                              <Edit3 size={13} />
                            </button>

                            {/* WhatsApp Follow up Link */}
                            <a
                              href={getWaQuickLink(order)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors shrink-0"
                              title="Kirim Pesan WhatsApp Otomatis"
                            >
                              <MessageSquare size={13} />
                            </a>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenCvBuilderWithOrder(order)}
                              className="flex-1 py-1 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition-colors"
                              title="Buka Dokumen di CV Builder"
                            >
                              <FileText size={11} />
                              <span>Builder</span>
                            </button>

                            {order.status !== 'Selesai' && (
                              <button
                                onClick={(e) => handleOpenStatusModal(order, undefined, e)}
                                className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded flex items-center gap-1 shadow-xs transition-colors shrink-0"
                                title="Majukan ke tahapan selanjutnya"
                              >
                                <span>Lanjut</span>
                                <ChevronRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID & Marketplace</th>
                  <th className="py-3 px-4">Klien & Kontak</th>
                  <th className="py-3 px-4">Layanan & Template</th>
                  <th className="py-3 px-4">Status Produksi</th>
                  <th className="py-3 px-4">Prioritas & SLA Deadline</th>
                  <th className="py-3 px-4">Desainer Bertugas</th>
                  <th className="py-3 px-4">Catatan Internal</th>
                  <th className="py-3 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <AlertCircle size={24} className="mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">Tidak ada pesanan yang sesuai filter.</p>
                        <p className="text-[11px] text-slate-400">Silakan ubah filter pencarian atau tekan tombol reset.</p>
                        {hasActiveFilters && (
                          <button
                            onClick={handleResetFilters}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const badge = getStatusBadgeClass(order.status);
                    const staff = staffList.find((s) => s.id === order.assignedStaffId);
                    const template = templates.find((t) => t.id === order.templateId);
                    const deadlineInfo = getDeadlineStatus(order.deadlineDate, order.status === 'Selesai');

                    return (
                      <tr
                        key={order.id}
                        onClick={() => onSelectOrder(order)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        {/* Order ID & Source */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-indigo-700 block">{order.id}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {order.marketplace} {order.marketplaceOrderId ? `(${order.marketplaceOrderId})` : ''}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{order.customerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{order.customerPhone}</div>
                        </td>

                        {/* Product & Template */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{order.productType}</div>
                          <div className="text-[10px] text-slate-400">{template ? template.name : 'Default Template'}</div>
                        </td>

                        {/* Status with Quick Advance Trigger */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenStatusModal(order, undefined, e)}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors hover:opacity-80 ${badge.bg} ${badge.text} ${badge.border}`}
                            title="Klik untuk mengubah tahapan status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{order.status}</span>
                            <ChevronRight size={11} className="opacity-60" />
                          </button>
                        </td>

                        {/* Priority & Deadline */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              order.priority === 'Urgent'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : order.priority === 'Tinggi'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {order.priority}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${deadlineInfo.badgeClass}`}>
                              {deadlineInfo.label}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            <span>{formatDate(order.deadlineDate)}</span>
                          </div>
                        </td>

                        {/* Staff Assignment */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.assignedStaffId || ''}
                            onChange={(e) => handleAssignStaff(order.id, e.target.value, e)}
                            className="text-xs py-1 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
                          >
                            <option value="">-- Belum Ditugaskan --</option>
                            {staffList.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.role})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Notes */}
                        <td className="py-3.5 px-4 max-w-[160px]" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenNotesModal(order, e)}
                            className="text-left w-full group"
                          >
                            {order.internalNotes ? (
                              <p className="text-[11px] text-slate-600 line-clamp-2 italic group-hover:text-indigo-600">
                                "{order.internalNotes}"
                              </p>
                            ) : (
                              <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 flex items-center gap-1">
                                <Edit3 size={11} /> + Catatan
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={getWaQuickLink(order)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Chat WhatsApp Klien"
                            >
                              <MessageSquare size={14} />
                            </a>
                            <button
                              onClick={() => onOpenCvBuilderWithOrder(order)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Buka Dokumen di CV Builder"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              onClick={() => onSelectOrder(order)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Buka Drawer Detail Pesanan"
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
      )}

      {/* MODAL 1: STATUS CHANGE CONFIRMATION */}
      {statusConfirmOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Workflow size={16} className="text-indigo-600" />
                  <span>Ubah Tahapan Status Produksi</span>
                </h3>
                <span className="text-slate-400 font-mono text-[11px]">{statusConfirmOrder.id} · {statusConfirmOrder.customerName}</span>
              </div>
              <button
                onClick={() => setStatusConfirmOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Tahapan Status Baru *</label>
                <select
                  value={targetNextStatus}
                  onChange={(e) => setTargetNextStatus(e.target.value as ProductionStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  {WORKFLOW_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage} {stage === statusConfirmOrder.status ? '(Status Saat Ini)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Perubahan Alur (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Draf pertama sudah diselesaikan, siap kirim preview..."
                  value={statusChangeNote}
                  onChange={(e) => setStatusChangeNote(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 space-y-1">
                <span className="font-bold block">💡 Notifikasi WhatsApp Klien</span>
                <p className="text-[11px] text-indigo-800">
                  Setelah mengubah status, Anda dapat langsung mengklik ikon WhatsApp untuk mengirimkan draf formulir / draf preview / berkas final secara otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setStatusConfirmOrder(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERNAL PRODUCTION NOTES */}
      {notesModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Edit3 size={16} className="text-amber-600" />
                  <span>Catatan Khusus Produksi</span>
                </h3>
                <span className="text-slate-400 font-mono text-[11px]">
                  {notesModalOrder.id} · {notesModalOrder.customerName}
                </span>
              </div>
              <button
                onClick={() => setNotesModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">
                Catatan Internal Desainer & Operator
              </label>
              <textarea
                rows={5}
                placeholder="Tuliskan catatan preferensi klien, instruksi desain, font, layout, atau poin revisi..."
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <p className="text-[10px] text-slate-400">
                Catatan ini hanya terlihat oleh tim internal dan tersimpan pada data pesanan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setNotesModalOrder(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Simpan Catatan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
