import { 
  Order, 
  DocumentTemplate, 
  StaffMember, 
  ShopeeProduct, 
  ShopeeSyncLog, 
  AppSettings,
  CustomerData 
} from '../types';

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'STF-001',
    name: 'Rian Pratama',
    role: 'Admin',
    email: 'rian@arisecareer.id',
    phone: '081234567890',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    activeOrdersCount: 4,
    completedOrdersCount: 142,
    status: 'Aktif',
  },
  {
    id: 'STF-002',
    name: 'Anisa Wulandari',
    role: 'Operator',
    email: 'anisa@arisecareer.id',
    phone: '081298765432',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    activeOrdersCount: 8,
    completedOrdersCount: 215,
    status: 'Aktif',
  },
  {
    id: 'STF-003',
    name: 'Dimas Anggara',
    role: 'Designer',
    email: 'dimas@arisecareer.id',
    phone: '081345678912',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    activeOrdersCount: 6,
    completedOrdersCount: 189,
    status: 'Aktif',
  },
  {
    id: 'STF-004',
    name: 'Siti Rahma',
    role: 'Designer',
    email: 'siti@arisecareer.id',
    phone: '081399887766',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    activeOrdersCount: 5,
    completedOrdersCount: 98,
    status: 'Aktif',
  }
];

