import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-matte-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-gold-400 mb-8 tracking-tight">
        PARLAYZ
      </h1>
      <p className="text-gray-400 mb-8 text-xl">
        Premium Prediction Markets
      </p>
      
      <div className="bg-matte-800 border border-matte-700 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Coming Soon
        </h2>
        <p className="text-gray-400 mb-6">
          Stake. Predict. Win.
        </p>
        
        <button 
          onClick={() => setCount(count + 1)}
          className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-matte-900 font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02]"
        >
          Count is {count}
        </button>
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        Golden. Sleek. Matte Black.
      </p>
    </div>
  )
}

export default App
