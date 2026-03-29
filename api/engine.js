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
const ORACLE_API = 'https://api.mexc.com/api/v3/ticker/price';

export default async function handler(req, res) {
    console.log("🟢 Vercel Engine: Running BULK-Speed 10-Min Cycle...");

    try {
        const oracleRes = await fetch(ORACLE_API);
        const prices = await oracleRes.json();

        if (!Array.isArray(prices)) {
            return res.status(502).json({ error: "Oracle blocked.", details: prices });
        }

        // ---------------------------------------------------------
        // 1. THE ORACLE: Settle Markets (Parallel)
        // ---------------------------------------------------------
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
                    resolution_link: `https://www.mexc.com/exchange/${symbolMatch.replace('USDT', '_USDT')}`,
                    description: finalDesc
                }).eq('id', event.id);

                await supabase.rpc('resolve_market_payout', { target_event_id: event.id, winning_index: winningIndex });
            }));
        }

        // ---------------------------------------------------------
        // 2. THE MAKER: Bulk Create Markets & Fix Overlap
        // ---------------------------------------------------------
        const ms = 1000 * 60 * 5; 
        const currentTick = new Date(Math.floor(Date.now() / ms) * ms);
        
        // 5 Mins to Bet, 5 Mins to Sweat
        const locksAt = new Date(currentTick.getTime() + 5 * 60000); 
        const resolvesAt = new Date(locksAt.getTime() + 5 * 60000); 
        const timeString = resolvesAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });

        const newEventsData = [];

        // Build the payload
        for (const symbol of ASSETS) {
            const assetData = prices.find(p => p.symbol === symbol);
            if (!assetData) continue;
            
            const currentPrice = parseFloat(assetData.price);
            const displaySymbol = symbol.replace('USDT', '');
            
            const title = `Will ${displaySymbol} stay strictly ABOVE $${currentPrice.toFixed(4).replace(/\.?0+$/, '')} at exactly ${timeString} EAT?`;
            const lore = COIN_LORE[symbol] || 'Automated 10-minute crypto cycle.';
            const description = `${lore}\n\n[SYS_AUTO] STRIKE:${currentPrice} | Resolves based on Live Spot Oracle.`;

            newEventsData.push({
                title: title,
                description: description,
                category: 'Crypto_Majors',
                outcomes: ['Yes (Up)', 'No (Down)'],
                locks_at: locksAt.toISOString(),
                closes_at: locksAt.toISOString(), // MAGIC FIX: Stops UI from locking users out early
                resolved: false
            });
        }

        // ONE Trip to the Database for all 15 events
        const { data: insertedEvents, error: eventsError } = await supabase
            .from('events')
            .insert(newEventsData)
            .select('id');

        if (eventsError || !insertedEvents) {
            throw new Error("Bulk Event Insert Failed: " + (eventsError?.message || "Unknown error"));
        }

        const newBetsData = [];

        // Build the payload for the liquidity bets
        for (const event of insertedEvents) {
            const totalLiquidity = Math.floor(Math.random() * (6000 - 2000 + 1) + 2000);
            const skewPercent = Math.random() * (0.75 - 0.25) + 0.25; 
            const stakeYes = Math.floor(totalLiquidity * skewPercent);
            const stakeNo = totalLiquidity - stakeYes;

            newBetsData.push({ event_id: event.id, outcome_index: 0, stake: stakeYes, status: 'open', user_id: HOUSE_UUID });
            newBetsData.push({ event_id: event.id, outcome_index: 1, stake: stakeNo, status: 'open', user_id: HOUSE_UUID });
        }

        // ONE Trip to the Database for all 30 bets
        await supabase.from('bets').insert(newBetsData);

        return res.status(200).json({ success: true, message: "Bulk-Speed 10-Min Cycle completed securely." });

    } catch (error) {
        console.error("Engine Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
