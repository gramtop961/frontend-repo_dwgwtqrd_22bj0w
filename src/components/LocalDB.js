// Simple wrapper around localStorage with namespacing and JSON handling
export const DB_KEY = 'gplocal-db-v1'

export function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return getDefaultDB()
    return JSON.parse(raw)
  } catch {
    return getDefaultDB()
  }
}

export function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function getDefaultDB() {
  const now = new Date().toISOString()
  return {
    products: [
      { id: 'vanille', name: 'Vanille', createdAt: now },
      { id: 'girofle', name: 'Girofle', createdAt: now },
      { id: 'poivre', name: 'Poivre', createdAt: now },
      { id: 'cafe', name: 'Café', createdAt: now },
    ],
    entries: {
      // per product: { purchases: [], sales: [], costs: [] }
    },
    settings: {
      darkMode: 'system', // 'system' | 'light' | 'dark'
    }
  }
}

export function ensureProduct(db, productId) {
  if (!db.entries[productId]) {
    db.entries[productId] = { purchases: [], sales: [], costs: [] }
  }
}

export function uid(prefix='id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}
