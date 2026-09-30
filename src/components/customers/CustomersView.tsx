import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  ShoppingBag, 
  MessageSquare, 
  ExternalLink,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  MapPin
} from 'lucide-react';
import { Order, CustomerProfile } from '../../types';
import { formatRupiah, formatDate, generateWhatsAppLink } from '../../utils/formatters';
import { storageService } from '../../services/storage';
import { CustomerDetailModal } from './CustomerDetailModal';
import { CustomerEditModal } from './CustomerEditModal';

interface Props {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onOpenCustomerFormPortal: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const CustomersView: React.FC<Props> = ({
  orders,
  onSelectOrder,
  onOpenCustomerFormPortal,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [customers, setCustomers] = useState<CustomerProfile[]>(() => storageService.getCustomers());

  // Modals state
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<CustomerProfile | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sync customers when storage changes
  React.useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setCustomers(storageService.getCustomers());
    });
    return () => {
      unsub();
    };
  }, []);

  // Unique cities for filter
  const cities = Array.from(new Set(customers.map((c) => c.city).filter(Boolean)));

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      c.fullName.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.customerData?.professionalTitle && c.customerData.professionalTitle.toLowerCase().includes(term));

    const matchesCity = selectedCityFilter === 'all' || c.city === selectedCityFilter;

    return matchesSearch && matchesCity;
  });

  const handleSendWhatsApp = (phone: string, name: string) => {
    const text = `Halo kak ${name}, dari Arise Career Craft. Apakah ada yang bisa kami bantu terkait dokumen karir Anda?`;
    window.open(generateWhatsAppLink(phone, text), '_blank');
  };

  const handleDeleteCustomer = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Hapus pelanggan "${name}" dari database?`)) {
      storageService.deleteCustomer(id);
      onShowToast(`Pelanggan "${name}" dihapus.`);
    }
  };

  const handleOpenAddModal = () => {
    setCustomerToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (c: CustomerProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerToEdit(c);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Basis Data & Direktori Pelanggan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil lengkap klien, kontak WhatsApp, riwayat transaksi, dan formulir karir.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Tambah Pelanggan Baru</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, nomor WhatsApp, email, atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Kota Domisili</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Total {filteredCustomers.length} Klien
          </span>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Tidak ada data pelanggan yang sesuai dengan pencarian.
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const customerOrders = orders.filter(
              (o) =>
                (o.customerPhone && o.customerPhone === customer.phone) ||
                (o.customerEmail && o.customerEmail === customer.email) ||
                o.customerName === customer.fullName
            );
            const totalSpent = customerOrders.reduce((sum, o) => sum + o.price, 0);

            return (
              <div
                key={customer.id}
                onClick={() => setActiveCustomerDetail(customer)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Name & Badge */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {customer.fullName}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {customer.customerData?.professionalTitle || 'Klien Karir'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                      {customerOrders.length} Pesanan
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3.5 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span>{customer.phone || '-'}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.city && (
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="text-slate-500">{customer.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Spend & Details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Omzet</span>
                      <span className="font-bold text-slate-900">{formatRupiah(totalSpent)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Pengalaman</span>
                      <span className="font-semibold text-slate-700">
                        {customer.customerData?.experiences?.length || 0} Pekerjaan
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div
                  className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendWhatsApp(customer.phone, customer.fullName)}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Kirim Pesan WhatsApp"
                    >
                      <MessageSquare size={12} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={(e) => handleOpenEditModal(customer, e)}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="Edit Data Pelanggan"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCustomer(customer.id, customer.fullName, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="Hapus Pelanggan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveCustomerDetail(customer)}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    <span>Detail</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Detail Modal */}
      {activeCustomerDetail && (
        <CustomerDetailModal
          customer={activeCustomerDetail}
          linkedOrders={orders.filter(
            (o) =>
              (o.customerPhone && o.customerPhone === activeCustomerDetail.phone) ||
              (o.customerEmail && o.customerEmail === activeCustomerDetail.email) ||
              o.customerName === activeCustomerDetail.fullName
          )}
          onClose={() => setActiveCustomerDetail(null)}
          onEdit={(c) => {
            setActiveCustomerDetail(null);
            setCustomerToEdit(c);
            setIsEditModalOpen(true);
          }}
          onSelectOrder={onSelectOrder}
          onShowToast={onShowToast}
        />
      )}

      {/* Customer Add/Edit Modal */}
      <CustomerEditModal
        isOpen={isEditModalOpen}
        customerToEdit={customerToEdit}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={(c) => {
          setCustomers(storageService.getCustomers());
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
