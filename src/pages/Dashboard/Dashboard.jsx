import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';

const WEATHER_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'🌨️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
};
const WEATHER_DESC = {
  0:'Ciel dégagé',1:'Peu nuageux',2:'Partiellement nuageux',3:'Couvert',
  51:'Bruine légère',61:'Pluie légère',63:'Pluie',80:'Averses',95:'Orage',
};
const JOURS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const COLORS  = ['#4a8c1c','#7ab648','#a8d878','#c8e6a0','#e8f5d4','#2d6a0a'];
const COLORS2 = ['#c0392b','#e8960a','#2d86c5','#8e44ad','#16a085'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:'1px solid #e0e8cc', borderRadius:8,
      padding:'8px 12px', fontSize:12, boxShadow:'0 2px 8px rgba(0,0,0,.1)' }}>
      <div style={{ fontWeight:700, color:'#2d5209', marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle"
      dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent*100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [weather, setWeather] = useState(null);
  const [wLoad,   setWLoad]   = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setStats(r.data))
      .catch(()=>{})
      .finally(()=>setLoading(false));

    fetch(
      'https://api.open-meteo.com/v1/forecast?' +
      'latitude=34.26&longitude=-6.58' +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode' +
      '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum' +
      '&timezone=Africa%2FCasablanca&forecast_days=5'
    ).then(r=>r.json()).then(setWeather).catch(()=>{}).finally(()=>setWLoad(false));
  }, []);

  const getAdvice = (code, rain) => {
    if ([95,96,99].includes(code))              return { text:'⛈️ Traitement impossible — orage',         color:'#c0392b', bg:'#fdecea' };
    if ([61,63,65,80,81,82].includes(code)||rain>2) return { text:'🌧️ Ne pas traiter — pluie prévue',    color:'#c0392b', bg:'#fdecea' };
    if ([51,53,55].includes(code))              return { text:'🌦️ Traitement déconseillé — bruine',       color:'#9a6500', bg:'#fef8e7' };
    if ([2,3].includes(code))                   return { text:'⛅ Conditions acceptables — surveiller',   color:'#9a6500', bg:'#fef8e7' };
    return                                             { text:'✅ Conditions idéales pour traiter',        color:'#2d7a0a', bg:'#e8f5d4' };
  };

  if (loading) return <div className="empty">Chargement...</div>;

  const cur    = weather?.current;
  const daily  = weather?.daily;
  const advice = cur ? getAdvice(cur.weathercode, daily?.precipitation_sum?.[0]||0) : null;

  const alertesData = stats?.alertesParType?.map(a => ({
    name:  a.type.replace(/_/g,' '),
    value: parseInt(a.total),
  })) || [];

  const cultureData = stats?.parCulture?.map(c => ({
    name:  c.culture || 'Inconnue',
    value: parseInt(c.total),
  })) || [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ marginBottom:4 }}>🏠 Tableau de bord</h1>
        <p style={{ color:'#7ab648', fontSize:14 }}>
          Bienvenue, <strong>{user?.nom}</strong> —{' '}
          {new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Traitements', value:stats?.total_traitements||0, icon:'💊', color:'#4a8c1c', bg:'#eaf3de' },
          { label:'Parcelles',   value:stats?.total_parcelles||0,   icon:'🗺️', color:'#1a6b9a', bg:'#e8f4fd' },
          { label:'Alertes',     value:stats?.total_alertes||0,     icon:'🔔', color:'#c0392b', bg:'#fdecea' },
        ].map(c => (
          <div key={c.label} className="stat-card"
            style={{ background:c.bg, border:`1px solid ${c.color}25` }}>
            <div style={{ fontSize:32, marginBottom:8 }}>{c.icon}</div>
            <div style={{ fontSize:40, fontWeight:800, color:c.color, lineHeight:1 }}>{c.value}</div>
            <div style={{ fontSize:13, color:c.color, opacity:.8, marginTop:6, fontWeight:600 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Météo */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ margin:0 }}>🌤️ Météo — Kénitra, Maroc</h3>
          {!wLoad && cur && <span style={{ fontSize:12, color:'#aaa' }}>Open-Meteo • En direct</span>}
        </div>
        {wLoad && <div style={{ textAlign:'center', padding:30, color:'#aaa', fontSize:13 }}>Chargement météo...</div>}
        {!wLoad && cur && daily && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20,
              alignItems:'center', padding:16, background:'#f7fbf0', borderRadius:12, marginBottom:14 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:52 }}>{WEATHER_ICONS[cur.weathercode]||'🌡️'}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:4 }}>{WEATHER_DESC[cur.weathercode]||'Variable'}</div>
              </div>
              <div>
                <div style={{ fontSize:46, fontWeight:800, color:'#2d5209', lineHeight:1 }}>
                  {Math.round(cur.temperature_2m)}°C
                </div>
                <div style={{ fontSize:13, color:'#666', marginTop:6, display:'flex', gap:16, flexWrap:'wrap' }}>
                  <span>💧 <strong>{cur.relative_humidity_2m}%</strong></span>
                  <span>💨 <strong>{Math.round(cur.wind_speed_10m)} km/h</strong></span>
                  <span>🌧️ <strong>{daily.precipitation_sum?.[0]??0} mm</strong></span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:700, color:'#c0392b', fontSize:15 }}>↑ {Math.round(daily.temperature_2m_max?.[0])}°</div>
                <div style={{ fontWeight:700, color:'#2d86c5', fontSize:15 }}>↓ {Math.round(daily.temperature_2m_min?.[0])}°</div>
              </div>
            </div>
            {advice && (
              <div style={{ padding:'11px 16px', borderRadius:10, marginBottom:14,
                background:advice.bg, color:advice.color, fontWeight:600, fontSize:13,
                border:`1px solid ${advice.color}30` }}>
                {advice.text}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
              {daily.weathercode?.slice(0,5).map((code,i) => {
                const d = new Date(); d.setDate(d.getDate()+i);
                const rain = daily.precipitation_sum?.[i]??0;
                return (
                  <div key={i} style={{ background:i===0?'#eaf3de':'white',
                    border:`1px solid ${i===0?'#b8dca0':'#eef5e4'}`,
                    borderRadius:12, padding:'12px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:i===0?'#2d7a0a':'#888',
                      marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>
                      {i===0?'Auj.':JOURS[d.getDay()]}
                    </div>
                    <div style={{ fontSize:26, marginBottom:6 }}>{WEATHER_ICONS[code]||'🌡️'}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#c0392b' }}>{Math.round(daily.temperature_2m_max?.[i])}°</div>
                    <div style={{ fontSize:12, color:'#2d86c5' }}>{Math.round(daily.temperature_2m_min?.[i])}°</div>
                    {rain>0 && <div style={{ fontSize:11, color:'#2d86c5', marginTop:4 }}>💧{rain.toFixed(1)}mm</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Graphiques row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

        {/* Traitements par mois */}
        <div className="card">
          <h3>📈 Traitements par mois</h3>
          {!stats?.parMois?.length
            ? <div className="empty" style={{ padding:40 }}>Aucune donnée</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.parMois} margin={{ top:5, right:10, bottom:5, left:-20 }}>
                  <defs>
                    <linearGradient id="colorT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4a8c1c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4a8c1c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ea" />
                  <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} />
                  <YAxis tick={{ fontSize:11, fill:'#888' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Traitements"
                    stroke="#4a8c1c" strokeWidth={2.5}
                    fill="url(#colorT)" dot={{ fill:'#4a8c1c', r:4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Top produits */}
        <div className="card">
          <h3>🧪 Top produits utilisés</h3>
          {!stats?.topProduits?.length
            ? <div className="empty" style={{ padding:40 }}>Aucune donnée</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={stats.topProduits.map(p=>({ name:p.produit.substring(0,14), total:parseInt(p.total) }))}
                  margin={{ top:5, right:10, bottom:5, left:-20 }}
                  layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ea" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#555' }} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Utilisations" radius={[0,6,6,0]}>
                    {stats.topProduits.map((_,i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Graphiques row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

        {/* Alertes par type */}
        <div className="card">
          <h3>🔔 Alertes par type</h3>
          {!alertesData.length
            ? (
              <div style={{ textAlign:'center', padding:'30px 0', color:'#7ab648' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
                <div style={{ fontSize:13 }}>Aucune alerte — conformité parfaite !</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={alertesData} cx="50%" cy="50%"
                    outerRadius={80} dataKey="value"
                    labelLine={false} label={<CustomPieLabel />}>
                    {alertesData.map((_,i) => (
                      <Cell key={i} fill={COLORS2[i % COLORS2.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[v,n]} />
                  <Legend iconType="circle" iconSize={10}
                    formatter={v => <span style={{ fontSize:11, color:'#555' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Traitements par culture */}
        <div className="card">
          <h3>🌾 Traitements par culture</h3>
          {!cultureData.length
            ? <div className="empty" style={{ padding:40 }}>Aucune donnée</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cultureData} margin={{ top:5, right:10, bottom:5, left:-20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ea" />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#888' }} />
                  <YAxis tick={{ fontSize:11, fill:'#888' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Traitements" radius={[6,6,0,0]}>
                    {cultureData.map((_,i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Derniers traitements */}
      <div className="card">
        <h3>📊 Derniers traitements</h3>
        {!stats?.derniers?.length
          ? <div className="empty">Aucun traitement enregistré</div>
          : (
            <table>
              <thead>
                <tr><th>Parcelle</th><th>Produit</th><th>Date</th><th>Dose</th><th>Surface</th></tr>
              </thead>
              <tbody>
                {stats.derniers.map((t,i) => (
                  <tr key={i}>
                    <td><strong>{t.parcelle}</strong></td>
                    <td>{t.produit}</td>
                    <td>{new Date(t.date_application).toLocaleDateString('fr-FR')}</td>
                    <td><span className="badge badge-ok">{t.dose_utilisee} L/ha</span></td>
                    <td>{t.surface_traitee} ha</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}