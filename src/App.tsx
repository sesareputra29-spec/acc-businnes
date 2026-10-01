/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { OrdersView } from './components/orders/OrdersView';
import { ProductionQueueView } from './components/production/ProductionQueueView';
import { CustomersView } from './components/customers/CustomersView';
import { CustomerFormView } from './components/customerForm/CustomerFormView';
import { TemplateLibraryView } from './components/templates/TemplateLibraryView';
import { CvBuilderView } from './components/builders/CvBuilderView';
import { PortfolioBuilderView } from './components/builders/PortfolioBuilderView';
import { CoverLetterBuilderView } from './components/builders/CoverLetterBuilderView';
import { OtherDocsView } from './components/builders/OtherDocsView';
import { ShopeeView } from './components/shopee/ShopeeView';
import { RevisionsView } from './components/revisions/RevisionsView';
import { FileExportView } from './components/files/FileExportView';
import { ReportsView } from './components/reports/ReportsView';
import { StaffView } from './components/staff/StaffView';
import { SettingsView } from './components/settings/SettingsView';
import { GuideView } from './components/guide/GuideView';
import { CreateOrderModal } from './components/orders/CreateOrderModal';
import { OrderDetailDrawer } from './components/orders/OrderDetailDrawer';
import { StandaloneClientPortal } from './components/customerForm/StandaloneClientPortal';

import { Order, DocumentTemplate, StaffMember, ShopeeProduct, ShopeeSyncLog, UserRole, CustomerProfile } from './types';
import { storageService } from './services/storage';
import { PortalErrorBoundary } from './components/common/PortalErrorBoundary';

