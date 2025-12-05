import { Race, Rarity, Mission, Item, MysteryPackage, TutorialStep } from './types';

export const INITIAL_RACES: Race[] = [
  {
    id: 'human',
    name: 'Human',
    rarity: Rarity.COMMON,
    chance: 25,
    statModifiers: { luck: 3 }, // +3% Luck
    traits: [
      { name: 'Blessed', description: '+3% Luck and +3% Extra XP' }
    ],
    drops: ['w1', 'a1', 'ac1']
  },
  {
    id: 'elf',
    name: 'Elf',
    rarity: Rarity.UNCOMMON,
    chance: 15,
    statModifiers: { health: 15, luck: 7 }, // Stamina mapped to HP
    traits: [
      { name: 'Superior Genes', description: '+15% Stamina and +5% Height' },
      { name: 'Glorious', description: '+7% Luck Boost' }
    ],
    drops: ['w_elf_bow', 'ac_elf_ears']
  },
  {
    id: 'zombie',
    name: 'Zombie',
    rarity: Rarity.UNCOMMON,
    chance: 14,
    statModifiers: { health: -25 },
    traits: [
      { name: 'Rotten', description: '-25% Health' },
      { name: 'Mutated Genes', description: '+2% health regeneration every 5 seconds' }, 
      { name: 'Absorb', description: '15% chance to convert incoming damage to health' }
    ],
    drops: ['ac_zombie_brain']
  },
  {
    id: 'goblin',
    name: 'Goblin',
    rarity: Rarity.RARE,
    chance: 10.5,
    statModifiers: { health: -15, speed: 15, attack: 10 }, // Sneaky: +15% Move Speed, +10% Atk Speed mapped to Attack
    traits: [
      { name: 'Tiny', description: '-15% Health, -15% Size' },
      { name: 'Sneaky', description: '+15% Movement Speed, +10% Attack Speed with daggers' },
      { name: 'Bargain', description: '12% discount when shopping' }
    ],
    drops: ['w_goblin_dag']
  },
  {
    id: 'undead',
    name: 'Undead',
    rarity: Rarity.RARE,
    chance: 9,
    statModifiers: { health: -12 },
    traits: [
      { name: 'Fragile Bones', description: '-12% Health' },
      { name: 'Sharp Surface', description: 'Reflect 10% of the damage taken' },
      { name: 'Second Chance', description: 'Refills 50% of health when health is under 10% every 5 minutes' }
    ],
    drops: ['a_bone_mail']
  },
  {
    id: 'orc',
    name: 'Orc',
    rarity: Rarity.RARE,
    chance: 8,
    statModifiers: { health: 5, speed: -10, attack: 10 }, // Heavy: -10% Stamina (Health), -10% Speed. Muscular: +10% Phys, +15% Health. Net Health +5%.
    traits: [
      { name: 'Heavy', description: '-10% Stamina, -10% Movement Speed' },
      { name: 'Muscular', description: '+10% Physical Damage, +15% Health, +10% Size' }
    ],
    drops: ['w3', 'w_orc_club']
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    rarity: Rarity.EPIC,
    chance: 7,
    statModifiers: { speed: -5, attack: 15 }, // Gifted Miner +15% Mining Dmg (mapped to attack)
    traits: [
      { name: 'Heavy Short', description: '-20% Height, -5% Movement Speed' },
      { name: 'Gifted Miner', description: '+15% Mining Damage, +5% Better Forge' },
      { name: 'Critical Mining', description: '20% chance to deal +50% damage to rocks' }
    ],
    drops: ['w_dwarf_pick']
  },
  {
    id: 'shadow',
    name: 'Shadow',
    rarity: Rarity.EPIC,
    chance: 6,
    statModifiers: { speed: 15, attack: 15, health: 0 }, // +15% Move, +10% Atk Spd (Attack), +10% Stamina (HP), +5% Phys (Attack), -10% Health. Net: Speed +15, Attack +15, Health 0.
    traits: [
      { name: 'Shadow Pact', description: '+15% Speed, +10% Atk Speed, +10% Stamina, +5% Phys Dmg, -10% Health' },
      { name: 'Phantom Step', description: 'On taking damage, 15% chance to turn into a shadow to dodge the attack' }
    ],
    drops: ['ac_shadow_cloak']
  },
  {
    id: 'minotaur',
    name: 'Minotaur',
    rarity: Rarity.LEGENDARY,
    chance: 1.75,
    statModifiers: { health: 10, speed: -10 }, // +20% HP, -10% Stamina (HP), -10% Speed. Net: HP +10, Speed -10.
    traits: [
      { name: 'Beast', description: '+20% Health, -10% Speed, -10% Stamina, +10% Height, +20% Width/Depth' },
      { name: 'Bull’s Fury', description: 'While under 50% Health, activate Rage Mode which increases speed and physical damage by 30%' }
    ],
    drops: ['w_mino_axe']
  },
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    rarity: Rarity.LEGENDARY,
    chance: 1.5,
    statModifiers: { health: 20, attack: 12 },
    traits: [
      { name: 'Durable Scales', description: '+20% Max HP and +10% Height' },
      { name: 'Sharp Fangs', description: '+12% Physical Damage' },
      { name: 'Dragon’s Breath', description: '40% chance to burn enemy and deal 30% of weapon’s damage per second for 3 seconds' }
    ],
    drops: ['w5', 'a_dragon_scale']
  },
  {
    id: 'golem',
    name: 'Golem',
    rarity: Rarity.LEGENDARY,
    chance: 1.25,
    statModifiers: { health: 30, speed: -10, attack: 15 }, // +30% HP, -10% Speed. Heavy Hitter: +15% Atk Spd (Attack).
    traits: [
      { name: 'Tank', description: '+30% Health, -10% Movement Speed, +30% Size' },
      { name: 'Heavy Hitter', description: '+15% Attack Speed with heavy weapons' },
      { name: 'Stone Heart', description: '50% chance to lower incoming damage by 25%' }
    ],
    drops: ['ac_golem_heart']
  },
  {
    id: 'angel',
    name: 'Angel',
    rarity: Rarity.MYTHICAL,
    chance: 0.5,
    statModifiers: { speed: 20, health: 20, luck: 25 }, // +20% Speed, +20% Stamina (HP). +25% Luck.
    traits: [
      { name: 'Wings', description: '-20% Dash Cooldown, +50% Dash Dist, +20% Speed, +20% Stamina' },
      { name: 'Mighty Clover', description: '+25% Luck Boost' },
      { name: 'Smite', description: '50% chance to call Smite on hit for 30% physical damage' },
      { name: 'Holy Hand', description: 'Infinite stamina while below 20% health' }
    ],
    drops: ['w_angel_sword', 'ac_halo']
  },
  {
    id: 'demon',
    name: 'Demon',
    rarity: Rarity.MYTHICAL,
    chance: 0.5,
    statModifiers: { speed: 20, attack: 40 }, // +20% Speed, +20% Atk Speed, +20% Phys Dmg. Net: Speed +20, Attack +40.
    traits: [
      { name: 'Demonic Powers', description: '+20% Speed, +20% Atk Speed, +20% Phys Dmg, +20% Fire Dmg' },
      { name: 'Backfire', description: '25% chance to burn enemy when damage is taken' },
      { name: 'Cursed Aura', description: 'Deals 10% weapon damage per second' },
      { name: 'Devil’s Finger', description: 'Dash teleport... 20% chance to create a fire circle dealing 45% weapon damage per second for 3 seconds' }
    ],
    drops: ['w_demon_trident', 'ac_demon_horn']
  }
];

