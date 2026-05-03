import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Traitements() {
  const [traitements, setTraitements] = useState([]);
  const [produits,    setProduits]    = useState([]);
  const [parcelles,   setParcelles]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,  setMsg]  = useState({ text:'', type:'' });
  const [form, setForm] = useState({
    parcelle_id:'', produit_id:'', date_application:'',
    dose_utilisee:'', surface_traitee:'', maladie_ciblee:'', mode_application:''
  });
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const load = () => {
    Promise.all([api.get('/traitements'), api.get('/produits'), api.get('/parcelles')])
      .then(([t, p, pa]) => { setTraitements(t.data); setProduits(p.data); setParcelles(pa.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setMsg({ text:'', type:'' });
    try {
      await api.post('/traitements', form);
      setMsg({ text:'✅ Traitement enregistré avec succès !', type:'success' });
      setForm({ parcelle_id:'', produit_id:'', date_application:'', dose_utilisee:'', surface_traitee:'', maladie_ciblee:'', mode_application:'' });
      load();
    } catch (err) {
      setMsg({ text:`⚠️ ${err.response?.data?.message || 'Erreur'}`, type:'error' });
    }
  };

  if (loading) return <div className="empty">Chargement...</div>;

  return (
    <div>
      <h1>💊 Traitements phytosanitaires</h1>

      <div className="card">
        <h3>Saisir un nouveau traitement</h3>
        {msg.text && <div className={`alert-box alert-${msg.type}`}>{msg.text}</div>}
        <form onSubmit={submit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group"><label>Parcelle</label>
              <select value={form.parcelle_id} onChange={set('parcelle_id')} required>
                <option value="">Sélectionner...</option>
                {parcelles.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Produit ONSSA</label>
              <select value={form.produit_id} onChange={set('produit_id')} required>
                <option value="">Sélectionner...</option>
                {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.statut})</option>)}
              </select>
            </div>
            <div className="form-group"><label>Date d'application</label>
              <input type="date" value={form.date_application} onChange={set('date_application')} required /></div>
            <div className="form-group"><label>Dose utilisée (L/ha)</label>
              <input type="number" step="0.01" value={form.dose_utilisee} onChange={set('dose_utilisee')} required /></div>
            <div className="form-group"><label>Surface traitée (ha)</label>
              <input type="number" step="0.1" value={form.surface_traitee} onChange={set('surface_traitee')} required /></div>
            <div className="form-group"><label>Maladie ciblée</label>
              <input value={form.maladie_ciblee} onChange={set('maladie_ciblee')} placeholder="Ex: Mildiou" /></div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label>Mode d'application</label>
              <select value={form.mode_application} onChange={set('mode_application')}>
                <option value="">Sélectionner...</option>
                <option>Pulvérisation foliaire</option>
                <option>Traitement du sol</option>
                <option>Injection</option>
                <option>Drench</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Enregistrer le traitement</button>
        </form>
      </div>

      <div className="card">
        <h3>Historique ({traitements.length})</h3>
        <table>
          <thead><tr><th>Date</th><th>Parcelle</th><th>Produit</th><th>Dose</th><th>Surface</th><th>Maladie</th></tr></thead>
          <tbody>
            {traitements.length === 0 ? <tr><td colSpan={6} className="empty">Aucun traitement</td></tr>
            : traitements.map((t,i) => (
              <tr key={i}>
                <td>{new Date(t.date_application).toLocaleDateString('fr-FR')}</td>
                <td>{t.parcelle}</td><td>{t.produit}</td>
                <td>{t.dose_utilisee} L/ha</td><td>{t.surface_traitee} ha</td>
                <td>{t.maladie_ciblee||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}