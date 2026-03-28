import { createClient } from '@supabase/supabase-js';

// Vercel automatically injects process.env variables from your Vercel Dashboard
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
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price';

export default async function handler(req, res) {
    console.log("🟢 Vercel Engine Triggered: Running 10-Minute Dopamine Cycle...");

    try {
        const binanceRes = await fetch(BINANCE_API);
        const prices = await binanceRes.json();

        // ---------------------------------------------------------
        // 1. THE ORACLE: Settle Markets from the "Sweat" Period
        // ---------------------------------------------------------
        // A market is ready to settle if its locks_at time was 5 minutes ago.
        // We use 4.5 minutes (270,000 ms) as a buffer just in case Vercel/Cron is a few seconds late.
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
                const currentPrice = parseFloat(assetData.price);

                const isUp = currentPrice > strikePrice;
                const winningIndex = isUp ? 0 : 1;
                const finalDesc = `${event.description}\n\n🛑 SETTLED: Final oracle price was $${currentPrice}. ${isUp ? 'YES' : 'NO'} wins.`;

                await supabase.from('events').update({
                    resolved: true,
                    winning_outcome_index: winningIndex,
                    resolution_link: `https://www.binance.com/en/trade/${symbolMatch}`,
                    description: finalDesc
                }).eq('id', event.id);

                await supabase.rpc('resolve_market_payout', { target_event_id: event.id, winning_index: winningIndex });
            }
        }

        // ---------------------------------------------------------
        // 2. THE MAKER: Create New Markets & Snap to the Clock
        // ---------------------------------------------------------
        // Snap the current time down to the exact 5-minute mark (e.g., 4:42 -> 4:40)
        const ms = 1000 * 60 * 5; 
        const currentTick = new Date(Math.floor(Date.now() / ms) * ms);
        
        // Betting Window: 5 Minutes (Locks at 4:45)
        const locksAt = new Date(currentTick.getTime() + 5 * 60000); 
        
        // Settlement Target: 10 Minutes Total (Settles at 4:50)
        const resolvesAt = new Date(locksAt.getTime() + 5 * 60000); 
        
        const timeString = resolvesAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });

        for (const symbol of ASSETS) {
            const assetData = prices.find(p => p.symbol === symbol);
            if (!assetData) continue;
            
            const currentPrice = parseFloat(assetData.price);
            const displaySymbol = symbol.replace('USDT', '');
            
            // Clean title showing the exact 10-minute settlement time
            const title = `Will ${displaySymbol} stay strictly ABOVE $${currentPrice.toFixed(4).replace(/\.?0+$/, '')} at exactly ${timeString} EAT?`;
            const lore = COIN_LORE[symbol] || 'Automated 10-minute crypto cycle.';
            const description = `${lore}\n\n[SYS_AUTO] STRIKE:${currentPrice} | Resolves based on Binance Spot.`;

            const { data: newEvent, error } = await supabase.from('events').insert({
                title: title,
                description: description,
                category: 'Crypto_Majors',
                outcomes: ['Yes (Up)', 'No (Down)'],
                locks_at: locksAt.toISOString(),
                resolved: false
            }).select('id').single();

            if (error) continue;

            // Generate 70/30 House Liquidity
            const totalLiquidity = Math.floor(Math.random() * (6000 - 2000 + 1) + 2000);
            const skewPercent = Math.random() * (0.75 - 0.25) + 0.25; 
            const stakeYes = Math.floor(totalLiquidity * skewPercent);
            const stakeNo = totalLiquidity - stakeYes;

            await supabase.from('bets').insert([
                { event_id: newEvent.id, outcome_index: 0, stake: stakeYes, status: 'open', user_id: HOUSE_UUID },
                { event_id: newEvent.id, outcome_index: 1, stake: stakeNo, status: 'open', user_id: HOUSE_UUID }
            ]);
        }

        return res.status(200).json({ success: true, message: "10-Min Cycle completed." });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}