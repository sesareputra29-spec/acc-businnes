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

export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. Check user configured public URL in Settings
  try {
    const saved = localStorage.getItem('arise_settings_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.publicAppUrl && typeof parsed.publicAppUrl === 'string' && parsed.publicAppUrl.trim()) {
        let clean = parsed.publicAppUrl.trim().replace(/\/+$/, '');
        // Fix legacy buggy ais-pre- rewrite that causes 404
        if (clean.includes('ais-pre-')) {
          clean = clean.replace('ais-pre-', 'ais-dev-');
        }
        return clean;
      }
    }
  } catch {}

  // 2. Check environment variable VITE_APP_URL
  try {
    if (import.meta.env?.VITE_APP_URL) {
      let envUrl = (import.meta.env.VITE_APP_URL as string).trim().replace(/\/+$/, '');
      if (envUrl.includes('ais-pre-')) {
        envUrl = envUrl.replace('ais-pre-', 'ais-dev-');
      }
      if (envUrl) return envUrl;
    }
  } catch {}

  const { origin, hostname } = window.location;

  // 3. If accessed on localhost or 127.0.0.1, check if an injected or global public URL exists
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (typeof (window as any).__PUBLIC_APP_URL__ === 'string' && (window as any).__PUBLIC_APP_URL__) {
      return (window as any).__PUBLIC_APP_URL__.replace(/\/+$/, '');
    }
    if (import.meta.env?.VITE_APP_URL) {
      return (import.meta.env.VITE_APP_URL as string).trim().replace(/\/+$/, '');
    }
  }

  // 4. In cloud/AI Studio or production web runner:
  // NEVER rewrite ais-dev- to ais-pre-!
  // In Google AI Studio, ais-dev-... is the live, active, accessible URL.
  // Replacing it with ais-pre-... leads to DNS/HTTP 404 Not Found on mobile.
  return origin;
}

export function generatePortalToken(orderId: string): string {
  let hash = 0;
  const str = `arise_craft_${orderId}_portal_v1`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}

export function generateClientFormUrl(
  orderId: string,
  customerName?: string,
  productType?: string,
  phone?: string
): string {
  const cleanId = (orderId || '').trim();
  if (typeof window === 'undefined') return `/portal/${cleanId}`;

  const baseUrl = getPublicBaseUrl();
  const token = generatePortalToken(cleanId);
  const params = new URLSearchParams();
  params.set('client_form', cleanId);
  params.set('token', token);
  if (customerName) params.set('c', customerName);
  if (productType) params.set('p', productType);
  if (phone) params.set('ph', phone);

  const cleanBase = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/` : '/';
  return `${cleanBase}?${params.toString()}`;
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
