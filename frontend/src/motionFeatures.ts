// LazyMotion uchun animatsiya dvigateli — alohida chunk bo'lib kechiktirib
// yuklanadi. Komponentlar `motion.` o'rniga `m.` ishlatadi (main.tsx'dagi
// LazyMotion provider'i shu fayldan features'ni dinamik oladi), shunda
// framer-motion'ning og'ir qismi kirish bundle'iga kirmaydi.
export { domAnimation as default } from 'framer-motion';
