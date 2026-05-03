import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Journal() {
  const { user }  = useAuth();
  const [journal,  setJournal]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filtre,   setFiltre]   = useState('tous');
  const [exporting,setExporting]= useState(false);

  useEffect(() => {
    api.get('/journal')
      .then(r => setJournal(Array.isArray(r.data) ? r.data : []))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const filtered = journal.filter(j => {
    const matchSearch =
      (j.parcelle||'').toLowerCase().includes(search.toLowerCase()) ||
      (j.produit||'').toLowerCase().includes(search.toLowerCase())  ||
      (j.maladie_ciblee||'').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc  = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
      const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() };

      // ── Fond header ──
      doc.setFillColor(74, 140, 28);
      doc.rect(0, 0, page.w, 38, 'F');

      // ── Logo cercle ──
      doc.setFillColor(255, 255, 255);
      doc.circle(22, 19, 11, 'F');
      doc.setFillColor(74, 140, 28);
      doc.setFontSize(16);
      doc.text('🌱', 16, 22);

      // ── Titre ──
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PhytoApp', 37, 16);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Gestion phytosanitaire — Maroc', 37, 23);

      // ── Date & utilisateur ──
      doc.setFontSize(9);
      doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR', {
        weekday:'long', year:'numeric', month:'long', day:'numeric'
      })}`, 37, 30);

      const infoX = page.w - 10;
      doc.setFont('helvetica', 'bold');
      doc.text(`${user?.nom || ''}`, infoX, 16, { align:'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(`Rôle : ${user?.role || ''}`, infoX, 23, { align:'right' });
      doc.text(`${filtered.length} traitement(s)`, infoX, 30, { align:'right' });

      // ── Ligne séparatrice ──
      doc.setDrawColor(45, 106, 10);
      doc.setLineWidth(0.5);
      doc.line(0, 38, page.w, 38);

      // ── Titre section ──
      doc.setTextColor(45, 106, 10);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Journal phytosanitaire', 14, 48);

      doc.setTextColor(120, 120, 120);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Conforme aux exigences ONSSA — Traçabilité complète des traitements', 14, 54);

      // ── Tableau ──
      autoTable(doc, {
        startY: 58,
        head: [[
          'Date', 'Parcelle', 'Produit phytosanitaire',
          'Dose (L/ha)', 'Surface (ha)', 'Maladie ciblée', 'Mode application'
        ]],
        body: filtered.map(j => [
          new Date(j.date_application).toLocaleDateString('fr-FR'),
          j.parcelle   || '—',
          j.produit    || '—',
          j.dose_utilisee   ? `${j.dose_utilisee} L/ha` : '—',
          j.surface_traitee ? `${j.surface_traitee} ha` : '—',
          j.maladie_ciblee  || '—',
          j.mode_application|| '—',
        ]),
        headStyles: {
          fillColor:   [74, 140, 28],
          textColor:   255,
          fontStyle:   'bold',
          fontSize:    9,
          halign:      'center',
          cellPadding: 4,
        },
        bodyStyles: {
          fontSize:    8.5,
          cellPadding: 3.5,
          textColor:   [50, 50, 50],
        },
        alternateRowStyles: {
          fillColor: [240, 247, 232],
        },
        columnStyles: {
          0: { halign:'center', cellWidth:22 },
          1: { cellWidth:35 },
          2: { cellWidth:50 },
          3: { halign:'center', cellWidth:22 },
          4: { halign:'center', cellWidth:22 },
          5: { cellWidth:45 },
          6: { cellWidth:45 },
        },
        margin:      { left:14, right:14 },
        tableWidth:  'wrap',
        didDrawPage: (data) => {
          // Footer chaque page
          const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
          const total   = doc.internal.getNumberOfPages();

          doc.setFillColor(74, 140, 28);
          doc.rect(0, page.h - 12, page.w, 12, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text('PhytoApp — Gestion phytosanitaire conforme ONSSA', 14, page.h - 4.5);
          doc.text(`Page ${pageNum} / ${total}`, page.w / 2, page.h - 4.5, { align:'center' });
          doc.text(`© ${new Date().getFullYear()} PhytoApp`, page.w - 14, page.h - 4.5, { align:'right' });
        },
      });

      // ── Stats résumé (dernière page) ──
      const finalY = doc.lastAutoTable.finalY + 10;
      if (finalY < page.h - 40) {
        doc.setFillColor(240, 247, 232);
        doc.roundedRect(14, finalY, page.w - 28, 22, 3, 3, 'F');
        doc.setDrawColor(74, 140, 28);
        doc.roundedRect(14, finalY, page.w - 28, 22, 3, 3, 'S');

        doc.setTextColor(45, 106, 10);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Résumé', 20, finalY + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(`Total traitements : ${filtered.length}`, 20, finalY + 16);

        if (filtered.length > 0) {
          const totalSurface = filtered.reduce((s,j) => s + parseFloat(j.surface_traitee||0), 0);
          const produits     = [...new Set(filtered.map(j => j.produit))];
          doc.text(`Surface totale traitée : ${totalSurface.toFixed(1)} ha`, 80, finalY + 16);
          doc.text(`Produits utilisés : ${produits.length}`, 160, finalY + 16);
          doc.text(`Période : ${new Date(filtered[filtered.length-1]?.date_application).toLocaleDateString('fr-FR')} → ${new Date(filtered[0]?.date_application).toLocaleDateString('fr-FR')}`, 220, finalY + 16);
        }
      }

      doc.save(`journal-phytosanitaire-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la génération du PDF');
    }
    setExporting(false);
  };

  if (loading) return <div className="empty">Chargement...</div>;

  return (
    <div>
      <h1>📋 Journal phytosanitaire</h1>

      {/* Barre outils */}
      <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
        <input
          placeholder="🔍 Rechercher parcelle, produit, maladie..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'10px 14px',
            border:'1px solid #c8dfa8', borderRadius:10, fontSize:13 }} />

        <div style={{ display:'flex', alignItems:'center', background:'#eaf3de',
          borderRadius:10, padding:'6px 14px', fontSize:13, color:'#2d6a0a', fontWeight:600 }}>
          {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
        </div>

        <button onClick={exportPDF} disabled={exporting || filtered.length === 0}
          style={{ padding:'10px 20px', background: filtered.length === 0 ? '#ccc' : '#c0392b',
            color:'white', border:'none', borderRadius:10, fontSize:13,
            fontWeight:700, cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', gap:8, transition:'all .2s',
            boxShadow: filtered.length > 0 ? '0 3px 10px rgba(192,57,43,0.3)' : 'none' }}>
          {exporting ? '⏳ Génération...' : '📄 Exporter PDF'}
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #eef5e4',
          display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16 }}>📋</span>
          <h3 style={{ margin:0 }}>Historique complet des traitements</h3>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ minWidth:700 }}>
            <thead>
              <tr>
                <th>Date</th><th>Parcelle</th><th>Produit</th>
                <th>Dose</th><th>Surface</th><th>Maladie</th><th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} className="empty">
                    {search ? 'Aucun résultat pour cette recherche' : 'Aucune entrée dans le journal'}
                  </td></tr>
                : filtered.map((j,i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace:'nowrap', fontWeight:600, color:'#4a8c1c' }}>
                      {new Date(j.date_application).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ fontWeight:500 }}>{j.parcelle}</td>
                    <td>{j.produit}</td>
                    <td><span className="badge badge-ok">{j.dose_utilisee} L/ha</span></td>
                    <td>{j.surface_traitee} ha</td>
                    <td>{j.maladie_ciblee || <span style={{ color:'#aaa' }}>—</span>}</td>
                    <td style={{ fontSize:12, color:'#666' }}>{j.mode_application || <span style={{ color:'#aaa' }}>—</span>}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Footer résumé */}
        {filtered.length > 0 && (
          <div style={{ padding:'12px 20px', background:'#f7fbf0',
            borderTop:'1px solid #eef5e4', display:'flex', gap:24,
            fontSize:12, color:'#4a8c1c', fontWeight:600 }}>
            <span>📊 {filtered.length} traitement(s)</span>
            <span>🌍 {filtered.reduce((s,j)=>s+parseFloat(j.surface_traitee||0),0).toFixed(1)} ha traité(s)</span>
            <span>🧪 {[...new Set(filtered.map(j=>j.produit))].length} produit(s) différent(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}