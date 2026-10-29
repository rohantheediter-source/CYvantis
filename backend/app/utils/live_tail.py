"""
Live Honey-Tail Terminal Stream Simulator for CYVANTIS CLI
"""

import time
from sqlalchemy.orm import Session
from app.models import HoneypotEvent

def start_live_tail(db: Session, max_events: int = 15):
    print("\n=======================================================")
    print("  CYVANTIS LIVE HONEY-TAIL EVENT STREAM (CLI)")
    print("  Press CTRL+C to pause stream and return to menu")
    print("=======================================================")
    print("Timestamp           | Protocol | Source IP       | User:Pass          | Severity | Command/Payload")
    print("-" * 95)

    events = db.query(HoneypotEvent).order_by(HoneypotEvent.timestamp.desc()).limit(max_events).all()
    events.reverse() # Show oldest to newest in stream format

    try:
        for ev in events:
            ts = ev.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            user_pass = f"{ev.username or ''}:{ev.password or ''}"
            cmd = (ev.command or 'N/A')[:30]
            print(f"{ts} | {ev.protocol:<8} | {ev.src_ip:<15} | {user_pass:<18} | {ev.severity:<8} | {cmd}")
            time.sleep(0.4)
        print("-----------------------------------------------------------------------------------------------")
        print("[+] Live stream tail complete. Returned 15 recent honeypot events.")
    except KeyboardInterrupt:
        print("\n[+] Stream paused by user.")