export const INITIAL_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'TMP-ATS-01',
    name: 'ATS Standard Harvad Minimalist',
    category: 'ATS',
    style: 'Minimalis',
    description: 'Format baku standar Harvard dengan rasio kelolosan ATS tertinggi (99%). Layout 1 kolom bersih tanpa elemen grafis penghalang parser.',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=80',
    fontFamily: 'Inter',
    primaryColor: '#0f172a',
    accentColor: '#334155',
    layout: 'single-column',
    sections: [
      { key: 'summary', label: 'Ringkasan Profesional', isVisible: true, order: 1 },
      { key: 'experience', label: 'Pengalaman Kerja', isVisible: true, order: 2 },
      { key: 'education', label: 'Pendidikan', isVisible: true, order: 3 },
      { key: 'skills', label: 'Keahlian & Kemampuan', isVisible: true, order: 4 },
      { key: 'certifications', label: 'Sertifikasi & Lisensi', isVisible: true, order: 5 },
      { key: 'languages', label: 'Bahasa', isVisible: true, order: 6 }
    ],
    isAtsCompliant: true,
    isFavorite: true,
    isActive: true,
    tags: ['ATS-Friendly', 'Harvard Standard', 'Single Column', 'Corporate', 'BUMN & MNC'],
    supportedProducts: ['CV ATS-Friendly', 'Executive Resume & Bio', 'Paket Komplit (CV + Portfolio + CL)'],
    usageCount: 348,
    createdAt: '2025-01-10T08:00:00Z'
  },
  {
    id: 'TMP-MOD-01',
    name: 'Executive Slate Two-Column',
    category: 'Modern',
    style: 'Modern Split',
    description: 'Layout modern dengan sidebar kiri untuk kontak, keahlian, dan bahasa. Cocok untuk profesional menengah hingga manajerial.',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    fontFamily: 'Plus Jakarta Sans',
    primaryColor: '#1e293b',
    accentColor: '#2563eb',
    layout: 'two-column-left',
    sections: [
      { key: 'summary', label: 'Ringkasan Profesional', isVisible: true, order: 1 },
      { key: 'experience', label: 'Pengalaman Kerja', isVisible: true, order: 2 },
      { key: 'education', label: 'Pendidikan', isVisible: true, order: 3 },
      { key: 'projects', label: 'Proyek Unggulan', isVisible: true, order: 4 },
      { key: 'skills', label: 'Keahlian & Kemampuan', isVisible: true, order: 5 },
      { key: 'languages', label: 'Bahasa', isVisible: true, order: 6 }
    ],
    isAtsCompliant: true,
    isFavorite: true,
    isActive: true,
    tags: ['Modern', 'Sidebar', 'Tech & Startup', 'Clean'],
    supportedProducts: ['CV ATS-Friendly', 'CV Kreatif / Desain', 'Paket Komplit (CV + Portfolio + CL)'],
    usageCount: 289,
    createdAt: '2025-01-15T08:00:00Z'
  },
  {
    id: 'TMP-EXE-01',
    name: 'Nordic Serif Editorial',
    category: 'Executive',
    style: 'Editorial',
    description: 'Tipografi klasik elegan dengan aksen serif Merriweather untuk posisi C-Level, konsultan, finance, dan akademisi.',
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&auto=format&fit=crop&q=80',
    fontFamily: 'Merriweather',
    primaryColor: '#1c1917',
    accentColor: '#047857',
    layout: 'single-column',
    sections: [
      { key: 'summary', label: 'Ringkasan Profesional', isVisible: true, order: 1 },
      { key: 'experience', label: 'Pengalaman Kerja', isVisible: true, order: 2 },
      { key: 'education', label: 'Pendidikan', isVisible: true, order: 3 },
      { key: 'skills', label: 'Keahlian & Kemampuan', isVisible: true, order: 4 },
      { key: 'certifications', label: 'Sertifikasi & Lisensi', isVisible: true, order: 5 }
    ],
    isAtsCompliant: true,
    isFavorite: false,
    isActive: true,
    tags: ['Executive', 'Serif', 'Finance', 'Law & Consulting'],
    supportedProducts: ['Executive Resume & Bio', 'CV ATS-Friendly'],
    usageCount: 142,
    createdAt: '2025-02-01T08:00:00Z'
  },
  {
    id: 'TMP-CRE-01',
    name: 'Creative Studio Bold Accent',
    category: 'Creative',
    style: 'Visual Bold',
    description: 'Desain visual elegan berbobot tinggi untuk desainer grafis, UI/UX, arsitek, content creator, dan marketing spesialis.',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop&q=80',
    fontFamily: 'Plus Jakarta Sans',
    primaryColor: '#09090b',
    accentColor: '#7c3aed',
    layout: 'header-card',
    sections: [
      { key: 'summary', label: 'Ringkasan Profil', isVisible: true, order: 1 },
      { key: 'projects', label: 'Proyek Portofolio', isVisible: true, order: 2 },
      { key: 'experience', label: 'Pengalaman Kerja', isVisible: true, order: 3 },
      { key: 'skills', label: 'Keahlian Visual', isVisible: true, order: 4 },
      { key: 'education', label: 'Pendidikan', isVisible: true, order: 5 }
    ],
    isAtsCompliant: false,
    isFavorite: true,
    isActive: true,
    tags: ['Kreatif', 'Visual', 'Design', 'Marketing', 'UI/UX'],
    supportedProducts: ['CV Kreatif / Desain', 'Paket Komplit (CV + Portfolio + CL)'],
    usageCount: 210,
    createdAt: '2025-02-10T08:00:00Z'
  },
  {
    id: 'TMP-PORT-01',
    name: 'Project Grid Showcase (Portfolio)',
    category: 'Portfolio',
    style: 'Tech Grid',
    description: 'Struktur portfolio komprehensif menampilkan highlight proyek unggulan, stack teknologi, peran tim, dan visualisasi tautan proyek.',
    thumbnail: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400&auto=format&fit=crop&q=80',
    fontFamily: 'Plus Jakarta Sans',
    primaryColor: '#0f172a',
    accentColor: '#0284c7',
    layout: 'grid-portfolio',
    sections: [
      { key: 'projects', label: 'Proyek Unggulan', isVisible: true, order: 1 },
      { key: 'skills', label: 'Tech Stack & Competencies', isVisible: true, order: 2 }
    ],
    isAtsCompliant: false,
    isFavorite: true,
    isActive: true,
    tags: ['Portfolio', 'Project Showcase', 'Tech Stack', 'Web & UI/UX'],
    supportedProducts: ['Portfolio Profesional', 'Paket Komplit (CV + Portfolio + CL)'],
    usageCount: 175,
    createdAt: '2025-02-20T08:00:00Z'
  },
  {
    id: 'TMP-CL-01',
    name: 'Official Corporate Cover Letter',
    category: 'CoverLetter',
    style: 'Korporat',
    description: 'Format surat lamaran kerja resmi dengan kop nama profesional, narasi value proposition terstruktur, dan penutup persuasif.',
    thumbnail: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&auto=format&fit=crop&q=80',
    fontFamily: 'Inter',
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
    layout: 'single-column',
    sections: [],
    isAtsCompliant: true,
    isFavorite: true,
    isActive: true,
    tags: ['Cover Letter', 'Surat Lamaran', 'Resmi', 'ATS-Friendly'],
    supportedProducts: ['Cover Letter / Surat Lamaran', 'Paket Komplit (CV + Portfolio + CL)'],
    usageCount: 312,
    createdAt: '2025-03-01T08:00:00Z'
  }
];

