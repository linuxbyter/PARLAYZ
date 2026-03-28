import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// 1. Map directly to YOUR exact .env variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("🛑 FATAL ERROR: Missing Supabase Keys!");
    console.log("Make sure 'SUPABASE_URL' and 'SUPABASE_SERVICE_KEY' are in your .env");
    process.exit(1);
}

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// 15 Crypto Majors for 24/7 nonstop volume
const ASSETS = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
    'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 
    'MATICUSDT', 'SHIBUSDT', 'LTCUSDT', 'TRXUSDT', 'UNIUSDT'
];

const HOUSE_UUID = '63484c36-6b40-492b-8bb1-b785ae636958'; // Your admin UUID
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price';

console.log("🟢 Parlayz Market Maker V2 ONLINE. 15 Majors. Dynamic Hedging Active.");

// ---------------------------------------------------------
// THE MAKER: Create Markets & Inject Skewed Liquidity
// ---------------------------------------------------------
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
            const locksAt = new Date(now.getTime() + 4 * 60000); // 4 min lock
            const resolvesAt = new Date(now.getTime() + 5 * 60000); // 5 min resolve
            
            const timeString = resolvesAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });
            
            // Clean, professional title
            const title = `Will ${displaySymbol} stay strictly ABOVE $${currentPrice.toFixed(4).replace(/\.?0+$/, '')} at ${timeString} EAT?`;
            const description = `[SYS_AUTO] STRIKE:${currentPrice} | Automated 5-minute market. Resolves based on Binance Spot price.`;

            // 1. Create Market (Only using locks_at!)
            const { data: newEvent, error } = await supabase.from('events').insert({
                title: title,
                description: description,
                category: 'Crypto_Majors',
                outcomes: ['Yes (Up)', 'No (Down)'],
                locks_at: locksAt.toISOString(),
                resolved: false
            }).select('id').single();

            if (error) {
                console.error(`❌ Failed to create ${symbol}:`, error.message);
                continue;
            }

            // 2. INTELLIGENT HEDGING (The 70/30 Skew Logic)
            // Total pool size between 2,000 and 6,000 KSh
            const totalLiquidity = Math.floor(Math.random() * (6000 - 2000 + 1) + 2000);
            // Skew the pot between 25% and 75%
            const skewPercent = Math.random() * (0.75 - 0.25) + 0.25; 
            
            const stakeYes = Math.floor(totalLiquidity * skewPercent);
            const stakeNo = totalLiquidity - stakeYes;

            // 3. Inject the House Money
            await supabase.from('bets').insert([
                { event_id: newEvent.id, outcome_index: 0, stake: stakeYes, status: 'open', user_id: HOUSE_UUID },
                { event_id: newEvent.id, outcome_index: 1, stake: stakeNo, status: 'open', user_id: HOUSE_UUID }
            ]);

            console.log(`📈 LAUNCHED: ${displaySymbol} | Pool: ${totalLiquidity} KSh | Skew: ${Math.round(skewPercent*100)}/${Math.round((1-skewPercent)*100)}`);
        }
    } catch (error) {
        console.error("❌ Maker Error:", error.message);
    }
}

// ---------------------------------------------------------
// THE ORACLE: Settle Expired Markets
// ---------------------------------------------------------
async function resolveExpiredMarkets() {
    try {
        // Find markets locked strictly more than 1 minute ago (4min lock + 1min = 5min total duration)
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

            console.log(`⚖️ SETTLING ${symbolMatch}: Strike $${strikePrice} vs Current $${currentPrice} -> Winner: ${isUp ? 'YES' : 'NO'}`);

            const { error: dbError } = await supabase.from('events').update({
                resolved: true,
                winning_outcome_index: winningIndex,
                resolution_link: `https://www.binance.com/en/trade/${symbolMatch}`
            }).eq('id', event.id);

            if (dbError) throw dbError;

            // Trigger your Payout RPC
            await supabase.rpc('resolve_market_payout', { 
                target_event_id: event.id, 
                winning_index: winningIndex 
            });

            console.log(`✅ PAYOUTS DISTRIBUTED FOR EVENT: ${event.id}`);
        }
    } catch (error) {
        console.error("❌ Oracle Error:", error.message);
    }
}

// Run Maker immediately, then every 5 minutes
createMarkets();
setInterval(createMarkets, 5 * 60000);

// Run Oracle every 10 seconds
setInterval(resolveExpiredMarkets, 10000);