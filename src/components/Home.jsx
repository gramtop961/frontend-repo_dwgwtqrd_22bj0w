import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { loadDB, saveDB, uid } from './LocalDB'

export default function Home({ onOpenProduct, onOpenSettings }) {
  const [query, setQuery] = useState('')
  const [db, setDb] = useState(loadDB())

  useEffect(() => {
    saveDB(db)
  }, [db])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = db.products || []
    if (!q) return items
    return items.filter(p => p.name.toLowerCase().includes(q))
  }, [db.products, query])

  const addProduct = () => {
    const name = prompt('Nom du produit')?.trim()
    if (!name || name.length < 2) return
    const id = name.normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$|--+/g, '')
    if (db.products.some(p => p.id === id)) return alert('Ce produit existe déjà.')
    const next = { ...db, products: [...db.products, { id, name, createdAt: new Date().toISOString() }] }
    setDb(next)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold flex-1">Produits</h1>
        <button onClick={addProduct} className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl shadow">
          <Plus size={18}/> Ajouter un produit
        </button>
      </header>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence>
          {filtered.map(p => (
            <motion.li key={p.id} layout initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
              <button onClick={()=>onOpenProduct(p)} className="w-full h-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-orange-50 to-white dark:from-slate-900 dark:to-slate-900 p-4 text-left shadow-sm hover:shadow">
                <div className="text-sm text-slate-500 dark:text-slate-400">Créé le {new Date(p.createdAt).toLocaleDateString()}</div>
                <div className="text-lg font-semibold">{p.name}</div>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
