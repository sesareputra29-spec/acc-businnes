import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Mail, 
  Phone, 
  Briefcase, 
  Trash2, 
  CheckCircle2,
  X
} from 'lucide-react';
import { StaffMember, UserRole } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  staffList: StaffMember[];
  onShowToast: (msg: string) => void;
}

export const StaffView: React.FC<Props> = ({ staffList, onShowToast }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Designer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newStaff: StaffMember = {
      id: `STF-${Date.now().toString().slice(-4)}`,
      name,
      role,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@arisecareer.id`,
      phone: phone || '0812-0000-0000',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      activeOrdersCount: 0,
      completedOrdersCount: 0,
      status: 'Aktif'
    };

    storageService.addStaff(newStaff);
    setShowAddModal(false);
    setName('');
    setEmail('');
    setPhone('');
    onShowToast(`Staff ${newStaff.name} (${newStaff.role}) berhasil ditambahkan.`);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    storageService.deleteStaff(id);
    onShowToast(`Staff ${name} dihapus.`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Tim & Staff Operasional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar administrator, operator customer service, dan desainer pembuat dokumen.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Tambah Anggota Tim</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffList.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  member.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                  member.role === 'Operator' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {member.role}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{member.id}</p>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2 truncate">
                  <Mail size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-slate-400 shrink-0" />
                  <span>{member.phone}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Antrian Aktif</span>
                  <span className="font-bold text-indigo-600">{member.activeOrdersCount} pesanan</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Terselesaikan</span>
                  <span className="font-bold text-slate-900">{member.completedOrdersCount} pesanan</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {member.status}
              </span>
              <button
                onClick={() => handleDeleteStaff(member.id, member.name)}
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Hapus Staff"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">Tambah Anggota Tim Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Maya Indriyani"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Peran / Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Designer">Designer (Pengerjaan Dokumen)</option>
                  <option value="Operator">Operator (Validasi & CS)</option>
                  <option value="Admin">Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@arisecareer.id"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
