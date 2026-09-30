import { CustomerData, DocumentTemplate, TemplateSectionConfig } from '../types';
import { DocumentCustomization } from '../components/builders/DocumentRenderer';

export const DEFAULT_TEMPLATE_SECTIONS: TemplateSectionConfig[] = [
  { key: 'summary', label: 'Ringkasan Profesional', isVisible: true, order: 1 },
  { key: 'experience', label: 'Pengalaman Kerja', isVisible: true, order: 2 },
  { key: 'education', label: 'Pendidikan', isVisible: true, order: 3 },
  { key: 'skills', label: 'Keahlian & Kemampuan', isVisible: true, order: 4 },
  { key: 'projects', label: 'Proyek Unggulan', isVisible: true, order: 5 },
  { key: 'certifications', label: 'Sertifikasi & Lisensi', isVisible: true, order: 6 },
  { key: 'languages', label: 'Bahasa', isVisible: true, order: 7 }
];

export const templateEngine = {
  /**
   * Convert template settings + optional overrides into DocumentCustomization props
   */
  resolveCustomization(
    template: DocumentTemplate,
    overrides?: Partial<DocumentCustomization>
  ): DocumentCustomization {
    const defaultSections = template.sections && template.sections.length > 0 
      ? template.sections 
      : DEFAULT_TEMPLATE_SECTIONS;

    const sectionsOrder = defaultSections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => s.key);

    const sectionsVisibility: Record<string, boolean> = {};
    defaultSections.forEach((s) => {
      sectionsVisibility[s.key] = s.isVisible !== false;
    });

    return {
      templateId: template.id,
      fontFamily: template.fontFamily || 'Inter',
      primaryColor: template.primaryColor || '#0f172a',
      accentColor: template.accentColor || '#2563eb',
      layout: template.layout || 'single-column',
      fontSize: 'normal',
      sectionsOrder: overrides?.sectionsOrder || sectionsOrder,
      sectionsVisibility: { ...sectionsVisibility, ...(overrides?.sectionsVisibility || {}) },
      showPhoto: overrides?.showPhoto !== undefined ? overrides.showPhoto : (template.category === 'Creative' || template.category === 'Modern'),
      ...overrides
    };
  },

  /**
   * Calculate ATS Score estimation based on structure and keyword density
   */
  calculateAtsReadiness(data: CustomerData, template: DocumentTemplate): {
    score: number;
    metrics: { label: string; passed: boolean; tip: string }[];
  } {
    const metrics = [
      {
        label: 'Format Layout ATS-Safe',
        passed: template.isAtsCompliant,
        tip: template.isAtsCompliant ? 'Layout 1 kolom bersih memenuhi standar parser HRD.' : 'Gunakan template kategori ATS untuk rasio kelolosan tertinggi.'
      },
      {
        label: 'Kelengkapan Ringkasan Profil',
        passed: Boolean(data.summary && data.summary.length > 50),
        tip: 'Sertakan 2-4 kalimat ringkasan profesional terarah.'
      },
      {
        label: 'Uraian Pengalaman Kerja Berbobot',
        passed: Boolean(data.experiences && data.experiences.length > 0 && data.experiences.some((e) => e.bulletPoints?.length > 0)),
        tip: 'Gunakan kata kerja aksi dan metrik pencapaian (angka/persen).'
      },
      {
        label: 'Kategorisasi Keahlian (Skills)',
        passed: Boolean(data.skills && data.skills.length > 0),
        tip: 'Pisahkan antara Hard Skills, Software Tools, dan Soft Skills.'
      },
      {
        label: 'Data Kontak & Lokasi Lengkap',
        passed: Boolean(data.email && data.phone && data.city),
        tip: 'Pastikan email profesional, nomor WhatsApp aktif, dan domisili tercantum.'
      }
    ];

    const passedCount = metrics.filter((m) => m.passed).length;
    const score = Math.round((passedCount / metrics.length) * 100);

    return { score, metrics };
  }
};