export const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: 'text-gray-400 border-gray-600 bg-gray-900/50',
  [Rarity.UNCOMMON]: 'text-green-400 border-green-600 bg-green-900/30',
  [Rarity.RARE]: 'text-blue-400 border-blue-600 bg-blue-900/30',
  [Rarity.EPIC]: 'text-purple-400 border-purple-600 bg-purple-900/30',
  [Rarity.LEGENDARY]: 'text-amber-400 border-amber-600 bg-amber-900/30',
  [Rarity.MYTHICAL]: 'text-rose-500 border-rose-600 bg-rose-950/40',
};

export const RARITY_BG_GLOW: Record<Rarity, string> = {
  [Rarity.COMMON]: 'shadow-gray-500/20',
  [Rarity.UNCOMMON]: 'shadow-green-500/20',
  [Rarity.RARE]: 'shadow-blue-500/20',
  [Rarity.EPIC]: 'shadow-purple-500/40',
  [Rarity.LEGENDARY]: 'shadow-amber-500/40',
  [Rarity.MYTHICAL]: 'shadow-rose-500/50',
};

export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    name: 'Scout the Perimeter',
    description: 'A quick patrol around the safety of the forge.',
    duration: 3000,
    reward: 50,
    xpReward: 10,
    minRarity: Rarity.COMMON
  },
  {
    id: 'm2',
    name: 'Hunt Goblins',
    description: 'Clear out the nearby caves of pesky goblins.',
    duration: 10000,
    reward: 150,
    xpReward: 30,
    minRarity: Rarity.COMMON
  },
  {
    id: 'm3',
    name: 'Explore Ruins',
    description: 'Search for ancient artifacts in the crumbling ruins.',
    duration: 30000,
    reward: 500,
    xpReward: 100,
    minRarity: Rarity.UNCOMMON
  },
  {
    id: 'm4',
    name: 'Slay Dragon',
    description: 'A legendary feat for only the strongest.',
    duration: 60000,
    reward: 1500,
    xpReward: 500,
    minRarity: Rarity.LEGENDARY
  }
];

