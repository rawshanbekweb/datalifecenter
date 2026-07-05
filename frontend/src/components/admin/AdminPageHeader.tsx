interface AdminPageHeaderProps {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}

export default function AdminPageHeader({ title, sub, actions }: AdminPageHeaderProps): React.ReactElement {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:16, flexWrap:'wrap', marginBottom:24 }}>
      <div style={{ flex:1, minWidth:220 }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:2 }}>{title}</h1>
        {sub && <p style={{ fontSize:13, color:'#64748b' }}>{sub}</p>}
      </div>
      {actions}
    </div>
  );
}
