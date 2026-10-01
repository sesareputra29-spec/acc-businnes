import React from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  Globe, 
  MessageSquare, 
  Calendar,
  ExternalLink,
  ShoppingBag,
  Edit
} from 'lucide-react';
import { CustomerProfile, Order } from '../../types';
import { formatDate, formatRupiah, generateWhatsAppLink, getStatusBadgeClass } from '../../utils/formatters';

interface Props {
  customer: CustomerProfile | null;
  linkedOrders: Order[];
  onClose: () => void;
  onEdit: (customer: CustomerProfile) => void;
  onSelectOrder: (order: Order) => void;
  onCreateOrder?: (customer: CustomerProfile) => void;
  onShowToast: (msg: string) => void;
}

export const CustomerDetailModal: React.FC<Props> = ({
  customer,
  linkedOrders,
  onClose,
  onEdit,
  onSelectOrder,
  onCreateOrder,
  onShowToast
}) => {
  if (!customer) return null;

  const data = customer.customerData || {
    id: customer.id,
    fullName: customer.fullName,
    professionalTitle: '',
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    country: customer.country || 'Indonesia',
    summary: '',
    educations: [],
    experiences: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    socialLinks: [],
    lastUpdated: customer.updatedAt
  };

  const handleSendWA = () => {
    const text = `Halo kak ${customer.fullName}, dari Arise Career Craft. Apakah ada yang dapat kami bantu terkait dokumen karir Anda?`;
    window.open(generateWhatsAppLink(customer.phone, text), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {customer.fullName[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{customer.fullName}</h2>
              <span className="text-xs text-slate-500">{data.professionalTitle || 'Klien Karir'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCreateOrder && (
              <button
                onClick={() => {
                  onClose();
                  onCreateOrder(customer);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                title="Buat pesanan baru untuk pelanggan ini"
              >
                <ShoppingBag size={13} />
                <span>Buat Pesanan Baru</span>
              </button>
            )}
            <button
              onClick={() => onEdit(customer)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit size={13} />
              <span>Edit Data</span>
            </button>
            <button
              onClick={handleSendWA}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <MessageSquare size={13} />
              <span>Kirim WhatsApp</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Contact Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800">{customer.phone || '-'}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="text-slate-700 truncate">{customer.email || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span className="text-slate-700">{customer.city ? `${customer.city}, ${customer.country}` : 'Indonesia'}</span>
            </div>
          </div>

          {/* Linked Orders History */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-indigo-600" />
              <span>Riwayat Transaksi & Pesanan ({linkedOrders.length})</span>
            </h3>

            {linkedOrders.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-slate-400 text-center">
                Belum ada pesanan terhubung untuk klien ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {linkedOrders.map((ord) => {
                  const badge = getStatusBadgeClass(ord.status);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        onClose();
                        onSelectOrder(ord);
                      }}
                      className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700">{ord.id}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-semibold text-slate-900">{ord.productType}</span>
                          <span className="text-slate-400 text-[11px]">({ord.marketplace})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatDate(ord.orderDate)} · {formatRupiah(ord.price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {ord.status}
                        </span>
                        <ExternalLink size={13} className="text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Professional Summary */}
          {data.summary && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Ringkasan Profil</h3>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed text-justify">
                {data.summary}
              </p>
            </div>
          )}

          {/* Experiences */}
          {data.experiences?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase size={14} className="text-indigo-600" />
                <span>Pengalaman Kerja ({data.experiences.length})</span>
              </h3>
              <div className="space-y-2">
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{exp.position}</span>
                      <span className="text-slate-400 font-normal">{exp.startDate} - {exp.endDate}</span>
                    </div>
                    <div className="text-indigo-600 font-medium text-[11px] mt-0.5">{exp.company}</div>
                    {exp.bulletPoints?.length > 0 && (
                      <ul className="list-disc ml-4 mt-2 space-y-0.5 text-slate-600 text-[11px]">
                        {exp.bulletPoints.map((bp, i) => (
                          <li key={i}>{bp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educations */}
          {data.educations?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap size={14} className="text-indigo-600" />
                <span>Pendidikan ({data.educations.length})</span>
              </h3>
              <div className="space-y-2">
                {data.educations.map((edu) => (
                  <div key={edu.id} className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{edu.institution}</div>
                      <div className="text-slate-600 text-[11px]">{edu.degree} · {edu.major}</div>
                    </div>
                    <span className="text-slate-400 font-medium">{edu.startYear} - {edu.endYear}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Code size={14} className="text-indigo-600" />
                <span>Keahlian & Kemampuan</span>
              </h3>
              <div className="space-y-2">
                {data.skills.map((skillCat) => (
                  <div key={skillCat.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-semibold text-slate-900 block mb-1">{skillCat.categoryName}</span>
                    <div className="flex flex-wrap gap-1">
                      {skillCat.skills.map((s, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
