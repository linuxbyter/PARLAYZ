import os
import random
import time
from supabase import create_client, Client

# --- 1. SETUP CREDENTIALS ---
SUPABASE_URL = "https://blwczecyysitydcdwghj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2N6ZWN5eXNpdHlkY2R3Z2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkyNzExOSwiZXhwIjoyMDg3NTAzMTE5fQ.44Injqen0cnA4hIwBd27_Rq2UF8onPWeMh0xmWc7jr0" 

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 2. THE 5 BOT IDENTITIES ---
BOT_UUIDS = [
    "b0700000-0000-0000-0000-000000000001", # DonHuan001
    "b0700000-0000-0000-0000-000000000002", # vvs_Amad
    "b0700000-0000-0000-0000-000000000003", # Icyyy.Palmer
    "b0700000-0000-0000-0000-000000000004", # Willy254
    "b0700000-0000-0000-0000-000000000005"  # Mia.Satifa
]

def pump_liquidity():
    print("🤖 Booting Parlayz Warzone Market Maker...")
    print("💼 5 Bot Accounts Loaded.\n")
    
    # Fetch all unresolved markets
    response = supabase.table('events').select('*').eq('resolved', False).execute()
    active_events = response.data
    
    if not active_events:
        print("❌ No active markets found. Go launch some in the Admin panel!")
        return

    print(f"🌍 Found {len(active_events)} active markets. Injecting capital...\n")

    for event in active_events:
        event_id = event['id']
        outcomes = event['outcomes']
        title = event['title']
        print(f"⚔️  Seeding Warzone: {title}")

        # Hit every side of the bet so the Orbs light up with varied percentages
        for idx, outcome in enumerate(outcomes):
            # Roll dice: Bots will place between 2 and 5 bets per outcome
            num_bets = random.randint(2, 5) 
            
            for _ in range(num_bets):
                # Randomize the stake sizes (heavier weight on smaller casual bets, occasionally a whale bet)
                stake = random.choice([200, 200, 350, 500, 500, 800, 1200, 2500, 5000]) 
                bot_user = random.choice(BOT_UUIDS)

                # Push bet to the pool
                bet_data = {
                    "event_id": event_id,
                    "outcome_index": idx,
                    "stake": stake,
                    "status": "open",
                    "user_id": bot_user
                }
                
                # Execute the DB insert
                supabase.table('bets').insert(bet_data).execute()
                
                # Deduct from the bot's wallet AND fetch avatar for the terminal readout
                profile_resp = supabase.table('profiles').select('wallet_balance, username, avatar').eq('id', bot_user).execute()
                if profile_resp.data:
                    current_bal = profile_resp.data[0]['wallet_balance']
                    bot_name = profile_resp.data[0]['username']
                    bot_avatar = profile_resp.data[0]['avatar']
                    
                    supabase.table('profiles').update({"wallet_balance": current_bal - stake}).eq('id', bot_user).execute()

                print(f"   -> {bot_avatar} {bot_name} dropped {stake} KSh on '{outcome}'")
                time.sleep(0.4) # Slight delay to mimic human traffic
        
        print("-" * 50)

iif __name__ == "__main__":
    while True:
        try:
            pump_liquidity()
            print("✅ Liquidity injected. The Orbs are glowing.")
            print("⏳ Sleeping for 30 minutes before next injection...")
            time.sleep(10) # 10 seconds
        except Exception as e:
            print(f"⚠️ Error: {e}. Retrying in 60 seconds...")
            time.sleep(60)
