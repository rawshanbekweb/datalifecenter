import { AlertCircle } from 'lucide-react';

// Hisob mentor profiliga bog'lanmagan holat — hamma mentor sahifalarida bir xil ko'rinadi
export default function MentorNotLinked({ message }: { message?: string }): React.ReactElement {
  return (
    <div className="card" style={{ padding:32, display:'flex', alignItems:'flex-start', gap:14 }}>
      <AlertCircle size={20} style={{ color:'#d97706', flexShrink:0, marginTop:2 }} />
      <div>
        <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:6 }}>Mentor profili bog'lanmagan</p>
        <p style={{ fontSize:13.5, color:'#64748b', lineHeight:1.7 }}>
          {message || "Sizning hisobingizga mentor profili bog'lanmagan. Administratorga murojaat qiling."}
        </p>
      </div>
    </div>
  );
}
