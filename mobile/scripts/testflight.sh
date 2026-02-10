#!/bin/bash
set -e

# TestFlight Build & Submit Script
# Automates version bumping, building, and submitting to TestFlight

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
APP_JSON="$MOBILE_DIR/app.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BUMP_TYPE="build"
DRY_RUN=false

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Bump version, build for iOS, and submit to TestFlight."
    echo ""
    echo "Options:"
    echo "  --build       Increment build number only (default)"
    echo "  --minor       Increment minor version (x.Y.z) and reset build to 1"
    echo "  --major       Increment major version (X.y.z) and reset build to 1"
    echo "  --dry-run     Show what would happen without making changes"
    echo "  --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Bump build number and deploy"
    echo "  $0 --minor      # Bump minor version and deploy"
    echo "  $0 --dry-run    # Preview changes only"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUMP_TYPE="build"
            shift
            ;;
        --minor)
            BUMP_TYPE="minor"
            shift
            ;;
        --major)
            BUMP_TYPE="major"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Check for jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq"
    exit 1
fi

# Read current values
CURRENT_VERSION=$(jq -r '.expo.version' "$APP_JSON")
CURRENT_BUILD=$(jq -r '.expo.ios.buildNumber' "$APP_JSON")

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Calculate new values
case $BUMP_TYPE in
    build)
        NEW_VERSION="$CURRENT_VERSION"
        NEW_BUILD=$((CURRENT_BUILD + 1))
        ;;
    minor)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        NEW_BUILD=1
        ;;
    major)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        NEW_BUILD=1
        ;;
esac

echo ""
echo -e "${YELLOW}Version Update:${NC}"
echo "  Version:      $CURRENT_VERSION -> $NEW_VERSION"
echo "  Build Number: $CURRENT_BUILD -> $NEW_BUILD"
echo ""

if $DRY_RUN; then
    echo -e "${YELLOW}[DRY RUN] Would run:${NC}"
    echo "  1. Update app.json with new version/build"
    echo "  2. eas build --profile production --platform ios --non-interactive"
    echo "  3. eas submit --platform ios --non-interactive --latest"
    exit 0
fi

# Update app.json
echo -e "${GREEN}Updating app.json...${NC}"
jq --arg version "$NEW_VERSION" --arg build "$NEW_BUILD" \
    '.expo.version = $version | .expo.ios.buildNumber = $build' \
    "$APP_JSON" > "$APP_JSON.tmp" && mv "$APP_JSON.tmp" "$APP_JSON"

echo -e "${GREEN}Starting EAS build...${NC}"
cd "$MOBILE_DIR"
eas build --profile production --platform ios --non-interactive

echo -e "${GREEN}Submitting to TestFlight...${NC}"
eas submit --platform ios --non-interactive --latest

echo ""
echo -e "${GREEN}Done! Build submitted to TestFlight.${NC}"
echo "Version: $NEW_VERSION (Build $NEW_BUILD)"