export const REDEEM_CODES: Record<string, number> = {
  'WELCOME': 500,
  'FORGE': 200,
  'LEGEND': 1000,
  'MYTHIC': 5000,
  'TEST': 100
};

export const ROLL_COST = 100;
export const SHOP_REFRESH_COST = 50;

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 0, text: "Welcome to Soul Forge! Use WASD or Arrow Keys to move your character around the map.", trigger: 'movement' },
  { id: 1, text: "Visit the Blacksmith (Hammer Icon) to the North to Forge a new Race.", trigger: 'open_forge' },
  { id: 2, text: "Great! Now visit the Quest Board (Scroll Icon) to the West to start an adventure.", trigger: 'open_adventure' },
  { id: 3, text: "Visit the Shop (Tent Icon) to the East to buy equipment or Mystery Packages.", trigger: 'open_shop' },
  { id: 4, text: "Beware the dark grass! Walking there triggers battles. Here is a Starter Pack to help you survive!", trigger: 'complete' },
];

export const MYSTERY_PACKAGES: MysteryPackage[] = [
  {
    id: 'pkg_novice',
    name: "Novice Supply Crate",
    cost: 200,
    description: "A dusty crate. Mostly contains basic gear, but might surprise you.",
    dropRates: {
      [Rarity.COMMON]: 70,
      [Rarity.UNCOMMON]: 25,
      [Rarity.RARE]: 5,
      [Rarity.EPIC]: 0,
      [Rarity.LEGENDARY]: 0,
      [Rarity.MYTHICAL]: 0
    }
  },
  {
    id: 'pkg_elite',
    name: "Elite Reinforcements",
    cost: 1000,
    description: "Standard issue for veteran soldiers. Good chance for Rare items.",
    guaranteedRarity: Rarity.UNCOMMON,
    dropRates: {
      [Rarity.COMMON]: 10,
      [Rarity.UNCOMMON]: 50,
      [Rarity.RARE]: 30,
      [Rarity.EPIC]: 10,
      [Rarity.LEGENDARY]: 0,
      [Rarity.MYTHICAL]: 0
    }
  },
  {
    id: 'pkg_celestial',
    name: "Celestial Vault",
    cost: 5000,
    description: "Radiates immense power. Contains high-tier equipment.",
    guaranteedRarity: Rarity.RARE,
    dropRates: {
      [Rarity.COMMON]: 0,
      [Rarity.UNCOMMON]: 0,
      [Rarity.RARE]: 40,
      [Rarity.EPIC]: 40,
      [Rarity.LEGENDARY]: 18,
      [Rarity.MYTHICAL]: 2
    }
  }
];

export const ITEMS_POOL: Item[] = [
  // Weapons
  { id: 'w1', name: 'Rusted Dagger', type: 'weapon', rarity: Rarity.COMMON, stats: { attack: 5, speed: 2 }, description: 'Better than nothing.', value: 10 },
  { id: 'w2', name: 'Iron Sword', type: 'weapon', rarity: Rarity.UNCOMMON, stats: { attack: 15 }, description: 'Standard issue infantry sword.', value: 50 },
  { id: 'w3', name: 'Orcish Axe', type: 'weapon', rarity: Rarity.RARE, stats: { attack: 30, speed: -5 }, description: 'Heavy but deadly.', value: 150 },
  { id: 'w4', name: 'Shadow Blade', type: 'weapon', rarity: Rarity.EPIC, stats: { attack: 45, speed: 10 }, description: 'Strikes from the dark.', value: 500 },
  { id: 'w5', name: 'Dragon Slayer', type: 'weapon', rarity: Rarity.LEGENDARY, stats: { attack: 80, defense: 10 }, description: 'Forged in dragon fire.', value: 2000 },
  
  // New Unique Race Drops
  { id: 'w_elf_bow', name: 'Elven Bow', type: 'weapon', rarity: Rarity.UNCOMMON, stats: { attack: 12, speed: 8 }, description: 'Lightweight and precise.', value: 60 },
  { id: 'w_goblin_dag', name: 'Goblin Dagger', type: 'weapon', rarity: Rarity.RARE, stats: { attack: 18, speed: 15, luck: 5 }, description: 'Stolen from a merchant.', value: 100 },
  { id: 'w_orc_club', name: 'Spiked Club', type: 'weapon', rarity: Rarity.RARE, stats: { attack: 35, speed: -8 }, description: 'Brutal force.', value: 120 },
  { id: 'w_dwarf_pick', name: 'Battle Pickaxe', type: 'weapon', rarity: Rarity.EPIC, stats: { attack: 50, defense: 5 }, description: 'For mining gold and skulls.', value: 600 },
  { id: 'w_mino_axe', name: 'Minotaur Greataxe', type: 'weapon', rarity: Rarity.LEGENDARY, stats: { attack: 90, speed: -15 }, description: 'Requires immense strength.', value: 2500 },
  { id: 'w_angel_sword', name: 'Celestial Blade', type: 'weapon', rarity: Rarity.MYTHICAL, stats: { attack: 120, luck: 20 }, description: 'Glows with divine light.', value: 10000 },
  { id: 'w_demon_trident', name: 'Hellfire Trident', type: 'weapon', rarity: Rarity.MYTHICAL, stats: { attack: 130, speed: 10 }, description: 'Burns to the touch.', value: 10000 },

  // Armor
  { id: 'a1', name: 'Leather Tunic', type: 'armor', rarity: Rarity.COMMON, stats: { defense: 5, speed: 2 }, description: 'Lightweight protection.', value: 10 },
  { id: 'a2', name: 'Chainmail', type: 'armor', rarity: Rarity.UNCOMMON, stats: { defense: 15, speed: -2 }, description: 'Good against slashing.', value: 50 },
  { id: 'a3', name: 'Plate Armor', type: 'armor', rarity: Rarity.RARE, stats: { defense: 35, speed: -10 }, description: 'Solid steel plates.', value: 150 },
  { id: 'a4', name: 'Mythril Vest', type: 'armor', rarity: Rarity.EPIC, stats: { defense: 50, speed: 5 }, description: 'Stronger than steel, lighter than a feather.', value: 500 },
  
  // Unique Armor
  { id: 'a_bone_mail', name: 'Bone Armor', type: 'armor', rarity: Rarity.RARE, stats: { defense: 30, health: 20 }, description: 'Crafted from fallen foes.', value: 200 },
  { id: 'a_dragon_scale', name: 'Dragon Scale Mail', type: 'armor', rarity: Rarity.LEGENDARY, stats: { defense: 80, health: 50 }, description: 'Impervious to fire.', value: 3000 },

  // Accessories
  { id: 'ac1', name: 'Lucky Charm', type: 'accessory', rarity: Rarity.COMMON, stats: { luck: 5 }, description: 'A simple rabbit foot.', value: 20 },
  { id: 'ac2', name: 'Ring of Vitality', type: 'accessory', rarity: Rarity.UNCOMMON, stats: { health: 50 }, description: 'Pulses with life.', value: 80 },
  { id: 'ac3', name: 'Amulet of Power', type: 'accessory', rarity: Rarity.RARE, stats: { attack: 10, defense: 10 }, description: 'Enhances combat capabilities.', value: 200 },
  
  // Unique Accessories
  { id: 'ac_elf_ears', name: 'Elf Earring', type: 'accessory', rarity: Rarity.UNCOMMON, stats: { speed: 5, luck: 5 }, description: 'Elegant jewelry.', value: 70 },
  { id: 'ac_zombie_brain', name: 'Preserved Brain', type: 'accessory', rarity: Rarity.UNCOMMON, stats: { health: 30, defense: 5 }, description: 'Disgusting but effective.', value: 90 },
  { id: 'ac_shadow_cloak', name: 'Shadow Cloak Fragment', type: 'accessory', rarity: Rarity.EPIC, stats: { speed: 20, defense: 5 }, description: 'Hard to see.', value: 550 },
  { id: 'ac_golem_heart', name: 'Golem Core', type: 'accessory', rarity: Rarity.LEGENDARY, stats: { defense: 40, health: 100 }, description: 'Beats slowly like stone.', value: 2800 },
  { id: 'ac_halo', name: 'Broken Halo', type: 'accessory', rarity: Rarity.MYTHICAL, stats: { luck: 50, health: 50 }, description: 'Radiates faint holy energy.', value: 8000 },
  { id: 'ac_demon_horn', name: 'Demon Horn', type: 'accessory', rarity: Rarity.MYTHICAL, stats: { attack: 40, defense: 10 }, description: 'Warm and sharp.', value: 8000 },

  // COLLECTION REWARD
  { id: 'ac_fusion_core', name: 'Fusion Core', type: 'accessory', rarity: Rarity.MYTHICAL, stats: { attack: 100, defense: 100, health: 500, speed: 50, luck: 50 }, description: 'The reward for collecting every soul in the realm.', value: 99999 },
];

