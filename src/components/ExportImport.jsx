import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import { loadDB, saveDB, DB_KEY } from './LocalDB'

export default function ExportImport() {
  const exportJSON = () => {
    const db = loadDB()
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const name = `gplocal-save-${new Date().toISOString().slice(0,19)}.json`
    saveAs(blob, name)
  }

  const exportExcel = () => {
    const db = loadDB()
    const wb = XLSX.utils.book_new()
    Object.entries(db.entries).forEach(([pid, e]) => {
      const rows = [
        ['Type','Date','Nom','Poids(kg)','Prix/kg','Montant','Type coût','Montant coût','Description']
      ]
      e.purchases.forEach(p=>rows.push(['Achat', p.date, p.name, p.weight, p.price, p.weight*p.price, '', '', '']))
      e.sales.forEach(s=>rows.push(['Vente', s.date, s.name, s.weight, s.price, s.weight*s.price, '', '', '']))
      e.costs.forEach(c=>rows.push(['Coût', c.date, '', '', '', '', c.type, c.amount, c.desc||'']))
      const ws = XLSX.utils.aoa_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, pid.slice(0,28))
    })
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'gplocal-donnees.xlsx')
  }

  const exportPDF = () => {
    const db = loadDB()
    const doc = new jsPDF()
    doc.text('Résumé – Gestion de Produits Locaux', 14, 16)
    let y = 24
    Object.entries(db.entries).forEach(([pid, e]) => {
      doc.setFontSize(12)
      doc.text(pid, 14, y)
      y+=6
      const rows = []
      e.purchases.forEach(p=>rows.push(['Achat', p.date, p.name, p.weight, p.price, p.weight*p.price]))
      e.sales.forEach(s=>rows.push(['Vente', s.date, s.name, s.weight, s.price, s.weight*s.price]))
      e.costs.forEach(c=>rows.push(['Coût', c.date, c.type, '', '', c.amount]))
      autoTable(doc, { startY: y, head: [['Type','Date','Nom/Type','Poids','Prix/kg','Montant']], body: rows })
      y = doc.lastAutoTable.finalY + 8
    })
    doc.save('gplocal-resume.pdf')
  }

  const generateQR = async () => {
    const db = loadDB()
    const json = JSON.stringify(db)
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, json, { width: 240 })
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'gplocal-qr.png'
    link.click()
  }

  const importJSON = async (mergeObj) => {
    try {
      const db = loadDB()
      const incoming = mergeObj || await new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        input.onchange = () => {
          const file = input.files[0]
          const reader = new FileReader()
          reader.onload = () => resolve(JSON.parse(reader.result))
          reader.onerror = reject
          reader.readAsText(file)
        }
        input.click()
      })

      // Merge products
      const ids = new Set(db.products.map(p=>p.id))
      incoming.products.forEach(p=>{ if(!ids.has(p.id)) db.products.push(p) })

      // Merge entries by unique id
      db.entries = db.entries || {}
      Object.entries(incoming.entries || {}).forEach(([pid, e]) => {
        db.entries[pid] = db.entries[pid] || { purchases: [], sales: [], costs: [] }
        ;['purchases','sales','costs'].forEach(k => {
          const existing = new Set(db.entries[pid][k].map(r=>r.id))
          ;(e[k]||[]).forEach(r=>{ if(!existing.has(r.id)) db.entries[pid][k].push(r) })
          // sort by date
          db.entries[pid][k].sort((a,b)=> (a.date||'').localeCompare(b.date))
        })
      })

      saveDB(db)
      alert('Import réussi et fusionné.')
    } catch (e) {
      alert('Import échoué: '+e.message)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={exportPDF} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Exporter PDF</button>
      <button onClick={exportExcel} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Exporter Excel</button>
      <button onClick={exportJSON} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">Sauvegarde JSON</button>
      <button onClick={generateQR} className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800">QR Code</button>
      <button onClick={()=>importJSON()} className="px-3 py-2 rounded-xl bg-orange-500 text-white">Importer / Fusionner</button>
    </div>
  )
}
