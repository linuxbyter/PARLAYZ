import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const ASSETS = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
    'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 
    'MATICUSDT', 'SHIBUSDT', 'LTCUSDT', 'TRXUSDT', 'UNIUSDT'
];

const COIN_LORE = {
    'BTCUSDT': 'Bitcoin is the world’s first decentralized cryptocurrency.',
    'ETHUSDT': 'Ethereum is the leading smart contract platform powering Web3.',
    'SOLUSDT': 'Solana is a high-performance blockchain known for incredible speed.',
    'BNBUSDT': 'BNB is the native coin of the Binance ecosystem.',
    'XRPUSDT': 'XRP is a digital asset built for global institutional payments.',
    'ADAUSDT': 'Cardano is a research-driven, proof-of-stake blockchain.',
    'AVAXUSDT': 'Avalanche is a highly scalable Layer-1 blockchain platform.',
    'DOGEUSDT': 'Dogecoin is the original community-driven meme coin.',
    'DOTUSDT': 'Polkadot enables separate blockchains to transfer value securely.',
    'LINKUSDT': 'Chainlink is a decentralized oracle network feeding real-world data.',
    'MATICUSDT': 'Polygon is a premier Layer-2 scaling solution for Ethereum.',
    'SHIBUSDT': 'Shiba Inu is a wildly popular, highly volatile meme token.',
    'LTCUSDT': 'Litecoin is designed to be the "silver" to Bitcoin\'s gold.',
    'TRXUSDT': 'Tron is focused on building a decentralized digital entertainment system.',
    'UNIUSDT': 'Uniswap is the largest decentralized trading protocol on Ethereum.'
};

const HOUSE_UUID = '63484c36-6b40-492b-8bb1-b785ae636958'; // Your admin UUID
// SWAPPED TO MEXC TO BYPASS VERCEL US-GEO BLOCK
const ORACLE_API = 'https://api.mexc.com/api/v3/ticker/price';

export default async function handler(req, res) {
    console.log("🟢 Vercel Engine Triggered: Running 10-Minute Dopamine Cycle...");

    try {
        const oracleRes = await fetch(ORACLE_API);
        const prices = await oracleRes.json();

        // FAILSAFE: If the exchange blocks us, stop the crash and report it safely.
        if (!Array.isArray(prices)) {
            console.error("🛑 ORACLE ERROR:", prices);
            return res.status(502).json({ error: "Oracle connection blocked or invalid.", details: prices });
        }

        // ---------------------------------------------------------
        // 1. THE ORACLE: Settle Markets
        // ---------------------------------------------------------
        const settlementThreshold = new Date(Date.now() - (4.5 * 60000)).toISOString();
        
        const { data: expiredEvents } = await supabase
            .from('events')
            .select('id, title, description')
            .like('description', '%[SYS_AUTO]%')
            .lte('locks_at', settlementThreshold) 
            .eq('resolved', false);

        if (expiredEvents && expiredEvents.length > 0) {
            for (const event of expiredEvents) {
                const strikeMatch = event.description.match(/STRIKE:([\d.]+)/);
                if (!strikeMatch) continue;
                
                const strikePrice = parseFloat(strikeMatch[1]);
                const symbolMatch = ASSETS.find(sym => event.title.includes(sym.replace('USDT', '')));
                if (!symbolMatch) continue;

                const assetData = prices.find(p => p.symbol === symbolMatch);
                if (!assetData) continue; // Secondary failsafe
                
                const currentPrice = parseFloat(assetData.price);

                const isUp = currentPrice > strikePrice;
                const winningIndex = isUp ? 0 : 1;
                const finalDesc = `${event.description}\n\n🛑 SETTLED: Final oracle price was $${currentPrice}. ${isUp ? 'YES' : 'NO'} wins.`;

                await supabase.from('events').update({
                    resolved: true,
                    winning_outcome_index: winningIndex,
                    resolution_link: `https://www.mexc.com/exchange/${symbolMatch.replace('USDT', '_USDT')}`,
                    description: finalDesc
                }).eq('id', event.id);

                await supabase.rpc('resolve_market_payout', { target_event_id: event.id, winning_index: winningIndex });
            }
        }

      // ---------------------------------------------------------
        // 2. THE MAKER: 10-Min Lifecycle (5 Min Bet + 5 Min Sweat)
        // ---------------------------------------------------------
        const ms = 1000 * 60 * 5; 
        
        // Anchor to the exact current 5-minute block (e.g., exactly 5:00:00)
        const currentTick = new Date(Math.floor(Date.now() / ms) * ms);
        
        // Locks exactly 5 minutes from the tick (e.g., 5:05:00) -> 5 MINS TO BET
        const locksAt = new Date(currentTick.getTime() + 5 * 60000); 
        
        // Settles exactly 5 minutes after locking (e.g., 5:10:00) -> 5 MINS TO SWEAT
        const resolvesAt = new Date(locksAt.getTime() + 5 * 60000); 
        
        const timeString = resolvesAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });