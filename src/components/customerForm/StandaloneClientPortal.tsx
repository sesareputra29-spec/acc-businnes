import React, { useState, useEffect } from 'react';
import { 
  Order, 
  CustomerData, 
  EducationItem, 
  ExperienceItem, 
  SkillCategory, 
  CertificationItem, 
  ProjectItem, 
  LanguageItem,
  ProductType,
  ProductFormFieldConfig
} from '../../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  Upload, 
  CheckCircle, 
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Globe,
  Check,
  Send,
  Camera,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  BellRing,
  ExternalLink
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { formatDate, generateWhatsAppLink } from '../../utils/formatters';

export function normalizeCustomerData(raw: any, orderId: string, customerName?: string, customerPhone?: string): CustomerData {
  return {
    id: raw?.id || `CUST-${orderId}`,
    fullName: raw?.fullName || (customerName && customerName !== 'Klien Arise Career' ? customerName : ''),
    professionalTitle: raw?.professionalTitle || '',
    email: raw?.email || '',
    phone: raw?.phone || (customerPhone && customerPhone !== '0812-0000-0000' ? customerPhone : ''),
    city: raw?.city || '',
    country: raw?.country || 'Indonesia',
    summary: raw?.summary || '',
    targetJobTitle: raw?.targetJobTitle || '',
    targetCompany: raw?.targetCompany || '',
    jobVacancySource: raw?.jobVacancySource || '',
    coverLetterNotes: raw?.coverLetterNotes || '',
    photoUrl: raw?.photoUrl || undefined,
    educations: Array.isArray(raw?.educations) ? raw.educations : [],
    experiences: Array.isArray(raw?.experiences) ? raw.experiences : [],
    skills: Array.isArray(raw?.skills) && raw.skills.length > 0 ? raw.skills : [
      { id: 'SKL-1', categoryName: 'Hard Skills & Tools', skills: [] },
      { id: 'SKL-2', categoryName: 'Soft Skills', skills: [] }
    ],
    certifications: Array.isArray(raw?.certifications) ? raw.certifications : [],
    projects: Array.isArray(raw?.projects) ? raw.projects : [],
    languages: Array.isArray(raw?.languages) && raw.languages.length > 0 ? raw.languages : [
      { id: 'LNG-1', language: 'Bahasa Indonesia', proficiency: 'Penutur Asli' },
      { id: 'LNG-2', language: 'Bahasa Inggris', proficiency: 'Profesional' }
    ],
    socialLinks: Array.isArray(raw?.socialLinks) ? raw.socialLinks : [],
    lastUpdated: raw?.lastUpdated || new Date().toISOString()
  };
}

interface Props {
  orderId: string;
  onExitStandalone?: () => void;
  onShowToast: (msg: string) => void;
}

