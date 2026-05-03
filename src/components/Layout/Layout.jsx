import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';

const links = [
  { to:'/',              icon:'🏠', label:'Dashboard'     },
  { to:'/exploitations', icon:'🏡', label:'Exploitations' },
  { to:'/parcelles',     icon:'🗺️', label:'Parcelles'     },
  { to:'/traitements',   icon:'💊', label:'Traitements'   },
  { to:'/produits',      icon:'🧪', label:'Produits ONSSA'},
  { to:'/journal',       icon:'📋', label:'Journal'       },
  { to:'/alertes',       icon:'🔔', label:'Alertes'       },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <aside style={{
        width:230,
        background:'linear-gradient(180deg, #A0784A 0%, #7A5530 100%)',
        display:'flex', flexDirection:'column', flexShrink:0,
        boxShadow:'3px 0 20px rgba(120,80,40,0.2)'
      }}>
        {/* Logo + cloche */}
        <div style={{ padding:'22px 16px 18px', borderBottom:'1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, background:'rgba(255,255,255,0.18)',
                borderRadius:10, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:22 }}>
                🌱
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#fdf0d5' }}>PhytoApp</div>
                <div style={{ fontSize:10, color:'#e8c88a' }}>Gestion phytosanitaire</div>
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'14px 10px' }}>
          {links.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to==='/'}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 14px', fontSize:13, textDecoration:'none',
                borderRadius:10, marginBottom:3,
                color:      isActive ? '#ffffff'                : '#f0d9a8',
                background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                fontWeight: isActive ? 700 : 400,
                boxShadow:  isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all .15s',
              })}>
              <span style={{ fontSize:16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:'14px', borderTop:'1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%',
              background:'rgba(255,255,255,0.2)', display:'flex',
              alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:700, color:'white' }}>
              {user?.nom?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, color:'#fdf0d5', fontWeight:600 }}>{user?.nom}</div>
              <div style={{ fontSize:10, color:'#e8c88a', textTransform:'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
            onMouseOut={e  => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
            style={{ width:'100%', padding:'8px', fontSize:12, fontWeight:600,
              background:'rgba(255,255,255,0.12)', color:'#fdf0d5',
              border:'1px solid rgba(255,255,255,0.25)', borderRadius:8,
              cursor:'pointer', transition:'all .2s' }}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ flex:1, padding:32, overflowY:'auto',
        background:'linear-gradient(135deg, #fdf6ec 0%, #f5ead8 100%)' }}>
        <Outlet />
      </main>
    </div>
  );
}