export default function App() {
  const parseClientOrderIdFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const formParam = params.get('client_form') || params.get('form') || params.get('orderId');
    if (formParam) return formParam.trim().replace(/\/+$/, '');

    const hash = window.location.hash;
    if (hash.includes('client_form=') || hash.includes('form=') || hash.includes('orderId=')) {
      const hashQuery = hash.includes('?') ? hash.split('?')[1] : hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(hashQuery);
      const val = hashParams.get('client_form') || hashParams.get('form') || hashParams.get('orderId');
      if (val) return val.trim().replace(/\/+$/, '');
    }

    const path = window.location.pathname;
    if (path.startsWith('/form-')) {
      return decodeURIComponent(path.replace('/form-', '')).trim().replace(/\/+$/, '');
    }
    if (path.startsWith('/form/')) {
      return decodeURIComponent(path.replace('/form/', '')).trim().replace(/\/+$/, '');
    }
    if (path.startsWith('/portal/')) {
      return decodeURIComponent(path.replace('/portal/', '')).trim().replace(/\/+$/, '');
    }

    return null;
  };

  // Check if URL specifies client form mode
  const [clientOrderId, setClientOrderId] = useState<string | null>(() => parseClientOrderIdFromUrl());

  useEffect(() => {
    const handleUrlChange = () => {
      const detected = parseClientOrderIdFromUrl();
      if (detected !== clientOrderId) {
        setClientOrderId(detected);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [clientOrderId]);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => storageService.getCurrentRole());

  // Data state
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [templates, setTemplates] = useState<DocumentTemplate[]>(() => storageService.getTemplates());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => storageService.getStaff());
  const [shopeeProducts, setShopeeProducts] = useState<ShopeeProduct[]>(() => storageService.getShopeeProducts());
  const [shopeeLogs, setShopeeLogs] = useState<ShopeeSyncLog[]>(() => storageService.getShopeeLogs());

  // Modals & Drawers
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [builderActiveOrder, setBuilderActiveOrder] = useState<Order | null>(null);
  const [preselectedCustomer, setPreselectedCustomer] = useState<CustomerProfile | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setOrders(storageService.getOrders());
      setTemplates(storageService.getTemplates());
      setStaffList(storageService.getStaff());
      setShopeeProducts(storageService.getShopeeProducts());
      setShopeeLogs(storageService.getShopeeLogs());
      setCurrentRole(storageService.getCurrentRole());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Update selected order in drawer if updated in storage
  useEffect(() => {
    if (selectedOrderDetail) {
      const updated = orders.find((o) => o.id === selectedOrderDetail.id);
      if (updated) setSelectedOrderDetail(updated);
    }
  }, [orders]);

  const handleRoleChange = (role: UserRole) => {
    storageService.setCurrentRole(role);
    setCurrentRole(role);
  };

  const handleOpenCvBuilderWithOrder = (order: Order, preferredTab?: NavTab) => {
    setBuilderActiveOrder(order);
    setSelectedOrderDetail(null);
    if (preferredTab) {
      setActiveTab(preferredTab);
      return;
    }
    // Intelligent builder routing based on product
    if (order.productType === 'Portfolio Profesional') {
      setActiveTab('portfolio-builder');
    } else if (order.productType === 'Cover Letter / Surat Lamaran') {
      setActiveTab('cover-letter');
    } else if (order.productType === 'Optimasi Profil LinkedIn') {
      setActiveTab('dokumen-lainnya');
    } else {
      setActiveTab('cv-builder');
    }
  };

  const handleOpenCustomerFormPortal = (order: Order) => {
    setBuilderActiveOrder(order);
    setSelectedOrderDetail(null);
    setActiveTab('form-customer');
  };

  const handleSelectTemplateForBuilder = (tpl: DocumentTemplate) => {
    if (builderActiveOrder) {
      const updated = { ...builderActiveOrder, templateId: tpl.id };
      storageService.updateOrder(updated);
      setBuilderActiveOrder(updated);
    }
    if (tpl.category === 'Portfolio') {
      setActiveTab('portfolio-builder');
      showToast(`Template "${tpl.name}" diterapkan ke Portfolio Builder.`);
    } else if (tpl.category === 'CoverLetter') {
      setActiveTab('cover-letter');
      showToast(`Template "${tpl.name}" diterapkan ke Cover Letter Generator.`);
    } else {
      setActiveTab('cv-builder');
      showToast(`Template "${tpl.name}" diterapkan ke CV Builder.`);
    }
  };

  // Badges calculations
  const pendingOrdersCount = orders.filter((o) => ['Menunggu Data', 'Data Masuk', 'Validasi Data'].includes(o.status)).length;
  const revisionCount = orders.filter((o) => o.status === 'Revisi').length;

  const getTabTitle = (tab: NavTab): string => {
    const titles: Record<NavTab, string> = {
      'dashboard': 'Dashboard Ringkasan Operasional',
      'pesanan': 'Manajemen Pesanan & Transaksi',
      'produksi': 'Antrian Produksi Desainer',
      'pelanggan': 'Basis Data Pelanggan',
      'form-customer': 'Portal Form Pengisian Data Klien',
      'templates': 'Template Library & Desain Dokumen',
      'cv-builder': 'CV Builder Engine',
      'portfolio-builder': 'Portfolio Project Showcase Builder',
      'cover-letter': 'Cover Letter / Surat Lamaran Generator',
      'dokumen-lainnya': 'Dokumen Tambahan & Optimasi LinkedIn',
      'shopee': 'Integrasi Marketplace Shopee Open API',
      'revisi': 'Pusat Manajemen Revisi Klien',
      'file-export': 'Pusat Berkas Dokumen & Ekspor PDF',
      'laporan': 'Laporan Bisnis & Statistik Omzet',
      'staff': 'Manajemen Tim & Desainer',
      'pengaturan': 'Pengaturan Sistem & Operasional',
      'panduan': 'Panduan Standar SOP & Kualitas ATS'
    };
    return titles[tab] || 'Arise Career Craft';
  };

  // If URL points to public standalone client portal
  if (clientOrderId) {
    return (
      <PortalErrorBoundary orderId={clientOrderId}>
        <div className="min-h-screen bg-slate-100">
          <StandaloneClientPortal
            orderId={clientOrderId}
            onExitStandalone={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('client_form');
              url.searchParams.delete('form');
              url.searchParams.delete('orderId');
              window.history.replaceState({}, '', url.pathname);
              setClientOrderId(null);
            }}
            onShowToast={showToast}
          />
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </PortalErrorBoundary>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
        currentRole={currentRole}
        pendingOrdersCount={pendingOrdersCount}
        revisionCount={revisionCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          currentRole={currentRole}
          onChangeRole={handleRoleChange}
          onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
          activeTabTitle={getTabTitle(activeTab)}
          onShowToast={showToast}
          onSelectOrderById={(orderId) => {
            const found = orders.find((o) => o.id === orderId);
            if (found) setSelectedOrderDetail(found);
          }}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {activeTab === 'dashboard' && (
              <DashboardView
                orders={orders}
                templates={templates}
                onSelectOrder={(order) => setSelectedOrderDetail(order)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              />
            )}

            {activeTab === 'pesanan' && (
              <OrdersView
                orders={orders}
                templates={templates}
                onSelectOrder={(order) => setSelectedOrderDetail(order)}
                onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
                onOpenCvBuilderWithOrder={handleOpenCvBuilderWithOrder}
              />
            )}

            {activeTab === 'produksi' && (
              <ProductionQueueView
                orders={orders}
                staffList={staffList}
                templates={templates}
                onSelectOrder={(order) => setSelectedOrderDetail(order)}
                onOpenCvBuilderWithOrder={handleOpenCvBuilderWithOrder}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'pelanggan' && (
              <CustomersView
                orders={orders}
                onSelectOrder={(order) => setSelectedOrderDetail(order)}
                onOpenCustomerFormPortal={handleOpenCustomerFormPortal}
                onOpenCreateOrderWithCustomer={(customer) => {
                  setPreselectedCustomer(customer);
                  setIsCreateOrderOpen(true);
                }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'form-customer' && (
              <CustomerFormView
                orders={orders}
                selectedOrderId={builderActiveOrder?.id}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'templates' && (
              <TemplateLibraryView
                templates={templates}
                onSelectTemplateForBuilder={handleSelectTemplateForBuilder}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'cv-builder' && (
              <CvBuilderView
                activeOrder={builderActiveOrder}
                allOrders={orders}
                templates={templates}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'portfolio-builder' && (
              <PortfolioBuilderView
                activeOrder={builderActiveOrder}
                allOrders={orders}
                templates={templates}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'cover-letter' && (
              <CoverLetterBuilderView
                activeOrder={builderActiveOrder}
                allOrders={orders}
                templates={templates}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'dokumen-lainnya' && (
              <OtherDocsView
                activeOrder={builderActiveOrder}
                allOrders={orders}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'shopee' && (
              <ShopeeView
                products={shopeeProducts}
                logs={shopeeLogs}
                templates={templates}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'revisi' && (
              <RevisionsView
                orders={orders}
                onSelectOrder={(order) => setSelectedOrderDetail(order)}
                onOpenCvBuilderWithOrder={handleOpenCvBuilderWithOrder}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'file-export' && (
              <FileExportView
                orders={orders}
                onOpenCvBuilderWithOrder={handleOpenCvBuilderWithOrder}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'laporan' && (
              <ReportsView
                orders={orders}
                templates={templates}
              />
            )}

            {activeTab === 'staff' && (
              <StaffView
                staffList={staffList}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'pengaturan' && (
              <SettingsView
                onShowToast={showToast}
              />
            )}

            {activeTab === 'panduan' && (
              <GuideView />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => {
          setIsCreateOrderOpen(false);
          setPreselectedCustomer(null);
        }}
        templates={templates}
        preselectedCustomer={preselectedCustomer}
        onOrderCreated={(newOrder) => {
          setSelectedOrderDetail(newOrder);
        }}
        onShowToast={showToast}
      />

      <OrderDetailDrawer
        order={selectedOrderDetail}
        onClose={() => setSelectedOrderDetail(null)}
        staffList={staffList}
        templates={templates}
        onOpenCvBuilderWithOrder={handleOpenCvBuilderWithOrder}
        onOpenCustomerFormPortal={handleOpenCustomerFormPortal}
        onShowToast={showToast}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