export const SAMPLE_CUSTOMER_DATA: CustomerData = {
  id: 'CUST-001',
  fullName: 'Bagas Aditya Pratama, S.Kom.',
  professionalTitle: 'Senior Frontend Engineer & UI/UX Specialist',
  email: 'bagas.aditya@gmail.com',
  phone: '0812-9844-3210',
  city: 'Jakarta Selatan',
  country: 'Indonesia',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  summary: 'Software Engineer berpengalaman 4+ tahun dalam membangun aplikasi web modern berskala besar menggunakan React, TypeScript, dan arsitektur Next.js. Memiliki rekam jejak meningkatkan performa load time aplikasi hingga 40% dan mengoptimalkan konversi user flow sistem perbankan & SaaS.',
  targetJobTitle: 'Lead Frontend Developer',
  targetCompany: 'PT Bank Central Asia Tbk / Tiket.com',
  jobVacancySource: 'LinkedIn Job Board',
  coverLetterNotes: 'Tekankan kepemimpinan tim 5 engineer dan pengalaman integrasi micro-frontend perbankan digital.',
  educations: [
    {
      id: 'EDU-1',
      institution: 'Universitas Indonesia',
      degree: 'Sarjana Komputer (S.Kom.)',
      major: 'Ilmu Komputer',
      startYear: '2017',
      endYear: '2021',
      gpa: '3.82 / 4.00 (Cum Laude)',
      achievements: 'Juara 1 National Hackathon Gemastik XIV Kategori Software Development 2020.'
    }
  ],
  experiences: [
    {
      id: 'EXP-1',
      company: 'PT Fintek Karya Nusantara (LinkAja)',
      position: 'Senior Frontend Engineer',
      location: 'Jakarta (Hybrid)',
      startDate: '2022-03',
      endDate: 'Sekarang',
      isCurrent: true,
      bulletPoints: [
        'Memimpin pengembangan modul Merchant Dashboard yang melayani 250.000+ UMKM harian di seluruh Indonesia.',
        'Mengimplementasikan optimasi Web Vitals (LCP < 1.2s, CLS 0.01) sehingga menaikkan retention rate sebesar 18%.',
        'Menyusun reusable Design System berbasis Tailwind CSS dan Storybook yang digunakan lintas 4 tim squad engineering.',
        'Melakukan code review dan mentoring untuk 6 junior & mid-level frontend engineer secara berkala.'
      ]
    },
    {
      id: 'EXP-2',
      company: 'PT Global Tiket Network (Tiket.com)',
      position: 'Frontend Developer',
      location: 'Jakarta',
      startDate: '2020-08',
      endDate: '2022-02',
      isCurrent: false,
      bulletPoints: [
        'Membangun alur checkout hotel & flight internasional dengan React, Redux Toolkit, dan integrasi Payment Gateway.',
        'Mengurangi error crash rate hingga 0.05% dengan menerapkan testing terotomasi Jest dan React Testing Library.',
        'Berkolaborasi erat dengan Product Manager dan UI/UX Designer dalam A/B Testing halaman landing promo.'
      ]
    }
  ],
  skills: [
    {
      id: 'SKL-1',
      categoryName: 'Hard Skills & Frameworks',
      skills: ['React.js', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'RESTful API', 'Redux Toolkit', 'Jest']
    },
    {
      id: 'SKL-2',
      categoryName: 'Tools & DevOps',
      skills: ['Git & GitHub', 'Figma', 'Docker (Basic)', 'CI/CD Pipeline', 'Postman', 'Storybook', 'Vercel']
    },
    {
      id: 'SKL-3',
      categoryName: 'Soft Skills & Leadership',
      skills: ['Agile / Scrum Leadership', 'Problem Solving', 'Mentoring Tim', 'Komunikasi Lintas Divisi', 'Time Management']
    }
  ],
  certifications: [
    {
      id: 'CRT-1',
      title: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services (AWS)',
      issueDate: '2023',
      credentialId: 'AWS-9928174'
    },
    {
      id: 'CRT-2',
      title: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Meta (Coursera)',
      issueDate: '2022'
    }
  ],
  projects: [
    {
      id: 'PRJ-1',
      title: 'Enterprise Merchant Hub Platform',
      category: 'Fintech SaaS',
      role: 'Lead Frontend',
      description: 'Aplikasi manajemen transaksi multi-outlet real-time untuk pemilik bisnis dengan chart visualisasi analytics dan export invoice.',
      technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Recharts', 'Socket.io'],
      link: 'https://merchanthub.id/preview',
      date: '2023'
    },
    {
      id: 'PRJ-2',
      title: 'CareerCraft ATS Parser Simulator',
      category: 'Open Source Tool',
      role: 'Creator & Maintainer',
      description: 'Alat penguji kompatibilitas CV terhadap algoritma sistem Applicant Tracking System dengan visualisasi skor kecocokan kata kunci.',
      technologies: ['Next.js', 'WebAssembly', 'Tailwind CSS'],
      link: 'https://github.com/bagasaditya/ats-simulator',
      date: '2022'
    }
  ],
  languages: [
    { id: 'LNG-1', language: 'Bahasa Indonesia', proficiency: 'Penutur Asli' },
    { id: 'LNG-2', language: 'Bahasa Inggris', proficiency: 'Fasih' }
  ],
  socialLinks: [
    { id: 'SOC-1', platform: 'LinkedIn', url: 'https://linkedin.com/in/bagasadityapratama' },
    { id: 'SOC-2', platform: 'GitHub', url: 'https://github.com/bagasaditya' },
    { id: 'SOC-3', platform: 'Portfolio Web', url: 'https://bagasaditya.dev' }
  ],
  lastUpdated: '2025-05-18T10:30:00Z'
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2025-001284',
    marketplace: 'Shopee',
    marketplaceOrderId: '24051887KJ92X1',
    customerName: 'Bagas Aditya Pratama',
    customerPhone: '081298443210',
    customerEmail: 'bagas.aditya@gmail.com',
    productType: 'Paket Komplit (CV + Portfolio + CL)',
    variation: 'Bahasa Indonesia & English (Dual)',
    price: 189000,
    orderDate: '2025-05-18T09:15:00Z',
    deadlineDate: '2025-05-20T17:00:00Z',
    paymentStatus: 'Lunas',
    status: 'Sedang Dikerjakan',
    priority: 'Tinggi',
    templateId: 'TMP-ATS-01',
    assignedStaffId: 'STF-003',
    customerData: SAMPLE_CUSTOMER_DATA,
    customerFormSlug: 'form-ord-2025-001284',
    customerSubmittedAt: '2025-05-18T10:30:00Z',
    revisions: [
      {
        id: 'REV-1',
        version: 1,
        requestedAt: '2025-05-18T14:00:00Z',
        clientNotes: 'Mohon tambahkan sertifikasi AWS dan highlight pengalaman project di LinkAja.',
        operatorNotes: 'Sudah diakomodasi di draft V2.',
        status: 'Selesai',
        completedAt: '2025-05-18T16:20:00Z'
      }
    ],
    files: [
      {
        id: 'FIL-1',
        fileName: 'ORD-2025-001284_Bagas_Aditya_CV_ATS_V1_Draft.pdf',
        stage: 'Draft',
        version: 1,
        uploadedAt: '2025-05-18T12:00:00Z',
        fileSize: '342 KB',
        fileType: 'pdf'
      },
      {
        id: 'FIL-2',
        fileName: 'ORD-2025-001284_Bagas_Aditya_CV_ATS_V2_Preview.pdf',
        stage: 'Preview',
        version: 2,
        uploadedAt: '2025-05-18T16:30:00Z',
        fileSize: '356 KB',
        fileType: 'pdf'
      }
    ],
    internalNotes: 'Customer minta prioritas sebelum interview hari Rabu jam 10 pagi.'
  },
  {
    id: 'ORD-2025-001285',
    marketplace: 'Shopee',
    marketplaceOrderId: '2405189912BA09',
    customerName: 'Clara Michelle Simanjuntak',
    customerPhone: '085712398124',
    customerEmail: 'clara.michelle@yahoo.com',
    productType: 'CV ATS-Friendly',
    variation: 'Bahasa Indonesia (Standar)',
    price: 49000,
    orderDate: '2025-05-18T11:45:00Z',
    deadlineDate: '2025-05-20T12:00:00Z',
    paymentStatus: 'Lunas',
    status: 'Validasi Data',
    priority: 'Normal',
    templateId: 'TMP-ATS-01',
    assignedStaffId: 'STF-002',
    customerData: {
      ...SAMPLE_CUSTOMER_DATA,
      id: 'CUST-002',
      fullName: 'Clara Michelle Simanjuntak, S.E.',
      professionalTitle: 'Human Resources & Talent Acquisition Specialist',
      email: 'clara.michelle@yahoo.com',
      phone: '0857-1239-8124',
      city: 'Surabaya',
      summary: 'Talent Acquisition profesional dengan 3+ tahun pengalaman dalam end-to-end recruitment, employer branding, dan employee onboarding di sektor FMCG dan perhotelan internasional.',
      targetJobTitle: 'Talent Acquisition Partner',
      targetCompany: 'PT Unilever Indonesia Tbk'
    },
    customerFormSlug: 'form-ord-2025-001285',
    customerSubmittedAt: '2025-05-18T12:10:00Z',
    revisions: [],
    files: [],
    internalNotes: 'Data lengkap, tinggal operator assign ke designer.'
  },
  {
    id: 'ORD-2025-001286',
    marketplace: 'Tokopedia',
    marketplaceOrderId: 'INV/20250518/MPL/449128',
    customerName: 'Deni Kurniawan',
    customerPhone: '087811223344',
    customerEmail: 'deni.kurniawan@gmail.com',
    productType: 'CV Kreatif / Desain',
    variation: 'Bahasa Indonesia + Custom Color',
    price: 79000,
    orderDate: '2025-05-18T13:20:00Z',
    deadlineDate: '2025-05-21T18:00:00Z',
    paymentStatus: 'Lunas',
    status: 'Menunggu Data',
    priority: 'Normal',
    templateId: 'TMP-CRE-01',
    assignedStaffId: 'STF-002',
    customerData: {
      ...SAMPLE_CUSTOMER_DATA,
      id: 'CUST-003',
      fullName: 'Deni Kurniawan',
      professionalTitle: '',
      email: 'deni.kurniawan@gmail.com',
      phone: '0878-1122-3344',
      city: '',
      summary: '',
      educations: [],
      experiences: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      socialLinks: []
    },
    customerFormSlug: 'form-ord-2025-001286',
    revisions: [],
    files: [],
    internalNotes: 'Sudah dikirimkan WhatsApp pengingat form data pukul 13:30.'
  },
  {
    id: 'ORD-2025-001287',
    marketplace: 'WhatsApp',
    marketplaceOrderId: 'WA-20250518-091',
    customerName: 'Fajar Nugraha',
    customerPhone: '081399882211',
    customerEmail: 'fajar.nugraha@corporate.id',
    productType: 'Executive Resume & Bio',
    variation: 'English (Executive 2 Halaman)',
    price: 249000,
    orderDate: '2025-05-17T15:00:00Z',
    deadlineDate: '2025-05-19T18:00:00Z',
    paymentStatus: 'Lunas',
    status: 'Preview',
    priority: 'Urgent',
    templateId: 'TMP-EXE-01',
    assignedStaffId: 'STF-004',
    customerData: {
      ...SAMPLE_CUSTOMER_DATA,
      id: 'CUST-004',
      fullName: 'Fajar Nugraha, M.B.A.',
      professionalTitle: 'Head of Commercial Operations & Growth Strategy',
      email: 'fajar.nugraha@corporate.id',
      phone: '0813-9988-2211',
      city: 'Jakarta Pusat',
      summary: 'Senior business leader with 10+ years driving revenue acceleration, P&L management, and operational restructuring across SEA fast-moving tech unicorns.'
    },
    customerFormSlug: 'form-ord-2025-001287',
    customerSubmittedAt: '2025-05-17T16:00:00Z',
    revisions: [],
    files: [
      {
        id: 'FIL-4',
        fileName: 'ORD-2025-001287_Fajar_Nugraha_Executive_Resume_V1_Preview.pdf',
        stage: 'Preview',
        version: 1,
        uploadedAt: '2025-05-18T10:00:00Z',
        fileSize: '410 KB',
        fileType: 'pdf'
      }
    ],
    internalNotes: 'Preview sudah dikirim ke WhatsApp client, menunggu approval.'
  },
  {
    id: 'ORD-2025-001288',
    marketplace: 'Shopee',
    marketplaceOrderId: '2405177199ZX82',
    customerName: 'Nadia Salsabila',
    customerPhone: '082199334455',
    customerEmail: 'nadia.salsabila@gmail.com',
    productType: 'Cover Letter / Surat Lamaran',
    variation: 'Bahasa Indonesia + Word Editable',
    price: 39000,
    orderDate: '2025-05-17T10:00:00Z',
    deadlineDate: '2025-05-18T18:00:00Z',
    paymentStatus: 'Lunas',
    status: 'Selesai',
    priority: 'Normal',
    templateId: 'TMP-CL-01',
    assignedStaffId: 'STF-003',
    customerData: {
      ...SAMPLE_CUSTOMER_DATA,
      id: 'CUST-005',
      fullName: 'Nadia Salsabila, S.I.Kom.',
      professionalTitle: 'Digital Marketing & Content Strategist',
      email: 'nadia.salsabila@gmail.com',
      phone: '0821-9933-4455',
      city: 'Bandung',
      summary: 'Content strategist dan copywriter kreatif dengan portofolio mengelola social media campaign brand beauty ternama dengan engagement rate 6.8%.'
    },
    customerFormSlug: 'form-ord-2025-001288',
    customerSubmittedAt: '2025-05-17T11:00:00Z',
    revisions: [],
    files: [
      {
        id: 'FIL-5',
        fileName: 'ORD-2025-001288_Nadia_Salsabila_Cover_Letter_V1_Final.pdf',
        stage: 'Final',
        version: 1,
        uploadedAt: '2025-05-18T08:30:00Z',
        fileSize: '280 KB',
        fileType: 'pdf'
      }
    ],
    internalNotes: 'Pesanan telah selesai dan dikirim ke email & Shopee Chat.'
  }
];

