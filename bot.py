import os
import random
import timeimport threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime, timezone, timedelta
from dateutil import parser
from supabase import create_client, Client
from dotenv import load_dotenv

# --- 1. SETUP CREDENTIALS ---
load_dotenv() # Pulls your secret keys from the .env file

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("🚨 Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 2. THE IDENTITIES ---
# Bots 1-4: The Hedgers / Market Makers
HEDGE_BOTS = [
    "b0700000-0000-0000-0000-000000000001", # Maxtheillest
    "b0700000-0000-0000-0000-000000000002", # V2_Toxic
    "b0700000-0000-0000-0000-000000000003", # AmadGotHoes
    "b0700000-0000-0000-0000-000000000004", # Uncle_Byron
]
# Bot 5: The Final Boss (Only steps in to match duels)
HOUSE_BOT = "b0700000-0000-0000-0000-000000000005" # Parlayz_House

PLATFORM_FEE = 0.03

def deduct_balance(bot_id, amount):
    prof = supabase.table('profiles').select('wallet_balance').eq('id', bot_id).execute()
    if prof.data:
        current_bal = prof.data[0]['wallet_balance']
        supabase.table('profiles').update({"wallet_balance": current_bal - amount}).eq('id', bot_id).execute()

def parse_db_time(time_str):
    if not time_str: return None
    time_str = time_str.replace('+00:00', 'Z')
    if time_str.endswith('Z'):
        time_str = time_str[:-1] + '+00:00'
    return datetime.fromisoformat(time_str)

def seed_markets(events):
    print("\n🌱 Scanning for empty arenas...")
    for event in events:
        bets_resp = supabase.table('bets').select('id').eq('event_id', event['id']).execute()
        if len(bets_resp.data) == 0:
            print(f"   -> 💧 Injecting initial liquidity: {event['title']}")
            seed_total = random.randint(1500, 2500)
            num_outcomes = len(event['outcomes'])
            
            for idx in range(num_outcomes):
                stake = int((seed_total / num_outcomes) * random.uniform(0.6, 1.4))
                bot_user = random.choice(HEDGE_BOTS)
                
                supabase.table('bets').insert({
                    "event_id": event['id'], 
                    "outcome_index": idx, 
                    "stake": stake, 
                    "status": "open", 
                    "user_id": bot_user
                }).execute()
                
                deduct_balance(bot_user, stake)
                time.sleep(0.3)

def handle_duels(events):
    print("⚔️ Checking for unmatched T-5 Duels...")
    duels_resp = supabase.table('duels').select('*').eq('status', 'open').eq('house_matched', False).execute()
    
    for duel in duels_resp.data:
        event = next((e for e in events if e['id'] == duel['event_id']), None)
        if not event or not event.get('locks_at'): continue
        
        lock_time = parse_db_time(event['locks_at'])
        time_left = lock_time - datetime.now(timezone.utc)
        
        if timedelta(minutes=0) < time_left < timedelta(minutes=5):
            print(f"   -> 🚨 HOUSE MATCH TRIGGERED! Stepping in on Duel {duel['id']}")
            
            supabase.table('duels').update({
                "status": "matched",
                "house_matched": True,
                "challenger_id": HOUSE_BOT
            }).eq('id', duel['id']).execute()

            hedge_stake = int(duel['required_challenger_stake'] * 0.5)
            hedge_bot = random.choice(HEDGE_BOTS)
            
            supabase.table('bets').insert({
                "event_id": event['id'], 
                "outcome_index": duel['creator_outcome_index'], 
                "stake": hedge_stake, 
                "status": "open", 
                "user_id": hedge_bot
            }).execute()
            
            deduct_balance(hedge_bot, hedge_stake)

            supabase.table('notifications').insert({
                "user_id": duel['creator_id'],
                "message": "Challenge Accepted! ⚡ The House has matched your Duel. Good luck!",
                "type": "duel_matched",
                "is_read": False
            }).execute()

def final_delta_hedge(event):
    if event.get('final_hedge_done') or not event.get('locks_at'): return
    
    lock_time = parse_db_time(event['locks_at'])
    time_left = lock_time - datetime.now(timezone.utc)
    
    if timedelta(minutes=0) < time_left < timedelta(minutes=5):
        print(f"🛡️ Running Final Delta Hedge: {event['title']}")
        
        bets = supabase.table('bets').select('*').eq('event_id', event['id']).eq('status', 'open').execute().data
        if not bets: return
        
        total_pool = sum(b['stake'] for b in bets)
        distributable = total_pool * (1 - PLATFORM_FEE)
        fee_collected = total_pool * PLATFORM_FEE
        
        side_stakes = {i: 0 for i in range(len(event['outcomes']))}
        bot_stakes = {i: 0 for i in range(len(event['outcomes']))}
        
        for b in bets:
            side_stakes[b['outcome_index']] += b['stake']
            if b['user_id'] in HEDGE_BOTS or b['user_id'] == HOUSE_BOT:
                bot_stakes[b['outcome_index']] += b['stake']
                
        total_bot_stake = sum(bot_stakes.values())
        worst_outcome, worst_net = None, float('inf')
        
        for i in range(len(event['outcomes'])):
            if side_stakes[i] == 0: continue
            bot_payout = (bot_stakes[i] / side_stakes[i]) * distributable
            bot_loss = total_bot_stake - bot_stakes[i]
            net_bot_result = bot_payout - bot_loss - bot_stakes[i]
            
            if net_bot_result < worst_net:
                worst_net = net_bot_result
                worst_outcome = i
                
        if worst_net < -fee_collected:
            correction = min((-fee_collected - worst_net) * 1.2, 1000)
            print(f"   -> ⚠️ EXPOSURE DETECTED! Hedging {int(correction)} KSh on outcome {worst_outcome}")
            
            hedge_bot = random.choice(HEDGE_BOTS)
            supabase.table('bets').insert({
                "event_id": event['id'], "outcome_index": worst_outcome, 
                "stake": int(correction), "status": "open", "user_id": hedge_bot
            }).execute()
            deduct_balance(hedge_bot, int(correction))

        supabase.table('events').update({"final_hedge_done": True}).eq('id', event['id']).execute()

def engine_loop():
    print("=========================================")
    print("🤖 Booting Parlayz Warzone Engine...")
    print("💼 5 Identities Loaded. Running continuous market surveillance.")
    print("=========================================\n")
    
    while True:
        try:
            active_events = supabase.table('events').select('*').eq('resolved', False).execute().data
            if not active_events:
                print("💤 No active markets. Sleeping for 60s...")
                time.sleep(60)
                continue

            seed_markets(active_events)
            handle_duels(active_events)
            for event in active_events: final_delta_hedge(event)

            print(f"\n✅ [{datetime.now().strftime('%H:%M:%S')}] Cycle complete. Polling again in 60s...")
            time.sleep(60)
            
        except Exception as e:
            print(f"⚠️ Network/DB Error: {e}. Retrying in 30 seconds...")
            time.sleep(30)

# --- RENDER FREE TIER BYPASS ---
class DummyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Parlayz Warzone Engine is LIVE")

def keep_alive():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), DummyHandler)
    server.serve_forever()

if __name__ == "__main__":
    # 1. Start the fake web server in the background so Render doesn't kill us
    threading.Thread(target=keep_alive, daemon=True).start()
    
    # 2. Boot the actual high-frequency trading engine
    engine_loop()