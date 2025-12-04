export enum Rarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  MYTHICAL = 'Mythical'
}

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'potion';

export interface Stats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  stats: Partial<Stats>;
  description: string;
  value: number; // Sell value in shards
  cost?: number; // Buy cost in shop
  image?: string;
}

export interface Trait {
  name: string;
  description: string;
}

export interface Race {
  id: string;
  name: string;
  rarity: Rarity;
  chance: number; // Percentage 0-100
  traits: Trait[];
  statModifiers?: Partial<Stats>; // Bonus percentages (e.g., 10 = +10%)
  description?: string;
  isCustom?: boolean; // For AI generated races
  drops?: string[]; // IDs of items this race specifically drops
}

export interface RollResult {
  race: Race;
  timestamp: number;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  duration: number; // in milliseconds
  reward: number; // Soul Shards
  xpReward: number;
  minRarity?: Rarity;
}

export interface CombatState {
  isActive: boolean;
  turn: number;
  log: string[];
  playerCurrentHp: number;
  playerMaxHp: number;
  enemyCurrentHp: number;
  enemyMaxHp: number;
  enemyRace: Race;
  enemyLevel: number;
  enemyStats: Stats;
  isFinished: boolean;
  won: boolean;
  rewards?: { shards: number, xp: number, drops: Item[] };
  // Track temporary effects
  effects: {
    playerBurnStacks: number;
    enemyBurnStacks: number;
    playerBurnDamage: number; // Damage per turn for burn
    enemyBurnDamage: number; 
    playerSecondChanceUsed: boolean;
    enemySecondChanceUsed: boolean;
  };
  dotDamage?: {
      source: string; // 'demon_circle', 'dragon_breath'
      damage: number;
      duration: number;
  }[];
}

export const RARITY_POWER: Record<Rarity, number> = {
  [Rarity.COMMON]: 10,
  [Rarity.UNCOMMON]: 25,
  [Rarity.RARE]: 45,
  [Rarity.EPIC]: 70,
  [Rarity.LEGENDARY]: 110,
  [Rarity.MYTHICAL]: 180,
};