export const INITIAL_SHOPEE_PRODUCTS: ShopeeProduct[] = [
  {
    id: 'SHP-001',
    shopeeItemId: '24890123981',
    title: 'Jasa Pembuatan CV ATS Friendly Lolos Screen HRD + File PDF & Word',
    sku: 'ARISE-CV-ATS-01',
    price: 49000,
    stock: 999,
    salesCount: 1420,
    status: 'NORMAL',
    mappedProductType: 'CV ATS-Friendly',
    defaultTemplateId: 'TMP-ATS-01',
    requiredFormFields: ['personal', 'summary', 'education', 'experience', 'skills', 'languages'],
    lastSyncAt: '2025-05-18T18:00:00Z'
  },
  {
    id: 'SHP-002',
    shopeeItemId: '24890123982',
    title: 'Jasa Desain CV Kreatif Modern Visual Portofolio Lamaran Kerja Startup',
    sku: 'ARISE-CV-CREATIVE-02',
    price: 79000,
    stock: 999,
    salesCount: 890,
    status: 'NORMAL',
    mappedProductType: 'CV Kreatif / Desain',
    defaultTemplateId: 'TMP-CRE-01',
    requiredFormFields: ['personal', 'photo', 'summary', 'education', 'experience', 'skills', 'projects', 'languages', 'socials'],
    lastSyncAt: '2025-05-18T18:00:00Z'
  },
  {
    id: 'SHP-003',
    shopeeItemId: '24890123983',
    title: 'Paket Komplit Super Karir: CV ATS + Portofolio PDF + Cover Letter Resmi',
    sku: 'ARISE-PAKET-KOMPLIT-03',
    price: 189000,
    stock: 999,
    salesCount: 654,
    status: 'NORMAL',
    mappedProductType: 'Paket Komplit (CV + Portfolio + CL)',
    defaultTemplateId: 'TMP-ATS-01',
    requiredFormFields: ['personal', 'photo', 'summary', 'education', 'experience', 'skills', 'certifications', 'projects', 'languages', 'socials', 'targetJob'],
    lastSyncAt: '2025-05-18T18:00:00Z'
  },
  {
    id: 'SHP-004',
    shopeeItemId: '24890123984',
    title: 'Jasa Pembuatan Cover Letter / Surat Lamaran Kerja Profesional HRD',
    sku: 'ARISE-COVER-LETTER-04',
    price: 39000,
    stock: 999,
    salesCount: 420,
    status: 'NORMAL',
    mappedProductType: 'Cover Letter / Surat Lamaran',
    defaultTemplateId: 'TMP-CL-01',
    requiredFormFields: ['personal', 'summary', 'experience', 'targetJob'],
    lastSyncAt: '2025-05-18T18:00:00Z'
  }
];

