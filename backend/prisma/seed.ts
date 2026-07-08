import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { hashPassword } from '../src/utils/password';
import { slugify } from '../src/utils/slugify';

// Render external Postgres SSL talab qiladi — src/config/prisma.ts dagi mantiq bilan bir xil
const needsSsl = /\.render\.com/.test(process.env.DATABASE_URL ?? '');
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const prisma = new PrismaClient({ adapter });

const COURSES = [
  { id: 'fe', icon: 'Monitor', title: 'Frontend Development', sub: 'React & TypeScript', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', dur: 6, rating: 4.9, students: 840, tags: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'], desc: "Zamonaviy veb ilovalar yaratishni o'rganing. React va TypeScript bilan professional developer bo'ling.", mods: ['HTML & CSS', 'JavaScript ES6+', 'React & Redux', 'TypeScript', 'Tailwind CSS'] },
  { id: 'be', icon: 'Server', title: 'Backend Development', sub: 'Node.js & APIs', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', dur: 7, rating: 4.8, students: 620, tags: ['Node.js', 'PostgreSQL', 'MongoDB', 'REST API', 'Docker'], desc: "Server-side dasturlash, ma'lumotlar bazasi va API yaratishni o'rganing.", mods: ['Node.js & Express', 'Database Design', 'GraphQL', 'Docker', 'Cloud Deploy'] },
  { id: 'cs', icon: 'Shield', title: 'Cyber Security', sub: 'Axborot xavfsizligi', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dur: 5, rating: 4.7, students: 480, tags: ['Linux', 'Networking', 'Ethical Hacking', 'CTF', 'Forensics'], desc: "Kiberxavfsizlik mutaxassisi bo'ling. Etik hacking va zamonaviy himoya texnikalarini o'rganing.", mods: ['Linux', 'Networking', 'Ethical Hacking', 'CTF', 'Audit'] },
  { id: 'mo', icon: 'Smartphone', title: 'Mobile Development', sub: 'Flutter & React Native', color: '#d97706', bg: '#fffbeb', border: '#fde68a', dur: 6, rating: 4.8, students: 390, tags: ['Flutter', 'Dart', 'Firebase', 'React Native'], desc: 'Flutter yordamida iOS va Android ilovalar yaratishni o\'rganing.', mods: ['Flutter', 'Dart', 'State Mgmt', 'Firebase', 'App Store'] },
  { id: 'ai', icon: 'Database', title: 'Data Science & AI', sub: "Sun'iy intellekt", color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', dur: 8, rating: 4.9, students: 310, tags: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Pandas'], desc: "Ma'lumotlar tahlili va sun'iy intellekt modellarini yaratishni o'rganing.", mods: ['Python', 'ML Basics', 'Deep Learning', 'NLP', 'MLOps'] },
  { id: 'cl', icon: 'Cloud', title: 'Cloud & DevOps', sub: 'Bulut texnologiyalari', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', dur: 5, rating: 4.7, students: 280, tags: ['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform'], desc: "Bulut infratuzilmasini boshqarishni va DevOps amaliyotlarini o'rganing.", mods: ['AWS/Azure', 'Docker & K8s', 'CI/CD', 'IaC', 'Monitoring'] },
];

