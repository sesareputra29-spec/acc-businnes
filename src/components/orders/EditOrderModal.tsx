import React, { useState } from 'react';
import { X, Save, ShoppingBag, Store, AlertCircle } from 'lucide-react';
import { 
  Order, 
  MarketplaceSource, 
  ProductType, 
  PaymentStatus, 
  DocumentTemplate 
} from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  isOpen: boolean;
  order: Order | null;
  templates: DocumentTemplate[];
  onClose: () => void;
  onSaved: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const EditOrderModal: React.FC<Props> = ({
  isOpen,
  order,
  templates,
  onClose,
  onSaved,
  onShowToast
}) => {
  if (!isOpen || !order) return null;

  const [marketplace, setMarketplace] = useState<MarketplaceSource>(order.marketplace);
  const [marketplaceOrderId, setMarketplaceOrderId] = useState(order.marketplaceOrderId || '');
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [customerEmail, setCustomerEmail] = useState(order.customerEmail);
  const [productType, setProductType] = useState<ProductType>(order.productType);
  const [variation, setVariation] = useState(order.variation);
  const [price, setPrice] = useState(order.price);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [priority, setPriority] = useState(order.priority);
  const [templateId, setTemplateId] = useState(order.templateId);
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      onShowToast('Nama pelanggan wajib diisi.');
      return;
    }

    const updatedOrder: Order = {
      ...order,
      marketplace,
      marketplaceOrderId,
      customerName,
      customerPhone,
      customerEmail,
      productType,
      variation,
      price: Number(price),
      paymentStatus,
      priority,
      templateId,
      internalNotes,
      customerData: {
        ...order.customerData,
        fullName: customerName,
        phone: customerPhone,
        email: customerEmail
      }
    };

    storageService.updateOrder(updatedOrder);
    onSaved(updatedOrder);
    onShowToast(`Pesanan ${order.id} berhasil diperbarui.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Edit Pesanan</h2>
              <span className="font-mono text-xs font-bold text-indigo-700">({order.id})</span>
            </div>
            <p className="text-xs text-slate-500">Perbarui informasi transaksi, produk, pembayaran, dan catatan</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Marketplace & Channel ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Marketplace / Channel</label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value as MarketplaceSource)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Shopee">Shopee</option>
                <option value="Tokopedia">Tokopedia</option>
                <option value="TikTok Shop">TikTok Shop</option>
                <option value="WhatsApp">WhatsApp / Direct</option>
                <option value="Manual">Manual / Offline</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ID Pesanan Marketplace (Resi/Invoice)</label>
              <input
                type="text"
                value={marketplaceOrderId}
                onChange={(e) => setMarketplaceOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-3">Informasi Pelanggan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Product & Pricing */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-3">Layanan & Keuangan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Produk</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as ProductType)}
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
                <label className="block font-semibold text-slate-700 mb-1">Variasi</label>
                <input
                  type="text"
                  value={variation}
                  onChange={(e) => setVariation(e.target.value)}
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
              <label className="block font-semibold text-slate-700 mb-1">Pilihan Template</label>
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

          {/* Notes */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block font-semibold text-slate-700 mb-1">Catatan Internal</label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
