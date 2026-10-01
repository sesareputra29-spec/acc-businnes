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
  ExternalLink, 
  Upload, 
  CheckCircle, 
  Copy, 
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Globe,
  Share2,
  SlidersHorizontal,
  FileSpreadsheet,
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
  RotateCcw,
  CheckCircle2,
  Link as LinkIcon,
  MessageSquare,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { formatDate, generateWhatsAppLink, generateClientFormUrl } from '../../utils/formatters';

interface Props {
  orders: Order[];
  selectedOrderId?: string;
  onShowToast: (msg: string) => void;
}

export const CustomerFormView: React.FC<Props> = ({
  orders,
  selectedOrderId,
  onShowToast
}) => {
  const [viewMode, setViewMode] = useState<'fill-form' | 'config-fields' | 'client-preview'>('fill-form');
  const [currentOrderId, setCurrentOrderId] = useState<string>(
    selectedOrderId || orders[0]?.id || ''
  );

  const currentOrder = orders.find((o) => o.id === currentOrderId) || orders[0];
  const [formData, setFormData] = useState<CustomerData>(
    currentOrder?.customerData || {
      id: 'CUST-NEW',
      fullName: '',
      professionalTitle: '',
      email: '',
      phone: '',
      city: '',
      country: 'Indonesia',
      summary: '',
      educations: [],
      experiences: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      socialLinks: [],
      lastUpdated: new Date().toISOString()
    }
  );

  const [activeStep, setActiveStep] = useState<
    'pribadi' | 'ringkasan' | 'pengalaman' | 'pendidikan' | 'keahlian' | 'proyek' | 'target'
  >('pribadi');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isRequestEditModalOpen, setIsRequestEditModalOpen] = useState(false);
  const [editReasonText, setEditReasonText] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic Form Configs State
  const [formConfigs, setFormConfigs] = useState<ProductFormFieldConfig[]>(() => storageService.getFormFieldConfigs());
  const [selectedProductForConfig, setSelectedProductForConfig] = useState<ProductType>('CV ATS-Friendly');

  // Available dynamic field definitions
  const ALL_DYNAMIC_FIELDS = [
    { key: 'personal', label: 'Data Pribadi & Kontak', desc: 'Nama, Gelar, Email, No. WA, Kota' },
    { key: 'photo', label: 'Upload Foto Profil', desc: 'Foto formal berlatar netral' },
    { key: 'summary', label: 'Ringkasan Profesional', desc: '2-4 kalimat profil singkat' },
    { key: 'experience', label: 'Pengalaman Kerja', desc: 'Jabatan, Perusahaan, Periode, Bullet Points' },
    { key: 'education', label: 'Pendidikan', desc: 'Kampus, Gelar, Jurusan, Tahun, IPK' },
    { key: 'skills', label: 'Keahlian & Kemampuan', desc: 'Hard skills, Soft skills, Software' },
    { key: 'certifications', label: 'Sertifikasi & Lisensi', desc: 'Sertifikat profesional dan penerbit' },
    { key: 'projects', label: 'Proyek Portofolio', desc: 'Kategori, Deskripsi, Tech Stack, Link' },
    { key: 'languages', label: 'Bahasa', desc: 'Bahasa dan tingkat kemahiran' },
    { key: 'socials', label: 'Sosial Media & Tautan', desc: 'LinkedIn, GitHub, Website' },
    { key: 'targetJob', label: 'Target Perusahaan & Posisi', desc: 'Perusahaan dan posisi untuk Cover Letter' }
  ];

  // Load order data when order selection changes
  useEffect(() => {
    if (currentOrder) {
      setFormData(currentOrder.customerData);
    }
  }, [currentOrderId, orders]);

  // Sync form configs
  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setFormConfigs(storageService.getFormFieldConfigs());
    });
    return () => {
      unsub();
    };
  }, []);

  if (!currentOrder && viewMode === 'fill-form') {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <AlertCircle size={28} className="mx-auto text-slate-400 mb-2" />
        <h3 className="font-bold text-slate-800 text-sm">Belum ada pesanan aktif</h3>
        <p className="text-xs text-slate-400 mt-1">Silakan buat pesanan baru terlebih dahulu untuk mengakses portal formulir.</p>
      </div>
    );
  }

  const currentProductConfig = formConfigs.find((c) => c.productType === currentOrder?.productType) || {
    productType: currentOrder?.productType || 'CV ATS-Friendly',
    requiredFields: ['personal', 'summary', 'education', 'experience', 'skills'],
    optionalFields: []
  };

  // Form lock status
  const isFormLockedForClient = currentOrder.isFormLocked ?? (currentOrder.status !== 'Menunggu Data' && !!currentOrder.customerSubmittedAt);
  const editRequestStatus = currentOrder.editRequestStatus || 'none';

  // Calculate Form Completion Percentage
  const calculateProgress = () => {
    let totalScore = 0;
    let maxScore = 0;

    // 1. Personal
    maxScore += 20;
    if (formData.fullName?.trim() && formData.email?.trim() && formData.phone?.trim()) {
      totalScore += 20;
    } else if (formData.fullName?.trim()) {
      totalScore += 10;
    }

    // 2. Summary
    maxScore += 15;
    if (formData.summary && formData.summary.trim().length > 30) {
      totalScore += 15;
    } else if (formData.summary?.trim()) {
      totalScore += 7;
    }

    // 3. Experience
    maxScore += 25;
    if (formData.experiences && formData.experiences.length > 0) {
      const validExps = formData.experiences.filter((e) => e.position && e.company);
      if (validExps.length > 0) totalScore += 25;
    }

    // 4. Education
    maxScore += 20;
    if (formData.educations && formData.educations.length > 0) {
      const validEdus = formData.educations.filter((e) => e.institution && e.major);
      if (validEdus.length > 0) totalScore += 20;
    }

    // 5. Skills & Others
    maxScore += 20;
    const hasSkills = formData.skills && formData.skills.some((s) => s.skills?.length > 0);
    if (hasSkills) totalScore += 20;

    return Math.min(100, Math.round((totalScore / maxScore) * 100));
  };

  const progressPercentage = calculateProgress();

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.fullName?.trim()) errors.push('Nama Lengkap & Gelar wajib diisi.');
    if (!formData.email?.trim()) errors.push('Email aktif wajib diisi.');
    if (!formData.phone?.trim()) errors.push('Nomor WhatsApp wajib diisi.');
    if (!formData.summary?.trim()) errors.push('Ringkasan profesional belum diisi.');

    if (currentProductConfig.requiredFields.includes('experience') && (!formData.experiences || formData.experiences.length === 0)) {
      errors.push('Minimal sertakan 1 riwayat pengalaman kerja / organisasi.');
    }

    if (currentProductConfig.requiredFields.includes('education') && (!formData.educations || formData.educations.length === 0)) {
      errors.push('Minimal sertakan 1 riwayat pendidikan terakhir.');
    }

    if (currentProductConfig.requiredFields.includes('targetJob') && !formData.targetJobTitle?.trim()) {
      errors.push('Posisi / Jabatan yang dituju wajib diisi untuk pembuatan Cover Letter.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleDraftSave = () => {
    const updated: CustomerData = {
      ...formData,
      lastUpdated: new Date().toISOString()
    };
    storageService.updateOrderCustomerData(currentOrder.id, updated);
    setFormData(updated);
    onShowToast(`Draf formulir pesanan ${currentOrder.id} (${formData.fullName || 'Klien'}) berhasil disimpan.`);
  };

  const handleSubmitFinal = () => {
    const isValid = validateForm();
    if (!isValid) {
      onShowToast('⚠️ Mohon lengkapi bagian wajib sebelum mengirim formulir.');
      return;
    }

    const nowIso = new Date().toISOString();
    const updated: CustomerData = {
      ...formData,
      lastUpdated: nowIso
    };

    // Update order data and progress status
    storageService.updateOrderCustomerData(currentOrder.id, updated);
    if (currentOrder.status === 'Menunggu Data') {
      storageService.updateOrderStatus(currentOrder.id, 'Data Masuk');
    }

    setIsSubmitModalOpen(false);
    onShowToast(`✓ Data formulir berhasil dikirim ke seller/desainer! Status pesanan: "Data Masuk".`);
  };

  // Client requests form edit/unlock
  const handleRequestEdit = () => {
    if (!editReasonText.trim()) {
      onShowToast('⚠️ Harap tuliskan alasan perubahan data.');
      return;
    }

    storageService.requestFormEdit(currentOrder.id, editReasonText.trim());
    setIsRequestEditModalOpen(false);
    setEditReasonText('');
    onShowToast('✓ Permintaan perubahan data telah dikirimkan ke seller untuk disetujui.');
  };

  // Seller approves form edit
  const handleApproveEdit = () => {
    storageService.approveFormEdit(currentOrder.id);
    onShowToast(`✓ Permintaan perubahan disetujui! Klien kini dapat mengubah dan mengirimkan data formulir baru.`);
  };

  // Seller manually locks form
  const handleLockForm = () => {
    storageService.lockForm(currentOrder.id);
    onShowToast(`🔒 Formulir pesanan ${currentOrder.id} telah dikunci kembali.`);
  };

  const handleCopyLink = () => {
    const url = generateClientFormUrl(
      currentOrder.id,
      currentOrder.customerName,
      currentOrder.productType,
      currentOrder.customerPhone
    );
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    onShowToast('Tautan formulir khusus klien disalin ke clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendFormLinkWhatsApp = () => {
    const settings = storageService.getSettings();
    const formUrl = generateClientFormUrl(
      currentOrder.id,
      currentOrder.customerName,
      currentOrder.productType,
      currentOrder.customerPhone
    );
    const message = settings.waTemplateWelcome
      .replace('{nama}', currentOrder.customerName)
      .replace('{produk}', currentOrder.productType)
      .replace('{link_form}', formUrl);
    
    const waLink = generateWhatsAppLink(currentOrder.customerPhone, message);
    window.open(waLink, '_blank');
    onShowToast(`Membuka WhatsApp untuk mengirimkan link formulir ke ${currentOrder.customerName}...`);
  };

  // Image Upload Handler
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

  // Toggle field in admin config
  const handleToggleConfigField = (product: ProductType, fieldKey: string) => {
    const targetConfig = formConfigs.find((c) => c.productType === product) || {
      productType: product,
      requiredFields: [],
      optionalFields: []
    };

    let newRequired = [...targetConfig.requiredFields];
    if (newRequired.includes(fieldKey)) {
      newRequired = newRequired.filter((k) => k !== fieldKey);
    } else {
      newRequired.push(fieldKey);
    }

    storageService.updateProductFormConfig(product, newRequired);
    onShowToast(`Konfigurasi form untuk produk "${product}" diperbarui.`);
  };

  // Pre-fill demo data
  const handlePreFillDemo = () => {
    const demoData: CustomerData = {
      id: formData.id || 'CUST-DEMO',
      fullName: 'Muhammad Farhan Rabbani, S.T.',
      professionalTitle: 'Operations & Supply Chain Project Lead',
      email: 'farhan.rabbani@gmail.com',
      phone: '0812-8822-1199',
      city: 'Tangerang Selatan',
      country: 'Indonesia',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      summary: 'Professional Supply Chain Engineer dengan 4+ tahun pengalaman dalam optimasi logistik pergudangan, inventory planning, dan perbaikan berkelanjutan (Kaizen / Lean Six Sigma). Berhasil menekan biaya operasional freight sebesar 14% di perusahaan manufaktur multinasional.',
      targetJobTitle: 'Supply Chain Operations Manager',
      targetCompany: 'PT Shopee International Indonesia / Unilever',
      jobVacancySource: 'LinkedIn Jobs',
      coverLetterNotes: 'Fokuskan pada sertifikasi Lean Six Sigma Green Belt dan pengalaman memimpin tim gudang 40 orang.',
      educations: [
        {
          id: 'EDU-1',
          institution: 'Institut Teknologi Bandung (ITB)',
          degree: 'Sarjana Teknik (S.T.)',
          major: 'Teknik Industri',
          startYear: '2017',
          endYear: '2021',
          gpa: '3.75 / 4.00',
          achievements: 'Lulusan Terpuji dengan Penghargaan Final Project Terbaik Kategori Logistik 2021.'
        }
      ],
      experiences: [
        {
          id: 'EXP-1',
          company: 'PT Fastock Logistics Nusantara',
          position: 'Senior Operations Lead',
          location: 'Jakarta',
          startDate: '2022-01',
          endDate: 'Sekarang',
          isCurrent: true,
          bulletPoints: [
            'Mengelola operasional fulfillment hub seluas 12.000 m2 dengan throughput 35.000 paket per hari.',
            'Menerapkan sistem automasi Warehouse Management System (WMS) yang memangkas waktu picking time hingga 25%.',
            'Memimpin audit keselamatan kerja K3 dan meraih zero-accident milestone selama 2 tahun berturut-turut.'
          ]
        },
        {
          id: 'EXP-2',
          company: 'PT Global E-Commerce Express',
          position: 'Logistics Process Specialist',
          location: 'Cikarang',
          startDate: '2020-08',
          endDate: '2021-12',
          isCurrent: false,
          bulletPoints: [
            'Merancang standar operasional prosedur (SOP) sortir armada first-mile yang mengurangi tingkat keterlambatan 18%.',
            'Mengembangkan dashboard monitoring armada berbasis Google Data Studio untuk visibilitas SLA pengiriman real-time.'
          ]
        }
      ],
      skills: [
        {
          id: 'SKL-1',
          categoryName: 'Technical & Systems',
          skills: ['SAP ERP', 'Warehouse Management System (WMS)', 'Supply Chain Planning', 'Six Sigma Lean', 'Data Analysis (Excel & Power BI)']
        },
        {
          id: 'SKL-2',
          categoryName: 'Soft Skills',
          skills: ['Team Leadership', 'Cross-functional Collaboration', 'Vendor Negotiation', 'Crisis Management']
        }
      ],
      certifications: [
        {
          id: 'CRT-1',
          title: 'Certified Supply Chain Professional (CSCP)',
          issuer: 'APICS / ASCM',
          issueDate: '2023',
          credentialId: 'CSCP-8890214'
        }
      ],
      projects: [
        {
          id: 'PRJ-1',
          title: 'Automated Hub Routing Optimization',
          category: 'Logistics Optimization',
          description: 'Restrukturisasi rute pengiriman last-mile area Jabodetabek menghemat biaya BBM Rp 450 Juta per tahun.',
          technologies: ['Python', 'Power BI', 'GIS Mapping'],
          date: '2023'
        }
      ],
      languages: [
        { id: 'LNG-1', language: 'Bahasa Indonesia', proficiency: 'Penutur Asli' },
        { id: 'LNG-2', language: 'Bahasa Inggris', proficiency: 'Profesional' }
      ],
      socialLinks: [
        { id: 'SOC-1', platform: 'LinkedIn', url: 'https://linkedin.com/in/farhanrabbani' }
      ],
      lastUpdated: new Date().toISOString()
    };

    setFormData(demoData);
    onShowToast('Data formulir berhasil diisi dengan data contoh lengkap!');
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
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              Portal Formulir Klien & Sistem Persetujuan
            </span>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Formulir Terenkripsi
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Pengisian Data Dokumen Karier Klien
          </h1>
          <p className="text-xs text-slate-500">
            Klien melengkapi data sesuai pesanan. Dilengkapi alur kirim data ke seller, pengajuan izin revisi data, dan persetujuan buka kunci formulir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('fill-form')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'fill-form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>Portal Admin</span>
            </button>
            <button
              onClick={() => setViewMode('client-preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'client-preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye size={13} />
              <span>Tampilan Frontend Klien</span>
            </button>
            <button
              onClick={() => setViewMode('config-fields')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'config-fields' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Atur Field</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CONFIG FIELDS BY PRODUCT */}
      {viewMode === 'config-fields' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pengaturan Dynamic Field Berdasarkan Produk</h2>
            <p className="text-slate-500 mt-0.5">
              Pilih produk layanan dan tentukan form field apa saja yang wajib diisi oleh klien ketika memesan produk tersebut:
            </p>
          </div>

          {/* Product selector tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {([
              'CV ATS-Friendly',
              'CV Kreatif / Desain',
              'Paket Komplit (CV + Portfolio + CL)',
              'Portfolio Profesional',
              'Cover Letter / Surat Lamaran',
              'Optimasi Profil LinkedIn',
              'Executive Resume & Bio'
            ] as ProductType[]).map((prod) => (
              <button
                key={prod}
                onClick={() => setSelectedProductForConfig(prod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedProductForConfig === prod
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {prod}
              </button>
            ))}
          </div>

          {/* Fields Toggle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {ALL_DYNAMIC_FIELDS.map((field) => {
              const activeConfig = formConfigs.find((c) => c.productType === selectedProductForConfig);
              const isRequired = activeConfig?.requiredFields?.includes(field.key);

              return (
                <div
                  key={field.key}
                  onClick={() => handleToggleConfigField(selectedProductForConfig, field.key)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    isRequired
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{field.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{field.desc}</p>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mt-2 ${
                      isRequired ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isRequired ? 'Aktif (Wajib Diisi)' : 'Nonaktif (Opsional)'}
                    </span>
                  </div>

                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    isRequired ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {isRequired && <Check size={13} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2 & 3: FORMULIR DATA KLIEN & FRONTEND CLIENT VIEW */
        <div className="space-y-4">
          {/* Seller / Admin Control Card (Shown in Admin Mode) */}
          {viewMode === 'fill-form' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                {/* Order Picker & Link Share Action */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 font-semibold">Pilih Pesanan:</span>
                  <select
                    value={currentOrderId}
                    onChange={(e) => setCurrentOrderId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 text-xs"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} — {o.customerName} ({o.productType})
                      </option>
                    ))}
                  </select>

                  {/* FOCUSED BUTTON: SALIN LINK KLIEN */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-lg transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95"
                    title="Salin tautan formulir mandiri khusus klien ini"
                  >
                    {copiedLink ? <Check size={13} className="text-emerald-600" /> : <LinkIcon size={13} />}
                    <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
                  </button>

                  {/* WhatsApp Quick Share Button */}
                  <button
                    type="button"
                    onClick={handleSendFormLinkWhatsApp}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-lg transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95"
                    title="Kirim link pengisian langsung ke WhatsApp klien"
                  >
                    <MessageSquare size={13} className="text-emerald-600" />
                    <span>Kirim WA</span>
                  </button>
                </div>

                {/* Seller Form Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handlePreFillDemo}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    title="Isi otomatis dengan data profil profesional"
                  >
                    <Sparkles size={13} className="text-amber-600" />
                    <span>Isi Data Contoh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDraftSave}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Save size={13} />
                    <span>Simpan Draf</span>
                  </button>
                </div>
              </div>

              {/* Edit Request Alert from Client to Seller */}
              {editRequestStatus === 'requested' && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <BellRing size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900 block text-xs">
                        🔔 Klien Mengajukan Permintaan Perubahan Data:
                      </span>
                      <p className="text-[11px] text-amber-800 mt-0.5 italic">
                        "{currentOrder.editRequestReason || 'Klien meminta izin untuk mengubah dan melengkapi datanya kembali.'}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleApproveEdit}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <Unlock size={13} />
                      <span>Setujui & Buka Kunci Form</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Lock Indicator in Admin */}
              {isFormLockedForClient && editRequestStatus !== 'requested' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Lock size={15} className="text-slate-500" />
                    <span>
                      Formulir klien saat ini <strong>terkunci (data sudah terkirim)</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApproveEdit}
                    className="px-2.5 py-1 text-indigo-700 hover:bg-indigo-50 font-semibold rounded text-[11px] border border-indigo-200"
                  >
                    Buka Kunci Manual
                  </button>
                </div>
              )}

              {!isFormLockedForClient && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Unlock size={15} className="text-emerald-600" />
                    <span>
                      Formulir dalam status <strong>terbuka (klien dapat mengedit dan mengirim data baru)</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLockForm}
                    className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 font-semibold rounded text-[11px] border border-slate-300"
                  >
                    Kunci Formulir
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FRONTEND CLIENT HERO HEADER (Shown in Client Preview Mode) */}
          {viewMode === 'client-preview' && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white shadow-md">
                    A
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">ARISE CAREER CRAFT — CLIENT PORTAL</h2>
                    <span className="text-[11px] text-indigo-300">Pengisian Data Dokumen Karier Pesanan #{currentOrder.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    isFormLockedForClient 
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' 
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                  }`}>
                    {isFormLockedForClient ? '🔒 Data Terkirim ke Seller' : '🔓 Mode Pengisian Data Aktif'}
                  </span>
                </div>
              </div>

              {/* Order Information & Live Status for Client */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pemesan:</span>
                  <span className="font-bold text-white text-sm block mt-0.5">{currentOrder.customerName}</span>
                  <span className="text-[11px] text-indigo-300">{currentOrder.customerPhone}</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Layanan & Target SLA:</span>
                  <span className="font-bold text-white text-sm block mt-0.5">{currentOrder.productType}</span>
                  <span className="text-[11px] text-emerald-400">Deadline: {formatDate(currentOrder.deadlineDate)}</span>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span className="text-slate-300 font-semibold">Kelengkapan Form:</span>
                    <span className="font-bold text-emerald-400">{progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>
              </div>

              {/* Lock / Request Edit Notification Banner for Client */}
              {isFormLockedForClient && editRequestStatus === 'none' && (
                <div className="p-3.5 bg-indigo-950/90 border border-indigo-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span className="text-indigo-200">
                      Data Anda telah berhasil terkirim ke seller/desainer. Ingin memperbarui riwayat atau menambah sertifikat?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRequestEditModalOpen(true)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 text-xs shadow-sm"
                  >
                    <KeyRound size={13} />
                    <span>Ajukan Perubahan Data</span>
                  </button>
                </div>
              )}

              {/* Waiting for approval banner for Client */}
              {isFormLockedForClient && editRequestStatus === 'requested' && (
                <div className="p-3.5 bg-amber-950/80 border border-amber-700/70 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={15} className="animate-spin text-amber-400 shrink-0" />
                    <span>
                      <strong>Permintaan Perubahan Terkirim:</strong> Menunggu seller menyetujui pembukaan kunci formulir...
                    </span>
                  </div>
                </div>
              )}

              {/* Edit Approved notification for Client */}
              {!isFormLockedForClient && editRequestStatus === 'approved' && (
                <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/70 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>
                      <strong>Persetujuan Diterima:</strong> Seller telah membuka kunci form! Silakan lakukan perubahan data lalu klik <em>Kirim Data Terbaru ke Seller</em>.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Dynamic Steps Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Step Navigation Tabs */}
            <div className="border-b border-slate-200 bg-slate-50/70 px-4 flex gap-2 overflow-x-auto text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveStep('pribadi')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeStep === 'pribadi' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
                }`}
              >
                <User size={14} />
                <span>1. Data Pribadi & Kontak</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('ringkasan')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeStep === 'ringkasan' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
                }`}
              >
                <span>2. Ringkasan Profil</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('pengalaman')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeStep === 'pengalaman' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Briefcase size={14} />
                <span>3. Pengalaman Kerja ({formData.experiences?.length || 0})</span>
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
                <span>5. Keahlian & Bahasa</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('proyek')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeStep === 'proyek' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Award size={14} />
                <span>6. Proyek & Sertifikasi</span>
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

            {/* Step Content */}
            <fieldset disabled={isFormLockedForClient && viewMode === 'client-preview'} className="p-5 lg:p-6 text-xs space-y-6">
              {/* STEP 1: DATA PRIBADI & UPLOAD FOTO */}
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
                        <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer flex items-center gap-1 transition-colors">
                          <Camera size={13} />
                          <span>Pilih Foto Berkas</span>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                        {formData.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photoUrl: '' })}
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
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Plus size={13} />
                      <span>Tambah Pekerjaan</span>
                    </button>
                  </div>

                  {formData.experiences.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 space-y-2">
                      <Briefcase size={24} className="mx-auto text-slate-300" />
                      <p>Belum ada riwayat pengalaman kerja yang ditambahkan.</p>
                      <button
                        type="button"
                        onClick={addExperience}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs"
                      >
                        + Tambah Pengalaman Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.experiences.map((exp, idx) => (
                        <div key={exp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Briefcase size={14} className="text-indigo-600" />
                              <span>Pekerjaan #{idx + 1}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExperience(exp.id)}
                              className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                              title="Hapus Pekerjaan"
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
                                  placeholder="2022-01 / Jan 2022"
                                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Tgl Selesai</label>
                                <input
                                  type="text"
                                  value={exp.endDate}
                                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                  placeholder="Sekarang / Des 2023"
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
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Plus size={13} />
                      <span>Tambah Pendidikan</span>
                    </button>
                  </div>

                  {formData.educations.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 space-y-2">
                      <GraduationCap size={24} className="mx-auto text-slate-300" />
                      <p>Belum ada riwayat pendidikan yang ditambahkan.</p>
                      <button
                        type="button"
                        onClick={addEducation}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs"
                      >
                        + Tambah Pendidikan
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.educations.map((edu, idx) => (
                        <div key={edu.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <GraduationCap size={14} className="text-indigo-600" />
                              <span>Pendidikan #{idx + 1}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEducation(edu.id)}
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
                                  const updated = formData.educations.map((item) =>
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
                                  const updated = formData.educations.map((item) =>
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
                                    const updated = formData.educations.map((item) =>
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
                                    const updated = formData.educations.map((item) =>
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
                                  const updated = formData.educations.map((item) =>
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

                  {/* Skills by category */}
                  <div className="space-y-3">
                    <label className="font-semibold text-slate-800 block text-xs">Kategori Keahlian (Skills)</label>
                    {formData.skills.map((cat) => (
                      <div key={cat.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="font-bold text-slate-800 text-xs block">{cat.categoryName}</span>
                        <input
                          type="text"
                          value={cat.skills.join(', ')}
                          onChange={(e) => {
                            const skillsArray = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            const updated = formData.skills.map((c) =>
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

                  {/* Languages */}
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

                  {/* Social Media Links */}
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
                            const otherLinks = (formData.socialLinks || []).filter((s) => s.platform !== 'Portfolio Web');
                            setFormData({
                              ...formData,
                              socialLinks: [...otherLinks, { id: 'SOC-PORT', platform: 'Portfolio Web', url: e.target.value }]
                            });
                          }}
                          placeholder="https://myportfolio.com atau https://github.com/..."
                          className="w-full p-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: PROJECTS & CERTIFICATIONS */}
              {activeStep === 'proyek' && (
                <div className="space-y-6">
                  {/* Projects */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-slate-900 text-sm">Proyek Unggulan / Portofolio Kerja</h3>
                      <button
                        type="button"
                        onClick={addProject}
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
                            placeholder="Judul Proyek (Contoh: Automated Warehouse Routing)"
                            className="font-bold text-slate-900 p-1.5 bg-white border rounded w-2/3"
                          />
                          <button
                            type="button"
                            onClick={() => removeProject(proj.id)}
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

                  {/* Certifications */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-slate-900 text-sm">Sertifikasi & Lisensi Profesional</h3>
                      <button
                        type="button"
                        onClick={addCertification}
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
                            placeholder="Lembaga Penerbit (e.g. BNSP / Google)"
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
                          className="text-rose-600 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: TARGET JOB & COVER LETTER NOTES */}
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

              {/* Bottom Action Toolbar */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-slate-400 text-[11px]">
                  Terakhir diperbarui: {formData.lastUpdated ? new Date(formData.lastUpdated).toLocaleString('id-ID') : 'Belum tersimpan'}
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {(!isFormLockedForClient || viewMode === 'fill-form') && (
                    <button
                      type="button"
                      onClick={handleDraftSave}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Save size={13} />
                      <span>Simpan Draf</span>
                    </button>
                  )}

                  {(!isFormLockedForClient || viewMode === 'fill-form') ? (
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Send size={13} />
                      <span>{editRequestStatus === 'approved' ? 'Kirim Data Terbaru ke Seller' : 'Kirim Formulir ke Seller'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRequestEditModalOpen(true)}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <KeyRound size={13} />
                      <span>Ajukan Perubahan Data</span>
                    </button>
                  )}
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      )}

      {/* MODAL 1: SUBMISSION CONFIRMATION */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                <Send size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Kirim Formulir ke Seller & Desainer</h3>
              <p className="text-slate-500 text-xs">
                Apakah seluruh data untuk pesanan <strong>{currentOrder.id}</strong> ({currentOrder.productType}) sudah selesai dan siap diproses?
              </p>
            </div>

            {/* Validation Checklist Check */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>Kelengkapan Data:</span>
                <span className="text-indigo-700 font-bold">{progressPercentage}% Lengkap</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={formData.fullName ? 'text-emerald-600' : 'text-slate-300'} />
                  <span>Data Pribadi & Kontak ({formData.fullName || 'Belum diisi'})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={formData.summary ? 'text-emerald-600' : 'text-slate-300'} />
                  <span>Ringkasan Eksekutif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={formData.experiences?.length ? 'text-emerald-600' : 'text-slate-300'} />
                  <span>{formData.experiences?.length || 0} Riwayat Pengalaman Kerja</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className={formData.educations?.length ? 'text-emerald-600' : 'text-slate-300'} />
                  <span>{formData.educations?.length || 0} Riwayat Pendidikan</span>
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
                <span>Ya, Kirim ke Seller</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST EDIT / UNLOCK FORM MODAL */}
      {isRequestEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ajukan Perubahan Data ke Seller</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Pesanan: #{currentOrder.id}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 text-xs leading-relaxed">
                Formulir Anda saat ini telah dikirim ke seller/desainer. Untuk menjaga konsistensi pengerjaan dokumen, silakan tuliskan poin perubahan yang ingin Anda edit agar seller dapat menyetujui pembukaan kunci formulir:
              </p>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Alasan / Poin Data yang Ingin Diubah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editReasonText}
                  onChange={(e) => setEditReasonText(e.target.value)}
                  placeholder="Contoh: Saya ingin mengupdate sertifikat kompetensi baru dan menambahkan uraian pencapaian pekerjaan terakhir..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
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
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>Kirim Pengajuan ke Seller</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
