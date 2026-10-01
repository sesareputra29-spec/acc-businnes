// Types for Arise Career Craft SaaS

export type MarketplaceSource = 'Shopee' | 'Tokopedia' | 'TikTok Shop' | 'WhatsApp' | 'Manual';

export type PaymentStatus = 'Lunas' | 'DP (50%)' | 'Menunggu Pembayaran';

export type ProductionStatus = 
  | 'Menunggu Data' 
  | 'Data Masuk' 
  | 'Validasi Data' 
  | 'Menunggu Produksi' 
  | 'Sedang Dikerjakan' 
  | 'Preview' 
  | 'Revisi' 
  | 'Finalisasi' 
  | 'Selesai';

export type ProductType = 
  | 'CV ATS-Friendly' 
  | 'CV Kreatif / Desain' 
  | 'Paket Komplit (CV + Portfolio + CL)' 
  | 'Portfolio Profesional' 
  | 'Cover Letter / Surat Lamaran' 
  | 'Optimasi Profil LinkedIn'
  | 'Executive Resume & Bio';

export type UserRole = 'Admin' | 'Operator' | 'Designer';

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  avatar: string;
  activeOrdersCount: number;
  completedOrdersCount: number;
  status: 'Aktif' | 'Cuti' | 'Nonaktif';
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  major: string;
  startYear: string;
  endYear: string;
  gpa?: string;
  achievements?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bulletPoints: string[];
}

export interface SkillCategory {
  id: string;
  categoryName: string; // e.g., 'Hard Skills', 'Soft Skills', 'Tools & Software'
  skills: string[];
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  role?: string;
  description: string;
  technologies: string[];
  link?: string;
  imageUrl?: string;
  date?: string;
}

export interface TestimonialItem {
  id: string;
  clientName: string;
  clientRole: string;
  company: string;
  feedback: string;
  avatarUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  caption?: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: 'Dasar' | 'Menengah' | 'Fasih' | 'Penutur Asli' | 'Profesional';
}

export interface SocialLink {
  id: string;
  platform: 'LinkedIn' | 'GitHub' | 'Behance' | 'Dribbble' | 'Portfolio Web' | 'Instagram' | 'Lainnya';
  url: string;
}

export interface CustomerData {
  id: string;
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  photoUrl?: string;
  summary: string;
  targetJobTitle?: string;
  targetCompany?: string;
  jobVacancySource?: string;
  coverLetterNotes?: string;
  educations: EducationItem[];
  experiences: ExperienceItem[];
  skills: SkillCategory[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
  gallery?: GalleryItem[];
  tools?: string[];
  testimonials?: TestimonialItem[];
  languages: LanguageItem[];
  socialLinks: SocialLink[];
  customSections?: { id: string; title: string; content: string }[];
  lastUpdated: string;
}

export type TemplateCategory = 'ATS' | 'Modern' | 'Executive' | 'Creative' | 'Portfolio' | 'CoverLetter';

export interface TemplateSectionConfig {
  key: string;
  label: string;
  isVisible: boolean;
  order: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  style: 'Minimalis' | 'Editorial' | 'Korporat' | 'Modern Split' | 'Visual Bold' | 'Tech Grid';
  description: string;
  thumbnail: string;
  fontFamily: 'Plus Jakarta Sans' | 'Inter' | 'Merriweather' | 'JetBrains Mono' | 'Montserrat';
  primaryColor: string;
  accentColor: string;
  layout: 'single-column' | 'two-column-left' | 'two-column-right' | 'header-card' | 'grid-portfolio';
  sections: TemplateSectionConfig[];
  isAtsCompliant: boolean;
  isFavorite: boolean;
  isActive: boolean;
  tags: string[];
  supportedProducts: ProductType[];
  usageCount: number;
  createdAt?: string;
}

export interface OrderRevision {
  id: string;
  version: number;
  requestedAt: string;
  clientNotes: string;
  operatorNotes?: string;
  status: 'Menunggu' | 'Dikerjakan' | 'Selesai';
  completedAt?: string;
}

export type FileStage = 'Draft' | 'Preview' | 'Revision' | 'Final';

export interface OrderFile {
  id: string;
  fileName: string;
  stage: FileStage;
  version: number;
  uploadedAt: string;
  fileSize: string;
  fileType: 'pdf' | 'docx' | 'png' | 'zip';
  url?: string;
}

export interface Order {
  id: string; // Format: ORD-YYYY-XXXXXX
  marketplace: MarketplaceSource;
  marketplaceOrderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  productType: ProductType;
  variation: string; // e.g., 'Bahasa Indonesia (1 Halaman)', 'English + Dual Format'
  price: number;
  orderDate: string;
  deadlineDate: string;
  paymentStatus: PaymentStatus;
  status: ProductionStatus;
  priority: 'Rendah' | 'Normal' | 'Tinggi' | 'Urgent';
  templateId: string;
  customerData: CustomerData;
  assignedStaffId?: string;
  revisions: OrderRevision[];
  files: OrderFile[];
  internalNotes?: string;
  customerFormSlug?: string;
  customerSubmittedAt?: string;
  isFormLocked?: boolean;
  editRequestStatus?: 'none' | 'requested' | 'approved';
  editRequestReason?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedSource?: 'CLIENT_PORTAL' | 'SELLER' | 'SYSTEM';
}

export interface ShopeeProduct {
  id: string;
  shopeeItemId: string;
  title: string;
  sku: string;
  price: number;
  stock: number;
  salesCount: number;
  status: 'NORMAL' | 'BANNED' | 'UNLIST';
  mappedProductType: ProductType;
  defaultTemplateId: string;
  requiredFormFields: string[]; // ['education', 'experience', 'projects', etc.]
  lastSyncAt: string;
}

export interface ShopeeSyncLog {
  id: string;
  timestamp: string;
  action: string;
  ordersSynced: number;
  status: 'Success' | 'Failed' | 'Warning';
  message: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  notes?: string;
  customerData: CustomerData;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicFieldOption {
  key: string;
  label: string;
  description: string;
  category: 'Wajib' | 'Opsional' | 'Visual';
}

export interface ProductFormFieldConfig {
  productType: ProductType;
  requiredFields: string[]; // e.g. ['personal', 'summary', 'education', 'experience', 'skills', 'languages']
  optionalFields: string[];
}

export interface AppSettings {
  brandName: string;
  businessEmail: string;
  businessPhone: string;
  orderIdPrefix: string;
  defaultDeadlineHours: number;
  publicAppUrl?: string;
  waTemplateWelcome: string;
  waTemplatePreview: string;
  waTemplateFinal: string;
  shopeeAutoSync: boolean;
  shopeeSyncIntervalMinutes: number;
  shopeeShopId: string;
  shopeePartnerId: string;
  shopeePartnerKey?: string;
  shopeeEnvironment?: 'sandbox' | 'live';
}

export interface AppNotification {
  id: string;
  orderId: string;
  type: 'form_submitted' | 'edit_requested' | 'edit_approved' | 'revision_requested' | 'new_order';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  customerName?: string;
  productType?: string;
}
