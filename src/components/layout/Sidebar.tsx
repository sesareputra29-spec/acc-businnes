import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Workflow, 
  Users, 
  FileText, 
  Layers, 
  FileSpreadsheet, 
  Briefcase, 
  Mail, 
  FileCheck2, 
  Store, 
  History, 
  FolderDown, 
  BarChart3, 
  UserCheck, 
  Settings, 
  BookOpen,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import { UserRole } from '../../types';

export type NavTab = 
  | 'dashboard' 
  | 'pesanan' 
  | 'produksi' 
  | 'pelanggan' 
  | 'form-customer' 
  | 'templates' 
  | 'cv-builder' 
  | 'portfolio-builder' 
  | 'cover-letter' 
  | 'dokumen-lainnya' 
  | 'shopee' 
  | 'revisi' 
  | 'file-export' 
  | 'laporan' 
  | 'staff' 
  | 'pengaturan' 
  | 'panduan';

interface Props {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  currentRole: UserRole;
  pendingOrdersCount: number;
  revisionCount: number;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles?: UserRole[];
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  currentRole,
  pendingOrdersCount,
  revisionCount,
}) => {
  const navGroups: NavGroup[] = [
    {
      groupName: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pesanan', label: 'Pesanan', icon: ShoppingBag, badge: pendingOrdersCount },
        { id: 'produksi', label: 'Antrian Produksi', icon: Workflow },
        { id: 'pelanggan', label: 'Data Pelanggan', icon: Users },
        { id: 'form-customer', label: 'Portal Form Klien', icon: FileSpreadsheet },
      ],
    },
    {
      groupName: 'DOKUMEN & BUILDER',
      items: [
        { id: 'templates', label: 'Template Library', icon: Layers },
        { id: 'cv-builder', label: 'CV Builder', icon: FileText },
        { id: 'portfolio-builder', label: 'Portfolio Builder', icon: Briefcase },
        { id: 'cover-letter', label: 'Cover Letter', icon: Mail },
        { id: 'dokumen-lainnya', label: 'Dokumen Lainnya', icon: FileCheck2 },
      ],
    },
    {
      groupName: 'OPERASIONAL & MARKETPLACE',
      items: [
        { id: 'shopee', label: 'Integrasi Shopee', icon: Store },
        { id: 'revisi', label: 'Revisi & Versi', icon: History, badge: revisionCount },
        { id: 'file-export', label: 'File & Export', icon: FolderDown },
      ],
    },
    {
      groupName: 'MANAJEMEN & SISTEM',
      items: [
        { id: 'laporan', label: 'Laporan & Statistik', icon: BarChart3 },
        { id: 'staff', label: 'Manajemen Staff', icon: UserCheck, roles: ['Admin'] },
        { id: 'pengaturan', label: 'Pengaturan', icon: Settings, roles: ['Admin'] },
        { id: 'panduan', label: 'Panduan & SOP', icon: BookOpen },
      ],
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-900/30">
            A
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              ARISE CAREER
            </span>
            <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider block">
              Craft Engine v2
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpenMobile(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          aria-label="Tutup Menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(currentRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.groupName}
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        size={16}
                        className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-white text-indigo-700'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={14} className="opacity-70" />}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer / Role indicator */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-slate-800/50">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="text-[11px] truncate">
            <span className="text-slate-400 block text-[10px]">Akses Pengguna:</span>
            <span className="font-semibold text-slate-200">{currentRole} Mode</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen shrink-0 border-r border-slate-200 z-30 sticky top-0">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
