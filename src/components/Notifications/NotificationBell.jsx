import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

export default function NotificationBell() {
  const [data,    setData]    = useState({ notifications:[], non_lues:0 });
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  const fetchNotifs = async () => {
    try {
      const r = await api.get('/notifications');
      setData(r.data);
    } catch {}
  };

  // Polling toutes les 30 secondes
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fermer si clic dehors
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const marquerLu = async () => {
    setLoading(true);
    try {
      await api.put('/notifications/lire');
      await fetchNotifs();
    } catch {}
    setLoading(false);
  };

  const styleType = (type) => ({
    danger: { bg:'#fdecea', color:'#c0392b', border:'#f5b8b8', icon:'🔴' },
    warn:   { bg:'#fef8e7', color:'#9a6500', border:'#f5d98f', icon:'🟡' },
    info:   { bg:'#e8f5d4', color:'#2d7a0a', border:'#b8dca0', icon:'🟢' },
  })[type] || { bg:'#f0f0f0', color:'#666', border:'#ddd', icon:'⚪' };

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60)     return 'À l\'instant';
    if (diff < 3600)   return `Il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400)  return `Il y a ${Math.floor(diff/3600)}h`;
    return `Il y a ${Math.floor(diff/86400)}j`;
  };

  return (
    <div ref={ref} style={{ position:'relative' }}>

      {/* Bouton cloche */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs(); }}
        style={{
          position:'relative', background:'rgba(255,255,255,0.15)',
          border:'1px solid rgba(255,255,255,0.25)', borderRadius:10,
          width:38, height:38, cursor:'pointer', fontSize:18,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .2s',
        }}
        onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
        onMouseOut={e  => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
        🔔
        {data.non_lues > 0 && (
          <span style={{
            position:'absolute', top:-5, right:-5,
            background:'#e74c3c', color:'white',
            borderRadius:'50%', width:18, height:18,
            fontSize:10, fontWeight:800,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid #4a8c1c',
            animation:'pulse 1.5s infinite',
          }}>
            {data.non_lues > 9 ? '9+' : data.non_lues}
          </span>
        )}
      </button>

      {/* Panneau notifications */}
      {open && (
        <div style={{
          position:'absolute', top:46, right:0, width:360,
          background:'white', borderRadius:14,
          border:'1px solid #e0e8cc', zIndex:9999,
          boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
          overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding:'14px 16px', background:'linear-gradient(135deg,#4a8c1c,#2d6a0a)',
            display:'flex', alignItems:'center', justifyContent:'space-between'
          }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'white' }}>
                🔔 Notifications
              </div>
              <div style={{ fontSize:11, color:'#c8e6a0', marginTop:1 }}>
                {data.non_lues} non lue{data.non_lues > 1 ? 's' : ''}
              </div>
            </div>
            {data.non_lues > 0 && (
              <button onClick={marquerLu} disabled={loading}
                style={{ fontSize:11, background:'rgba(255,255,255,0.2)',
                  color:'white', border:'1px solid rgba(255,255,255,0.3)',
                  borderRadius:6, padding:'5px 10px', cursor:'pointer' }}>
                {loading ? '...' : '✓ Tout lire'}
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight:380, overflowY:'auto' }}>
            {data.notifications.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'#aaa', fontSize:13 }}>
                <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
                Aucune notification
              </div>
            ) : data.notifications.map(n => {
              const s = styleType(n.type);
              return (
                <div key={n.id} style={{
                  padding:'12px 16px',
                  borderBottom:'1px solid #f0f4ea',
                  background: n.lu ? 'white' : s.bg,
                  transition:'background .2s',
                }}>
                  <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{s.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:s.color, marginBottom:3 }}>
                        {n.titre}
                      </div>
                      <div style={{ fontSize:12, color:'#555', lineHeight:1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>
                        {timeAgo(n.date)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 16px', background:'#f7fbf0',
            borderTop:'1px solid #e8f0dc', textAlign:'center' }}>
            <span style={{ fontSize:12, color:'#7ab648' }}>
              Actualisation automatique toutes les 30 secondes
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}