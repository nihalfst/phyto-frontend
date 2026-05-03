import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function Produits() {
  const [produits,   setProduits]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('liste');
  const [scanning,   setScanning]   = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError,  setScanError]  = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [msg,        setMsg]        = useState({ text:'', type:'' });
  const [form,       setForm]       = useState({
    nom:'', matiere_active:'', statut:'autorisé',
    culture_autorisee:'', dose_max:'', unite_dose:'L/ha',
    DAR:'', mode_application:'', onssa_code:''
  });

  const videoRef  = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    loadProduits();
    return () => stopScan();
  }, []);

  const loadProduits = () => {
    api.get('/produits')
      .then(r => setProduits(Array.isArray(r.data) ? r.data : []))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };

  const startScan = async () => {
    setScanResult(null);
    setScanError('');
    setScanning(true);

    try {
      readerRef.current = new BrowserMultiFormatReader();
      await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const code = result.getText();
            stopScan();
            handleScanResult(code);
          }
        }
      );
    } catch (e) {
      setScanError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (readerRef.current) {
      try { readerRef.current.reset(); } catch {}
      readerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = async (code) => {
    setScanResult({ code, loading: true });

    // Chercher dans la base locale d'abord
    const local = produits.find(p =>
      p.onssa_code === code ||
      p.nom.toLowerCase().includes(code.toLowerCase())
    );

    if (local) {
      setScanResult({ code, produit: local, source: 'local' });
      return;
    }

    // Chercher via Open Food Facts (base mondiale produits)
    try {
      const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();

      if (data.status === 1) {
        const p = data.product;
        setScanResult({
          code,
          source: 'web',
          infos: {
            nom:            p.product_name || p.product_name_fr || 'Produit inconnu',
            marque:         p.brands || '—',
            categorie:      p.categories || '—',
            description:    p.generic_name || '—',
          }
        });
        // Pré-remplir le formulaire
        setForm(f => ({
          ...f,
          nom:       p.product_name || p.product_name_fr || '',
          onssa_code: code,
        }));
        setShowForm(true);
      } else {
        // Produit non trouvé — pré-remplir avec le code seulement
        setScanResult({ code, source: 'inconnu' });
        setForm(f => ({ ...f, onssa_code: code }));
        setShowForm(true);
      }
    } catch {
      setScanResult({ code, source: 'inconnu' });
      setForm(f => ({ ...f, onssa_code: code }));
      setShowForm(true);
    }
  };

  const submitProduit = async (e) => {
    e.preventDefault();
    setMsg({ text:'', type:'' });
    try {
      await api.post('/produits', form);
      setMsg({ text:'✅ Produit ajouté avec succès !', type:'success' });
      loadProduits();
      setForm({ nom:'', matiere_active:'', statut:'autorisé',
        culture_autorisee:'', dose_max:'', unite_dose:'L/ha',
        DAR:'', mode_application:'', onssa_code:'' });
      setShowForm(false);
      setScanResult(null);
      setActiveTab('liste');
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Erreur', type:'error' });
    }
  };

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const filtered = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    (p.matiere_active||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.onssa_code||'').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="empty">Chargement...</div>;

  return (
    <div>
      <h1>🧪 Produits ONSSA</h1>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[
          { key:'liste',  label:'📋 Catalogue' },
          { key:'scan',   label:'📷 Scanner'   },
          { key:'ajouter',label:'➕ Ajouter'   },
        ].map(t => (
          <button key={t.key}
            onClick={() => { setActiveTab(t.key); if(t.key!=='scan') stopScan(); }}
            style={{
              padding:'9px 20px', borderRadius:10, border:'none',
              cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .2s',
              background: activeTab===t.key ? '#4a8c1c' : 'white',
              color:       activeTab===t.key ? 'white'   : '#4a8c1c',
              border:      activeTab===t.key ? 'none'    : '1px solid #c8dfa8',
              boxShadow:   activeTab===t.key ? '0 3px 10px rgba(74,140,28,0.3)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center',
          background:'#eaf3de', borderRadius:10, padding:'6px 14px',
          fontSize:13, color:'#2d6a0a', fontWeight:600 }}>
          {produits.length} produit{produits.length>1?'s':''}
        </div>
      </div>

      {/* ── SCAN ── */}
      {activeTab === 'scan' && (
        <div className="card">
          <h3>📷 Scanner un code-barres</h3>
          <p style={{ fontSize:13, color:'#666', marginBottom:16 }}>
            Pointez la caméra vers le code-barres d'un produit phytosanitaire
            pour récupérer automatiquement ses informations.
          </p>

          {!scanning && !scanResult && (
            <div style={{ textAlign:'center', padding:'30px 0' }}>
              <div style={{ fontSize:80, marginBottom:16 }}>📷</div>
              <button onClick={startScan}
                style={{ padding:'12px 32px', background:'#4a8c1c', color:'white',
                  border:'none', borderRadius:12, fontSize:15, fontWeight:700,
                  cursor:'pointer', boxShadow:'0 4px 14px rgba(74,140,28,0.4)' }}>
                Démarrer le scan
              </button>
              <p style={{ fontSize:12, color:'#aaa', marginTop:12 }}>
                Autorisez l'accès à la caméra quand demandé
              </p>
            </div>
          )}

          {scanning && (
            <div style={{ position:'relative', borderRadius:16, overflow:'hidden',
              background:'#000', marginBottom:16 }}>
              <video ref={videoRef} style={{ width:'100%', maxHeight:380,
                display:'block', objectFit:'cover' }} />

              {/* Cadre viseur */}
              <div style={{ position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:220, height:140, border:'3px solid #4a8c1c',
                borderRadius:12, boxShadow:'0 0 0 9999px rgba(0,0,0,0.5)' }}>
                {/* Coins */}
                {[
                  {top:0,left:0,borderTop:'4px solid #8fce50',borderLeft:'4px solid #8fce50'},
                  {top:0,right:0,borderTop:'4px solid #8fce50',borderRight:'4px solid #8fce50'},
                  {bottom:0,left:0,borderBottom:'4px solid #8fce50',borderLeft:'4px solid #8fce50'},
                  {bottom:0,right:0,borderBottom:'4px solid #8fce50',borderRight:'4px solid #8fce50'},
                ].map((s,i) => (
                  <div key={i} style={{ position:'absolute', width:20, height:20,
                    borderRadius:2, ...s }} />
                ))}
                {/* Ligne scan animée */}
                <div style={{ position:'absolute', left:0, right:0, height:2,
                  background:'#4a8c1c', animation:'scan 2s linear infinite',
                  boxShadow:'0 0 8px #4a8c1c' }} />
              </div>

              <div style={{ position:'absolute', bottom:16, left:0, right:0,
                textAlign:'center', color:'white', fontSize:13 }}>
                🔍 Scan en cours...
              </div>

              <button onClick={stopScan}
                style={{ position:'absolute', top:12, right:12,
                  background:'rgba(0,0,0,0.6)', color:'white',
                  border:'1px solid rgba(255,255,255,0.3)', borderRadius:8,
                  padding:'6px 14px', cursor:'pointer', fontSize:12 }}>
                ✕ Arrêter
              </button>
            </div>
          )}

          {scanError && (
            <div className="alert-box alert-error">{scanError}</div>
          )}

          {/* Résultat scan */}
          {scanResult && (
            <div>
              <div style={{ padding:'16px', background:'#f0f7e8', borderRadius:12,
                border:'1px solid #c8dfa8', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:24 }}>✅</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:'#2d6a0a' }}>
                      Code scanné avec succès !
                    </div>
                    <div style={{ fontSize:12, color:'#666', marginTop:2 }}>
                      Code : <code style={{ background:'#dff0c8', padding:'2px 6px',
                        borderRadius:4, fontSize:11 }}>{scanResult.code}</code>
                    </div>
                  </div>
                </div>

                {/* Produit trouvé en local */}
                {scanResult.produit && (
                  <div style={{ background:'white', borderRadius:10, padding:14,
                    border:'1px solid #b8dca0' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#2d6a0a', marginBottom:8 }}>
                      ✅ Produit trouvé dans la base ONSSA locale !
                    </div>
                    <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                      {[
                        ['Nom',            scanResult.produit.nom],
                        ['Matière active', scanResult.produit.matiere_active||'—'],
                        ['Statut',         scanResult.produit.statut],
                        ['Dose max',       `${scanResult.produit.dose_max} ${scanResult.produit.unite_dose}`],
                        ['DAR',            `${scanResult.produit.DAR} jours`],
                        ['Cultures',       scanResult.produit.culture_autorisee||'—'],
                      ].map(([k,v]) => (
                        <tr key={k} style={{ borderBottom:'1px solid #f0f4ea' }}>
                          <td style={{ padding:'5px 0', color:'#888', width:'40%' }}>{k}</td>
                          <td style={{ padding:'5px 0', fontWeight:600, color:
                            k==='Statut' ? (v==='autorisé'?'#2d7a0a':v==='interdit'?'#c0392b':'#9a6500') : '#333'
                          }}>{v}</td>
                        </tr>
                      ))}
                    </table>
                  </div>
                )}

                {/* Infos web */}
                {scanResult.infos && (
                  <div style={{ background:'white', borderRadius:10, padding:14,
                    border:'1px solid #b8dca0', marginBottom:10 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#9a6500', marginBottom:8 }}>
                      ℹ️ Produit trouvé en ligne — Complétez les infos ONSSA
                    </div>
                    {Object.entries(scanResult.infos).map(([k,v]) => (
                      <div key={k} style={{ display:'flex', gap:8, fontSize:13,
                        padding:'4px 0', borderBottom:'1px solid #f5f5f5' }}>
                        <span style={{ color:'#888', width:100, flexShrink:0,
                          textTransform:'capitalize' }}>{k} :</span>
                        <span style={{ fontWeight:500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inconnu */}
                {scanResult.source === 'inconnu' && !scanResult.produit && !scanResult.infos && (
                  <div style={{ background:'#fef8e7', borderRadius:10, padding:12,
                    border:'1px solid #f5d98f', fontSize:13, color:'#9a6500' }}>
                    ⚠️ Produit non trouvé — Remplissez le formulaire ci-dessous pour l'ajouter à la base ONSSA
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:10}}>
                <button onClick={() => {
                    setScanResult(null); setShowForm(false);
                    setTimeout(startScan, 300);
                  }}
                  style={{ flex:1, padding:'10px', background:'white', color:'#4a8c1c',
                    border:'1px solid #c8dfa8', borderRadius:10, cursor:'pointer',
                    fontSize:13, fontWeight:600 }}>
                  📷 Scanner à nouveau
                </button>
                {!scanResult.produit && (
                  <button onClick={() => setShowForm(!showForm)}
                    style={{ flex:1, padding:'10px', background:'#4a8c1c', color:'white',
                      border:'none', borderRadius:10, cursor:'pointer',
                      fontSize:13, fontWeight:700 }}>
                    ➕ Ajouter ce produit
                  </button>
                )}
              </div>
            </div>
          )}

          <style>{`
            @keyframes scan {
              0%   { top: 10%; }
              100% { top: 90%; }
            }
          `}</style>
        </div>
      )}

      {/* ── FORMULAIRE AJOUT ── */}
      {(activeTab === 'ajouter' || (activeTab === 'scan' && showForm)) && (
        <div className="card" style={{ marginTop: activeTab==='scan' ? 16 : 0 }}>
          <h3>{activeTab==='scan' ? '➕ Compléter et ajouter le produit' : '➕ Nouveau produit'}</h3>
          {msg.text && <div className={`alert-box alert-${msg.type}`}>{msg.text}</div>}
          <form onSubmit={submitProduit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label>Nom du produit *</label>
                <input value={form.nom} onChange={set('nom')}
                  placeholder="Ex: Fungicide Pro" required />
              </div>
              <div className="form-group">
                <label>Code ONSSA</label>
                <input value={form.onssa_code} onChange={set('onssa_code')}
                  placeholder="Code scanné ou manuel" />
              </div>
              <div className="form-group">
                <label>Matière active</label>
                <input value={form.matiere_active} onChange={set('matiere_active')}
                  placeholder="Ex: Mancozèbe" />
              </div>
              <div className="form-group">
                <label>Statut ONSSA *</label>
                <select value={form.statut} onChange={set('statut')}>
                  <option value="autorisé">✅ Autorisé</option>
                  <option value="en_révision">⚠️ En révision</option>
                  <option value="interdit">🚫 Interdit</option>
                </select>
              </div>
              <div className="form-group">
                <label>Cultures autorisées</label>
                <input value={form.culture_autorisee} onChange={set('culture_autorisee')}
                  placeholder="Ex: Tomate,Blé,Maïs" />
              </div>
              <div className="form-group">
                <label>Dose maximale</label>
                <input type="number" step="0.01" value={form.dose_max}
                  onChange={set('dose_max')} placeholder="Ex: 3.0" />
              </div>
              <div className="form-group">
                <label>Unité dose</label>
                <select value={form.unite_dose} onChange={set('unite_dose')}>
                  <option value="L/ha">L/ha</option>
                  <option value="kg/ha">kg/ha</option>
                  <option value="ml/ha">ml/ha</option>
                  <option value="g/ha">g/ha</option>
                </select>
              </div>
              <div className="form-group">
                <label>DAR — Délai avant récolte (jours)</label>
                <input type="number" value={form.DAR} onChange={set('DAR')}
                  placeholder="Ex: 7" />
              </div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label>Mode d'application</label>
                <select value={form.mode_application} onChange={set('mode_application')}>
                  <option value="">Sélectionner...</option>
                  <option>Pulvérisation foliaire</option>
                  <option>Traitement du sol</option>
                  <option>Injection</option>
                  <option>Drench</option>
                  <option>Enrobage semences</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button type="button"
                onClick={() => { setShowForm(false); setMsg({text:'',type:''}); }}
                style={{ flex:1, padding:'11px', background:'white', color:'#666',
                  border:'1px solid #ddd', borderRadius:10, cursor:'pointer',
                  fontSize:13, fontWeight:600 }}>
                Annuler
              </button>
              <button type="submit"
                style={{ flex:2, padding:'11px', background:'#4a8c1c', color:'white',
                  border:'none', borderRadius:10, cursor:'pointer',
                  fontSize:13, fontWeight:700 }}>
                Enregistrer le produit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── LISTE ── */}
      {activeTab === 'liste' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #eef5e4' }}>
            <input placeholder="🔍 Rechercher par nom, matière active ou code ONSSA..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', padding:'10px 14px', border:'1px solid #c8dfa8',
                borderRadius:10, fontSize:13 }} />
          </div>
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Nom</th><th>Matière active</th><th>Statut</th>
                  <th>Dose max</th><th>DAR</th><th>Cultures</th><th>Code</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7} className="empty">Aucun produit trouvé</td></tr>
                  : filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight:600 }}>{p.nom}</td>
                      <td style={{ color:'#555' }}>{p.matiere_active||'—'}</td>
                      <td>
                        <span className={`badge badge-${
                          p.statut==='autorisé'?'ok':p.statut==='interdit'?'danger':'warn'
                        }`}>{p.statut}</span>
                      </td>
                      <td style={{ fontWeight:500 }}>{p.dose_max} {p.unite_dose}</td>
                      <td>{p.DAR} j</td>
                      <td style={{ fontSize:11, color:'#666' }}>
                        {p.culture_autorisee||'—'}
                      </td>
                      <td>
                        {p.onssa_code
                          ? <code style={{ background:'#eaf3de', padding:'2px 6px',
                              borderRadius:4, fontSize:11, color:'#2d6a0a' }}>
                              {p.onssa_code}
                            </code>
                          : <span style={{ color:'#ccc' }}>—</span>}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}