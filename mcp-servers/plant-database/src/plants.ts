/**
 * Plant Database
 *
 * Comprehensive plant data for landscaping recommendations.
 * Focus on privacy screening, native plants, and deer resistance.
 */

export interface Plant {
  id: string;
  common_name: string;
  scientific_name: string;
  type: 'tree' | 'shrub' | 'perennial' | 'grass' | 'vine';
  hardiness_zones: string; // e.g., "4-8" or "6b-9a"
  sun: ('full_sun' | 'part_shade' | 'full_shade')[];
  water: 'low' | 'medium' | 'high';
  mature_height_ft: number;
  mature_width_ft: number;
  growth_rate: 'slow' | 'medium' | 'fast';
  evergreen: boolean;
  deer_resistant: boolean;
  native_regions?: string[];
  pollinator_friendly?: boolean;
  fall_color?: string;
  flower_color?: string;
  bloom_season?: string;
  problems?: string[];
  uses?: string[];
  care_notes?: string;
}

export const PLANTS_DATABASE: Record<string, Plant> = {
  // ============================================================================
  // PRIVACY SCREENING - RECOMMENDED (Non-Arborvitae)
  // ============================================================================

  'nellie-stevens-holly': {
    id: 'nellie-stevens-holly',
    common_name: 'Nellie Stevens Holly',
    scientific_name: 'Ilex × \'Nellie R. Stevens\'',
    type: 'tree',
    hardiness_zones: '6-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 20,
    mature_width_ft: 12,
    growth_rate: 'fast',
    evergreen: true,
    deer_resistant: true,
    uses: ['privacy_screen', 'specimen', 'hedge'],
    care_notes: 'Excellent arborvitae alternative. Grows 2-3 ft/year. Red berries in winter.',
  },

  'skip-laurel': {
    id: 'skip-laurel',
    common_name: 'Skip Laurel',
    scientific_name: 'Prunus laurocerasus \'Schipkaensis\'',
    type: 'shrub',
    hardiness_zones: '5-9',
    sun: ['full_sun', 'part_shade', 'full_shade'],
    water: 'medium',
    mature_height_ft: 10,
    mature_width_ft: 6,
    growth_rate: 'fast',
    evergreen: true,
    deer_resistant: true,
    uses: ['privacy_screen', 'hedge', 'foundation'],
    care_notes: 'Dense growth, tolerates heavy pruning. Better cold hardiness than other laurels.',
  },

  'green-giant-arborvitae': {
    id: 'green-giant-arborvitae',
    common_name: 'Green Giant Arborvitae',
    scientific_name: 'Thuja standishii × plicata \'Green Giant\'',
    type: 'tree',
    hardiness_zones: '5-8',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 50,
    mature_width_ft: 15,
    growth_rate: 'fast',
    evergreen: true,
    deer_resistant: true, // More resistant than Emerald Green
    uses: ['privacy_screen', 'windbreak'],
    problems: ['bagworms', 'spider_mites', 'winter_burn_in_extreme_cold'],
    care_notes: 'Better disease resistance than other arborvitae, but still susceptible to bagworms. Monitor closely.',
  },

  'emerald-green-arborvitae': {
    id: 'emerald-green-arborvitae',
    common_name: 'Emerald Green Arborvitae',
    scientific_name: 'Thuja occidentalis \'Smaragd\'',
    type: 'tree',
    hardiness_zones: '3-8',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 15,
    mature_width_ft: 4,
    growth_rate: 'slow',
    evergreen: true,
    deer_resistant: false, // Major deer candy
    uses: ['privacy_screen', 'accent'],
    problems: ['bagworms', 'deer_browse', 'winter_burn', 'spider_mites', 'slow_establishment'],
    care_notes: 'WARNING: Very popular but problematic. Heavy deer browse, bagworm susceptible, slow to establish. Consider alternatives.',
  },

  'leyland-cypress': {
    id: 'leyland-cypress',
    common_name: 'Leyland Cypress',
    scientific_name: '× Cupressocyparis leylandii',
    type: 'tree',
    hardiness_zones: '6-10',
    sun: ['full_sun'],
    water: 'medium',
    mature_height_ft: 60,
    mature_width_ft: 15,
    growth_rate: 'fast',
    evergreen: true,
    deer_resistant: true,
    uses: ['privacy_screen', 'windbreak'],
    problems: ['seiridium_canker', 'bagworms', 'root_rot_in_wet_soil'],
    care_notes: 'Fast growing but disease-prone in humid climates. Better in zones 7-9.',
  },

  'wax-myrtle': {
    id: 'wax-myrtle',
    common_name: 'Wax Myrtle',
    scientific_name: 'Morella cerifera',
    type: 'shrub',
    hardiness_zones: '7-11',
    sun: ['full_sun', 'part_shade'],
    water: 'low',
    mature_height_ft: 15,
    mature_width_ft: 10,
    growth_rate: 'fast',
    evergreen: true,
    deer_resistant: true,
    native_regions: ['southeast'],
    pollinator_friendly: true,
    uses: ['privacy_screen', 'native_garden', 'coastal'],
    care_notes: 'Excellent native alternative. Salt tolerant. Aromatic foliage.',
  },

  'american-holly': {
    id: 'american-holly',
    common_name: 'American Holly',
    scientific_name: 'Ilex opaca',
    type: 'tree',
    hardiness_zones: '5-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 40,
    mature_width_ft: 20,
    growth_rate: 'slow',
    evergreen: true,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest'],
    pollinator_friendly: true,
    uses: ['privacy_screen', 'specimen', 'wildlife'],
    care_notes: 'Native. Red berries on female plants (need male pollinator nearby).',
  },

  'inkberry-holly': {
    id: 'inkberry-holly',
    common_name: 'Inkberry Holly',
    scientific_name: 'Ilex glabra',
    type: 'shrub',
    hardiness_zones: '4-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 8,
    mature_width_ft: 8,
    growth_rate: 'medium',
    evergreen: true,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast'],
    pollinator_friendly: true,
    uses: ['privacy_screen', 'hedge', 'native_garden', 'wet_areas'],
    care_notes: 'Native. Tolerates wet soil. Can get leggy - prune to maintain density.',
  },

  'winterberry-holly': {
    id: 'winterberry-holly',
    common_name: 'Winterberry Holly',
    scientific_name: 'Ilex verticillata',
    type: 'shrub',
    hardiness_zones: '3-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 8,
    mature_width_ft: 8,
    growth_rate: 'medium',
    evergreen: false, // Deciduous but great winter interest
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest'],
    pollinator_friendly: true,
    uses: ['winter_interest', 'wildlife', 'wet_areas'],
    care_notes: 'Deciduous but spectacular red berries in winter. Need male + female.',
  },

  // ============================================================================
  // NATIVE TREES
  // ============================================================================

  'eastern-redbud': {
    id: 'eastern-redbud',
    common_name: 'Eastern Redbud',
    scientific_name: 'Cercis canadensis',
    type: 'tree',
    hardiness_zones: '4-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 25,
    mature_width_ft: 30,
    growth_rate: 'medium',
    evergreen: false,
    deer_resistant: false,
    native_regions: ['northeast', 'southeast', 'midwest'],
    pollinator_friendly: true,
    flower_color: 'pink',
    bloom_season: 'early_spring',
    fall_color: 'yellow',
    uses: ['specimen', 'understory'],
    care_notes: 'Native. Heart-shaped leaves. Early spring blooms before leaves.',
  },

  'serviceberry': {
    id: 'serviceberry',
    common_name: 'Serviceberry',
    scientific_name: 'Amelanchier canadensis',
    type: 'tree',
    hardiness_zones: '4-8',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 20,
    mature_width_ft: 15,
    growth_rate: 'medium',
    evergreen: false,
    deer_resistant: false,
    native_regions: ['northeast', 'midwest'],
    pollinator_friendly: true,
    flower_color: 'white',
    bloom_season: 'spring',
    fall_color: 'orange-red',
    uses: ['specimen', 'edible_landscape', 'wildlife'],
    care_notes: 'Native. Edible berries. Four-season interest.',
  },

  'american-hornbeam': {
    id: 'american-hornbeam',
    common_name: 'American Hornbeam',
    scientific_name: 'Carpinus caroliniana',
    type: 'tree',
    hardiness_zones: '3-9',
    sun: ['part_shade', 'full_shade'],
    water: 'medium',
    mature_height_ft: 30,
    mature_width_ft: 25,
    growth_rate: 'slow',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest'],
    fall_color: 'orange-red',
    uses: ['shade_tree', 'understory', 'hedge'],
    care_notes: 'Native. Muscular trunk. Excellent shade tolerance.',
  },

  // ============================================================================
  // NATIVE SHRUBS
  // ============================================================================

  'virginia-sweetspire': {
    id: 'virginia-sweetspire',
    common_name: 'Virginia Sweetspire',
    scientific_name: 'Itea virginica',
    type: 'shrub',
    hardiness_zones: '5-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 5,
    mature_width_ft: 5,
    growth_rate: 'medium',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast'],
    pollinator_friendly: true,
    flower_color: 'white',
    bloom_season: 'summer',
    fall_color: 'red-purple',
    uses: ['border', 'mass_planting', 'wet_areas'],
    care_notes: 'Native. Fragrant white flower spikes. Tolerates wet soil.',
  },

  'native-azalea': {
    id: 'native-azalea',
    common_name: 'Native Azalea',
    scientific_name: 'Rhododendron viscosum',
    type: 'shrub',
    hardiness_zones: '4-9',
    sun: ['part_shade'],
    water: 'medium',
    mature_height_ft: 8,
    mature_width_ft: 6,
    growth_rate: 'slow',
    evergreen: false,
    deer_resistant: false,
    native_regions: ['northeast', 'southeast'],
    pollinator_friendly: true,
    flower_color: 'white-pink',
    bloom_season: 'late_spring',
    uses: ['woodland', 'border', 'fragrance'],
    care_notes: 'Native. Extremely fragrant. Swamp azalea tolerates wet soil.',
  },

  'oakleaf-hydrangea': {
    id: 'oakleaf-hydrangea',
    common_name: 'Oakleaf Hydrangea',
    scientific_name: 'Hydrangea quercifolia',
    type: 'shrub',
    hardiness_zones: '5-9',
    sun: ['part_shade', 'full_shade'],
    water: 'medium',
    mature_height_ft: 8,
    mature_width_ft: 8,
    growth_rate: 'medium',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['southeast'],
    pollinator_friendly: true,
    flower_color: 'white',
    bloom_season: 'summer',
    fall_color: 'burgundy',
    uses: ['specimen', 'border', 'shade_garden'],
    care_notes: 'Native. Large oak-shaped leaves. White flowers age to pink/tan.',
  },

  'summersweet': {
    id: 'summersweet',
    common_name: 'Summersweet',
    scientific_name: 'Clethra alnifolia',
    type: 'shrub',
    hardiness_zones: '3-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 8,
    mature_width_ft: 6,
    growth_rate: 'medium',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast'],
    pollinator_friendly: true,
    flower_color: 'white-pink',
    bloom_season: 'mid_summer',
    fall_color: 'yellow',
    uses: ['border', 'fragrance', 'wet_areas'],
    care_notes: 'Native. Extremely fragrant. Tolerates wet soil and salt.',
  },

  // ============================================================================
  // NATIVE PERENNIALS
  // ============================================================================

  'black-eyed-susan': {
    id: 'black-eyed-susan',
    common_name: 'Black-Eyed Susan',
    scientific_name: 'Rudbeckia hirta',
    type: 'perennial',
    hardiness_zones: '3-9',
    sun: ['full_sun'],
    water: 'low',
    mature_height_ft: 3,
    mature_width_ft: 2,
    growth_rate: 'fast',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest', 'great_plains'],
    pollinator_friendly: true,
    flower_color: 'yellow',
    bloom_season: 'summer',
    uses: ['pollinator_garden', 'meadow', 'cut_flower'],
    care_notes: 'Native. Easy to grow. Self-seeds. Drought tolerant once established.',
  },

  'purple-coneflower': {
    id: 'purple-coneflower',
    common_name: 'Purple Coneflower',
    scientific_name: 'Echinacea purpurea',
    type: 'perennial',
    hardiness_zones: '3-9',
    sun: ['full_sun'],
    water: 'low',
    mature_height_ft: 3,
    mature_width_ft: 2,
    growth_rate: 'medium',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest', 'great_plains'],
    pollinator_friendly: true,
    flower_color: 'purple-pink',
    bloom_season: 'summer',
    uses: ['pollinator_garden', 'meadow', 'cut_flower'],
    care_notes: 'Native. Drought tolerant. Seeds feed birds in winter.',
  },

  'bee-balm': {
    id: 'bee-balm',
    common_name: 'Bee Balm',
    scientific_name: 'Monarda didyma',
    type: 'perennial',
    hardiness_zones: '4-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 4,
    mature_width_ft: 3,
    growth_rate: 'fast',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest'],
    pollinator_friendly: true,
    flower_color: 'red',
    bloom_season: 'summer',
    uses: ['pollinator_garden', 'hummingbird', 'herb'],
    care_notes: 'Native. Hummingbird magnet. Can be susceptible to powdery mildew.',
  },

  'joe-pye-weed': {
    id: 'joe-pye-weed',
    common_name: 'Joe Pye Weed',
    scientific_name: 'Eutrochium purpureum',
    type: 'perennial',
    hardiness_zones: '4-9',
    sun: ['full_sun', 'part_shade'],
    water: 'medium',
    mature_height_ft: 6,
    mature_width_ft: 4,
    growth_rate: 'fast',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest'],
    pollinator_friendly: true,
    flower_color: 'pink-purple',
    bloom_season: 'late_summer',
    uses: ['pollinator_garden', 'meadow', 'wet_areas'],
    care_notes: 'Native. Tall and dramatic. Butterfly magnet. Tolerates wet soil.',
  },

  // ============================================================================
  // NATIVE GRASSES
  // ============================================================================

  'switchgrass': {
    id: 'switchgrass',
    common_name: 'Switchgrass',
    scientific_name: 'Panicum virgatum',
    type: 'grass',
    hardiness_zones: '4-9',
    sun: ['full_sun'],
    water: 'low',
    mature_height_ft: 5,
    mature_width_ft: 3,
    growth_rate: 'fast',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest', 'great_plains'],
    fall_color: 'yellow-red',
    uses: ['meadow', 'privacy_screen', 'erosion_control'],
    care_notes: 'Native. Extremely tough. Fall color varies by cultivar.',
  },

  'little-bluestem': {
    id: 'little-bluestem',
    common_name: 'Little Bluestem',
    scientific_name: 'Schizachyrium scoparium',
    type: 'grass',
    hardiness_zones: '3-9',
    sun: ['full_sun'],
    water: 'low',
    mature_height_ft: 3,
    mature_width_ft: 2,
    growth_rate: 'medium',
    evergreen: false,
    deer_resistant: true,
    native_regions: ['northeast', 'southeast', 'midwest', 'great_plains'],
    fall_color: 'copper-orange',
    uses: ['meadow', 'mass_planting', 'erosion_control'],
    care_notes: 'Native. Stunning fall color. Extremely drought tolerant.',
  },
};
