#!/usr/bin/env python3
"""
SessionStart hook that logs session activity to a JSON file.
Receives hook input via stdin and appends it to the log file.
"""
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def get_recent_files(project_root: Path, limit: int = 10) -> list[dict]:
    """Get recently modified files in the project."""
    files = []

    # Try git first (shows files modified in last 7 days)
    try:
        result = subprocess.run(
            ["git", "log", "--name-only", "--pretty=format:", "--since=7.days.ago"],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            seen = set()
            for line in result.stdout.strip().split("\n"):
                if line and line not in seen:
                    seen.add(line)
                    file_path = project_root / line
                    if file_path.exists():
                        stat = file_path.stat()
                        files.append({
                            "path": line,
                            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        })
            return files[:limit]
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass

    # Fallback: find by mtime
    try:
        result = subprocess.run(
            ["find", ".", "-type", "f", "-mtime", "-7", "-not", "-path", "./.git/*", "-not", "-path", "./node_modules/*"],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            for line in result.stdout.strip().split("\n")[:limit]:
                if line:
                    file_path = project_root / line[2:]  # strip "./"
                    if file_path.exists():
                        stat = file_path.stat()
                        files.append({
                            "path": line,
                            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        })
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass

    return files


def main():
    # Read hook input from stdin
    try:
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        hook_input = {}

    # Add timestamp
    hook_input["logged_at"] = datetime.now().isoformat()

    # Add recent files
    project_root = Path(__file__).parent.parent.parent  # hooks -> .claude -> project_root
    hook_input["recent_files"] = get_recent_files(project_root)

    # Log file path (in .claude directory)
    log_file = Path(__file__).parent.parent / "session-log.json"

    # Load existing logs or create new list
    if log_file.exists():
        try:
            with open(log_file, "r") as f:
                logs = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            logs = []
    else:
        logs = []

    # Append new entry
    logs.append(hook_input)

    # Write back to file
    with open(log_file, "w") as f:
        json.dump(logs, f, indent=2)

    # Output nothing (or could output JSON with systemMessage to show notification)


if __name__ == "__main__":
    main()