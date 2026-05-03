import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ nom:'', email:'', mot_de_passe:'', confirmer:'', role:'agriculteur' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.mot_de_passe !== form.confirmer) return setError('Mots de passe différents');
    if (form.mot_de_passe.length < 6) return setError('Minimum 6 caractères');
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: form.nom, email: form.email, mot_de_passe: form.mot_de_passe, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSuccess('Compte créé ! Redirection...');
      setTimeout(() => navigate('/login'), 1500);
    } catch { setError('Impossible de contacter le serveur'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f7f0' }}>
      <div className="card" style={{ width:420 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:36 }}>🌱</div>
          <h2 style={{ color:'#2d5209', fontSize:22, margin:'8px 0 4px' }}>Créer un compte</h2>
          <p style={{ color:'#777', fontSize:13 }}>PhytoApp — Gestion phytosanitaire</p>
        </div>

        {error   && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        <form onSubmit={submit}>
          <div className="form-group"><label>Nom complet</label>
            <input value={form.nom} onChange={set('nom')} placeholder="Ahmed Hassan" required /></div>
          <div className="form-group"><label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemple.com" required /></div>
          <div className="form-group"><label>Rôle</label>
            <select value={form.role} onChange={set('role')}>
              <option value="agriculteur">🌾 Agriculteur</option>
              <option value="technicien">🔬 Technicien</option>
              <option value="admin">⚙️ Administrateur</option>
            </select>
          </div>
          <div className="form-group"><label>Mot de passe</label>
            <input type="password" value={form.mot_de_passe} onChange={set('mot_de_passe')} placeholder="Minimum 6 caractères" required /></div>
          <div className="form-group"><label>Confirmer le mot de passe</label>
            <input type="password" value={form.confirmer} onChange={set('confirmer')} placeholder="Répéter le mot de passe" required /></div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Création...' : "S'inscrire"}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#666' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color:'#3B6D11', fontWeight:600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}