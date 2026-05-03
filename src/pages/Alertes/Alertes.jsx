import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Alertes() {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alertes').then(r => setAlertes(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const style = t => ({ PRODUIT_INTERDIT:'danger', DOSE_DEPASSEE:'warn' })[t] || 'ok';

  if (loading) return <div className="empty">Chargement...</div>;

  return (
    <div>
      <h1>🔔 Alertes ONSSA</h1>
      <div className="card">
        {alertes.length === 0
          ? <div className="empty">✅ Aucune alerte — tous les traitements sont conformes</div>
          : alertes.map((a,i) => (
            <div key={i} className={`alert-box alert-${style(a.type)}`} style={{ marginBottom:10 }}>
              <strong>{a.type}</strong><br/>
              <span style={{ fontSize:13 }}>{a.message}</span><br/>
              <small style={{ opacity:.7 }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</small>
            </div>
          ))
        }
      </div>
    </div>
  );
}