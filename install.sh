#!/usr/bin/env bash
#
# Too Many Cooks — local install helper.
#
# Copies a built skill/rule from dist/<platform>/ into the place the target
# agent loads it from, so you don't have to remember each platform's path.
# It installs the *know-how* only; the MCP server config (the tools) still has
# to be added once — the snippet to paste is printed at the end.
#
# Usage:
#   ./install.sh <platform> [--global]
#   ./install.sh --list
#
# Run `npm run build` first — this script copies from the gitignored dist/ tree.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$ROOT/dist"

# platform -> "source-relative-to-dist/<platform>::target-dir::target-filename"
# A literal '~' in target-dir is expanded to $HOME. Empty filename copies a tree.
declare -A ROUTES=(
	[cursor]=".cursor/rules/toomanycooks.mdc::.cursor/rules::toomanycooks.mdc"
	[copilot]=".github/copilot-instructions.md::.github::copilot-instructions.md"
	[hermes]="skills/toomanycooks::~/.hermes/skills/finance::"
)

list_platforms() {
	echo "Available platforms:"
	for p in $(printf '%s\n' "${!ROUTES[@]}" | sort); do
		echo "  - $p"
	done
	echo
	echo "Note: 'claude-code-plugin' / 'codex-plugin' install via their marketplaces"
	echo "(see INSTALL.md). Every other editor (Cline, Continue, Windsurf, Roo, Zed,"
	echo "Gemini, Junie, OpenClaw, Claude Code, …) installs via: npx skills add <repo-url>."
}

if [[ $# -eq 0 || "${1:-}" == "--list" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
	list_platforms
	exit 0
fi

PLATFORM="$1"
GLOBAL=false
[[ "${2:-}" == "--global" ]] && GLOBAL=true

if [[ -z "${ROUTES[$PLATFORM]:-}" ]]; then
	echo "error: unknown platform '$PLATFORM'." >&2
	echo >&2
	list_platforms >&2
	exit 1
fi

PLATFORM_DIST="$DIST/$PLATFORM"
if [[ ! -d "$PLATFORM_DIST" ]]; then
	echo "error: $PLATFORM_DIST not found. Run 'npm run build' first." >&2
	exit 1
fi

# Split "src::target-dir::target-filename" on the '::' delimiter.
SRC_REL="${ROUTES[$PLATFORM]%%::*}"
REST="${ROUTES[$PLATFORM]#*::}"
TARGET_DIR="${REST%%::*}"
TARGET_NAME="${REST#*::}"

# A project-relative target becomes a global one with --global where it makes sense.
if $GLOBAL; then
	case "$PLATFORM" in
	cursor) TARGET_DIR="~/.cursor/rules" ;;
	*) TARGET_DIR="${TARGET_DIR/#./$HOME}" ;;
	esac
fi
TARGET_DIR="${TARGET_DIR/#\~/$HOME}"

SRC="$PLATFORM_DIST/$SRC_REL"
if [[ ! -e "$SRC" ]]; then
	echo "error: expected source $SRC missing. Re-run 'npm run build'." >&2
	exit 1
fi

mkdir -p "$TARGET_DIR"
if [[ -z "$TARGET_NAME" ]]; then
	cp -R "$SRC" "$TARGET_DIR/"
	echo "✓ installed $PLATFORM → $TARGET_DIR/$(basename "$SRC")"
else
	cp "$SRC" "$TARGET_DIR/$TARGET_NAME"
	echo "✓ installed $PLATFORM → $TARGET_DIR/$TARGET_NAME"
fi

SNIPPET="$PLATFORM_DIST/mcp-snippet.json"
[[ -f "$SNIPPET" ]] || SNIPPET="$(find "$PLATFORM_DIST" -name 'mcp-snippet.json' -print -quit 2>/dev/null || true)"
echo
echo "Next: add the MCP server (the tools). Set TMC_API_KEY (free key at"
echo "https://toomanycooks.app/dashboard/api-keys), then register this object"
echo "with $PLATFORM's MCP config — see INSTALL.md for the exact target file:"
echo
if [[ -n "$SNIPPET" && -f "$SNIPPET" ]]; then
	cat "$SNIPPET"
else
	echo '{ "command": "npx", "args": ["-y", "@toomanycooks/mcp-server"], "env": { "TMC_API_KEY": "tmc_live_..." } }'
fi
