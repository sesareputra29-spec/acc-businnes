import React, { useState } from 'react';
import { X, Save, User, MapPin, Mail, Phone, FileText } from 'lucide-react';
import { CustomerProfile, CustomerData } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  isOpen: boolean;
  customerToEdit?: CustomerProfile | null;
  onClose: () => void;
  onSaved: (customer: CustomerProfile) => void;
  onShowToast: (msg: string) => void;
}

export const CustomerEditModal: React.FC<Props> = ({
  isOpen,
  customerToEdit,
  onClose,
  onSaved,
  onShowToast
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(customerToEdit);

  const [fullName, setFullName] = useState(customerToEdit?.fullName || '');
  const [professionalTitle, setProfessionalTitle] = useState(customerToEdit?.customerData?.professionalTitle || '');
  const [phone, setPhone] = useState(customerToEdit?.phone || '');
  const [email, setEmail] = useState(customerToEdit?.email || '');
  const [city, setCity] = useState(customerToEdit?.city || 'Jakarta');
  const [country, setCountry] = useState(customerToEdit?.country || 'Indonesia');
  const [summary, setSummary] = useState(customerToEdit?.customerData?.summary || '');
  const [notes, setNotes] = useState(customerToEdit?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      onShowToast('Nama lengkap wajib diisi.');
      return;
    }

    const baseCustomerData: CustomerData = customerToEdit?.customerData || {
      id: customerToEdit?.id || `CUST-${Date.now().toString().slice(-4)}`,
      fullName,
      professionalTitle,
      email,
      phone,
      city,
      country,
      summary,
      educations: [],
      experiences: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      socialLinks: [],
      lastUpdated: new Date().toISOString()
    };

    const updatedCustomerData: CustomerData = {
      ...baseCustomerData,
      fullName,
      professionalTitle,
      email,
      phone,
      city,
      country,
      summary,
      lastUpdated: new Date().toISOString()
    };

    const customerRecord: CustomerProfile = {
      id: customerToEdit?.id || `CUST-${Date.now().toString().slice(-4)}`,
      fullName,
      phone,
      email,
      city,
      country,
      notes,
      customerData: updatedCustomerData,
      createdAt: customerToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isEditing) {
      storageService.updateCustomer(customerRecord);
      onShowToast(`Data pelanggan "${fullName}" berhasil diperbarui.`);
    } else {
      storageService.addCustomer(customerRecord);
      onShowToast(`Pelanggan baru "${fullName}" berhasil ditambahkan.`);
    }

    onSaved(customerRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Perbarui informasi kontak dan profil klien' : 'Input data klien baru ke dalam direktori'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Rian Pratama, S.Kom."
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Gelar Profesional / Headline</label>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="Contoh: Product Marketing Lead"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nomor WhatsApp *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Klien</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kota Domisili</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Jakarta Selatan"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Negara</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Indonesia"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Ringkasan Profil Singkat</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Deskripsi singkat profil dan keahlian utama klien..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Catatan Khusus Klien (Internal)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Klien minta percepat pengiriman dokumen sebelum hari Senin"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
              <span>Simpan Data Klien</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
