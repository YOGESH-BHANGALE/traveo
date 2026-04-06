#!/bin/bash
# Script to rename DITMATE to Traveo throughout the project

echo "🔄 Renaming DITMATE to Traveo..."

# Function to replace in file
replace_in_file() {
    if [ -f "$1" ]; then
        sed -i 's/DITMATE/Traveo/g' "$1"
        sed -i 's/ditmate/traveo/g' "$1"
        sed -i 's/DitMate/Traveo/g' "$1"
        echo "✓ Updated: $1"
    fi
}

# Update README
replace_in_file "README.md"

# Update package.json files
replace_in_file "package.json"
replace_in_file "client/package.json"
replace_in_file "server/package.json"

# Update client source files
find client/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's/DITMATE/Traveo/g; s/ditmate/traveo/g; s/DitMate/Traveo/g' {} \;

# Update server files
find server -type f \( -name "*.js" -o -name "*.json" \) -not -path "*/node_modules/*" -exec sed -i 's/DITMATE/Traveo/g; s/ditmate/traveo/g; s/DitMate/Traveo/g' {} \;

# Update documentation files
find . -maxdepth 1 -type f -name "*.md" -exec sed -i 's/DITMATE/Traveo/g; s/ditmate/traveo/g; s/DitMate/Traveo/g' {} \;

# Update start scripts
replace_in_file "start.bat"
replace_in_file "start.ps1"

echo "✅ Renaming complete! DITMATE → Traveo"
