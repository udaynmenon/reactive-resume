#!/usr/bin/env bash
# usage: ./file-dump-script.sh [START_DIR]
set -euo pipefail

# Resolve the target directory (where the dump runs from)
start_dir="$(realpath "${1:-.}")"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Move into the target directory
cd "$start_dir"

# Name the dump folder after the target directory
dir_name="$(basename "$start_dir")"
timestamp="$(date +%Y%m%d-%H%M%S)"
output_dir="${start_dir}/.${dir_name}.filedumps"
output_file="${output_dir}/${dir_name}-${timestamp}.xml"

mkdir -p "$output_dir"

# Generate full dump — .gitignore respected by default in repomix
repomix . -o "$output_file"

echo "Output written to: $output_file"
echo ""

# Print tree of included files using git ls-files (same filter repomix uses)
echo "Files included in dump:"
echo "========================"
git ls-files | tree --fromfile .