export const StandaloneClientPortal: React.FC<Props> = ({
  orderId,
  onExitStandalone,
  onShowToast
}) => {
  const [order, setOrder] = useState<Order>(() => {
    let customerName: string | undefined;
    let productType: ProductType | undefined;
    let phone: string | undefined;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      customerName = params.get('c') || undefined;
      const pParam = params.get('p');
      if (pParam) productType = pParam as ProductType;
      phone = params.get('ph') || undefined;
    }

    return storageService.getOrCreateOrderForClient(orderId, {
      customerName,
      productType,
      phone
    });
  });

  const [formData, setFormData] = useState<CustomerData>(() => {
    return normalizeCustomerData(
      order?.customerData,
      orderId,
      order?.customerName,
      order?.customerPhone
    );
  });

  const [activeStep, setActiveStep] = useState<
    'pribadi' | 'ringkasan' | 'pengalaman' | 'pendidikan' | 'keahlian' | 'proyek' | 'target'
  >('pribadi');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSuccessSubmittedModalOpen, setIsSuccessSubmittedModalOpen] = useState(false);
  const [isRequestEditModalOpen, setIsRequestEditModalOpen] = useState(false);
  const [editReasonText, setEditReasonText] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formConfigs, setFormConfigs] = useState<ProductFormFieldConfig[]>(() => storageService.getFormFieldConfigs());

  const portalToken = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('token') || '') : '';

  // Listen to storage changes and real-time cross-device approval polling
  useEffect(() => {
    let isMounted = true;

    // Check url action parameter for unlock
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'unlock' || params.get('status') === 'unlocked') {
        storageService.approveFormEdit(orderId);
      }
    }

    let retryCount = 0;
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);
    
    console.log('[REALTIME_INIT]', {
      connectionType: 'HTTP Bidirectional Polling',
      endpoint: '/api/portal/orders/:id',
      status: 'initialized',
      device: isMobile ? 'Mobile/HP' : 'Desktop/PC'
    });

    // Direct fetch from server on mount for HP/mobile & incognito isolation support
    const fetchFromServer = async () => {
      try {
        console.log('[REALTIME_CONNECTING]', { connectionType: 'HTTP Polling', endpoint: '/api/portal/orders', retryCount });
        const portalUrl = `/api/portal/orders/${encodeURIComponent(orderId.trim())}?token=${encodeURIComponent(portalToken)}`;
        let res = await fetch(portalUrl);
        if (!res.ok) {
          res = await fetch(`/api/orders/${encodeURIComponent(orderId.trim())}`);
        }
        if (res.ok && isMounted) {
          console.log('[REALTIME_CONNECTED]', { connectionType: 'HTTP Polling', status: 'connected', orderId });
          const serverOrder: Order = await res.json();
          if (serverOrder) {
            console.log('[REALTIME_MESSAGE]', {
              type: 'initial_order_sync',
              orderId,
              isFormLocked: serverOrder.isFormLocked,
              editRequestStatus: serverOrder.editRequestStatus
            });
            setOrder(serverOrder);
            storageService.updateOrder(serverOrder);
            if (serverOrder.customerData) {
              setFormData((prev) => {
                const normalized = normalizeCustomerData(
                  serverOrder.customerData,
                  orderId,
                  serverOrder.customerName,
                  serverOrder.customerPhone
                );
                return {
                  ...normalized,
                  ...prev,
                  lastUpdated: serverOrder.customerData?.lastUpdated || prev.lastUpdated,
                  educations: normalized.educations.length > 0 ? normalized.educations : (prev.educations || []),
                  experiences: normalized.experiences.length > 0 ? normalized.experiences : (prev.experiences || []),
                  skills: normalized.skills.length > 0 ? normalized.skills : (prev.skills || []),
                  languages: normalized.languages.length > 0 ? normalized.languages : (prev.languages || []),
                  certifications: normalized.certifications.length > 0 ? normalized.certifications : (prev.certifications || []),
                  projects: normalized.projects.length > 0 ? normalized.projects : (prev.projects || []),
                  socialLinks: normalized.socialLinks.length > 0 ? normalized.socialLinks : (prev.socialLinks || [])
                };
              });
            }
          }
        } else {
          console.warn('[REALTIME_ERROR]', { connectionType: 'HTTP Polling', status: res.status, errorType: 'HTTP_' + res.status, retryCount: ++retryCount });
        }
      } catch (e: any) {
        console.warn('[REALTIME_ERROR]', { connectionType: 'HTTP Polling', errorType: e?.name || 'FetchError', retryCount: ++retryCount });
      }
    };

    fetchFromServer();

    const unsubscribe = storageService.subscribe(() => {
      const updated = storageService.getOrderById(orderId);
      if (updated && isMounted) {
        setOrder(updated);
      }
    });

    // Cross-device polling interval: checks server directly so Seller actions on PC immediately reflect on HP
    const pollInterval = setInterval(async () => {
      try {
        const portalUrl = `/api/portal/orders/${encodeURIComponent(orderId.trim())}?token=${encodeURIComponent(portalToken)}`;
        let res = await fetch(portalUrl);
        if (!res.ok) {
          res = await fetch(`/api/orders/${encodeURIComponent(orderId.trim())}`);
        }
        if (res.ok && isMounted) {
          const serverOrder: Order = await res.json();
          if (serverOrder) {
            setOrder((prev) => {
              if (prev.isFormLocked && !serverOrder.isFormLocked) {
                console.log('[REALTIME_MESSAGE]', { type: 'form_unlocked_by_seller', orderId });
                onShowToast('🎉 Izin Perubahan Disetujui! Formulir Anda telah dibuka oleh Seller. Silakan perbarui data.');
              }
              return serverOrder;
            });
            storageService.updateOrder(serverOrder);
          }
        } else {
          const latest = storageService.getOrderById(orderId);
          if (latest && isMounted) {
            setOrder((prev) => {
              if (prev.isFormLocked && !latest.isFormLocked) {
                onShowToast('🎉 Izin Perubahan Disetujui! Formulir Anda telah dibuka oleh Seller. Silakan perbarui data.');
              }
              return latest;
            });
          }
        }
      } catch (err: any) {
        console.log('[REALTIME_RECONNECT]', { connectionType: 'HTTP Polling', retryCount: ++retryCount, reason: err?.message || 'network_retry' });
        const latest = storageService.getOrderById(orderId);
        if (latest && isMounted) {
          setOrder(latest);
        }
      }
    }, 2500);

    return () => {
      isMounted = false;
      console.log('[REALTIME_DISCONNECTED]', { connectionType: 'HTTP Polling', status: 'closed' });
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [orderId, portalToken]);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl border border-slate-200 space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Formulir Pesanan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pesanan dengan ID <strong>{orderId}</strong> tidak ditemukan atau tautan formulir tidak valid.
            Mohon hubungi admin / customer support kami via WhatsApp untuk mendapatkan tautan baru.
          </p>
          {onExitStandalone && (
            <button
              onClick={onExitStandalone}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
            >
              Buka Panel Utama
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentProductConfig = formConfigs.find((c) => c.productType === order.productType) || {
    productType: order.productType,
    requiredFields: ['personal', 'summary', 'education', 'experience', 'skills'],
    optionalFields: []
  };

  // Lock status
  const isFormLocked = order.isFormLocked ?? (order.status !== 'Menunggu Data' && !!order.customerSubmittedAt);
  const editRequestStatus = order.editRequestStatus || 'none';

  // Calculate Form Completion
  const calculateProgress = () => {
    let totalScore = 0;
    let maxScore = 0;

    maxScore += 20;
    if (formData.fullName?.trim() && formData.email?.trim() && formData.phone?.trim()) {
      totalScore += 20;
    } else if (formData.fullName?.trim()) {
      totalScore += 10;
    }

    maxScore += 15;
    if (formData.summary && formData.summary.trim().length > 30) {
      totalScore += 15;
    } else if (formData.summary?.trim()) {
      totalScore += 7;
    }

    maxScore += 25;
    if (formData.experiences && formData.experiences.length > 0) {
      const validExps = formData.experiences.filter((e) => e.position && e.company);
      if (validExps.length > 0) totalScore += 25;
    }

    maxScore += 20;
    if (formData.educations && formData.educations.length > 0) {
      const validEdus = formData.educations.filter((e) => e.institution && e.major);
      if (validEdus.length > 0) totalScore += 20;
    }

    maxScore += 20;
    const hasSkills = formData.skills && formData.skills.some((s) => s.skills?.length > 0);
    if (hasSkills) totalScore += 20;

    return Math.min(100, Math.round((totalScore / maxScore) * 100));
  };

  const progressPercentage = calculateProgress();

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!formData.fullName?.trim()) errors.push('Nama Lengkap & Gelar wajib diisi.');
    if (!formData.email?.trim()) errors.push('Email aktif wajib diisi.');
    if (!formData.phone?.trim()) errors.push('Nomor WhatsApp aktif wajib diisi.');
    if (!formData.summary?.trim()) errors.push('Ringkasan profil profesional belum diisi.');

    if (currentProductConfig.requiredFields.includes('experience') && (!formData.experiences || formData.experiences.length === 0)) {
      errors.push('Minimal sertakan 1 riwayat pengalaman kerja / organisasi.');
    }

    if (currentProductConfig.requiredFields.includes('education') && (!formData.educations || formData.educations.length === 0)) {
      errors.push('Minimal sertakan 1 riwayat pendidikan formal.');
    }

    if (currentProductConfig.requiredFields.includes('targetJob') && !formData.targetJobTitle?.trim()) {
      errors.push('Posisi / Jabatan yang dituju wajib diisi untuk pembuatan Cover Letter.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleDraftSave = async () => {
    const updated: CustomerData = {
      ...formData,
      lastUpdated: new Date().toISOString()
    };
    storageService.updateOrderCustomerData(order.id, updated);
    setFormData(updated);

    try {
      await fetch(`/api/orders/${encodeURIComponent(order.id.trim())}/customer-data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerData: updated,
          isFormLocked: order.isFormLocked ?? false
        })
      });
    } catch {}

    onShowToast(`Draf formulir Anda berhasil disimpan.`);
  };

  const handleSubmitFinal = async () => {
    const isValid = validateForm();
    if (!isValid) {
      onShowToast('⚠️ Mohon lengkapi bagian wajib sebelum mengirimkan data.');
      return;
    }

    const nowIso = new Date().toISOString();
    const updated: CustomerData = {
      ...formData,
      lastUpdated: nowIso
    };

    // 1. Update storage and local state
    storageService.updateOrderCustomerData(order.id, updated);
    storageService.updateOrderStatus(order.id, 'Data Masuk');
    storageService.lockForm(order.id);

    setOrder((prev) => ({
      ...prev,
      customerData: updated,
      status: 'Data Masuk',
      isFormLocked: true,
      editRequestStatus: 'none',
      customerSubmittedAt: nowIso
    }));

    // 2. Direct server push
    try {
      const portalSubmitUrl = `/api/portal/orders/${encodeURIComponent(order.id.trim())}/customer-data`;
      let res = await fetch(portalSubmitUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerData: updated,
          status: 'Data Masuk',
          isFormLocked: true,
          token: portalToken
        })
      });
      if (!res.ok) {
        await fetch(`/api/orders/${encodeURIComponent(order.id.trim())}/customer-data`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerData: updated,
            status: 'Data Masuk',
            isFormLocked: true
          })
        });
      }
    } catch (err) {
      console.warn('Server push failed:', err);
    }

    setIsSubmitModalOpen(false);
    setIsSuccessSubmittedModalOpen(true);
    onShowToast(`✓ Formulir berhasil terkirim ke seller/desainer! Tim kami akan segera memproses dokumen Anda.`);
  };

  const handleSendConfirmationToSellerWhatsApp = () => {
    const settings = storageService.getSettings();
    const sellerPhone = settings.businessPhone || '0812-8800-9900';
    const message = `Halo Admin Arise Career Craft, saya telah melengkapi dan mengirimkan formulir pesanan:\n\n` +
      `📋 *Order ID:* ${order.id}\n` +
      `👤 *Nama:* ${formData.fullName || order.customerName}\n` +
      `📦 *Layanan:* ${order.productType}\n\n` +
      `Mohon dicek dan diproses ke tahap produksi ya. Terima kasih!`;
    
    const waLink = generateWhatsAppLink(sellerPhone, message);
    window.open(waLink, '_blank');
  };

  const handleRequestEdit = async () => {
    if (!editReasonText.trim()) {
      onShowToast('⚠️ Harap tuliskan alasan perubahan data.');
      return;
    }

    const reason = editReasonText.trim();

    // 1. Immediate visual feedback on client device
    setOrder((prev) => ({
      ...prev,
      editRequestStatus: 'requested',
      editRequestReason: reason
    }));

    // 2. Storage service
    storageService.requestFormEdit(order.id, reason);

    // 3. Direct server call so seller gets notification and unlock action immediately
    try {
      const portalRequestUrl = `/api/portal/orders/${encodeURIComponent(order.id.trim())}/request-edit`;
      let res = await fetch(portalRequestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, token: portalToken })
      });
      if (!res.ok) {
        await fetch(`/api/orders/${encodeURIComponent(order.id.trim())}/request-edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
      }
    } catch (err) {
      console.warn('Request edit push failed:', err);
    }

    setIsRequestEditModalOpen(false);
    setEditReasonText('');
    onShowToast('✓ Permintaan perubahan data telah dikirimkan ke seller untuk disetujui.');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('Ukuran foto terlalu besar. Maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setFormData({ ...formData, photoUrl: result });
        onShowToast('Foto profil berhasil diunggah.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper functions for nested array items
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: `EXP-${Date.now()}`,
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      bulletPoints: ['']
    };
    setFormData({
      ...formData,
      experiences: [...(formData.experiences || []), newItem]
    });
  };

  const removeExperience = (id: string) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.filter((exp) => exp.id !== id)
    });
  };

  const updateExperience = (id: string, field: keyof ExperienceItem, value: any) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    });
  };

  const addEducation = () => {
    const newItem: EducationItem = {
      id: `EDU-${Date.now()}`,
      institution: '',
      degree: '',
      major: '',
      startYear: '',
      endYear: '',
      gpa: '',
      achievements: ''
    };
    setFormData({
      ...formData,
      educations: [...(formData.educations || []), newItem]
    });
  };

  const removeEducation = (id: string) => {
    setFormData({
      ...formData,
      educations: formData.educations.filter((edu) => edu.id !== id)
    });
  };

  const addProject = () => {
    const newItem: ProjectItem = {
      id: `PRJ-${Date.now()}`,
      title: '',
      category: 'Proyek Karir',
      description: '',
      technologies: [],
      link: '',
      date: ''
    };
    setFormData({
      ...formData,
      projects: [...(formData.projects || []), newItem]
    });
  };

  const removeProject = (id: string) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((p) => p.id !== id)
    });
  };

  const addCertification = () => {
    const newItem: CertificationItem = {
      id: `CRT-${Date.now()}`,
      title: '',
      issuer: '',
      issueDate: '',
      credentialId: ''
    };
    setFormData({
      ...formData,
      certifications: [...(formData.certifications || []), newItem]
    });
  };

  const removeCertification = (id: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((c) => c.id !== id)
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Client Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center font-bold text-white shadow-sm">
              A
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold tracking-tight block">ARISE CAREER CRAFT</span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block">
                Portal Formulir Klien
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700 px-2.5 py-1 rounded-full items-center gap-1">
              <ShieldCheck size={12} />
              <span>Formulir Terenkripsi 256-bit</span>
            </span>

            {onExitStandalone && (
              <button
                onClick={onExitStandalone}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
              >
                Panel Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-4">
        {/* Hero Order Information Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                ID Pesanan: {order.id}
              </span>
              <h1 className="text-base sm:text-lg font-bold tracking-tight mt-0.5">
                Formulir Kelengkapan Data: {order.productType}
              </h1>
            </div>

            <div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                isFormLocked 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' 
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
              }`}>
                {isFormLocked ? <Lock size={11} /> : <Unlock size={11} />}
                <span>{isFormLocked ? 'Data Terkirim ke Seller' : 'Mode Pengisian Aktif'}</span>
              </span>
            </div>
          </div>

          {/* Client & SLA Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Klien Pemesan:</span>
              <span className="font-bold text-white text-sm block mt-0.5 truncate">{order.customerName}</span>
              <span className="text-[11px] text-indigo-300 font-mono">{order.customerPhone}</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Target Waktu Pengerjaan:</span>
              <span className="font-bold text-white text-sm block mt-0.5">{order.productType}</span>
              <span className="text-[11px] text-emerald-400">Deadline: {formatDate(order.deadlineDate)}</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-slate-300 font-semibold">Kemajuan Data:</span>
                <span className="font-bold text-emerald-400">{progressPercentage}% Lengkap</span>
              </div>
              <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Locked Notice & Request Edit Button */}
          {isFormLocked && editRequestStatus === 'none' && (
            <div className="p-3.5 bg-indigo-950/90 border border-indigo-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="text-indigo-200">
                  Data Anda telah tersimpan dan terkirim ke seller/desainer. Butuh menambah riwayat atau revisi data?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestEditModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 text-xs shadow-sm active:scale-95"
              >
                <KeyRound size={13} />
                <span>Ajukan Perubahan Data</span>
              </button>
            </div>
          )}

          {/* Waiting for approval */}
          {isFormLocked && editRequestStatus === 'requested' && (
            <div className="p-3.5 bg-amber-950/80 border border-amber-700/70 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <RefreshCw size={15} className="animate-spin text-amber-400 shrink-0" />
                <span>
                  <strong>Permintaan Perubahan Terkirim:</strong> Menunggu konfirmasi seller untuk membuka kunci form...
                </span>
              </div>
            </div>
          )}

          {/* Edit Approved */}
          {!isFormLocked && editRequestStatus === 'approved' && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/70 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>
                  <strong>Persetujuan Diterima:</strong> Seller telah membuka kunci formulir! Silakan perbarui data Anda lalu klik <em>Kirim Data ke Seller</em>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Steps Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Step Navigation Tabs */}
          <div className="border-b border-slate-200 bg-slate-50/80 px-3 flex gap-1.5 overflow-x-auto text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveStep('pribadi')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeStep === 'pribadi' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <User size={14} />
              <span>1. Biodata</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('ringkasan')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeStep === 'ringkasan' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <span>2. Profil Ringkas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('pengalaman')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeStep === 'pengalaman' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Briefcase size={14} />
              <span>3. Pengalaman ({formData.experiences?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('pendidikan')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeStep === 'pendidikan' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <GraduationCap size={14} />
              <span>4. Pendidikan ({formData.educations?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('keahlian')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeStep === 'keahlian' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Code size={14} />
              <span>5. Keahlian</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('proyek')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeStep === 'proyek' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Award size={14} />
              <span>6. Proyek & Lisensi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('target')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeStep === 'target' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <span>7. Target Lamaran</span>
            </button>
          </div>

          {/* Form Fields Section */}
          <fieldset disabled={isFormLocked} className="p-5 lg:p-6 text-xs space-y-6">
            {/* STEP 1: DATA PRIBADI */}
            {activeStep === 'pribadi' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">1. Informasi Kontak & Biodata Utama</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">* Wajib diisi</span>
                </div>

                {/* Foto Profil Upload */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-indigo-200 shrink-0 flex items-center justify-center">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Foto Profil" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <h4 className="font-bold text-slate-800 text-xs">Foto Profil (Formal / Profesional)</h4>
                    <p className="text-[11px] text-slate-500">
                      Disarankan foto berlatar polos (putih/biru/merah) dengan pencahayaan jelas. Format PNG, JPG (Maks. 5MB).
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <label className={`px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer flex items-center gap-1 transition-colors ${isFormLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Camera size={13} />
                        <span>Pilih Foto Berkas</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isFormLocked} className="hidden" />
                      </label>
                      {formData.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoUrl: '' })}
                          disabled={isFormLocked}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-medium transition-colors"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Biodata Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Contoh: Bagas Aditya Pratama, S.Kom."
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gelar Profesional / Headline *</label>
                    <input
                      type="text"
                      value={formData.professionalTitle}
                      onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                      placeholder="Contoh: Senior Frontend Engineer"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Aktif *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@domain.com"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp Aktif *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kota Domisili</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Contoh: Jakarta Selatan"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Negara</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Indonesia"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SUMMARY */}
            {activeStep === 'ringkasan' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">2. Ringkasan Eksekutif / Profil Singkat</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">* Wajib diisi</span>
                </div>

                <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-indigo-950 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-xs text-indigo-900">
                    <HelpCircle size={14} className="text-indigo-600" />
                    Tips Penulisan Ringkasan yang Menarik HRD:
                  </span>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Tuliskan 2-4 kalimat ringkas yang memuat: Total tahun pengalaman, spesialisasi utama, pencapaian kuantitatif terbesar, dan nilai tambah yang bisa Anda berikan pada perusahaan baru.
                  </p>
                </div>

                <textarea
                  rows={6}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Tuliskan ringkasan profesional Anda di sini..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed font-medium"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Panjang karakter: {formData.summary?.length || 0} karakter</span>
                  <span>Rekomendasi: 150 - 400 karakter</span>
                </div>
              </div>
            )}

            {/* STEP 3: EXPERIENCE */}
            {activeStep === 'pengalaman' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">3. Riwayat Pengalaman Kerja & Organisasi</h3>
                    <p className="text-[11px] text-slate-500">Urutkan dari pekerjaan terbaru / terkini.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addExperience}
                    disabled={isFormLocked}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Plus size={13} />
                    <span>Tambah Pekerjaan</span>
                  </button>
                </div>

                {(formData.experiences || []).length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 space-y-2">
                    <Briefcase size={24} className="mx-auto text-slate-300" />
                    <p>Belum ada riwayat pengalaman kerja yang ditambahkan.</p>
                    <button
                      type="button"
                      onClick={addExperience}
                      disabled={isFormLocked}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs"
                    >
                      + Tambah Pengalaman Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(formData.experiences || []).map((exp, idx) => (
                      <div key={exp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Briefcase size={14} className="text-indigo-600" />
                            <span>Pekerjaan #{idx + 1}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExperience(exp.id)}
                            disabled={isFormLocked}
                            className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Posisi / Jabatan *</label>
                            <input
                              type="text"
                              value={exp.position}
                              onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                              placeholder="Contoh: Senior Frontend Developer"
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Organisasi *</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              placeholder="Contoh: PT Bank Central Asia Tbk"
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Lokasi (Kota / Remote)</label>
                            <input
                              type="text"
                              value={exp.location || ''}
                              onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                              placeholder="Contoh: Jakarta (Hybrid)"
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Tgl Mulai</label>
                              <input
                                type="text"
                                value={exp.startDate}
                                onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                placeholder="2022-01"
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Tgl Selesai</label>
                              <input
                                type="text"
                                value={exp.endDate}
                                onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                placeholder="Sekarang / 2023-12"
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Uraian Tugas & Pencapaian Kerja (Pisahkan 1 baris per poin)
                          </label>
                          <textarea
                            rows={3}
                            value={exp.bulletPoints?.join('\n') || ''}
                            onChange={(e) => updateExperience(exp.id, 'bulletPoints', e.target.value.split('\n'))}
                            placeholder="Memimpin tim 5 orang engineer...&#10;Meningkatkan performa web hingga 40%..."
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg leading-relaxed text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: EDUCATION */}
            {activeStep === 'pendidikan' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">4. Riwayat Pendidikan Formal</h3>
                    <p className="text-[11px] text-slate-500">Universitas, Institut, Politeknik, atau SMA/SMK.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addEducation}
                    disabled={isFormLocked}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Plus size={13} />
                    <span>Tambah Pendidikan</span>
                  </button>
                </div>

                {(formData.educations || []).length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 space-y-2">
                    <GraduationCap size={24} className="mx-auto text-slate-300" />
                    <p>Belum ada riwayat pendidikan yang ditambahkan.</p>
                    <button
                      type="button"
                      onClick={addEducation}
                      disabled={isFormLocked}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs"
                    >
                      + Tambah Pendidikan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(formData.educations || []).map((edu, idx) => (
                      <div key={edu.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <GraduationCap size={14} className="text-indigo-600" />
                            <span>Pendidikan #{idx + 1}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEducation(edu.id)}
                            disabled={isFormLocked}
                            className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Nama Universitas / Sekolah *</label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => {
                                const updated = (formData.educations || []).map((item) =>
                                  item.id === edu.id ? { ...item, institution: e.target.value } : item
                                );
                                setFormData({ ...formData, educations: updated });
                              }}
                              placeholder="Contoh: Universitas Indonesia"
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Gelar & Jurusan *</label>
                            <input
                              type="text"
                              value={edu.major}
                              onChange={(e) => {
                                const updated = (formData.educations || []).map((item) =>
                                  item.id === edu.id ? { ...item, major: e.target.value } : item
                                );
                                setFormData({ ...formData, educations: updated });
                              }}
                              placeholder="Contoh: Sarjana Komputer - Ilmu Komputer"
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Tahun Mulai - Selesai</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={edu.startYear}
                                onChange={(e) => {
                                  const updated = (formData.educations || []).map((item) =>
                                    item.id === edu.id ? { ...item, startYear: e.target.value } : item
                                  );
                                  setFormData({ ...formData, educations: updated });
                                }}
                                placeholder="2017"
                                className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg"
                              />
                              <input
                                type="text"
                                value={edu.endYear}
                                onChange={(e) => {
                                  const updated = (formData.educations || []).map((item) =>
                                    item.id === edu.id ? { ...item, endYear: e.target.value } : item
                                  );
                                  setFormData({ ...formData, educations: updated });
                                }}
                                placeholder="2021"
                                className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">IPK / Nilai Rata-rata</label>
                            <input
                              type="text"
                              value={edu.gpa || ''}
                              onChange={(e) => {
                                const updated = (formData.educations || []).map((item) =>
                                  item.id === edu.id ? { ...item, gpa: e.target.value } : item
                                );
                                setFormData({ ...formData, educations: updated });
                              }}
                              placeholder="Contoh: 3.82 / 4.00 (Cum Laude)"
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: SKILLS & LANGUAGES */}
            {activeStep === 'keahlian' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">5. Keahlian, Tools & Penguasaan Bahasa</h3>
                </div>

                <div className="space-y-3">
                  <label className="font-semibold text-slate-800 block text-xs">Kategori Keahlian (Skills)</label>
                  {(formData.skills || []).map((cat) => (
                    <div key={cat.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-800 text-xs block">{cat.categoryName}</span>
                      <input
                        type="text"
                        value={(cat.skills || []).join(', ')}
                        onChange={(e) => {
                          const skillsArray = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          const updated = (formData.skills || []).map((c) =>
                            c.id === cat.id ? { ...c, skills: skillsArray } : c
                          );
                          setFormData({ ...formData, skills: updated });
                        }}
                        placeholder="Pisahkan dengan tanda koma: React, TypeScript, Tailwind CSS, REST API"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-2">
                  <label className="font-semibold text-slate-800 block text-xs">Kemampuan Bahasa</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.languages?.map((lang, idx) => (
                      <div key={lang.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{lang.language}</span>
                          <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded ml-2">
                            {lang.proficiency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="font-semibold text-slate-800 block text-xs">Tautan Profil & Portofolio Online</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">LinkedIn URL</label>
                      <input
                        type="text"
                        value={formData.socialLinks?.find((s) => s.platform === 'LinkedIn')?.url || ''}
                        onChange={(e) => {
                          const otherLinks = (formData.socialLinks || []).filter((s) => s.platform !== 'LinkedIn');
                          setFormData({
                            ...formData,
                            socialLinks: [...otherLinks, { id: 'SOC-LI', platform: 'LinkedIn', url: e.target.value }]
                          });
                        }}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Website Portofolio / GitHub / Behance</label>
                      <input
                        type="text"
                        value={formData.socialLinks?.find((s) => s.platform === 'Portfolio Web')?.url || ''}
                        onChange={(e) => {
                          const liLink = (formData.socialLinks || []).find((s) => s.platform === 'LinkedIn');
                          const newLinks = liLink ? [liLink] : [];
                          if (e.target.value) {
                            newLinks.push({ id: 'SOC-PORT', platform: 'Portfolio Web', url: e.target.value });
                          }
                          setFormData({ ...formData, socialLinks: newLinks });
                        }}
                        placeholder="https://myportfolio.com"
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: PROJECTS & CERTIFICATES */}
            {activeStep === 'proyek' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-sm">Proyek Unggulan / Portofolio Kerja</h3>
                    <button
                      type="button"
                      onClick={addProject}
                      disabled={isFormLocked}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Plus size={13} />
                      <span>Tambah Proyek</span>
                    </button>
                  </div>

                  {formData.projects?.map((proj) => (
                    <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const updated = formData.projects.map((p) =>
                              p.id === proj.id ? { ...p, title: e.target.value } : p
                            );
                            setFormData({ ...formData, projects: updated });
                          }}
                          placeholder="Judul Proyek"
                          className="font-bold text-slate-900 p-1.5 bg-white border rounded w-2/3"
                        />
                        <button
                          type="button"
                          onClick={() => removeProject(proj.id)}
                          disabled={isFormLocked}
                          className="text-rose-600 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => {
                          const updated = formData.projects.map((p) =>
                            p.id === proj.id ? { ...p, description: e.target.value } : p
                          );
                          setFormData({ ...formData, projects: updated });
                        }}
                        placeholder="Deskripsi singkat dampak dan hasil proyek..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-sm">Sertifikasi & Lisensi Profesional</h3>
                    <button
                      type="button"
                      onClick={addCertification}
                      disabled={isFormLocked}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Plus size={13} />
                      <span>Tambah Sertifikat</span>
                    </button>
                  </div>

                  {formData.certifications?.map((cert) => (
                    <div key={cert.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          value={cert.title}
                          onChange={(e) => {
                            const updated = formData.certifications.map((c) =>
                              c.id === cert.id ? { ...c, title: e.target.value } : c
                            );
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="Nama Sertifikasi"
                          className="p-1.5 bg-white border rounded text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => {
                            const updated = formData.certifications.map((c) =>
                              c.id === cert.id ? { ...c, issuer: e.target.value } : c
                            );
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="Lembaga Penerbit (e.g. Google / BNSP)"
                          className="p-1.5 bg-white border rounded text-xs"
                        />
                        <input
                          type="text"
                          value={cert.issueDate}
                          onChange={(e) => {
                            const updated = formData.certifications.map((c) =>
                              c.id === cert.id ? { ...c, issueDate: e.target.value } : c
                            );
                            setFormData({ ...formData, certifications: updated });
                          }}
                          placeholder="Tahun (e.g. 2023)"
                          className="p-1.5 bg-white border rounded text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertification(cert.id)}
                        disabled={isFormLocked}
                        className="text-rose-600 hover:text-rose-700 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: TARGET JOB */}
            {activeStep === 'target' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">7. Target Lamaran & Catatan Desain Dokumen</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Posisi / Jabatan yang Dituju</label>
                    <input
                      type="text"
                      value={formData.targetJobTitle || ''}
                      onChange={(e) => setFormData({ ...formData, targetJobTitle: e.target.value })}
                      placeholder="Contoh: Senior Operations Manager"
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan Target</label>
                    <input
                      type="text"
                      value={formData.targetCompany || ''}
                      onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                      placeholder="Contoh: PT Shopee International / Unilever"
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Khusus untuk Tim Desainer (Opsional)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.coverLetterNotes || ''}
                    onChange={(e) => setFormData({ ...formData, coverLetterNotes: e.target.value })}
                    placeholder="Sebutkan preferensi desain, warna favorit, fokus prestasi yang ingin ditonjolkan, atau instruksi khusus..."
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs leading-relaxed"
                  />
                </div>
              </div>
            )}
          </fieldset>

          {/* Bottom Action Toolbar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-slate-500 text-[11px]">
              {isFormLocked ? '🔒 Formulir terkunci setelah dikirim' : '💾 Perubahan tersimpan otomatis'}
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {!isFormLocked && (
                <button
                  type="button"
                  onClick={handleDraftSave}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <Save size={13} />
                  <span>Simpan Draf</span>
                </button>
              )}

              {isFormLocked ? (
                <button
                  type="button"
                  onClick={() => setIsRequestEditModalOpen(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <KeyRound size={14} />
                  <span>Ajukan Perubahan Data</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Send size={14} />
                  <span>Kirim Data ke Seller</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: SUBMIT CONFIRMATION */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                <Send size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Konfirmasi Kirim Data ke Seller</h3>
              <p className="text-slate-500 text-xs">
                Apakah seluruh data untuk pesanan <strong>{order.id}</strong> ({order.productType}) sudah benar dan siap diproses oleh tim desainer?
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>Kelengkapan Formulir:</span>
                <span className="text-indigo-700 font-bold">{progressPercentage}% Lengkap</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={formData.fullName ? 'text-emerald-600' : 'text-slate-300'} />
                  <span>Data Pribadi ({formData.fullName || 'Belum lengkap'})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={formData.summary ? 'text-emerald-600' : 'text-slate-300'} />
                  <span>Profil Ringkas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={formData.experiences?.length ? 'text-emerald-600' : 'text-slate-300'} />
                  <span>{formData.experiences?.length || 0} Pengalaman Kerja</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={formData.educations?.length ? 'text-emerald-600' : 'text-slate-300'} />
                  <span>{formData.educations?.length || 0} Pendidikan</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cek Kembali
              </button>
              <button
                type="button"
                onClick={handleSubmitFinal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Ya, Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST EDIT MODAL */}
      {isRequestEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center gap-2.5 pb-2 border-b">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <KeyRound size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ajukan Izin Perubahan Data</h3>
                <span className="text-[11px] text-slate-400">Pesanan #{order.id}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">
                Alasan / Poin Data yang Ingin Diperbarui *
              </label>
              <textarea
                rows={3}
                value={editReasonText}
                onChange={(e) => setEditReasonText(e.target.value)}
                placeholder="Contoh: Ingin menambahkan sertifikasi baru atau mengupdate periode pekerjaan terkini..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-amber-500 font-medium"
              />
              <p className="text-[11px] text-slate-500">
                Permintaan ini akan dikirimkan ke seller/desainer. Setelah disetujui, formulir akan otomatis terbuka kembali agar Anda dapat mengirimkan data terbaru.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsRequestEditModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRequestEdit}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>Kirim Permintaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SUCCESS SUBMITTED MODAL */}
      {isSuccessSubmittedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Data Berhasil Terkirim ke Seller!</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Terima kasih! Seluruh formulir pesanan <strong>#{order.id}</strong> telah tersimpan dan siap diproses ke tahap pengerjaan.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left space-y-2">
              <div className="flex items-center justify-between text-emerald-950 font-semibold">
                <span>Status Pesanan:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Data Masuk</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Tim desainer kami akan memvalidasi data dan mulai menyusun draf dokumen sesuai template dan instruksi Anda.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSendConfirmationToSellerWhatsApp}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={15} />
                <span>Kirim Konfirmasi ke WhatsApp Seller</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSuccessSubmittedModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Tutup & Lihat Formulir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
