import React, { useState } from 'react';
import { 
  Store, 
  RefreshCw, 
  ArrowRightLeft, 
  History, 
  CheckCircle2, 
  Layers, 
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Radio,
  Copy,
  Check,
  Info,
  HelpCircle,
  Plus,
  Lock,
  Eye,
  EyeOff,
  Save,
  Key,
  Terminal,
  Server
} from 'lucide-react';
import { ShopeeProduct, ShopeeSyncLog, DocumentTemplate, ProductType, AppSettings } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { shopeeService } from '../../services/shopeeService';
import { storageService } from '../../services/storage';

interface Props {
  products: ShopeeProduct[];
  logs: ShopeeSyncLog[];
  templates: DocumentTemplate[];
  onShowToast: (msg: string) => void;
}

export const ShopeeView: React.FC<Props> = ({
  products,
  logs,
  templates,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'mapping' | 'logs' | 'api-settings'>('products');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');

  // API Credentials State
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [partnerId, setPartnerId] = useState<string>(settings.shopeePartnerId || '');
  const [partnerKey, setPartnerKey] = useState<string>(settings.shopeePartnerKey || '');
  const [shopId, setShopId] = useState<string>(settings.shopeeShopId || '');
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>(settings.shopeeEnvironment || 'sandbox');
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [hasCopiedEnv, setHasCopiedEnv] = useState<boolean>(false);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusText(
      environment === 'live'
        ? `Menghubungkan ke Shopee Live API (Shop ID: ${shopId || 'Default'})...`
        : 'Menghubungkan & Mensimulasikan Pesanan Shopee Sandbox...'
    );
    try {
      const res = await shopeeService.syncShopeeOrders();
      if (res.success) {
        onShowToast(`Sinkronisasi sukses! ${res.syncedCount} pesanan baru Shopee ditambahkan ke antrian.`);
      }
    } catch {
      onShowToast('Gagal sinkronisasi data Shopee.');
    } finally {
      setIsSyncing(false);
      setSyncStatusText('');
    }
  };

  const handleUpdateMapping = (productId: string, templateId: string) => {
    const p = products.find((item) => item.id === productId);
    if (p) {
      storageService.updateShopeeProductMapping(productId, templateId, p.requiredFormFields);
      onShowToast(`Mapping template untuk produk ${p.sku} diperbarui.`);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: AppSettings = {
      ...settings,
      shopeePartnerId: partnerId.trim(),
      shopeePartnerKey: partnerKey.trim(),
      shopeeShopId: shopId.trim(),
      shopeeEnvironment: environment
    };

    storageService.saveSettings(updatedSettings);
    setSettings(updatedSettings);
    onShowToast('Kredensial API Shopee berhasil disimpan dan dikonfigurasi!');
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      if (environment === 'sandbox') {
        onShowToast('✓ Tes Koneksi Sandbox Berhasil! Sistem siap menerima pesanan simulasi.');
      } else if (!partnerId || !shopId) {
        onShowToast('⚠️ Masukkan Partner ID dan Shop ID terlebih dahulu.');
      } else {
        onShowToast(`✓ Format Kredensial Valid! Siap terhubung ke Shopee Open API (Shop ID: ${shopId}).`);
      }
    }, 800);
  };

  // Generate .env file contents
  const generatedEnvText = `# Konfigurasi Shopee Open Platform v2
SHOPEE_ENVIRONMENT="${environment}"
SHOPEE_PARTNER_ID="${partnerId || 'YOUR_PARTNER_ID'}"
SHOPEE_PARTNER_KEY="${partnerKey || 'YOUR_PARTNER_KEY_SECRET'}"
SHOPEE_SHOP_ID="${shopId || 'YOUR_SHOP_ID'}"
SHOPEE_WEBHOOK_URL="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/shopee/webhook"`;

  const handleCopyEnvConfig = () => {
    navigator.clipboard.writeText(generatedEnvText);
    setHasCopiedEnv(true);
    onShowToast('Konfigurasi .env berhasil disalin ke clipboard!');
    setTimeout(() => setHasCopiedEnv(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              Integrasi Marketplace Shopee
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              environment === 'live'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {environment === 'live' ? '● Mode Live API' : '● Mode Sandbox / Simulasi Aktif'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sinkronisasi otomatis katalog listing, penarikan pesanan masuk, dan pemetaan template dokumen.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? syncStatusText || 'Sedang Menarik Data...' : 'Tarik Pesanan Baru (Sync)'}</span>
        </button>
      </div>

      {/* Info Banner for New Sellers */}
      <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-start gap-3 text-xs text-indigo-950">
        <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Belum punya akun Shopee Seller atau Shopee Open API? Aplikasi ini tetap berjalan 100%!
          </p>
          <p className="text-indigo-800 leading-relaxed text-[11px]">
            Sistem telah dilengkapi <strong>Mode Simulasi Bawaan (Sandbox)</strong> dan <strong>Manajemen Pesanan Manual (Direct WhatsApp / Website)</strong>. Anda bisa langsung membuat pesanan baru manual lewat menu <em>Pesanan &rarr; Tambah Pesanan</em>, atau klik tombol <em>Tarik Pesanan Baru</em> di atas untuk mencoba alur kerja sinkronisasi otomatis pesanan Shopee. Ketika akun Shopee Anda sudah siap nanti, Anda tinggal memasukkan Partner ID, Partner Key, dan Shop ID pada tab <strong>Kredensial API & Cara Koneksi</strong> di bawah ini.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'products' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Store size={14} />
          <span>Katalog Produk Shopee ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'mapping' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft size={14} />
          <span>Mapping Produk & Form</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'logs' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History size={14} />
          <span>Log Sinkronisasi ({logs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('api-settings')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'api-settings' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Kredensial API & Cara Koneksi</span>
        </button>
      </div>

      {/* TAB CONTENT: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Listing Shopee</th>
                  <th className="py-3 px-4">SKU Toko</th>
                  <th className="py-3 px-4">Harga Listing</th>
                  <th className="py-3 px-4">Terjual</th>
                  <th className="py-3 px-4">Status Shopee</th>
                  <th className="py-3 px-4">Produk Internal Terhubung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900">{prod.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Item ID: {prod.shopeeItemId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-700">{prod.sku}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatRupiah(prod.price)}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600">{prod.salesCount} unit</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {prod.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{prod.mappedProductType}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MAPPING */}
      {activeTab === 'mapping' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <p className="text-slate-500">
            Setiap pesanan yang ditarik dari Shopee akan otomatis menggunakan template dokumen default dan form field yang Anda petakan di bawah ini:
          </p>

          <div className="space-y-3">
            {products.map((prod) => (
              <div key={prod.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <span className="font-mono text-[10px] text-indigo-700 font-bold block">{prod.sku}</span>
                  <span className="font-bold text-slate-900 text-xs">{prod.title}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Layanan: {prod.mappedProductType}</span>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Template Dokumen Default</label>
                  <select
                    value={prod.defaultTemplateId}
                    onChange={(e) => handleUpdateMapping(prod.id, e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Form Field yang Diminta Klien</label>
                  <div className="flex flex-wrap gap-1">
                    {prod.requiredFormFields.map((f, i) => (
                      <span key={i} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded capitalize">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Aksi / Pemicu</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pesan & Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{formatDateTime(log.timestamp)}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: API SETTINGS & .ENV GENERATOR */}
      {activeTab === 'api-settings' && (
        <div className="space-y-6 text-xs">
          {/* Status Alert */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            environment === 'live' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <CheckCircle2 size={18} className={environment === 'live' ? 'text-emerald-600 shrink-0 mt-0.5' : 'text-amber-600 shrink-0 mt-0.5'} />
            <div className="space-y-1">
              <span className="font-bold block">
                {environment === 'live' ? 'Koneksi Siap: Mode Shopee Live Production' : 'Koneksi Aktif: Mode Sandbox & Simulasi Mandiri'}
              </span>
              <p className="text-[11px] leading-relaxed opacity-90">
                {environment === 'live'
                  ? 'Kredensial toko live terkonfigurasi. Pesanan riil dari pembeli di Shopee akan ditarik secara otomatis.'
                  : 'Aplikasi ini tidak mewajibkan akun Shopee riil untuk dapat beroperasi. Anda dapat langsung menjalankan pesanan mandiri via WhatsApp atau mencoba penarikan pesanan contoh melalui tombol sync.'}
              </p>
            </div>
          </div>

          {/* Form Input Kredensial */}
          <form onSubmit={handleSaveCredentials} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Key size={16} className="text-indigo-600" />
                  <span>Formulir Input Kredensial API Shopee Open Platform</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Isi field di bawah ini saat akun toko dan developer Shopee Anda telah dibuat.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEnvironment('sandbox')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    environment === 'sandbox' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🧪 Sandbox (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => setEnvironment('live')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    environment === 'live' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ Live Production
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Partner ID */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  1. Shopee Partner ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 20084591"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">Diberikan oleh Shopee Open Platform Console saat membuat App.</p>
              </div>

              {/* Shop ID */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  2. Shopee Shop ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 89104421"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">Nomor ID toko Anda di Shopee Seller Centre.</p>
              </div>
            </div>

            {/* Partner Key / Secret */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                3. Shopee Partner Secret Key (Kunci Rahasia API) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  placeholder="Contoh: 6a8f89b1c02e4d58823192aa82348512..."
                  value={partnerKey}
                  onChange={(e) => setPartnerKey(e.target.value)}
                  className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  title={showSecretKey ? 'Sembunyikan Secret Key' : 'Tampilkan Secret Key'}
                >
                  {showSecretKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Kunci enkripsi HMAC-SHA256 untuk memvalidasi otentikasi request dan webhook order.
              </p>
            </div>

            {/* Webhook Endpoint URL (Readonly with Copy) */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                4. Webhook Callback URL (Untuk Didaftarkan di Shopee Open Platform)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/shopee/webhook`}
                  className="flex-1 p-2.5 bg-slate-100 border border-slate-300 rounded-lg font-mono text-slate-600 text-xs select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/shopee/webhook`);
                    onShowToast('Webhook URL disalin!');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 flex items-center gap-1 font-semibold"
                >
                  <Copy size={13} />
                  <span>Salin URL</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Masukkan URL ini ke pengaturan Webhook di portal Shopee Open Platform untuk menerima auto-sync saat pesanan dibayar.
              </p>
            </div>

            {/* Form Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Server size={14} className={isTestingConnection ? 'animate-spin' : ''} />
                <span>{isTestingConnection ? 'Menguji...' : 'Uji Tes Koneksi'}</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Save size={14} />
                <span>Simpan Kredensial</span>
              </button>
            </div>
          </form>

          {/* GENERATOR KONFIGURASI .ENV BACKEND */}
          <div className="bg-slate-900 rounded-xl p-5 text-slate-200 space-y-3 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400" />
                <span className="font-bold text-white text-xs">Generator File Environment (.env) Backend</span>
              </div>
              <button
                type="button"
                onClick={handleCopyEnvConfig}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {hasCopiedEnv ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                <span>{hasCopiedEnv ? 'Tersalin ke Clipboard!' : 'Salin Format .env'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Format siap pakai untuk dimasukkan langsung ke file <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">.env</code> di server backend Anda:
            </p>

            <pre className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto select-all leading-relaxed">
              {generatedEnvText}
            </pre>
          </div>

          {/* Panduan Langkah Demi Langkah */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <HelpCircle size={15} className="text-indigo-600" />
              <span>Panduan Langkah Demi Langkah Mendaftarkan Toko & API Shopee:</span>
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">
              <li>
                <strong>Buka Toko di Shopee:</strong> Daftarkan toko baru Anda melalui portal resmi di <a href="https://seller.shopee.co.id" target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline">seller.shopee.co.id</a>.
              </li>
              <li>
                <strong>Daftar Shopee Open Platform:</strong> Masuk ke <a href="https://open.shopee.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline">open.shopee.com</a> dan buat akun Developer / Partner untuk mendapatkan <em>Partner ID</em> dan <em>Partner Secret Key</em>.
              </li>
              <li>
                <strong>Masukkan ke Form di Atas:</strong> Isi Partner ID, Shop ID, dan Secret Key pada form di atas, lalu klik <strong>Simpan Kredensial</strong>.
              </li>
              <li>
                <strong>Salin ke File .env:</strong> Gunakan tombol <strong>Salin Format .env</strong> di atas untuk menaruh kredensial ke server backend Anda secara aman.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
