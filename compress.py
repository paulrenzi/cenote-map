"""Compress images/*.{jpg,png} -> .webp, target ~85 quality."""
import os, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).parent / "images"
TARGETS = {".jpg", ".jpeg", ".png"}

def have_cwebp() -> bool:
    try:
        subprocess.run(["cwebp", "-version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

def main() -> int:
    if not ROOT.exists():
        print(f"  {ROOT} does not exist — skip")
        return 0
    if not have_cwebp():
        print("  cwebp not installed — install libwebp (brew/apt/choco) to compress")
        return 0
    converted = 0
    for src in ROOT.rglob("*"):
        if src.suffix.lower() not in TARGETS:
            continue
        dst = src.with_suffix(".webp")
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            continue
        subprocess.run(["cwebp", "-q", "85", "-m", "6", str(src), "-o", str(dst)], check=True)
        converted += 1
        print(f"  {src.name} -> {dst.name}")
    print(f"  {converted} image(s) (re)converted")
    return 0

if __name__ == "__main__":
    sys.exit(main())
