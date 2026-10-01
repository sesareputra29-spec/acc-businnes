import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Store, AlertCircle, User, Users } from 'lucide-react';
import { 
  Order, 
  MarketplaceSource, 
  ProductType, 
  PaymentStatus, 
  DocumentTemplate,
  CustomerData,
  CustomerProfile
} from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  templates: DocumentTemplate[];
  preselectedCustomer?: CustomerProfile | null;
  onOrderCreated: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const CreateOrderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  templates,
  preselectedCustomer,
  onOrderCreated,
  onShowToast
}) => {
  if (!isOpen) return null;

  const existingCustomers = storageService.getCustomers();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomer?.id || '');
  const [marketplace, setMarketplace] = useState<MarketplaceSource>('Shopee');
  const [marketplaceOrderId, setMarketplaceOrderId] = useState('');
  const [customerName, setCustomerName] = useState(preselectedCustomer?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(preselectedCustomer?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(preselectedCustomer?.email || '');
  const [productType, setProductType] = useState<ProductType>('CV ATS-Friendly');
  const [variation, setVariation] = useState('Bahasa Indonesia (Standar)');
  const [price, setPrice] = useState(49000);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [priority, setPriority] = useState<'Normal' | 'Tinggi' | 'Urgent'>('Normal');
  const [templateId, setTemplateId] = useState(templates[0]?.id || 'TMP-ATS-01');
  const [internalNotes, setInternalNotes] = useState('');

  // Handle existing customer selection
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      return;
    }
    const found = existingCustomers.find((c) => c.id === customerId);
    if (found) {
      setCustomerName(found.fullName);
      setCustomerPhone(found.phone);
      setCustomerEmail(found.email);
      onShowToast(`Data profil pelanggan "${found.fullName}" diterapkan.`);
    }
  };

  const handleProductChange = (newProduct: ProductType) => {
    setProductType(newProduct);
    // Auto preset price
    switch (newProduct) {
      case 'CV ATS-Friendly':
        setPrice(49000);
        setVariation('Bahasa Indonesia (Standar)');
        break;
      case 'CV Kreatif / Desain':
        setPrice(79000);
        setVariation('Bahasa Indonesia (Visual Color)');
        break;
      case 'Paket Komplit (CV + Portfolio + CL)':
        setPrice(189000);
        setVariation('Bahasa Indonesia & English (Dual)');
        break;
      case 'Portfolio Profesional':
        setPrice(129000);
        setVariation('PDF Project Showcase');
        break;
      case 'Cover Letter / Surat Lamaran':
        setPrice(39000);
        setVariation('Bahasa Indonesia Formal');
        break;
      case 'Executive Resume & Bio':
        setPrice(249000);
        setVariation('Executive 2 Halaman');
        break;
      default:
        setPrice(49000);
    }

    // Recommend matching template
    const matchingTemplate = templates.find((t) => {
      if (newProduct === 'Portfolio Profesional') return t.category === 'Portfolio';
      if (newProduct === 'Cover Letter / Surat Lamaran') return t.category === 'CoverLetter';
      if (newProduct === 'CV ATS-Friendly') return t.isAtsCompliant;
      if (newProduct === 'CV Kreatif / Desain') return t.category === 'Creative' || t.category === 'Modern';
      return true;
    });

    if (matchingTemplate) {
      setTemplateId(matchingTemplate.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      onShowToast('Nama pelanggan wajib diisi!');
      return;
    }

    const settings = storageService.getSettings();
    const nextId = storageService.generateNextOrderId();

    // If an existing customer was chosen, inherit customer data
    const existingCust = selectedCustomerId 
      ? existingCustomers.find((c) => c.id === selectedCustomerId) 
      : existingCustomers.find((c) => c.phone === customerPhone || c.email === customerEmail);

    const initialCustomerData: CustomerData = existingCust?.customerData ? {
      ...existingCust.customerData,
      id: `CUST-${nextId}`,
      fullName: customerName,
      email: customerEmail,
      phone: customerPhone,
      lastUpdated: new Date().toISOString()
    } : {
      id: `CUST-${Date.now().toString().slice(-5)}`,
      fullName: customerName,
      professionalTitle: '',
      email: customerEmail,
      phone: customerPhone,
      city: '',
      country: 'Indonesia',
      summary: '',
      educations: [],
      experiences: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      socialLinks: [],
      lastUpdated: new Date().toISOString()
    };

    const newOrder: Order = {
      id: nextId,
      marketplace,
      marketplaceOrderId: marketplaceOrderId || `MANUAL-${Date.now().toString().slice(-6)}`,
      customerName,
      customerPhone,
      customerEmail,
      productType,
      variation,
      price: Number(price),
      orderDate: new Date().toISOString(),
      deadlineDate: new Date(Date.now() + settings.defaultDeadlineHours * 3600 * 1000).toISOString(),
      paymentStatus,
      status: 'Menunggu Data',
      priority,
      templateId,
      customerData: initialCustomerData,
      customerFormSlug: `form-${nextId.toLowerCase()}`,
      revisions: [],
      files: [],
      internalNotes
    };

    storageService.addOrder(newOrder);
    onOrderCreated(newOrder);
    onShowToast(`Pesanan ${newOrder.id} berhasil dibuat dan terhubung ke antrian!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Buat Pesanan Manual / Marketplace</h2>
            <p className="text-xs text-slate-500">Input transaksi baru ke dalam sistem antrian Arise Career Craft</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Marketplace & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sumber Channel Marketplace</label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value as MarketplaceSource)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Shopee">Shopee</option>
                <option value="Tokopedia">Tokopedia</option>
                <option value="TikTok Shop">TikTok Shop</option>
                <option value="WhatsApp">WhatsApp / Direct</option>
                <option value="Manual">Manual / Offline</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ID Pesanan Marketplace (No. Resi/Invoice)</label>
              <input
                type="text"
                value={marketplaceOrderId}
                onChange={(e) => setMarketplaceOrderId(e.target.value)}
                placeholder="Contoh: 24051887KJ92X1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Informasi Pelanggan</h4>
              <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                <Users size={12} />
                <span>Master Data Pelanggan</span>
              </span>
            </div>

            {/* Quick Customer Picker Dropdown */}
            {existingCustomers.length > 0 && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Pilih dari Pelanggan Terdaftar (Opsional untuk Repeat Order):
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Input Pelanggan Baru Secara Manual --</option>
                  {existingCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone || c.email || 'Tanpa Kontak'}) - {c.city || 'Indonesia'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama klien"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Product & Variation */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-3">Layanan & Template</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Produk</label>
                <select
                  value={productType}
                  onChange={(e) => handleProductChange(e.target.value as ProductType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CV ATS-Friendly">CV ATS-Friendly</option>
                  <option value="CV Kreatif / Desain">CV Kreatif / Desain</option>
                  <option value="Paket Komplit (CV + Portfolio + CL)">Paket Komplit (CV + Portfolio + CL)</option>
                  <option value="Portfolio Profesional">Portfolio Profesional</option>
                  <option value="Cover Letter / Surat Lamaran">Cover Letter / Surat Lamaran</option>
                  <option value="Optimasi Profil LinkedIn">Optimasi Profil LinkedIn</option>
                  <option value="Executive Resume & Bio">Executive Resume & Bio</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Variasi / Bahasa</label>
                <input
                  type="text"
                  value={variation}
                  onChange={(e) => setVariation(e.target.value)}
                  placeholder="e.g. Bahasa Indonesia"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Lunas">Lunas</option>
                  <option value="DP (50%)">DP (50%)</option>
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prioritas</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block font-semibold text-slate-700 mb-1">Pilihan Template Awal</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block font-semibold text-slate-700 mb-1">Catatan Internal Operator</label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Catatan khusus dari klien atau instruksi untuk desainer..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
            >
              Simpan & Terbitkan Pesanan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
