import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Star } from 'lucide-react';
import { resolveIcon } from '../../utils/iconMap';

interface CourseModule {
  id: string | number;
  title: string;
}

export interface CourseCardData {
  id: string | number;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  rating?: number | string;
  tags: string[];
  modules?: CourseModule[];
  durationMonths: number;
  studentsCount: number;
  [key: string]: unknown;
}

interface CourseCardProps {
  course: CourseCardData;
  index?: number;
}

export default function CourseCard({ course, index = 0 }: CourseCardProps): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const Icon = resolveIcon(course.iconKey);

  return (
    <motion.div initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-30px' }}
      transition={{ duration:0.5, delay:(index%3)*0.1 }} className="card"
      style={{ padding:24, display:'flex', flexDirection:'column', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', background:course.bg, border:`1.5px solid ${course.border}` }}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ width:48, height:48, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1.5px solid ${course.border}`, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <Icon size={22} style={{ color:course.color }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'#fff', padding:'4px 10px', borderRadius:20, border:'1px solid #e2e8f0' }}>
          <Star size={11} fill={course.color} style={{ color:course.color }} />
          <span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{course.rating}</span>
        </div>
      </div>

      <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:3 }}>{course.title}</h3>
      <p style={{ fontSize:12, color:course.color, fontWeight:700, marginBottom:10 }}>{course.subtitle}</p>
      <p style={{ fontSize:13, color:'#64748b', lineHeight:1.75, marginBottom:14, flexGrow:1 }}>{course.description}</p>

      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
        {course.tags.map((t: string) => <span key={t} className="tag" style={{ background:'#fff', borderColor:course.border, color:course.color }}>{t}</span>)}
      </div>

      {open && course.modules && course.modules.length > 0 && (
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
          style={{ background:'#fff', border:`1px solid ${course.border}`, borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Modullar</p>
          {course.modules.map((m: CourseModule, mi: number) => (
            <p key={m.id} style={{ fontSize:12, color:'#334155', marginBottom:4 }}>
              <span style={{ color:course.color, fontFamily:'JetBrains Mono,monospace', fontSize:11, marginRight:6 }}>0{mi+1}</span>{m.title}
            </p>
          ))}
        </motion.div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:`1px solid ${course.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#94a3b8' }}>
          <Clock size={13} />{course.durationMonths} oy
          <span style={{ marginLeft:8 }}>{course.studentsCount} ta</span>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          {course.modules && course.modules.length > 0 && (
            <button onClick={() => setOpen(!open)} style={{ fontSize:11, padding:'5px 12px', borderRadius:20, cursor:'pointer', background:'#fff', color:course.color, border:`1px solid ${course.border}`, fontWeight:600, transition:'all 0.2s' }}>
              {open ? 'Yopish' : "Ko'proq"}
            </button>
          )}
          <Link to={`/courses/${course.slug}`}>
            <button style={{ fontSize:11, padding:'5px 14px', borderRadius:20, cursor:'pointer', background:course.color, color:'#fff', border:'none', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
              Batafsil <ArrowRight size={11} />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
