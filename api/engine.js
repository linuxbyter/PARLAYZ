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

const HOUSE_UUID = '63484c36-6b40-492b-8bb1-b785ae636958'; 
const ORACLE_API = 'https://api.mexc.com/api/v3/ticker/price';

export default async function handler(req, res) {
    try {
        const oracleRes = await fetch(ORACLE_API);
        const prices = await oracleRes.json();

        if (!Array.isArray(prices)) {
            return res.status(502).json({ error: "Oracle blocked." });
        }

        // 1. SETTLE EXPIRED MARKETS
        const settlementThreshold = new Date(Date.now() - (4.5 * 60000)).toISOString();
        const { data: expiredEvents } = await supabase
            .from('events')
            .select('id, title, description')
            .like('description', '%[SYS_AUTO]%')
            .lte('locks_at', settlementThreshold) 
            .eq('resolved', false);

        if (expiredEvents && expiredEvents.length > 0) {
            await Promise.all(expiredEvents.map(async (event) => {
                const strikeMatch = event.description.match(/STRIKE:([\d.]+)/);
                if (!strikeMatch) return;
                
                const strikePrice = parseFloat(strikeMatch[1]);
                const symbolMatch = ASSETS.find(sym => event.title.includes(sym.replace('USDT', '')));
                if (!symbolMatch) return;

                const assetData = prices.find(p => p.symbol === symbolMatch);
                if (!assetData) return;
                
                const currentPrice = parseFloat(assetData.price);
                const isUp = currentPrice > strikePrice;
                const winningIndex = isUp ? 0 : 1;
                const finalDesc = `${event.description}\n\n🛑 SETTLED: Final oracle price was $${currentPrice}. ${isUp ? 'YES' : 'NO'} wins.`;

                await supabase.from('events').update({
                    resolved: true,
                    winning_outcome_index: winningIndex,
                    description: finalDesc
                }).eq('id', event.id);

                await supabase.rpc('resolve_market_payout', { target_event_id: event.id, winning_index: winningIndex });
            }));
        }

        // 2. CREATE NEW MARKETS (BULK)
        const ms = 1000 * 60 * 5; 
        const currentTick = new Date(Math.floor(Date.now() / ms) * ms);
        const locksAt = new Date(currentTick.getTime() + 5 * 60000); 
        const resolvesAt = new Date(locksAt.getTime() + 5 * 60000); 
        const timeString = resolvesAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });

        const newEventsData = ASSETS.map(symbol => {
            const assetData = prices.find(p => p.symbol === symbol);
            if (!assetData) return null;
            const currentPrice = parseFloat(assetData.price);
            const displaySymbol = symbol.replace('USDT', '');
            
            return {
                title: `Will ${displaySymbol} stay strictly ABOVE $${currentPrice.toFixed(4).replace(/\.?0+$/, '')} at exactly ${timeString} EAT?`,
                description: `${COIN_LORE[symbol] || ''}\n\n[SYS_AUTO] STRIKE:${currentPrice} | Resolves via Live Oracle.`,
                category: 'Crypto_Majors',
                outcomes: ['Yes (Up)', 'No (Down)'],
                locks_at: locksAt.toISOString(),
                resolved: false
            };
        }).filter(Boolean);

        const { data: insertedEvents, error: eventsError } = await supabase
            .from('events')
            .insert(newEventsData)
            .select('id');

        if (eventsError) throw eventsError;

        // 3. INJECT HOUSE LIQUIDITY (BULK)
        const newBetsData = insertedEvents.flatMap(event => {
            const totalLiquidity = Math.floor(Math.random() * 4001 + 2000);
            const skew = Math.random() * 0.5 + 0.25;
            const stakeYes = Math.floor(totalLiquidity * skew);
            return [
                { event_id: event.id, outcome_index: 0, stake: stakeYes, status: 'open', user_id: HOUSE_UUID },
                { event_id: event.id, outcome_index: 1, stake: totalLiquidity - stakeYes, status: 'open', user_id: HOUSE_UUID }
            ];
        });

        await supabase.from('bets').insert(newBetsData);

        return res.status(200).json({ success: true, message: "Engine Synced Successfully." });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
