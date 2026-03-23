#!/bin/bash
# Load plan.md into session context
if [ -f plan.md ]; then
  jq -Rs '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: "Loaded plan.md:\n\(.)"}}' plan.md
else
  echo '{}'
fi
