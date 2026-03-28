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
    // SECURITY: Optional, but you can require a secret header so people can't trigger this manually
    // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    //    return res.status(401).json({ error: 'Unauthorized' });
    // }

    console.log("🟢 Vercel Engine Triggered: Running Oracle & Maker...");

    try {
        const binanceRes = await fetch(BINANCE_API);
        const prices = await binanceRes.json();

        // ---------------------------------------------------------
        // 1. THE ORACLE: Settle Expired Markets First
        // ---------------------------------------------------------
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        const { data: expiredEvents } = await supabase
            .from('events')
            .select('id, title, description')
            .like('description', '%[SYS_AUTO]%')
            .lte('locks_at', oneMinuteAgo) 
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
        // 2. THE MAKER: Create New Markets
        // ---------------------------------------------------------
        for (const symbol of ASSETS) {
            const assetData = prices.find(p => p.symbol === symbol);
            if (!assetData) continue;
            
            const currentPrice = parseFloat(assetData.price);
            const displaySymbol = symbol.replace('USDT', '');
            
            const now = new Date();
            const ms = 1000 * 60 * 5; 
            let locksAt = new Date(Math.ceil(now.getTime() / ms) * ms);
            if (locksAt.getTime() - now.getTime() < 2 * 60000) { locksAt = new Date(locksAt.getTime() + ms); }
            
            const resolvesAt = new Date(locksAt.getTime() + 5 * 60000); 
            const timeString = resolvesAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });
            
            const title = `Will ${displaySymbol} stay strictly ABOVE $${currentPrice.toFixed(4).replace(/\.?0+$/, '')} at exactly ${timeString} EAT?`;
            const lore = COIN_LORE[symbol] || 'Automated 5-minute crypto market.';
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

            const totalLiquidity = Math.floor(Math.random() * (6000 - 2000 + 1) + 2000);
            const skewPercent = Math.random() * (0.75 - 0.25) + 0.25; 
            const stakeYes = Math.floor(totalLiquidity * skewPercent);
            const stakeNo = totalLiquidity - stakeYes;

            await supabase.from('bets').insert([
                { event_id: newEvent.id, outcome_index: 0, stake: stakeYes, status: 'open', user_id: HOUSE_UUID },
                { event_id: newEvent.id, outcome_index: 1, stake: stakeNo, status: 'open', user_id: HOUSE_UUID }
            ]);
        }

        return res.status(200).json({ success: true, message: "Markets cycled successfully." });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}