const BLOG_POSTS = [
  { icon: 'BookOpen', cat: 'Tutorial', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', readMinutes: 8, views: 3200, tags: ['React', 'JavaScript'], title: "React Hooks: useState va useEffect ni chuqur o'rganing", excerpt: "React Hooks — zamonaviy React dasturlashning asosi. Ushbu maqolada real misolar bilan o'rganamiz.", content: "React Hooks 16.8 versiyasidan boshlab funksional komponentlarga state va lifecycle imkoniyatlarini olib keldi.\n\nuseState — komponent ichida lokal holatni boshqarish uchun ishlatiladi. useEffect esa side-effect'larni (API so'rovlari, obuna bo'lish, DOM o'zgartirish) boshqarish uchun mo'ljallangan.\n\nUshbu maqolada real loyihalardan misollar bilan har ikkala hook'ning ishlash tamoyillarini, umumiy xatolarni va eng yaxshi amaliyotlarni ko'rib chiqamiz." },
  { icon: 'Shield', cat: 'Security', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', readMinutes: 12, views: 5800, tags: ['Security', 'SQL'], title: 'Kiberxavfsizlik: SQL Injection dan qanday himoyalanish', excerpt: "SQL Injection — eng keng tarqalgan zaifliklardan biri. Himoya usullari va amaliy misollarni ko'rib chiqamiz.", content: "SQL Injection — foydalanuvchi kiritgan ma'lumotlar to'g'ridan-to'g'ri SQL so'roviga qo'shilganda yuzaga keladigan zaiflik turi.\n\nBu maqolada parametrlashtirilgan so'rovlar (prepared statements), ORM'lardan foydalanish va kiritilgan ma'lumotlarni validatsiya qilish orqali himoyalanish usullarini ko'rib chiqamiz." },
  { icon: 'Map', cat: 'Career', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', readMinutes: 15, views: 9100, tags: ['Career', 'IT'], title: "IT Sanoatida Karera: 2025-yilgi To'liq Roadmap", excerpt: "Frontend, Backend yoki AI — qaysi yo'nalishni tanlash kerak? 2025-yilgi IT karera yo'l xaritasi.", content: "IT sohasida karera boshlash uchun to'g'ri yo'nalishni tanlash muhim qadamdir.\n\nBu maqolada Frontend, Backend, Mobile, Data Science va DevOps yo'nalishlarining har biri uchun kerakli ko'nikmalar, o'rganish tartibi va bozordagi talab darajasini tahlil qilamiz." },
  { icon: 'BookOpen', cat: 'Tutorial', color: '#d97706', bg: '#fffbeb', border: '#fde68a', readMinutes: 20, views: 4500, tags: ['Node.js', 'API'], title: 'Node.js va Express bilan REST API qurish', excerpt: "Sifatli REST API yaratish sirlarini o'rganing. Authentication, validation va documentation.", content: "REST API — zamonaviy veb-ilovalarning asosiy qatlamlaridan biri.\n\nBu maqolada Express.js yordamida resurslarni to'g'ri modellashtirish, autentifikatsiya, kiritilgan ma'lumotlarni validatsiya qilish va xatoliklarni boshqarishning amaliy misollarini ko'rib chiqamiz." },
  { icon: 'Shield', cat: 'AI', color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', readMinutes: 18, views: 7200, tags: ['Python', 'ML'], title: 'Python bilan Machine Learning: Birinchi modelingiz', excerpt: "Sun'iy intellekt va ML haqida yangi boshlayotganlar uchun amaliy qo'llanma.", content: "Machine Learning'ni o'rganishni boshlash uchun Python va uning kutubxonalari (NumPy, Pandas, scikit-learn) bilan tanishish kerak.\n\nBu maqolada oddiy klassifikatsiya modelini boshidan oxirigacha qurish jarayonini bosqichma-bosqich ko'rsatamiz." },
  { icon: 'Map', cat: 'DevOps', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', readMinutes: 14, views: 6300, tags: ['Docker', 'K8s'], title: 'Docker va Kubernetes: Container deployment asoslari', excerpt: "Containerization nima? Docker va Kubernetes yordamida ilovalarni deploy qilishni o'rganing.", content: "Containerization ilovalarni muhitdan mustaqil ravishda ishga tushirish imkonini beradi.\n\nBu maqolada Docker image yaratish, konteynerlarni boshqarish va Kubernetes yordamida ko'p konteynerli tizimlarni orkestratsiya qilish asoslarini o'rganamiz." },
];

const PARTNERS = [
  { name: 'TechCorp Uzbekistan', category: 'hiring' },
  { name: 'Innovate Solutions', category: 'tech' },
  { name: 'Tashkent IT Park', category: 'education' },
  { name: 'Digital Bridge', category: 'hiring' },
];

// Bosh sahifadagi hozirgi hardcoded qiymatlar — birinchi deploy'da sayt
// bo'sh ko'rinmasligi uchun SiteSetting jadvaliga default sifatida yoziladi.
const SITE_SETTINGS: { section: string; data: unknown }[] = [
  {
    section: 'hero',
    data: {
      stats: [
        { label: 'Bitiruvchilar', value: '2,000+' },
        { label: 'Kurslar', value: '7+' },
        { label: 'Yillik Tajriba', value: '5+' },
        { label: 'Ish Vaqti', value: '09:00–19:00' },
      ],
    },
  },
  {
    section: 'about',
    data: {
      stats: [
        { icon: 'Users', label: 'Bitiruvchilar', value: '2,000+', color: '#0ea5e9' },
        { icon: 'BookOpen', label: 'Kurslar', value: '7+', color: '#9333ea' },
        { icon: 'Briefcase', label: 'Loyihalar', value: '180+', color: '#16a34a' },
        { icon: 'Award', label: 'Yillik Tajriba', value: '5+', color: '#d97706' },
      ],
      features: [
        'Professional sertifikatlar',
        'Real loyihalarda ishlash',
        'Tajribali mentorlar',
        "Karera qo'llab-quvvatlash",
        "Zamonaviy o'quv dasturi",
        'Kichik guruhlar (max 15)',
      ],
      skills: [
        { label: 'Frontend Development', pct: 95 },
        { label: 'Backend Development', pct: 88 },
        { label: 'Cyber Security', pct: 82 },
        { label: 'Mobile Development', pct: 78 },
      ],
      satisfaction: [
        { value: '98%', label: 'Satisfaction' },
        { value: '92%', label: 'Employment' },
      ],
    },
  },
  {
    section: 'services',
    data: {
      items: [
        { icon: 'Globe', title: 'Web Development', color: '#0ea5e9', desc: 'Zamonaviy veb ilovalar. React, Next.js, Node.js bilan enterprise yechimlar.', feats: ['SPA & SSR ilovalar', 'API integratsiya', 'SEO optimizatsiya', 'Performance'] },
        { icon: 'Smartphone', title: 'Mobile Applications', color: '#9333ea', desc: 'iOS va Android uchun professional ilovalar. Flutter va React Native bilan.', feats: ['Flutter & React Native', 'Native iOS/Android', 'App Store deploy', 'Push notifications'] },
        { icon: 'Palette', title: 'UI/UX Design', color: '#db2777', desc: "Foydalanuvchilar uchun qulay dizayn. Figma bilan prototipdan mahsulotgacha.", feats: ['User Research', 'Wireframing', 'Design Systems', 'Usability Testing'] },
        { icon: 'Brain', title: 'IT Consulting', color: '#d97706', desc: "Biznesingiz uchun texnologik strategiya. Expert maslahat xizmatlar.", feats: ['Tech Strategy', 'Digital Transform', 'System Architecture', 'Code Audit'] },
        { icon: 'Cpu', title: 'Digital Solutions', color: '#16a34a', desc: "Biznes jarayonlarini avtomatlashtirish. ERP, CRM va maxsus yechimlar.", feats: ['Business Automation', 'Custom Software', 'CRM & ERP', 'Data Analytics'] },
        { icon: 'BarChart3', title: 'Data Analytics', color: '#0284c7', desc: "Ma'lumotlardan qimmatli bilimlar olish. Dashboard va hisobot tizimlar.", feats: ['BI Dashboards', 'Real-time Analytics', 'Predictive Models', 'Reports'] },
      ],
    },
  },
  {
    section: 'why_us',
    data: {
      items: [
        { icon: 'GraduationCap', title: 'Tajribali Mentorlar', color: '#0ea5e9', stat: '40+', desc: "IT sanoatida 5+ yil tajribaga ega mutaxassislar tomonidan o'qiting." },
        { icon: 'Zap', title: "Amaliy Ta'lim", color: '#9333ea', stat: '70%', desc: "Nazariyadan ko'ra amaliyot ustuvor. Real loyihalar va hackathon-lar." },
        { icon: 'Briefcase', title: 'Real Loyihalar', color: '#16a34a', stat: '180+', desc: "Ta'lim jarayonida haqiqiy mijozlar uchun loyihalarda ishlaysiz." },
        { icon: 'HeartHandshake', title: "Karera Qo'llab-quvvat", color: '#d97706', stat: '92%', desc: "Resume, intervyu tayyorlash va ish topishda to'liq yordam." },
        { icon: 'Trophy', title: 'Sertifikatlar', color: '#db2777', stat: '3,000+', desc: "Sanoat tomonidan tan olingan. LinkedIn va xalqaro platformalarda tasdiqlangan." },
        { icon: 'Users', title: 'Kuchli Hamjamiyat', color: '#0284c7', stat: '2,500+', desc: "DATA LIFE bitiruvchilari tarmog'i. Networking va karera imkoniyatlari." },
      ],
    },
  },
  {
    section: 'contact',
    data: {
      phone: '+998 99 208 11 77',
      telegram: '@datalife_uz',
      email: 'info@datalife.uz',
      address: "Qoraqolpog'iston, Nukus",
      addressSub: "Amir Temur ko'chasi, 108",
      hours: [
        { day: 'Dushanba — Juma', time: '09:00 — 19:00', closed: false },
        { day: 'Shanba', time: '09:00 — 19:00', closed: false },
        { day: 'Yakshanba', time: 'Yopiq', closed: true },
      ],
    },
  },
];

const TESTIMONIALS = [
  { name: 'Jasur Toshmatov', role: 'Frontend dasturchi, Frontend Dev bitiruvchisi', text: "DATA LIFE'da olgan bilimlarim tufayli 3 oyda ishga joylashdim. Mentorlar juda tajribali va har doim yordam berishga tayyor edi.", rating: 5 },
  { name: 'Madina Yusupova', role: 'Backend dasturchi, Backend Dev bitiruvchisi', text: "Real loyihalar ustida ishlash imkoniyati eng katta afzallik bo'ldi. Nazariya emas, amaliyotga asoslangan dastur juda foydali.", rating: 5 },
  { name: 'Bekzod Rahimov', role: 'Cyber Security mutaxassisi', text: "Kurs dasturi zamonaviy va sohadagi haqiqiy talablarga mos. Sertifikat ish beruvchilar orasida yaxshi tan olinadi.", rating: 5 },
];

async function main() {
  // Production himoyasi: demo parollar va test kontent tasodifan jonli bazaga
  // tushmasligi uchun aniq rozilik talab qilinadi (SEED_FORCE=true)
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    console.error(
      'Seed production muhitida bloklandi.\n' +
        "Demo hisoblar (Admin123! kabi parollar bilan) jonli bazaga yozilishini oldini olish uchun.\n" +
        'Agar rostdan ham xohlasangiz: SEED_FORCE=true va ADMIN_PASSWORD=<kuchli parol> bilan ishga tushiring.'
    );
    process.exit(1);
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    console.error('Production seed uchun ADMIN_PASSWORD env o\'zgaruvchisi majburiy.');
    process.exit(1);
  }

  const adminPasswordHash = await hashPassword(adminPassword);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@datalife.uz' },
    update: {},
    create: { email: process.env.ADMIN_EMAIL || 'admin@datalife.uz', name: 'Admin', passwordHash: adminPasswordHash, role: 'ADMIN' },
  });
  console.log('Admin:', admin.email);

  const mentorSpecs = [
    { name: 'Aziz Karimov', specialty: 'Frontend & React', courseIds: ['fe'] },
    { name: 'Dilnoza Yusupova', specialty: 'Backend & Node.js', courseIds: ['be', 'cl'] },
    { name: 'Sardor Rashidov', specialty: 'Cyber Security', courseIds: ['cs'] },
  ];

  const mentorPasswordHash = await hashPassword('Mentor123!');
  const mentorsByCourseId = new Map<string, string>();

  for (const m of mentorSpecs) {
    const email = `${slugify(m.name)}@datalife.uz`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: m.name, passwordHash: mentorPasswordHash, role: 'MENTOR' },
    });
    const mentor = await prisma.mentor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: m.name,
        bio: `${m.name} — DATA LIFE'da ${m.specialty} bo'yicha mentor.`,
        specialty: m.specialty,
        featured: true,
      },
    });
    for (const courseId of m.courseIds) {
      mentorsByCourseId.set(courseId, mentor.id);
    }
  }

  for (const c of COURSES) {
    const course = await prisma.course.upsert({
      where: { slug: slugify(c.title) },
      update: { price: c.id === 'ai' ? 3500000 : 0, isFree: c.id !== 'ai' },
      create: {
        slug: slugify(c.title),
        title: c.title,
        subtitle: c.sub,
        description: c.desc,
        iconKey: c.icon,
        color: c.color,
        bg: c.bg,
        border: c.border,
        price: c.id === 'ai' ? 3500000 : 0,
        isFree: c.id !== 'ai',
        durationMonths: c.dur,
        level: 'BEGINNER',
        rating: c.rating,
        studentsCount: c.students,
        tags: c.tags,
        published: true,
        mentorId: mentorsByCourseId.get(c.id),
      },
    });

    // Seed qayta ishga tushirilganda modullar dublikatlanmasligi uchun —
    // kursda modul bo'lsa, dastur allaqachon yaratilgan deb hisoblaymiz
    const existingModules = await prisma.module.count({ where: { courseId: course.id } });
    if (existingModules === 0) {
      for (const [i, modTitle] of c.mods.entries()) {
        const mod = await prisma.module.create({
          data: { courseId: course.id, title: modTitle, order: i },
        });
        await prisma.lesson.create({
          data: {
            moduleId: mod.id,
            title: `${modTitle} — Kirish`,
            order: 0,
            contentType: 'VIDEO',
            durationMinutes: 20,
            isFreePreview: i === 0,
          },
        });
      }
    }
  }
  console.log(`Seeded ${COURSES.length} courses`);

  for (const [i, p] of PARTNERS.entries()) {
    await prisma.partner.upsert({
      where: { id: `seed-partner-${i}` },
      update: { logoUrl: '/partners/placeholder-logo.svg' },
      create: { id: `seed-partner-${i}`, name: p.name, logoUrl: '/partners/placeholder-logo.svg', category: p.category, order: i, featured: i < 2 },
    });
  }
  console.log(`Seeded ${PARTNERS.length} partners`);

  for (const [i, p] of BLOG_POSTS.entries()) {
    await prisma.blogPost.upsert({
      where: { slug: slugify(p.title) },
      update: {},
      create: {
        slug: slugify(p.title),
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        category: p.cat,
        iconKey: p.icon,
        color: p.color,
        bg: p.bg,
        border: p.border,
        readMinutes: p.readMinutes,
        views: p.views,
        tags: p.tags,
        published: true,
        publishedAt: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`Seeded ${BLOG_POSTS.length} blog posts`);

  // Bosh sahifa sozlamalari faqat mavjud bo'lmasa yoziladi — admin panelda
  // tahrirlangan qiymatlar qayta seed ishga tushirilganda ustidan yozilmasin
  for (const s of SITE_SETTINGS) {
    const existing = await prisma.siteSetting.findUnique({ where: { section: s.section } });
    if (!existing) {
      await prisma.siteSetting.create({ data: { section: s.section, data: s.data as object } });
    }
  }
  console.log(`Seeded ${SITE_SETTINGS.length} site settings`);

  for (const [i, t] of TESTIMONIALS.entries()) {
    await prisma.testimonial.upsert({
      where: { id: `seed-testimonial-${i}` },
      update: {},
      create: { id: `seed-testimonial-${i}`, name: t.name, role: t.role, text: t.text, rating: t.rating, order: i },
    });
  }
  console.log(`Seeded ${TESTIMONIALS.length} testimonials`);

  const studentPasswordHash = await hashPassword('Student123!');
  await prisma.user.upsert({
    where: { email: 'student@datalife.uz' },
    update: {},
    create: { email: 'student@datalife.uz', name: 'Test Student', passwordHash: studentPasswordHash, role: 'STUDENT' },
  });

  // Qayta seed'da dublikat bo'lmasligi uchun faqat birinchi marta yoziladi
  const existingDemoMessage = await prisma.contactMessage.findFirst({ where: { email: 'jasur@example.com' } });
  if (!existingDemoMessage) {
    await prisma.contactMessage.create({
      data: { name: 'Jasur Aliyev', email: 'jasur@example.com', subject: 'course', message: 'Frontend kursi haqida batafsil ma\'lumot bering.' },
    });
  }

  console.log('Seed tugadi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
