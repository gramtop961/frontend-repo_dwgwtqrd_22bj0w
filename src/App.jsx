import { useEffect, useState } from 'react'
import Splash from './components/Splash'
import Home from './components/Home'
import ProductView from './components/ProductView'
import ExportImport from './components/ExportImport'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [activeProduct, setActiveProduct] = useState(null)

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (m.matches) setShowSplash(false)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {showSplash && <Splash onFinish={()=>setShowSplash(false)} />}

      {!activeProduct ? (
        <>
          <Home onOpenProduct={setActiveProduct} />
          <div className="fixed bottom-4 left-0 right-0 flex justify-center">
            <ExportImport />
          </div>
        </>
      ) : (
        <ProductView product={activeProduct} onBack={()=>setActiveProduct(null)} />
      )}
    </div>
  )
}

export default App
