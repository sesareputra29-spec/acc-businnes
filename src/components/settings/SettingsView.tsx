import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  MessageSquare, 
  Store, 
  Building, 
  FileText,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { AppSettings, UserRole } from '../../types';
import { storageService } from '../../services/storage';
import { ROLE_PERMISSIONS } from '../../services/permissionService';
import { getPublicBaseUrl } from '../../utils/formatters';

interface Props {
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<Props> = ({ onShowToast }) => {
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'whatsapp' | 'security' | 'shopee'>('general');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    onShowToast('Pengaturan sistem dan integrasi berhasil disimpan.');
  };

  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin mengatur ulang data ke kondisi bawaan (demo)? Seluruh pesanan baru akan terhapus.')) {
      storageService.resetAllData();
      setSettings(storageService.getSettings());
      onShowToast('Data berhasil diatur ulang ke kondisi demo awal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Pengaturan Sistem, Hak Akses & Operasional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas brand, template otomatis WhatsApp, SLA pengerjaan, dan matriks hak akses RBAC.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="px-3.5 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw size={14} />
          <span>Reset Data Demo</span>
        </button>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'general' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building size={14} />
          <span>Identitas & Operasional</span>
        </button>
        <button
          onClick={() => setActiveSubTab('whatsapp')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'whatsapp' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MessageSquare size={14} />
          <span>Template WhatsApp</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'security' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Keamanan & RBAC Role</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* SUBTAB 1: GENERAL */}
        {activeSubTab === 'general' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b pb-3">
                <Building size={16} className="text-indigo-600" />
                <span>Identitas Bisnis & Penomoran Order</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Brand / Bisnis *</label>
                  <input
                    type="text"
                    required
                    value={settings.brandName}
                    onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Resmi Layanan</label>
                  <input
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor WhatsApp CS / Notifikasi</label>
                  <input
                    type="text"
                    value={settings.businessPhone}
                    onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Prefix Kode Pesanan (Order ID)</label>
                  <input
                    type="text"
                    value={settings.orderIdPrefix}
                    onChange={(e) => setSettings({ ...settings, orderIdPrefix: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Format penomoran: ORD-YYYY-XXXXXX</p>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Default SLA Waktu Pengerjaan (Jam)</label>
                  <input
                    type="number"
                    value={settings.defaultDeadlineHours}
                    onChange={(e) => setSettings({ ...settings, defaultDeadlineHours: Number(e.target.value) || 24 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Standar pengerjaan express (misal: 24 jam / 48 jam)</p>
                </div>
              </div>

              {/* Public App URL for HP Portal links */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 block">
                    URL Domain Publik Portal Klien (Wajib untuk Akses HP & WhatsApp)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const detected = getPublicBaseUrl();
                      setSettings({ ...settings, publicAppUrl: detected });
                      onShowToast(`URL publik berhasil dideteksi: ${detected}`);
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Deteksi Otomatis URL Publik
                  </button>
                </div>
                <input
                  type="url"
                  value={settings.publicAppUrl ? settings.publicAppUrl.replace('ais-pre-', 'ais-dev-') : ''}
                  onChange={(e) => setSettings({ ...settings, publicAppUrl: e.target.value.replace('ais-pre-', 'ais-dev-') })}
                  placeholder="https://ais-dev-...run.app atau https://domain-anda.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Tautan formulir yang dikirim ke WhatsApp klien akan otomatis menggunakan domain ini (bukan localhost/127.0.0.1) agar dapat langsung dibuka dari HP/Smartphone tanpa error.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: WHATSAPP TEMPLATES */}
        {activeSubTab === 'whatsapp' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b pb-3">
              <MessageSquare size={16} className="text-emerald-600" />
              <span>Template Pesan WhatsApp Otomatis (1-Klik Kirim)</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  1. Pesan Pembuka & Permintaan Pengisian Form Klien
                </label>
                <textarea
                  rows={3}
                  value={settings.waTemplateWelcome}
                  onChange={(e) => setSettings({ ...settings, waTemplateWelcome: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-[11px] leading-relaxed"
                />
                <span className="text-[10px] text-slate-400">Variabel: {'{nama}'}, {'{produk}'}, {'{link_form}'}</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  2. Pesan Pengiriman Draf Pratinjau (Preview Persetujuan)
                </label>
                <textarea
                  rows={3}
                  value={settings.waTemplatePreview}
                  onChange={(e) => setSettings({ ...settings, waTemplatePreview: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-[11px] leading-relaxed"
                />
                <span className="text-[10px] text-slate-400">Variabel: {'{nama}'}, {'{produk}'}, {'{link_preview}'}</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  3. Pesan Serah Terima Berkas Final (Selesai)
                </label>
                <textarea
                  rows={3}
                  value={settings.waTemplateFinal}
                  onChange={(e) => setSettings({ ...settings, waTemplateFinal: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-[11px] leading-relaxed"
                />
                <span className="text-[10px] text-slate-400">Variabel: {'{nama}'}, {'{produk}'}, {'{link_final}'}</span>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: SECURITY & ROLE MATRIX */}
        {activeSubTab === 'security' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b pb-3">
                <Lock size={16} className="text-indigo-600" />
                <span>Matriks Hak Akses Peran (Role-Based Access Control)</span>
              </div>

              <p className="text-slate-600">
                Sistem membatasi hak akses halaman dan tindakan berdasarkan 3 peran utama berikut secara otomatis:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['Admin', 'Operator', 'Designer'] as UserRole[]).map((r) => {
                  const perms = ROLE_PERMISSIONS[r];
                  return (
                    <div key={r} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">{r}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {perms.length} Izin
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {r === 'Admin'
                          ? 'Akses penuh ke seluruh modul, keuangan, manajemen staff, dan konfigurasi API.'
                          : r === 'Operator'
                          ? 'Dapat mengelola pesanan, sinkronisasi Shopee, komunikasi klien, dan status revisi.'
                          : 'Fokus pada antrian produksi, CV Builder, Portfolio, Cover Letter, dan ekspor file.'}
                      </p>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {perms.map((p) => (
                          <div key={p} className="flex items-center gap-1.5 text-[10px] text-slate-700 font-mono">
                            <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secret Security Policy */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Kebijakan Keamanan Kredensial & Secrets</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Seluruh kredensial sensitif seperti API Secret Key, Shopee Partner Key, dan OAuth Tokens disimpan pada environment variabel server-side (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">.env</code> / Cloud Secret Manager) dan tidak pernah dikirimkan atau diekspos pada antarmuka frontend klien.
              </p>
            </div>
          </div>
        )}

        {/* Action Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs">Pastikan seluruh data terisi dengan benar sebelum menyimpan.</span>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Save size={14} />
            <span>Simpan Seluruh Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
