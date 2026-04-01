export const INSTRUMENTS = [
  { id: 'BTC',    label: 'Bitcoin',    symbol: 'BTCUSDT',  category: 'Crypto_Majors',   initialPrice: 87000,   hasBinance: true },
  { id: 'ETH',    label: 'Ethereum',   symbol: 'ETHUSDT',  category: 'Crypto_Majors',   initialPrice: 2100,    hasBinance: true },
  { id: 'SOL',    label: 'Solana',     symbol: 'SOLUSDT',  category: 'Crypto_Majors',   initialPrice: 145,     hasBinance: true },
  { id: 'LTC',    label: 'Litecoin',   symbol: 'LTCUSDT',  category: 'Crypto_Majors',   initialPrice: 85,      hasBinance: true },
  { id: 'LINK',   label: 'Chainlink',  symbol: 'LINKUSDT', category: 'Crypto_Majors',   initialPrice: 14,      hasBinance: true },
  { id: 'DOGE',   label: 'Dogecoin',   symbol: 'DOGEUSDT', category: 'Crypto_Majors',   initialPrice: 0.17,    hasBinance: true },
  { id: 'SHIB',   label: 'Shiba Inu',  symbol: 'SHIBUSDT', category: 'Crypto_Meme',     initialPrice: 0.000024, hasBinance: true },
  { id: 'PEPE',   label: 'Pepe',       symbol: 'PEPEUSDT', category: 'Crypto_Meme',     initialPrice: 0.000012, hasBinance: true },
  { id: 'NAS100', label: 'Nasdaq 100', symbol: 'NAS100',   category: 'Finance_Futures', initialPrice: 17800,   hasBinance: false },
  { id: 'GOLD',   label: 'Gold (XAU)', symbol: 'XAUUSDT',  category: 'Finance_Futures', initialPrice: 3050,    hasBinance: false },
  { id: 'OIL',    label: 'Brent Crude',symbol: 'UKOIL',    category: 'Finance_Futures', initialPrice: 85,      hasBinance: false },
] as const

export const VOLATILITY: Record<string, number> = {
  BTC: 0.0008, ETH: 0.001, SOL: 0.0015, LTC: 0.001,
  LINK: 0.0015, DOGE: 0.002, SHIB: 0.003, PEPE: 0.004,
  NAS100: 0.0005, GOLD: 0.0003, OIL: 0.0008,
}

export const INSTRUMENT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Crypto_Majors', label: 'Majors' },
  { id: 'Crypto_Meme', label: 'Meme' },
  { id: 'Finance_Futures', label: 'Futures' },
] as const

export type InstrumentId = typeof INSTRUMENTS[number]['id']
export type InstrumentCategory = typeof INSTRUMENTS[number]['category']

export const isAutoResolvable = (category: string): boolean => {
  return category.startsWith('Crypto_') || category.startsWith('Finance_Futures')
}

export const getDecimalPlaces = (id: string): number => {
  if (id === 'SHIB' || id === 'PEPE') return 8
  if (id === 'DOGE' || id === 'SOL' || id === 'LINK' || id === 'LTC') return 2
  if (id === 'ETH') return 2
  if (id === 'BTC') return 2
  return 2
}

export const formatPrice = (price: number, id: string): string => {
  const decimals = getDecimalPlaces(id)
  return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
