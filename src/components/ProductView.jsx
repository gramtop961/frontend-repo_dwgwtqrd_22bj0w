import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import { loadDB, saveDB, ensureProduct, uid } from './LocalDB'
import { Cart, ShoppingCart, Wallet, BarChart2 } from 'lucide-react'
import Summary from './Summary'
import Charts from './Charts'

const number = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v))

function Field({ label, type='text', value, onChange, placeholder, error }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs text-slate-500 dark:text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-xl border bg-white/70 dark:bg-slate-900/70 focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800 focus:ring-orange-500'}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Row({ row, onChange, onDelete, kind }) {
  // Validation rules
  const [errors, setErrors] = useState({})
  useEffect(()=>{
    const errs = {}
    if (!row.date || dayjs(row.date).isAfter(dayjs())) errs.date = 'Date invalide'
    if (number(row.weight) <= 0) errs.weight = 'Poids doit être > 0'
    if (number(row.price) <= 0) errs.price = 'Prix doit être > 0'
    if (!row.name || row.name.trim().length < 2) errs.name = 'Nom trop court'
    setErrors(errs)
  }, [row])

  const total = number(row.weight) * number(row.price)

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
      <Field label="Date" type="date" value={row.date} onChange={v=>onChange({...row, date:v})} error={errors.date}/>
      <Field label={kind==='purchase' ? 'Fournisseur' : 'Acheteur'} value={row.name} onChange={v=>onChange({...row, name:v})} error={errors.name} />
      <Field label="Poids (kg)" type="number" value={row.weight} onChange={v=>onChange({...row, weight:v})} error={errors.weight} />
      <Field label={`Prix (${kind==='purchase'?'Achat':'Vente'}) / kg`} type="number" value={row.price} onChange={v=>onChange({...row, price:v})} error={errors.price} />
      <div className="md:col-span-1">
        <div className="text-xs text-slate-500 dark:text-slate-400">Montant</div>
        <div className="font-semibold">{total.toLocaleString()} Ar</div>
      </div>
      <div className="md:col-span-1 flex justify-end">
        <button onClick={onDelete} className="text-red-500 hover:underline">Supprimer</button>
      </div>
    </div>
  )
}

function CostRow({ row, onChange, onDelete }) {
  const [errors, setErrors] = useState({})
  useEffect(()=>{
    const errs = {}
    if (!row.date || dayjs(row.date).isAfter(dayjs())) errs.date = 'Date invalide'
    if (number(row.amount) <= 0) errs.amount = 'Montant > 0'
    if (!row.type || row.type.trim().length < 2) errs.type = 'Type requis'
    setErrors(errs)
  }, [row])

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
      <Field label="Date" type="date" value={row.date} onChange={v=>onChange({...row, date:v})} error={errors.date}/>
      <Field label="Type de coût" value={row.type} onChange={v=>onChange({...row, type:v})} error={errors.type} />
      <Field label="Montant (Ar)" type="number" value={row.amount} onChange={v=>onChange({...row, amount:v})} error={errors.amount} />
      <Field label="Description" value={row.desc || ''} onChange={v=>onChange({...row, desc:v})} placeholder="Optionnel" />
      <div className="md:col-span-1 flex justify-end">
        <button onClick={onDelete} className="text-red-500 hover:underline">Supprimer</button>
      </div>
    </div>
  )
}

