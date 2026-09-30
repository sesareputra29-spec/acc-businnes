import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Plus, 
  RefreshCw, 
  User, 
  Bell, 
  CheckCircle2, 
  ExternalLink,
  Unlock,
  MessageSquare,
  FileText,
  Check,
  Clock,
  Inbox
} from 'lucide-react';
import { UserRole, AppNotification } from '../../types';
import { shopeeService } from '../../services/shopeeService';
import { storageService } from '../../services/storage';
import { formatDateTime } from '../../utils/formatters';

interface Props {
  onOpenMobileSidebar: () => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenCreateOrder: () => void;
  activeTabTitle: string;
  onGlobalSearch?: (query: string) => void;
  onShowToast: (msg: string) => void;
  onSelectOrderById?: (orderId: string) => void;
}

export const Topbar: React.FC<Props> = ({
  onOpenMobileSidebar,
  currentRole,
  onChangeRole,
  onOpenCreateOrder,
  activeTabTitle,
  onShowToast,
  onSelectOrderById
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => storageService.getNotifications());

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setNotifications(storageService.getNotifications());
    });
    return () => { unsub(); };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSyncShopee = async () => {
    setIsSyncing(true);
    try {
      const res = await shopeeService.syncShopeeOrders();
      onShowToast(`Sinkronisasi Shopee sukses: ${res.syncedCount} pesanan baru diperbarui!`);
    } catch {
      onShowToast('Gagal sinkronisasi data Shopee.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApproveEditFromNotif = (notif: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.approveFormEdit(notif.orderId);
    storageService.markNotificationAsRead(notif.id);
    onShowToast(`✓ Izin perubahan data pesanan ${notif.orderId} disetujui! Formulir klien otomatis terbuka.`);
  };

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsAsRead();
    onShowToast('Semua notifikasi ditandai telah dibaca.');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {activeTabTitle}
          </h2>
        </div>
      </div>

      {/* Right side: Notifications, Actions, Sync, Role Switcher */}
      <div className="flex items-center gap-2 lg:gap-3.5">
        {/* Shopee quick sync button */}
        <button
          onClick={handleSyncShopee}
          disabled={isSyncing}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          title="Sinkronkan data pesanan dari Shopee API"
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin text-orange-600' : 'text-slate-500'} />
          <span>{isSyncing ? 'Sinkronisasi...' : 'Sync Shopee'}</span>
        </button>

        {/* NOTIFICATION BELL DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifikasi Masuk (Klien Submit & Permintaan Edit)"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Pusat Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <Inbox size={24} className="mx-auto text-slate-300" />
                    <p className="text-xs">Belum ada notifikasi baru.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isFormSubmit = notif.type === 'form_submitted';
                    const isEditReq = notif.type === 'edit_requested';
                    const isApproved = notif.type === 'edit_approved';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          storageService.markNotificationAsRead(notif.id);
                          if (onSelectOrderById) onSelectOrderById(notif.orderId);
                          setShowNotificationMenu(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors space-y-1.5 ${
                          !notif.isRead ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-bold text-xs flex items-center gap-1.5 ${
                            isEditReq ? 'text-amber-800' : isFormSubmit ? 'text-emerald-800' : 'text-indigo-800'
                          }`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              isEditReq ? 'bg-amber-500 animate-pulse' : isFormSubmit ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`} />
                            <span>{notif.title}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatDateTime(notif.timestamp)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Quick action button for Edit Requests */}
                        {isEditReq && (
                          <div className="pt-1 flex items-center gap-2">
                            <button
                              onClick={(e) => handleApproveEditFromNotif(notif, e)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-xs flex items-center gap-1"
                            >
                              <Unlock size={11} />
                              <span>Setujui & Buka Form Klien</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Order Button */}
        <button
          onClick={onOpenCreateOrder}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg shadow-sm transition-all"
        >
          <Plus size={14} />
          <span>Pesanan Baru</span>
        </button>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
              {currentRole[0]}
            </div>
            <span className="hidden md:inline font-semibold text-slate-700">{currentRole}</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 font-bold text-[10px] uppercase text-slate-400 border-b border-slate-100">
                Ganti Mode Akses
              </div>
              {(['Admin', 'Operator', 'Designer'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onChangeRole(role);
                    setShowRoleMenu(false);
                    onShowToast(`Beralih ke hak akses ${role}`);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                    currentRole === role ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{role}</span>
                  {currentRole === role && <CheckCircle2 size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
