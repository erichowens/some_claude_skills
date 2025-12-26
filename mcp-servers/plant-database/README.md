# Plant Database MCP Server

An MCP server providing plant information, USDA hardiness zone lookups, and landscaping recommendations. Designed to pair with the `fancy-yard-landscaper` skill.

## Features

- **USDA Hardiness Zone Lookup** - Get zone information by ZIP code
- **Plant Search** - Filter by zone, sun, water, type, deer resistance, etc.
- **Privacy Screen Recommendations** - Smart suggestions avoiding common mistakes
- **Native Plant Finder** - Find plants native to your region
- **Compatibility Checking** - Verify if plants work in your zone

## Installation

```bash
cd mcp-servers/plant-database
npm install
npm run build
```

## Configuration

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "plant-database": {
      "command": "node",
      "args": ["/path/to/plant-database/dist/index.js"]
    }
  }
}
```

## Tools

### `lookup_zone`

Get USDA hardiness zone for a ZIP code.

```json
{
  "zip_code": "10001"
}
```

Returns:
```json
{
  "zip_code": "10001",
  "zone": "7a",
  "min_temp_f": 0,
  "avg_first_frost": "Nov 15",
  "avg_last_frost": "Apr 1"
}
```

### `search_plants`

Search plants by criteria.

```json
{
  "zone": "6b",
  "type": "shrub",
  "evergreen": true,
  "deer_resistant": true,
  "limit": 10
}
```

### `get_plant`

Get detailed plant information.

```json
{
  "plant_id": "nellie-stevens-holly"
}
```

### `recommend_privacy_screen`

Get smart privacy screening recommendations.

```json
{
  "zone": "6b",
  "height_needed_ft": 15,
  "length_ft": 50,
  "timeline": "fast",
  "avoid_arborvitae": true,
  "deer_pressure": "high"
}
```

Returns recommendations with:
- Suitable plants for your zone
- Spacing calculations
- Plants needed
- Estimated time to privacy
- Warnings about common issues

### `find_native_plants`

Find plants native to your region.

```json
{
  "region": "northeast",
  "type": "perennial",
  "for_pollinators": true
}
```

Regions: `northeast`, `southeast`, `midwest`, `southwest`, `pacific_northwest`, `california`, `mountain_west`, `great_plains`

### `check_compatibility`

Verify zone compatibility.

```json
{
  "plant_id": "nellie-stevens-holly",
  "zone": "5b"
}
```

## Why Avoid Arborvitae?

The `recommend_privacy_screen` tool defaults to excluding arborvitae because:

1. **Bagworms** - Arborvitae are extremely susceptible
2. **Deer Browse** - Emerald Green arborvitae are deer candy
3. **Winter Burn** - Common in exposed locations
4. **Slow Establishment** - Takes 5-7 years for good screening
5. **Disease** - Root rot and various blights

Better alternatives:
- **Nellie Stevens Holly** - Fast (2-3 ft/year), deer resistant, disease resistant
- **Skip Laurel** - Dense, tolerates shade, very cold hardy
- **Wax Myrtle** - Native (Southeast), drought tolerant, salt tolerant
- **Green Giant Thuja** - If you must use arborvitae, this is the most resistant variety

## Plant Database

The database includes:
- Privacy screening plants
- Native trees and shrubs by region
- Native perennials for pollinator gardens
- Ornamental grasses

Each plant entry includes:
- Common and scientific names
- Hardiness zones
- Sun/water requirements
- Mature size and growth rate
- Deer resistance
- Native regions
- Pollinator friendliness
- Care notes and potential problems

## Pairing with fancy-yard-landscaper

This MCP is designed to work alongside the `fancy-yard-landscaper` skill:

1. User describes their yard situation to the skill
2. Skill uses MCP to look up their zone by ZIP
3. Skill uses MCP to get plant recommendations
4. Skill provides personalized landscaping advice with specific plants

## Extending the Database

To add plants, edit `src/plants.ts`:

```typescript
'your-plant-id': {
  id: 'your-plant-id',
  common_name: 'Your Plant Name',
  scientific_name: 'Genus species',
  type: 'shrub',
  hardiness_zones: '5-9',
  sun: ['full_sun', 'part_shade'],
  water: 'medium',
  mature_height_ft: 10,
  mature_width_ft: 8,
  growth_rate: 'medium',
  evergreen: true,
  deer_resistant: true,
  native_regions: ['northeast'],
  pollinator_friendly: true,
  uses: ['privacy_screen', 'hedge'],
  care_notes: 'Your care notes here.',
}
```

## License

MIT - Part of someclaudeskills.com
