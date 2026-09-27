"""
Galaxy Gaming Hub — Local Game Launcher
========================================
Run this script on your PC to launch installed games directly.
Usage: python game_launcher.py <game_key>

Game keys:
  valorant, roblox, genshin, starrail, wuthering,
  honkai3, zenless, mlbb, minecraft, pubg, fortnite

Example:
  python game_launcher.py valorant
"""

import os
import sys
import subprocess

# ── Edit these paths to match where your games are installed ──────────────────
GAMES = {
    "valorant":  r"C:\Riot Games\VALORANT\live\VALORANT.exe",
    "roblox":    r"C:\Users\{user}\AppData\Local\Roblox\Versions\RobloxPlayerLauncher.exe",
    "genshin":   r"C:\Program Files\Genshin Impact\Genshin Impact Game\GenshinImpact.exe",
    "starrail":  r"C:\Program Files\Star Rail\Games\StarRail.exe",
    "wuthering": r"C:\Program Files\Wuthering Waves\Wuthering Waves Game\Client\Binaries\Win64\WutheringWaves.exe",
    "honkai3":   r"C:\Program Files\Honkai Impact 3rd\Games\BH3.exe",
    "zenless":   r"C:\Program Files\ZenlessZoneZero\Games\ZenlessZoneZero.exe",
    "mlbb":      r"C:\Program Files\Mobile Legends\MobileLegends.exe",
    "minecraft": r"C:\Program Files (x86)\Minecraft Launcher\MinecraftLauncher.exe",
    "pubg":      r"C:\Program Files (x86)\Steam\steamapps\common\PUBG\TslGame.exe",
    "fortnite":  r"C:\Program Files\Epic Games\Fortnite\FortniteGame\Binaries\Win64\FortniteClient-Win64-Shipping.exe",
}

# Fallback browser URLs if the game is not installed locally
BROWSER_URLS = {
    "valorant":  "https://playvalorant.com/",
    "roblox":    "https://www.roblox.com/",
    "genshin":   "https://genshin.hoyoverse.com/",
    "starrail":  "https://hsr.hoyoverse.com/",
    "wuthering": "https://wutheringwaves.kurogames.com/",
    "honkai3":   "https://honkaiimpact3.hoyoverse.com/",
    "zenless":   "https://zenless.hoyoverse.com/",
    "mlbb":      "https://m.mobilelegends.com/",
    "minecraft": "https://www.minecraft.net/",
    "pubg":      "https://pubg.com/",
    "fortnite":  "https://www.fortnite.com/",
}


def launch(game_key: str) -> None:
    key = game_key.lower().strip()

    # Resolve {user} placeholder
    exe = GAMES.get(key, "").replace("{user}", os.environ.get("USERNAME", "User"))

    if exe and os.path.isfile(exe):
        print(f"Launching {key.title()} from: {exe}")
        subprocess.Popen([exe])
    else:
        url = BROWSER_URLS.get(key)
        if url:
            print(f"{key.title()} not found locally. Opening browser: {url}")
            os.startfile(url)
        else:
            print(f"Unknown game: '{key}'. Available keys: {', '.join(GAMES.keys())}")
            sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python game_launcher.py <game_key>")
        print(f"Available keys: {', '.join(GAMES.keys())}")
        sys.exit(0)
    launch(sys.argv[1])
