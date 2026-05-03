import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Parcelles() {
  const [parcelles,     setParcelles]     = useState([]);
  const [exploitations, setExploitations] = useState([]);
  const [cultures,      setCultures]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [msg,           setMsg]           = useState({ text:'', type:'' });
  const [activeTab,     setActiveTab]     = useState('liste');
  const [form, setForm] = useState({
    exploitation_id:'', nom:'', surface:'',
    culture_id:'', gps_lat:'', gps_lng:''
  });
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const load = () => {
    Promise.all([
      api.get('/parcelles'),
      api.get('/exploitations'),
      api.get('/cultures')
    ]).then(([p, e, c]) => {
      setParcelles(p.data);
      setExploitations(e.data);
      setCultures(c.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (activeTab !== 'carte') return;

    const existingLink = document.getElementById('leaflet-css');
    if (!existingLink) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById('leaflet-js');
    if (existingScript) {
      initMap();
      return;
    }

    const script  = document.createElement('script');
    script.id     = 'leaflet-js';
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);
  }, [activeTab, parcelles]);

  const initMap = () => {
    setTimeout(() => {
      const L = window.L;
      if (!L) return;

      const existing = document.getElementById('map')?._leaflet_id;
      if (existing) {
        document.getElementById('map')._leaflet_id = null;
        document.getElementById('map').innerHTML   = '';
      }

      const map = L.map('map').setView([33.9716, -6.8498], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const parcellesAvecGPS = parcelles.filter(p => p.gps_lat && p.gps_lng);

      if (parcellesAvecGPS.length === 0) {
        L.marker([33.9716, -6.8498])
          .addTo(map)
          .bindPopup('<b>Aucune parcelle avec GPS</b><br>Ajoutez des coordonnées GPS à vos parcelles')
          .openPopup();
        return;
      }

      const bounds = [];

      parcellesAvecGPS.forEach(p => {
        const color = p.culture_nom ? '#4a8c1c' : '#e8960a';

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              background:${color};
              width:14px;height:14px;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3)
            "></div>`,
          iconSize:   [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([p.gps_lat, p.gps_lng], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family:Segoe UI,sans-serif;min-width:160px">
            <div style="font-weight:700;font-size:14px;color:#2d5209;margin-bottom:6px">
              🗺️ ${p.nom}
            </div>
            <table style="font-size:12px;width:100%;border-collapse:collapse">
              <tr><td style="color:#888;padding:2px 0">Exploitation</td>
                  <td style="text-align:right;font-weight:500">${p.exploitation_nom||'—'}</td></tr>
              <tr><td style="color:#888;padding:2px 0">Culture</td>
                  <td style="text-align:right;font-weight:500">${p.culture_nom||'—'}</td></tr>
              <tr><td style="color:#888;padding:2px 0">Surface</td>
                  <td style="text-align:right;font-weight:500">${p.surface} ha</td></tr>
              <tr><td style="color:#888;padding:2px 0">GPS</td>
                  <td style="text-align:right;font-size:11px">${parseFloat(p.gps_lat).toFixed(4)}, ${parseFloat(p.gps_lng).toFixed(4)}</td></tr>
            </table>
          </div>
        `);

        bounds.push([p.gps_lat, p.gps_lng]);
      });

      if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
    }, 100);
  };

  const submit = async (e) => {
    e.preventDefault(); setMsg({ text:'', type:'' });
    try {
      await api.post('/parcelles', form);
      setMsg({ text:'✅ Parcelle ajoutée avec succès !', type:'success' });
      setForm({ exploitation_id:'', nom:'', surface:'', culture_id:'', gps_lat:'', gps_lng:'' });
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Erreur', type:'error' });
    }
  };

  if (loading) return <div className="empty">Chargement...</div>;

  return (
    <div>
      <h1>🗺️ Parcelles</h1>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[
          { key:'liste',  label:'📋 Liste'      },
          { key:'carte',  label:'🗺️ Carte GPS'  },
          { key:'ajouter',label:'➕ Nouvelle'   },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              padding:'9px 20px', borderRadius:10, border:'none',
              cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .2s',
              background: activeTab === t.key ? '#4a8c1c' : 'white',
              color:       activeTab === t.key ? 'white'   : '#4a8c1c',
              border:      activeTab === t.key ? 'none'    : '1px solid #c8dfa8',
              boxShadow:   activeTab === t.key ? '0 3px 10px rgba(74,140,28,0.3)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center',
          background:'#eaf3de', borderRadius:10, padding:'6px 14px',
          fontSize:13, color:'#2d6a0a', fontWeight:600 }}>
          {parcelles.length} parcelle{parcelles.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Carte */}
      {activeTab === 'carte' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #eef5e4',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ margin:0 }}>Carte des parcelles — Maroc</h3>
            <div style={{ display:'flex', gap:16, fontSize:12, color:'#666' }}>
              <span><span style={{ display:'inline-block', width:10, height:10,
                borderRadius:'50%', background:'#4a8c1c', marginRight:5 }}/>Avec culture</span>
              <span><span style={{ display:'inline-block', width:10, height:10,
                borderRadius:'50%', background:'#e8960a', marginRight:5 }}/>Sans culture</span>
            </div>
          </div>
          <div id="map" style={{ height:500, width:'100%' }} />
          {parcelles.filter(p => p.gps_lat && p.gps_lng).length === 0 && (
            <div style={{ padding:'12px 20px', background:'#fef8e7',
              borderTop:'1px solid #f5d98f', fontSize:13, color:'#9a6500' }}>
              ⚠️ Aucune parcelle avec coordonnées GPS. Ajoutez des coordonnées lors de la création.
            </div>
          )}
        </div>
      )}

      {/* Liste */}
      {activeTab === 'liste' && (
        <div className="card">
          <h3>Mes parcelles ({parcelles.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Nom</th><th>Exploitation</th><th>Culture</th>
                <th>Surface</th><th>GPS</th>
              </tr>
            </thead>
            <tbody>
              {parcelles.length === 0
                ? <tr><td colSpan={5} className="empty">Aucune parcelle — créez-en une !</td></tr>
                : parcelles.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight:600 }}>{p.nom}</td>
                    <td>{p.exploitation_nom}</td>
                    <td>
                      {p.culture_nom
                        ? <span className="badge badge-ok">{p.culture_nom}</span>
                        : <span style={{ color:'#aaa', fontSize:12 }}>—</span>}
                    </td>
                    <td>{p.surface} ha</td>
                    <td style={{ fontSize:12 }}>
                      {p.gps_lat
                        ? <span style={{ color:'#4a8c1c', fontWeight:500 }}>
                            📍 {parseFloat(p.gps_lat).toFixed(3)}, {parseFloat(p.gps_lng).toFixed(3)}
                          </span>
                        : <span style={{ color:'#aaa' }}>—</span>}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Formulaire */}
      {activeTab === 'ajouter' && (
        <div className="card">
          <h3>Nouvelle parcelle</h3>
          {msg.text && (
            <div className={`alert-box alert-${msg.type}`}>{msg.text}</div>
          )}
          <form onSubmit={submit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group">
                <label>Exploitation *</label>
                <select value={form.exploitation_id} onChange={set('exploitation_id')} required>
                  <option value="">Sélectionner...</option>
                  {exploitations.map(e => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nom de la parcelle *</label>
                <input value={form.nom} onChange={set('nom')}
                  placeholder="Ex: Parcelle Nord" required />
              </div>
              <div className="form-group">
                <label>Surface (ha) *</label>
                <input type="number" step="0.1" min="0"
                  value={form.surface} onChange={set('surface')} required />
              </div>
              <div className="form-group">
                <label>Culture</label>
                <select value={form.culture_id} onChange={set('culture_id')}>
                  <option value="">Aucune</option>
                  {cultures.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>GPS Latitude</label>
                <input type="number" step="any" value={form.gps_lat}
                  onChange={set('gps_lat')} placeholder="Ex: 34.0209" />
              </div>
              <div className="form-group">
                <label>GPS Longitude</label>
                <input type="number" step="any" value={form.gps_lng}
                  onChange={set('gps_lng')} placeholder="Ex: -5.0003" />
              </div>
            </div>

            <div style={{ background:'#f0f7e8', borderRadius:10, padding:'12px 16px',
              marginBottom:16, fontSize:13, color:'#4a8c1c' }}>
              💡 Coordonnées GPS Maroc — Kenitra: 34.26, -6.58 | Rabat: 34.02, -6.83 | Casablanca: 33.57, -7.58 | Fès: 34.03, -5.00
            </div>

            <button type="submit" className="btn btn-primary">
              Ajouter la parcelle
            </button>
          </form>
        </div>
      )}
    </div>
  );
}