export default function ProductView({ product, onBack }) {
  const [db, setDb] = useState(loadDB())
  const [tab, setTab] = useState('purchase')

  useEffect(() => { ensureProduct(db, product.id); saveDB(db) }, [])
  useEffect(() => { saveDB(db) }, [db])

  const data = db.entries[product.id] || { purchases: [], sales: [], costs: [] }

  const totals = useMemo(() => {
    const sumW = (arr) => arr.reduce((a, r) => a + number(r.weight), 0)
    const sumAmt = (arr) => arr.reduce((a, r) => a + number(r.weight) * number(r.price), 0)

    const wBuy = sumW(data.purchases)
    const aBuy = sumAmt(data.purchases)
    const avgBuy = wBuy ? aBuy / wBuy : 0

    const wSell = sumW(data.sales)
    const aSell = sumAmt(data.sales)
    const avgSell = wSell ? aSell / wSell : 0

    const costTotal = data.costs.reduce((a, c) => a + number(c.amount), 0)

    const profit = aSell - aBuy - costTotal
    const margin = aSell ? (profit / aSell) * 100 : 0
    const perKg = wSell ? profit / wSell : 0

    return { wBuy, aBuy, avgBuy, wSell, aSell, avgSell, costTotal, profit, margin, perKg }
  }, [data])

  const upd = (section, list) => {
    const next = { ...db, entries: { ...db.entries, [product.id]: { ...data, [section]: list } } }
    setDb(next)
  }

  const addRow = (section) => {
    const today = dayjs().format('YYYY-MM-DD')
    if (section === 'costs') {
      upd('costs', [{ id: uid('c'), date: today, type: 'Transport', amount: 0, desc: '' }, ...data.costs])
    } else if (section === 'purchases') {
      upd('purchases', [{ id: uid('p'), date: today, name: '', weight: 0, price: 0 }, ...data.purchases])
    } else {
      upd('sales', [{ id: uid('s'), date: today, name: '', weight: 0, price: 0 }, ...data.sales])
    }
  }

  const warning = useMemo(() => {
    // contextual alerts
    const buyAvg = totals.avgBuy
    const sellBelowBuy = data.sales.some(s => number(s.price) < buyAvg && number(s.price) > 0)
    const soldMore = totals.wSell > totals.wBuy
    return {
      sellBelowBuy,
      soldMore,
    }
  }, [data, totals])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 pb-24">
      <button onClick={onBack} className="mb-3 text-orange-600 hover:underline">← Retour</button>
      <h2 className="text-xl font-bold mb-3">{product.name}</h2>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {[
          {id:'purchase', label:'Achat'},
          {id:'sale', label:'Vente'},
          {id:'costs', label:'Coûts annexes'},
          {id:'summary', label:'Résumé / Rentabilité'},
          {id:'charts', label:'Graphiques'},
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 py-2 rounded-full border ${tab===t.id? 'bg-orange-500 text-white border-orange-500' : 'border-slate-200 dark:border-slate-800'}`}>{t.label}</button>
        ))}
      </div>

      {warning.sellBelowBuy && (
        <div className="mb-3 text-sm text-amber-600">⚠️ Certains prix de vente sont inférieurs au prix moyen d'achat.</div>
      )}
      {warning.soldMore && (
        <div className="mb-3 text-sm text-amber-600">⚠️ Le poids vendu dépasse le poids acheté.</div>
      )}

      {tab === 'purchase' && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Achat</h3>
            <button onClick={()=>addRow('purchases')} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white">Ajouter</button>
          </div>
          {data.purchases.map((r)=> (
            <Row key={r.id} kind="purchase" row={r} onChange={(nr)=>{
              upd('purchases', data.purchases.map(x=>x.id===r.id?nr:x))
            }} onDelete={()=>{
              upd('purchases', data.purchases.filter(x=>x.id!==r.id))
            }}/>
          ))}

          <footer className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div><div className="text-xs text-slate-500">Poids total</div><div className="font-semibold">{totals.wBuy.toLocaleString()} kg</div></div>
            <div><div className="text-xs text-slate-500">Prix moyen d'achat</div><div className="font-semibold">{totals.avgBuy.toFixed(0).toLocaleString()} Ar/kg</div></div>
            <div className="md:col-span-2"><div className="text-xs text-slate-500">Montant total</div><div className="font-semibold">{totals.aBuy.toLocaleString()} Ar</div></div>
          </footer>
        </section>
      )}

      {tab === 'sale' && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Vente</h3>
            <button onClick={()=>addRow('sales')} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white">Ajouter</button>
          </div>
          {data.sales.map((r)=> (
            <Row key={r.id} kind="sale" row={r} onChange={(nr)=>{
              upd('sales', data.sales.map(x=>x.id===r.id?nr:x))
            }} onDelete={()=>{
              upd('sales', data.sales.filter(x=>x.id!==r.id))
            }}/>
          ))}

          <footer className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div><div className="text-xs text-slate-500">Poids total</div><div className="font-semibold">{totals.wSell.toLocaleString()} kg</div></div>
            <div><div className="text-xs text-slate-500">Prix moyen de vente</div><div className="font-semibold">{totals.avgSell.toFixed(0).toLocaleString()} Ar/kg</div></div>
            <div className="md:col-span-2"><div className="text-xs text-slate-500">Montant total</div><div className="font-semibold">{totals.aSell.toLocaleString()} Ar</div></div>
          </footer>
        </section>
      )}

      {tab === 'costs' && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Coûts annexes</h3>
            <button onClick={()=>addRow('costs')} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white">Ajouter</button>
          </div>
          {data.costs.map((r)=> (
            <CostRow key={r.id} row={r} onChange={(nr)=>{
              upd('costs', data.costs.map(x=>x.id===r.id?nr:x))
            }} onDelete={()=>{
              upd('costs', data.costs.filter(x=>x.id!==r.id))
            }}/>
          ))}

          <footer className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="md:col-span-4"><div className="text-xs text-slate-500">Total des coûts</div><div className="font-semibold">{totals.costTotal.toLocaleString()} Ar</div></div>
          </footer>
        </section>
      )}

      {tab === 'summary' && (
        <Summary totals={totals} />
      )}

      {tab === 'charts' && (
        <Charts product={product} data={data} />
      )}
    </div>
  )
}
