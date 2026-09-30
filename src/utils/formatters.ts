import { ProductionStatus, PaymentStatus, FileStage } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStatusBadgeClass(status: ProductionStatus): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'Menunggu Data':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'Data Masuk':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'Validasi Data':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' };
    case 'Menunggu Produksi':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
    case 'Sedang Dikerjakan':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' };
    case 'Preview':
      return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' };
    case 'Revisi':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
    case 'Finalisasi':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' };
    case 'Selesai':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' };
  }
}

export function getPaymentBadgeClass(status: PaymentStatus): { bg: string; text: string } {
  switch (status) {
    case 'Lunas':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' };
    case 'DP (50%)':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' };
    case 'Menunggu Pembayaran':
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' };
    default:
      return { bg: 'bg-slate-50 text-slate-700 border-slate-200', text: 'text-slate-700' };
  }
}

export function generateStandardFileName(
  orderId: string,
  customerName: string,
  productType: string,
  stage: FileStage,
  version: number,
  ext: 'pdf' | 'docx' | 'png' = 'pdf'
): string {
  const cleanName = customerName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const cleanProduct = productType
    .replace('CV ATS-Friendly', 'CV_ATS')
    .replace('CV Kreatif / Desain', 'CV_Kreatif')
    .replace('Paket Komplit (CV + Portfolio + CL)', 'Paket_Komplit')
    .replace('Portfolio Profesional', 'Portfolio')
    .replace('Cover Letter / Surat Lamaran', 'Cover_Letter')
    .replace('Optimasi Profil LinkedIn', 'LinkedIn_Opt')
    .replace('Executive Resume & Bio', 'Executive_Resume')
    .replace(/[^a-zA-Z0-9]/g, '_');

  return `${orderId}_${cleanName}_${cleanProduct}_V${version}_${stage}.${ext}`;
}

export function generateClientFormUrl(
  orderId: string,
  customerName?: string,
  productType?: string,
  phone?: string
): string {
  if (typeof window === 'undefined') return `/form-${orderId}`;
  
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set('client_form', orderId);
  if (customerName) params.set('c', customerName);
  if (productType) params.set('p', productType);
  if (phone) params.set('ph', phone);
  return `${baseUrl}?${params.toString()}`;
}

export function generateWhatsAppLink(phone: string, text: string): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export const WORKFLOW_STAGES: ProductionStatus[] = [
  'Menunggu Data',
  'Data Masuk',
  'Validasi Data',
  'Menunggu Produksi',
  'Sedang Dikerjakan',
  'Preview',
  'Revisi',
  'Finalisasi',
  'Selesai'
];
