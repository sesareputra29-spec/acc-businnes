import React from 'react';
import { CustomerData, DocumentTemplate } from '../../types';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Award, ExternalLink } from 'lucide-react';

export interface DocumentCustomization {
  templateId: string;
  fontFamily: 'Plus Jakarta Sans' | 'Inter' | 'Merriweather' | 'JetBrains Mono' | 'Montserrat';
  primaryColor: string;
  accentColor: string;
  layout: 'single-column' | 'two-column-left' | 'two-column-right' | 'header-card' | 'grid-portfolio';
  fontSize: 'compact' | 'normal' | 'spacious';
  sectionsOrder: string[]; // ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages']
  sectionsVisibility: Record<string, boolean>;
  showPhoto: boolean;
}

interface Props {
  data: CustomerData;
  customization: DocumentCustomization;
  template?: DocumentTemplate;
  documentType?: 'cv' | 'portfolio' | 'cover-letter';
  coverLetterContent?: string;
  scale?: number;
}

export const DocumentRenderer: React.FC<Props> = ({
  data,
  customization,
  documentType = 'cv',
  coverLetterContent,
  scale = 1
}) => {
  const {
    fontFamily = 'Inter',
    primaryColor = '#0f172a',
    accentColor = '#2563eb',
    layout = 'single-column',
    fontSize = 'normal',
    sectionsOrder = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
    sectionsVisibility = {
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      languages: true
    },
    showPhoto = false
  } = customization;

  const fontClass = {
    'Inter': 'font-sans',
    'Plus Jakarta Sans': 'font-sans',
    'Merriweather': 'font-serif',
    'JetBrains Mono': 'font-mono',
    'Montserrat': 'font-sans'
  }[fontFamily] || 'font-sans';

  const fontStyle = {
    fontFamily: fontFamily === 'Merriweather' ? "'Merriweather', serif" :
      fontFamily === 'JetBrains Mono' ? "'JetBrains Mono', monospace" :
      fontFamily === 'Plus Jakarta Sans' ? "'Plus Jakarta Sans', sans-serif" : "'Inter', sans-serif"
  };

  const textSizes = {
    compact: {
      name: 'text-2xl',
      title: 'text-xs',
      sectionHeading: 'text-xs',
      body: 'text-[11px]',
      meta: 'text-[10px]',
      spacing: 'space-y-3',
      sectionMargin: 'mb-3'
    },
    normal: {
      name: 'text-3xl',
      title: 'text-sm',
      sectionHeading: 'text-sm',
      body: 'text-[12px]',
      meta: 'text-[11px]',
      spacing: 'space-y-4',
      sectionMargin: 'mb-4'
    },
    spacious: {
      name: 'text-3xl',
      title: 'text-base',
      sectionHeading: 'text-base',
      body: 'text-[13px]',
      meta: 'text-[12px]',
      spacing: 'space-y-5',
      sectionMargin: 'mb-5'
    }
  }[fontSize];

  // Helper section renderers
  const renderSummary = () => {
    if (!sectionsVisibility['summary'] || !data.summary) return null;
    return (
      <div key="summary" className={textSizes.sectionMargin}>
        <h3 
          className={`${textSizes.sectionHeading} font-bold uppercase tracking-wider border-b pb-1 mb-2`}
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Ringkasan Profesional
        </h3>
        <p className={`${textSizes.body} text-slate-700 leading-relaxed text-justify`}>
          {data.summary}
        </p>
      </div>
    );
  };

  const renderExperience = () => {
    if (!sectionsVisibility['experience'] || !data.experiences?.length) return null;
    return (
      <div key="experience" className={textSizes.sectionMargin}>
        <h3 
          className={`${textSizes.sectionHeading} font-bold uppercase tracking-wider border-b pb-1 mb-2`}
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Pengalaman Kerja
        </h3>
        <div className="space-y-3">
          {data.experiences.map((exp) => (
            <div key={exp.id} className="text-left">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-xs">{exp.position}</span>
                <span className={`${textSizes.meta} text-slate-500 font-medium`}>
                  {exp.startDate} – {exp.isCurrent ? 'Sekarang' : exp.endDate}
                </span>
              </div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold" style={{ color: accentColor }}>
                  {exp.company}
                </span>
                {exp.location && <span className={`${textSizes.meta} text-slate-400`}>{exp.location}</span>}
              </div>
              {exp.bulletPoints?.length > 0 && (
                <ul className="list-disc list-outside ml-4 space-y-1 mt-1">
                  {exp.bulletPoints.map((bp, i) => (
                    <li key={i} className={`${textSizes.body} text-slate-700 leading-normal`}>
                      {bp}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEducation = () => {
    if (!sectionsVisibility['education'] || !data.educations?.length) return null;
    return (
      <div key="education" className={textSizes.sectionMargin}>
        <h3 
          className={`${textSizes.sectionHeading} font-bold uppercase tracking-wider border-b pb-1 mb-2`}
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Pendidikan
        </h3>
        <div className="space-y-2.5">
          {data.educations.map((edu) => (
            <div key={edu.id}>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-xs">{edu.institution}</span>
                <span className={`${textSizes.meta} text-slate-500 font-medium`}>
                  {edu.startYear} – {edu.endYear}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className={`${textSizes.body} text-slate-700`}>
                  {edu.degree} · {edu.major}
                </span>
                {edu.gpa && (
                  <span className={`${textSizes.meta} font-medium text-slate-600`}>IPK: {edu.gpa}</span>
                )}
              </div>
              {edu.achievements && (
                <p className={`${textSizes.meta} text-slate-600 italic mt-0.5`}>
                  Prestasi: {edu.achievements}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSkills = () => {
    if (!sectionsVisibility['skills'] || !data.skills?.length) return null;
    return (
      <div key="skills" className={textSizes.sectionMargin}>
        <h3 
          className={`${textSizes.sectionHeading} font-bold uppercase tracking-wider border-b pb-1 mb-2`}
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Keahlian & Kemampuan
        </h3>
        <div className="space-y-1.5">
          {data.skills.map((skillCat) => (
            <div key={skillCat.id} className={`${textSizes.body}`}>
              <span className="font-semibold text-slate-800">{skillCat.categoryName}: </span>
              <span className="text-slate-600">{skillCat.skills.join(' · ')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjects = () => {
    if (!sectionsVisibility['projects'] || !data.projects?.length) return null;
    return (
      <div key="projects" className={textSizes.sectionMargin}>
        <h3 
          className={`${textSizes.sectionHeading} font-bold uppercase tracking-wider border-b pb-1 mb-2`}
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Proyek Unggulan
        </h3>
        <div className="space-y-2.5">
          {data.projects.map((proj) => (
            <div key={proj.id}>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-xs">
                  {proj.title}
                  {proj.role && <span className="font-normal text-slate-500 text-[11px]"> ({proj.role})</span>}
                </span>
                {proj.date && <span className={`${textSizes.meta} text-slate-400`}>{proj.date}</span>}
              </div>
              <p className={`${textSizes.body} text-slate-700 mt-0.5 leading-normal`}>{proj.description}</p>
              {proj.technologies?.length > 0 && (
                <div className={`${textSizes.meta} text-slate-500 mt-0.5`}>
                  <span className="font-medium">Tech Stack:</span> {proj.technologies.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCertifications = () => {
    if (!sectionsVisibility['certifications'] || !data.certifications?.length) return null;
    return (
      <div key="certifications" className={textSizes.sectionMargin}>
        <h3 
          className={`${textSizes.sectionHeading} font-bold uppercase tracking-wider border-b pb-1 mb-2`}
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Sertifikasi & Lisensi
        </h3>
        <div className="space-y-1.5">
          {data.certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between items-baseline">
              <div className={`${textSizes.body}`}>
                <span className="font-semibold text-slate-900">{cert.title}</span>
                <span className="text-slate-600"> — {cert.issuer}</span>
              </div>
              <span className={`${textSizes.meta} text-slate-500 font-medium`}>{cert.issueDate}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLanguages = () => {
    if (!sectionsVisibility['languages'] || !data.languages?.length) return null;
    return (
      <div key="languages" className={textSizes.sectionMargin}>
        <h3 
          className={`${textSizes.sectionHeading} font-bold uppercase tracking-wider border-b pb-1 mb-2`}
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Bahasa
        </h3>
        <p className={`${textSizes.body} text-slate-700`}>
          {data.languages.map((l) => `${l.language} (${l.proficiency})`).join(' · ')}
        </p>
      </div>
    );
  };

  const sectionMap: Record<string, () => React.ReactNode> = {
    summary: renderSummary,
    experience: renderExperience,
    education: renderEducation,
    skills: renderSkills,
    projects: renderProjects,
    certifications: renderCertifications,
    languages: renderLanguages
  };

  // COVER LETTER RENDERER
  if (documentType === 'cover-letter') {
    return (
      <div
        id="printable-document"
        className={`bg-white text-slate-900 shadow-xl mx-auto transition-transform ${fontClass}`}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '24mm 22mm',
          boxSizing: 'border-box',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
          ...fontStyle
        }}
      >
        {/* Cover Letter Header */}
        <div className="border-b-2 pb-4 mb-6" style={{ borderColor: primaryColor }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: primaryColor }}>
            {data.fullName || 'Nama Lengkap'}
          </h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: accentColor }}>
            {data.professionalTitle || 'Posisi Profesional'}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-2.5">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>· {data.phone}</span>}
            {data.city && <span>· {data.city}, {data.country}</span>}
          </div>
        </div>

        {/* Date & Recipient */}
        <div className="text-xs text-slate-700 space-y-1 mb-6">
          <p className="text-slate-500 mb-4">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="font-semibold text-slate-900">Kepada Yth.</p>
          <p className="font-medium text-slate-800">HRD / Hiring Manager</p>
          <p className="font-bold text-slate-900">{data.targetCompany || '[Nama Perusahaan Tujuan]'}</p>
        </div>

        {/* Subject */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-900">
            Perihal: Lamaran Pekerjaan — {data.targetJobTitle || data.professionalTitle || '[Posisi yang Dilamar]'}
          </p>
        </div>

        {/* Body Content */}
        <div className="text-xs text-slate-800 leading-relaxed space-y-4 text-justify">
          {coverLetterContent ? (
            <div className="whitespace-pre-line">{coverLetterContent}</div>
          ) : (
            <>
              <p>Dengan hormat,</p>
              <p>
                Berdasarkan informasi lowongan pekerjaan yang saya dapatkan untuk posisi{' '}
                <strong>{data.targetJobTitle || 'Posisi yang Dituju'}</strong> di{' '}
                <strong>{data.targetCompany || 'Perusahaan'}</strong>, saya bermaksud untuk mengajukan surat lamaran kerja. Dengan latar belakang pendidikan dan pengalaman saya di bidang {data.professionalTitle || 'terkait'}, saya yakin dapat memberikan kontribusi nyata bagi pertumbuhan perusahaan.
              </p>
              <p>
                Selama berkarir, saya telah berhasil mengembangkan kemampuan dalam{' '}
                {data.skills?.[0]?.skills.slice(0, 4).join(', ') || 'manajemen proyek, komunikasi efektif, dan pemecahan masalah'}.{' '}
                {data.summary || 'Saya terbiasa bekerja dalam lingkungan yang dinamis dengan target tinggi serta kolaborasi lintas divisi.'}
              </p>
              <p>
                Besar harapan saya untuk diberikan kesempatan wawancara agar dapat menjelaskan lebih mendalam mengenai kualifikasi dan motivasi saya. Terlampir saya sertakan CV dan berkas pendukung sebagai bahan pertimbangan Bapak/Ibu.
              </p>
              <p>Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.</p>
            </>
          )}
        </div>

        {/* Signature */}
        <div className="mt-10 text-xs text-slate-800 space-y-8">
          <p>Hormat saya,</p>
          <div>
            <p className="font-bold text-slate-900">{data.fullName}</p>
            <p className="text-slate-500">{data.phone}</p>
          </div>
        </div>
      </div>
    );
  }

  // PORTFOLIO SHOWCASE RENDERER
  if (documentType === 'portfolio' || layout === 'grid-portfolio') {
    return (
      <div
        id="printable-document"
        className={`bg-white text-slate-900 shadow-xl mx-auto transition-transform ${fontClass}`}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 20mm',
          boxSizing: 'border-box',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
          ...fontStyle
        }}
      >
        {/* Portfolio Cover / Header */}
        <div className="border-b pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Design & Engineering Portfolio</span>
              <h1 className="text-2xl font-extrabold tracking-tight mt-0.5" style={{ color: primaryColor }}>
                {data.fullName}
              </h1>
              <p className="text-sm font-semibold mt-0.5" style={{ color: accentColor }}>
                {data.professionalTitle}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500 space-y-0.5">
              <p>{data.email}</p>
              <p>{data.phone}</p>
              <p>{data.city}</p>
            </div>
          </div>
        </div>

        {/* About / Summary */}
        {data.summary && (
          <div className="mb-6 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">About Me</h3>
            <p className="text-[11px] text-slate-700 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Featured Projects Grid */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3" style={{ borderColor: primaryColor }}>
            Featured Projects & Case Studies
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            {data.projects.map((proj) => (
              <div key={proj.id} className="border border-slate-200 rounded-lg p-3 bg-white hover:border-slate-400 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{proj.category}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug mb-2">{proj.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {proj.technologies?.map((tech, idx) => (
                    <span key={idx} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
                {proj.link && (
                  <div className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                    <ExternalLink size={10} />
                    <span>{proj.link}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack & Core Competencies */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2" style={{ borderColor: primaryColor }}>
            Tech Stack & Competencies
          </h3>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            {data.skills?.map((cat) => (
              <div key={cat.id} className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1 text-[11px]">{cat.categoryName}</span>
                <p className="text-slate-600 text-[10px] leading-relaxed">{cat.skills.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Client Testimonials */}
        {data.testimonials && data.testimonials.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2.5" style={{ borderColor: primaryColor }}>
              Client Testimonials & Rekomendasi
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {data.testimonials.map((testi) => (
                <div key={testi.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-[10px] text-slate-700 italic mb-2 leading-relaxed">
                    "{testi.feedback}"
                  </p>
                  <div className="text-[10px] font-bold text-slate-900">
                    {testi.clientName}
                    <span className="font-normal text-slate-500 block text-[9px]">
                      {testi.clientRole} · {testi.company}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-slate-500 flex justify-center gap-4">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>· {data.phone}</span>}
          {data.city && <span>· {data.city}</span>}
        </div>
      </div>
    );
  }

  // TWO COLUMN LAYOUT (Modern Split)
  if (layout === 'two-column-left') {
    return (
      <div
        id="printable-document"
        className={`bg-white text-slate-900 shadow-xl mx-auto transition-transform ${fontClass}`}
        style={{
          width: '210mm',
          minHeight: '297mm',
          boxSizing: 'border-box',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
          ...fontStyle
        }}
      >
        <div className="flex min-h-[297mm]">
          {/* Left Column / Sidebar */}
          <div 
            className="w-[33%] p-6 text-white flex flex-col justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div>
              {showPhoto && data.photoUrl && (
                <div className="mb-4 text-center">
                  <img
                    src={data.photoUrl}
                    alt={data.fullName}
                    className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-white/40 shadow-sm"
                  />
                </div>
              )}
              <h1 className="text-xl font-extrabold tracking-tight text-white mb-1">
                {data.fullName}
              </h1>
              <p className="text-xs font-medium text-slate-200 mb-6">
                {data.professionalTitle}
              </p>

              {/* Contact Info */}
              <div className="space-y-2.5 text-[11px] text-slate-200 mb-6 border-t border-white/20 pt-4">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{data.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="shrink-0" />
                  <span>{data.phone}</span>
                </div>
                {data.city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="shrink-0" />
                    <span>{data.city}, {data.country}</span>
                  </div>
                )}
                {data.socialLinks?.map((soc) => (
                  <div key={soc.id} className="flex items-center gap-2">
                    <Globe size={12} className="shrink-0" />
                    <span className="truncate">{soc.url.replace(/^https?:\/\//, '')}</span>
                  </div>
                ))}
              </div>

              {/* Left Column Skills */}
              {sectionsVisibility['skills'] && data.skills?.length > 0 && (
                <div className="border-t border-white/20 pt-4 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">Keahlian</h3>
                  <div className="space-y-3">
                    {data.skills.map((cat) => (
                      <div key={cat.id}>
                        <p className="text-[10px] font-semibold text-slate-300 uppercase">{cat.categoryName}</p>
                        <p className="text-[11px] text-slate-100">{cat.skills.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Left Column Languages */}
              {sectionsVisibility['languages'] && data.languages?.length > 0 && (
                <div className="border-t border-white/20 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">Bahasa</h3>
                  <div className="space-y-1 text-[11px] text-slate-100">
                    {data.languages.map((l) => (
                      <div key={l.id} className="flex justify-between">
                        <span>{l.language}</span>
                        <span className="text-slate-300 text-[10px]">{l.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Main Column */}
          <div className="w-[67%] p-6">
            {renderSummary()}
            {renderExperience()}
            {renderEducation()}
            {renderProjects()}
            {renderCertifications()}
          </div>
        </div>
      </div>
    );
  }

  // STANDARD SINGLE COLUMN (ATS-Standard & Executive Serif)
  return (
    <div
      id="printable-document"
      className={`bg-white text-slate-900 shadow-xl mx-auto transition-transform ${fontClass}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 20mm',
        boxSizing: 'border-box',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        ...fontStyle
      }}
    >
      {/* Header Profile */}
      <div className="text-center pb-4 mb-4 border-b" style={{ borderColor: primaryColor }}>
        <h1 
          className={`${textSizes.name} font-extrabold tracking-tight uppercase`}
          style={{ color: primaryColor }}
        >
          {data.fullName || 'NAMA LENGKAP'}
        </h1>
        <p className={`${textSizes.title} font-semibold mt-0.5 tracking-wide`} style={{ color: accentColor }}>
          {data.professionalTitle || 'PROFESIONAL / SPESIALISASI'}
        </p>

        {/* Contact info inline */}
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-slate-600">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>· {data.phone}</span>}
          {data.city && <span>· {data.city}, {data.country}</span>}
          {data.socialLinks?.map((soc) => (
            <span key={soc.id}>· {soc.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
          ))}
        </div>
      </div>

      {/* Ordered Sections */}
      <div>
        {sectionsOrder.map((sectionKey) => {
          const renderer = sectionMap[sectionKey];
          return renderer ? renderer() : null;
        })}
      </div>
    </div>
  );
};
