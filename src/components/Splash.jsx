import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Splash({ onFinish }) {
  useEffect(() => {
    const t = setTimeout(() => onFinish?.(), 1400)
    return () => clearTimeout(t)
  }, [onFinish])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-orange-500">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-white text-center"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
            <span className="text-5xl">🌾</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Gestion de Produits Locaux</h1>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