export const SHOP_ITEMS: Item[] = [
  { id: 'shop_pot_1', name: 'Health Potion', type: 'potion', rarity: Rarity.COMMON, stats: { health: 50 }, description: 'Restores 50 HP (Single Use - Not implemented yet)', value: 10, cost: 50 },
  { id: 'shop_w_1', name: 'Training Sword', type: 'weapon', rarity: Rarity.COMMON, stats: { attack: 8 }, description: 'A balanced blade for beginners.', value: 15, cost: 100 },
  { id: 'shop_a_1', name: 'Iron Breastplate', type: 'armor', rarity: Rarity.UNCOMMON, stats: { defense: 12 }, description: 'Solid iron protection.', value: 40, cost: 300 },
  { id: 'shop_ac_1', name: 'Thief Gloves', type: 'accessory', rarity: Rarity.UNCOMMON, stats: { speed: 5, luck: 2 }, description: 'Increases dexterity.', value: 45, cost: 400 },
  { id: 'shop_w_2', name: 'Flaming Mace', type: 'weapon', rarity: Rarity.RARE, stats: { attack: 25, speed: -2 }, description: 'Warm to the touch.', value: 100, cost: 1000 },
  { id: 'shop_a_2', name: 'Obsidian Shield', type: 'armor', rarity: Rarity.EPIC, stats: { defense: 40, speed: -5 }, description: 'Incredibly heavy but unbreakable.', value: 400, cost: 2500 },
  { id: 'shop_ac_2', name: 'Berserker Ring', type: 'accessory', rarity: Rarity.EPIC, stats: { attack: 20, defense: -5 }, description: 'Trade safety for power.', value: 350, cost: 2200 },
];