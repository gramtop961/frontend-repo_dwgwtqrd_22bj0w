import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Counter({ value, className }) {
  const [display, setDisplay] = useState(0)
  useEffect(()=>{
    let start = 0
    const duration = 700
    const step = 16
    const totalSteps = Math.ceil(duration/step)
    const delta = value/totalSteps
    const id = setInterval(()=>{
      start += delta
      if ((delta >= 0 && start >= value) || (delta < 0 && start <= value)) {
        setDisplay(value)
        clearInterval(id)
      } else {
        setDisplay(start)
      }
    }, step)
    return ()=>clearInterval(id)
  }, [value])
  return <span className={className}>{Math.round(display).toLocaleString()}</span>
}

export default function Summary({ totals }) {
  const positive = totals.profit >= 0
  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-2xl border ${positive? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'} dark:bg-transparent dark:border-opacity-30`}>
        <div className="text-sm">Bénéfice net</div>
        <div className="text-3xl font-bold"><Counter value={totals.profit} /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800"><div className="text-xs text-slate-500">Marge (%)</div><div className="text-xl font-semibold"><Counter value={Math.round(totals.margin)} /></div></div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800"><div className="text-xs text-slate-500">Rendement / kg (Ar)</div><div className="text-xl font-semibold"><Counter value={Math.round(totals.perKg)} /></div></div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800"><div className="text-xs text-slate-500">Coûts totaux (Ar)</div><div className="text-xl font-semibold"><Counter value={Math.round(totals.costTotal)} /></div></div>
      </div>
    </div>
  )
}
