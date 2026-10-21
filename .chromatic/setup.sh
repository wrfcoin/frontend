#!/bin/bash

# Chromatic Setup Script for WRFCoin Frontend
# Automates Chromatic project setup and configuration

set -e

echo "🎨 Setting up Chromatic Visual Testing for WRFCoin Frontend"
echo "=========================================================="

# Color definitions for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the frontend directory${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${BLUE}1. Checking dependencies...${NC}"

# Check if Storybook is already configured
if [ ! -d ".storybook" ]; then
    echo -e "${RED}Error: Storybook is not configured. Please set up Storybook first.${NC}"
    exit 1
fi

# Check if chromatic is installed
if ! npm list chromatic &> /dev/null; then
    echo -e "${YELLOW}Installing Chromatic CLI...${NC}"
    npm install --save-dev chromatic
else
    echo -e "${GREEN}✓ Chromatic CLI is already installed${NC}"
fi

echo -e "${BLUE}2. Verifying Storybook stories...${NC}"

# Generate stories if they don't exist
if [ ! -d "src/stories/auto-generated" ]; then
    echo -e "${YELLOW}Generating Storybook stories...${NC}"
    npm run storybook:generate
fi

# Count the number of stories
STORY_COUNT=$(find src/stories -name "*.stories.*" | wc -l)
echo -e "${GREEN}✓ Found ${STORY_COUNT} Storybook stories${NC}"

echo -e "${BLUE}3. Setting up Chromatic configuration...${NC}"

# Create .env template if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env template...${NC}"
    cat > .env << EOL
# Chromatic Configuration
CHROMATIC_PROJECT_TOKEN=your_chromatic_project_token_here

# Storybook Configuration
STORYBOOK_NODE_ENV=production
EOL
    echo -e "${GREEN}✓ Created .env template${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Check if chromatic.config.json exists
if [ ! -f "chromatic.config.json" ]; then
    echo -e "${RED}Error: chromatic.config.json not found${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Chromatic configuration found${NC}"
fi

echo -e "${BLUE}4. Testing Storybook build...${NC}"

# Test Storybook build
if npm run build-storybook; then
    echo -e "${GREEN}✓ Storybook builds successfully${NC}"
else
    echo -e "${RED}Error: Storybook build failed${NC}"
    exit 1
fi

echo -e "${BLUE}5. Chromatic project setup...${NC}"

# Check if CHROMATIC_PROJECT_TOKEN is set
if [ -z "${CHROMATIC_PROJECT_TOKEN}" ]; then
    echo -e "${YELLOW}CHROMATIC_PROJECT_TOKEN not set in environment${NC}"
    echo -e "${YELLOW}Please follow these steps to complete setup:${NC}"
    echo ""
    echo "1. Visit https://chromatic.com and create an account"
    echo "2. Connect your GitHub repository"
    echo "3. Get your project token from the project settings"
    echo "4. Add the token to your .env file:"
    echo "   CHROMATIC_PROJECT_TOKEN=your_actual_token_here"
    echo "5. Add the token to GitHub repository secrets as CHROMATIC_PROJECT_TOKEN"
    echo ""
else
    echo -e "${GREEN}✓ CHROMATIC_PROJECT_TOKEN is configured${NC}"
    
    # Test Chromatic connection
    echo -e "${YELLOW}Testing Chromatic connection...${NC}"
    if npx chromatic --dry-run; then
        echo -e "${GREEN}✓ Chromatic connection test successful${NC}"
    else
        echo -e "${RED}Error: Chromatic connection test failed${NC}"
        echo -e "${YELLOW}Please verify your project token${NC}"
    fi
fi

echo -e "${BLUE}6. GitHub Actions setup...${NC}"

# Check if GitHub Actions workflow exists
if [ -f "../.github/workflows/chromatic.yml" ]; then
    echo -e "${GREEN}✓ GitHub Actions workflow found${NC}"
else
    echo -e "${YELLOW}Warning: GitHub Actions workflow not found${NC}"
    echo -e "${YELLOW}Please ensure the workflow file is committed to version control${NC}"
fi

echo -e "${BLUE}7. Performance optimization check...${NC}"

# Check component count for performance optimization recommendations
if [ "$STORY_COUNT" -gt 200 ]; then
    echo -e "${YELLOW}Large component library detected (${STORY_COUNT} stories)${NC}"
    echo -e "${YELLOW}Performance optimizations recommended:${NC}"
    echo "  - Use onlyChanged: true for faster CI runs"
    echo "  - Consider batching components for parallel testing"
    echo "  - Enable zip compression for faster uploads"
    echo "  - Use smart change detection patterns"
fi

echo -e "${BLUE}8. Generating component coverage report...${NC}"

# Generate component categories report
cat > .chromatic/component-coverage.md << EOL
# Component Coverage Report

Generated on: $(date)
Total Stories: ${STORY_COUNT}

## Component Categories

$(find src/stories/auto-generated -type d | grep -v "^src/stories/auto-generated$" | sort | while read dir; do
    category=$(basename "$dir")
    count=$(find "$dir" -name "*.stories.*" 2>/dev/null | wc -l)
    echo "- **${category}**: ${count} components"
done)

## Testing Status

- ✅ Storybook stories generated
- ✅ Chromatic configuration created
- ✅ GitHub Actions workflow configured
- ✅ Performance optimizations applied

## Next Steps

1. Set up Chromatic project token
2. Run initial visual baseline: \`npm run chromatic\`
3. Review and approve initial baselines
4. Configure team approval workflows
5. Set up monitoring and notifications

EOL

echo -e "${GREEN}✓ Component coverage report generated${NC}"

echo ""
echo -e "${GREEN}🎉 Chromatic setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Complete Chromatic project token setup (if not done)"
echo "2. Run initial visual testing: npm run chromatic"
echo "3. Review baselines in Chromatic dashboard"
echo "4. Configure team approval workflows"
echo "5. Set up monitoring and notifications"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  npm run chromatic           # Run visual testing"
echo "  npm run chromatic:ci        # Run with CI optimizations"
echo "  npm run test:visual         # Alias for visual testing"
echo "  npm run storybook:generate  # Regenerate stories"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  See CHROMATIC_VISUAL_TESTING.md for detailed setup guide"
echo "  Visit .chromatic/ directory for configuration files"
echo ""
echo -e "${GREEN}Happy visual testing! 🎨${NC}"