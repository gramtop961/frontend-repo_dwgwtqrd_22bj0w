import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'
import dayjs from 'dayjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, ArcElement, PointElement, Tooltip, Legend)

export default function Charts({ product, data }) {
  const [type, setType] = useState('bar')

  const byMonth = useMemo(() => {
    const months = {}
    data.sales.forEach(s => {
      const m = dayjs(s.date).format('YYYY-MM')
      months[m] = months[m] || { sell:0, buy:0 }
      months[m].sell += (parseFloat(s.weight)||0)*(parseFloat(s.price)||0)
    })
    data.purchases.forEach(p => {
      const m = dayjs(p.date).format('YYYY-MM')
      months[m] = months[m] || { sell:0, buy:0 }
      months[m].buy += (parseFloat(p.weight)||0)*(parseFloat(p.price)||0)
    })
    const labels = Object.keys(months).sort()
    return {
      labels,
      buy: labels.map(l => months[l].buy),
      sell: labels.map(l => months[l].sell),
      profit: labels.map((l,i)=> months[l].sell - months[l].buy)
    }
  }, [data])

  const byName = useMemo(() => {
    const map = {}
    data.purchases.forEach(p => { map[p.name] = (map[p.name]||0) + (parseFloat(p.weight)||0)*(parseFloat(p.price)||0) })
    data.sales.forEach(s => { map[s.name] = (map[s.name]||0) + (parseFloat(s.weight)||0)*(parseFloat(s.price)||0) })
    const labels = Object.keys(map).filter(Boolean)
    return { labels, amounts: labels.map(l => map[l]) }
  }, [data])

  const compare = useMemo(() => {
    const total = arr => arr.reduce((a,r)=> a + (parseFloat(r.weight)||0)*(parseFloat(r.price)||0), 0)
    return { buy: total(data.purchases), sell: total(data.sales) }
  }, [data])

  const palette = {
    buy: 'rgba(59,130,246,0.7)',
    sell: 'rgba(16,185,129,0.7)',
    profit: 'rgba(249,115,22,0.8)'
  }

  const typeComp = type === 'bar' ? Bar : type === 'line' ? Line : Pie

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['bar','line','pie'].map(t => (
          <button key={t} onClick={()=>setType(t)} className={`px-3 py-1.5 rounded-full border ${type===t? 'bg-orange-500 text-white border-orange-500' : 'border-slate-200 dark:border-slate-800'}`}>{t}</button>
        ))}
      </div>

      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        {type !== 'pie' ? (
          <Bar
            data={{
              labels: byMonth.labels,
              datasets: [
                { label: 'Achats', data: byMonth.buy, backgroundColor: palette.buy },
                { label: 'Ventes', data: byMonth.sell, backgroundColor: palette.sell },
                { label: 'Bénéfice', data: byMonth.profit, backgroundColor: palette.profit },
              ]
            }}
          />
        ) : (
          <Pie data={{ labels: ['Achats','Ventes'], datasets: [{ data: [compare.buy, compare.sell], backgroundColor: [palette.buy, palette.sell] }] }} />
        )}
      </div>

      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        {type !== 'pie' ? (
          <Line data={{ labels: byName.labels, datasets: [{ label: 'Montants par nom', data: byName.amounts, borderColor: palette.profit, backgroundColor: 'rgba(249,115,22,0.2)' }] }} />
        ) : (
          <Pie data={{ labels: byName.labels, datasets: [{ data: byName.amounts, backgroundColor: byName.labels.map((_,i)=>`hsl(${(i*47)%360} 70% 55%)`) }] }} />
        )}
      </div>

      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        {type !== 'pie' ? (
          <Line data={{ labels: byMonth.labels, datasets: [{ label: 'Bénéfice mensuel', data: byMonth.profit, borderColor: palette.profit, backgroundColor: 'rgba(249,115,22,0.2)' }] }} />
        ) : (
          <Pie data={{ labels: byMonth.labels, datasets: [{ data: byMonth.profit.map(v=>Math.max(v,0)), backgroundColor: byMonth.labels.map((_,i)=>`hsl(${(i*47)%360} 70% 55%)`) }] }} />
        )}
      </div>
    </div>
  )
}
