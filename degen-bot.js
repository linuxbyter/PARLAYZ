import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

// 1. DUMMY SERVER (Keeps Cloud Providers like Render/Railway happy)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🟢 Parlayz Degen Engine is ALIVE and hedging.');
}).listen(PORT, () => console.log(`☁️ Cloud health-check server running on port ${PORT}`));

// 2. SUPABASE SETUP
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("🛑 FATAL ERROR: Missing Supabase Keys!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ASSETS = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
    'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 
    'MATICUSDT', 'SHIBUSDT', 'LTCUSDT', 'TRXUSDT', 'UNIUSDT'
];

// COIN LORE DICTIONARY
const COIN_LORE = {
    'BTCUSDT': 'Bitcoin is the world’s first decentralized cryptocurrency and the largest digital asset by market cap.',
    'ETHUSDT': 'Ethereum is the leading smart contract platform powering decentralized finance (DeFi) and Web3.',
    'SOLUSDT': 'Solana is a high-performance blockchain known for incredible speed and low transaction costs.',
    'BNBUSDT': 'BNB is the native coin of the Binance ecosystem, the largest crypto exchange in the world.',
    'XRPUSDT': 'XRP is a highly scalable digital asset built specifically for global institutional payments.',
    'ADAUSDT': 'Cardano is a research-driven, proof-of-stake blockchain platform built for high security.',
    'AVAXUSDT': 'Avalanche is a highly scalable Layer-1 blockchain platform for decentralized applications.',
    'DOGEUSDT': 'Dogecoin is the original meme coin, backed by massive community support and retail volume.',
    'DOTUSDT': 'Polkadot enables different, entirely separate blockchains to transfer messages and value securely.',
    'LINKUSDT': 'Chainlink is a decentralized oracle network feeding real-world data to smart contracts.',
    'MATICUSDT': 'Polygon is a premier Layer-2 scaling solution designed to make Ethereum faster and cheaper.',
    'SHIBUSDT': 'Shiba Inu is a wildly popular, highly volatile community-driven meme token.',
    'LTCUSDT': 'Litecoin is one of the oldest altcoins, designed to be the "silver" to Bitcoin\'s gold for fast payments.',
    'TRXUSDT': 'Tron is a blockchain focused on building a massive, decentralized global digital entertainment system.',
    'UNIUSDT': 'Uniswap is the largest decentralized automated trading protocol built on Ethereum.'
};

const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price';

console.log("🟢 Parlayz Precision Engine ONLINE. Snapping to 5-min intervals...");

async function createMarkets() {
    try {
        const res = await fetch(BINANCE_API);
        const prices = await res.json();
        
        for (const symbol of ASSETS) {
            const assetData = prices.find(p => p.symbol === symbol);
            if (!assetData) continue;
            
            const currentPrice = parseFloat(assetData.price);
            const displaySymbol = symbol.replace('USDT', '');
            
            const now = new Date();
            const ms = 1000 * 60 * 5; 
            let locksAt = new Date(Math.ceil(now.getTime() / ms) * ms);
            
            if (locksAt.getTime() - now.getTime() < 2 * 60000) {
                locksAt = new Date(locksAt.getTime() + ms);
            }
            
            const resolvesAt = new Date(locksAt.getTime() + 5 * 60000); 
            const timeString = resolvesAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });
            
            const title = `Will ${displaySymbol} stay strictly ABOVE $${currentPrice.toFixed(4).replace(/\.?0+$/, '')} at exactly ${timeString} EAT?`;
            
            // INJECTING THE COIN INFO HERE
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

            console.log(`📈 LAUNCHED: ${displaySymbol} | Locks at ${locksAt.toLocaleTimeString()} | Skew: ${Math.round(skewPercent*100)}/${Math.round((1-skewPercent)*100)}`);
        }
    } catch (error) {
        console.error("❌ Maker Error:", error.message);
    }
}

async function resolveExpiredMarkets() {
    try {
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

        const { data: expiredEvents, error } = await supabase
            .from('events')
            .select('id, title, description')
            .like('description', '%[SYS_AUTO]%')
            .lte('locks_at', oneMinuteAgo) 
            .eq('resolved', false);

        if (error || !expiredEvents || expiredEvents.length === 0) return; 

        const res = await fetch(BINANCE_API);
        const prices = await res.json();

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
            console.log(`✅ SETTLED ${symbolMatch}: Strike $${strikePrice} vs Current $${currentPrice}.`);
        }
    } catch (error) {}
}

createMarkets();
setInterval(createMarkets, 5 * 60000);
setInterval(resolveExpiredMarkets, 10000);