export const INITIAL_SHOPEE_LOGS: ShopeeSyncLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2025-05-18T18:00:00Z',
    action: 'Auto-Sync Periodic',
    ordersSynced: 3,
    status: 'Success',
    message: 'Berhasil menyinkronkan 3 pesanan baru dari Shopee Open API v2.'
  },
  {
    id: 'LOG-002',
    timestamp: '2025-05-18T12:00:00Z',
    action: 'Manual Refresh',
    ordersSynced: 1,
    status: 'Success',
    message: 'Sinkronisasi manual berhasil. 1 pesanan baru ditambahkan ke antrian.'
  },
  {
    id: 'LOG-003',
    timestamp: '2025-05-17T20:00:00Z',
    action: 'Webhook Event Order Paid',
    ordersSynced: 1,
    status: 'Success',
    message: 'Notifikasi pembayaran Shopee diterima untuk Pesanan #2405177199ZX82.'
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  brandName: 'Arise Career Craft',
  businessEmail: 'halo@arisecareer.id',
  businessPhone: '0812-8800-9900',
  orderIdPrefix: 'ORD',
  defaultDeadlineHours: 48,
  waTemplateWelcome: 'Halo kak {nama}, terima kasih telah memesan {produk} di Arise Career Craft. Mohon lengkapi formulir data karier melalui tautan berikut agar tim desainer kami dapat langsung memproses: {link_form}',
  waTemplatePreview: 'Halo kak {nama}, draf preview {produk} kakak sudah selesai dikerjakan! Silakan cek file berikut: {link_preview}. Jika ada revisi, silakan beri tahu kami ya.',
  waTemplateFinal: 'Halo kak {nama}, berkas final {produk} berkualitas cetak & ATS sudah selesai dan kami lampirkan. Terima kasih telah mempercayakan Arise Career Craft. Semoga sukses seleksi kerjanya!',
  shopeeAutoSync: true,
  shopeeSyncIntervalMinutes: 15,
  shopeeShopId: '89104421',
  shopeePartnerId: '20084591'
};
