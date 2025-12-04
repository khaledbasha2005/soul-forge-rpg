import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_RACES, MISSIONS, REDEEM_CODES, ROLL_COST, SHOP_REFRESH_COST, RARITY_COLORS, ITEMS_POOL, SHOP_ITEMS } from './constants';
import { Race, Rarity, Mission, RARITY_POWER, Stats, Item, ItemType, CombatState } from './types';
import RaceCard from './components/RaceCard';
import ItemCard from './components/ItemCard';
import StatsChart from './components/StatsChart';
import { Dices, History, BookOpen, KeyRound, Swords, Scroll, Gem, Trophy, Skull, User, Shield, Zap, Heart, Sparkles, Coins, ShoppingBag, ArrowRight, Bell, RefreshCw, Atom, Plus, X, Menu, Flame } from 'lucide-react';

const App: React.FC = () => {
  // Game State
  const [shards, setShards] = useState<number>(500); // Currency
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [rebirths, setRebirths] = useState<number>(0);
  const [races, setRaces] = useState<Race[]>(INITIAL_RACES);
  const [ownedRaceIds, setOwnedRaceIds] = useState<Set<string>>(new Set(['human']));
  
  // Hero State
  const [equippedRace, setEquippedRace] = useState<Race>(INITIAL_RACES[0]);
  const [secondaryRace, setSecondaryRace] = useState<Race | null>(null); // For Fusion Core
  const [inventory, setInventory] = useState<Item[]>([]);
  const [equipment, setEquipment] = useState<{weapon?: Item, armor?: Item, accessory?: Item}>({});
  const [hasClaimedCollectionReward, setHasClaimedCollectionReward] = useState<boolean>(false);

  // Shop State
  const [shopStock, setShopStock] = useState<Item[]>([]);

  // Fusion State
  const [fusionSlot1, setFusionSlot1] = useState<Race | null>(null);
  const [fusionSlot2, setFusionSlot2] = useState<Race | null>(null);

  // UI State
  const [currentRace, setCurrentRace] = useState<Race | null>(null); // For display in Forge
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState<Race[]>([]);
  const [activeTab, setActiveTab] = useState<'forge' | 'adventure' | 'hero' | 'collection' | 'stats' | 'codes' | 'shop' | 'fusion'>('forge');
  const [notification, setNotification] = useState<{ title: string, message: string, rarity: Rarity } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Adventure State
  const [activeMission, setActiveMission] = useState<string | null>(null);
  const [missionProgress, setMissionProgress] = useState<number>(0);
  
  // Combat State
  const [combatState, setCombatState] = useState<CombatState | null>(null);

  // Code State
  const [codeScan, setCodeScan] = useState('');
  const [redeemedCodes, setRedeemedCodes] = useState<Set<string>>(new Set());

  // Refs
  const rollIntervalRef = useRef<number | null>(null);
  const missionIntervalRef = useRef<number | null>(null);
  const combatIntervalRef = useRef<number | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const notificationTimeoutRef = useRef<number | null>(null);

  const MAX_LEVEL = 100;
  const FUSION_COST = 1000;

  const RARITY_TIERS = [
    Rarity.COMMON,
    Rarity.UNCOMMON,
    Rarity.RARE,
    Rarity.EPIC,
    Rarity.LEGENDARY,
    Rarity.MYTHICAL
  ];

  // Derived State
  // Check if Fusion Core is equipped
  const isFusionCoreActive = equipment.accessory?.id?.includes('ac_fusion_core') || equipment.accessory?.name === 'Fusion Core';

  // --- STATS CALCULATION ---
  const calculateStats = (): Stats => {
    // 1. Base stats + Level growth
    let stats: Stats = {
      health: 100 + (level * 10),
      attack: 10 + (level * 2),
      defense: 5 + (level * 1),
      speed: 10 + (level * 0.5),
      luck: 1 + (level * 0.2)
    };

    // 2. Equipment Modifiers (Flat additions)
    (Object.values(equipment) as (Item | undefined)[]).forEach(item => {
      if (item) {
        if (item.stats.health) stats.health += item.stats.health;
        if (item.stats.attack) stats.attack += item.stats.attack;
        if (item.stats.defense) stats.defense += item.stats.defense;
        if (item.stats.speed) stats.speed += item.stats.speed;
        if (item.stats.luck) stats.luck += item.stats.luck;
      }
    });

    // 3. Race Modifiers (Percentage based)
    const applyRaceModifiers = (race: Race, weight: number = 1.0) => {
      if (race.statModifiers) {
        if (race.statModifiers.health) stats.health = Math.floor(stats.health * (1 + (race.statModifiers.health * weight) / 100));
        if (race.statModifiers.attack) stats.attack = Math.floor(stats.attack * (1 + (race.statModifiers.attack * weight) / 100));
        if (race.statModifiers.defense) stats.defense = Math.floor(stats.defense * (1 + (race.statModifiers.defense * weight) / 100));
        if (race.statModifiers.speed) stats.speed = Math.floor(stats.speed * (1 + (race.statModifiers.speed * weight) / 100));
        if (race.statModifiers.luck) stats.luck = Math.floor(stats.luck * (1 + (race.statModifiers.luck * weight) / 100));
      }
    };

    // Apply Primary Race (100% Effectiveness)
    applyRaceModifiers(equippedRace, 1.0);

    // Apply Secondary Race (100% Effectiveness if Fusion Core equipped)
    if (isFusionCoreActive && secondaryRace) {
      applyRaceModifiers(secondaryRace, 1.0);
    }

    // 4. Rebirth Multiplier (+25% all stats per rebirth)
    if (rebirths > 0) {
      const rebirthMult = 1 + (rebirths * 0.25);
      stats.health = Math.floor(stats.health * rebirthMult);
      stats.attack = Math.floor(stats.attack * rebirthMult);
      stats.defense = Math.floor(stats.defense * rebirthMult);
      stats.speed = Math.floor(stats.speed * rebirthMult);
      stats.luck = Math.floor(stats.luck * (1 + (rebirths * 0.05))); 
    }
    
    return stats;
  };

  const heroStats = calculateStats();
  const maxXp = level * 100;

  // Initialize display and shop
  useEffect(() => {
    setCurrentRace(equippedRace);
    handleRefreshShop(true); // Initial free stock
  }, []);

  // Check for Collection Completion Reward
  useEffect(() => {
    if (hasClaimedCollectionReward) return;

    // Check if user owns all INITIAL_RACES
    const allBaseRacesOwned = INITIAL_RACES.every(r => ownedRaceIds.has(r.id));
    
    if (allBaseRacesOwned) {
      const fusionCore = ITEMS_POOL.find(i => i.id === 'ac_fusion_core');
      if (fusionCore) {
        setInventory(prev => [...prev, { ...fusionCore, id: `reward-${Date.now()}` }]);
        setHasClaimedCollectionReward(true);
        triggerNotification("COLLECTION COMPLETE!", "You found the Fusion Core!", Rarity.MYTHICAL);
      }
    }
  }, [ownedRaceIds, hasClaimedCollectionReward]);

  // Scroll to bottom of combat log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [combatState?.log]);

  // Watch for rare drops in combat
  useEffect(() => {
    if (combatState?.isFinished && combatState.won && combatState.rewards?.drops) {
      combatState.rewards.drops.forEach(drop => {
        if (drop.rarity === Rarity.LEGENDARY || drop.rarity === Rarity.MYTHICAL) {
          triggerNotification("LEGENDARY DROP!", `You found ${drop.name}!`, drop.rarity);
        }
      });
    }
  }, [combatState?.isFinished]);

  // --- HELPER FUNCTIONS ---
  const triggerNotification = (title: string, message: string, rarity: Rarity) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ title, message, rarity });
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Helper to check if player has a specific race trait active (either Primary OR Secondary via Fusion Core)
  const playerHasRaceAbility = (raceId: string) => {
    if (equippedRace.id === raceId) return true;
    if (isFusionCoreActive && secondaryRace?.id === raceId) return true;
    return false;
  };

  const getFusionName = (race1: Race, race2: Race): string => {
    // Sort IDs alphabetically to ensure consistent keys (angel+demon == demon+angel)
    const [r1, r2] = [race1.id, race2.id].sort();
    const key = `${r1}+${r2}`;

    const specialCombinations: Record<string, string> = {
      'angel+demon': 'Nephalem',
      'human+zombie': 'Infected',
      'elf+human': 'Half-Elf',
      'human+orc': 'Half-Orc',
      'dragonborn+golem': 'Obsidian Drake',
      'angel+human': 'Demigod',
      'demon+human': 'Tiefling',
      'shadow+undead': 'Wraith',
      'dwarf+golem': 'Rune Construct',
      'minotaur+orc': 'Warbeast',
      'elf+shadow': 'Dark Elf',
      'dragonborn+human': 'Draconian'
    };

    if (specialCombinations[key]) {
      return specialCombinations[key];
    }

    // Default Portmanteau Logic
    const nameStart = race1.name.substring(0, Math.ceil(race1.name.length / 2));
    const nameEnd = race2.name.substring(Math.ceil(race2.name.length / 2));
    return `${nameStart}${nameEnd}`;
  };

  const getFusionRarity = (race1: Race, race2: Race): Rarity => {
    const idx1 = RARITY_TIERS.indexOf(race1.rarity);
    const idx2 = RARITY_TIERS.indexOf(race2.rarity);

    if (idx1 === -1 || idx2 === -1) return Rarity.COMMON;

    if (idx1 === idx2) {
      // Same rarity: Upgrade to next tier (capped at Mythical)
      const newIdx = Math.min(idx1 + 1, RARITY_TIERS.length - 1);
      return RARITY_TIERS[newIdx];
    } else {
      // Different rarity: Average (Midpoint)
      const newIdx = Math.floor((idx1 + idx2) / 2);
      return RARITY_TIERS[newIdx];
    }
  };

  // --- ACTIONS ---

  const addXp = (amount: number) => {
    if (level >= MAX_LEVEL) return; // Cap at max level

    // Human Blessed Trait: +3% Extra XP
    let finalAmount = amount;
    if (playerHasRaceAbility('human')) {
      finalAmount = Math.floor(amount * 1.03);
    }

    let newXp = xp + finalAmount;
    let newLevel = level;
    
    // Level up logic
    while (newXp >= newLevel * 100 && newLevel < MAX_LEVEL) {
      newXp -= newLevel * 100;
      newLevel++;
    }
    
    // Hard cap at max level
    if (newLevel === MAX_LEVEL) {
      newXp = 0;
    }

    setXp(newXp);
    setLevel(newLevel);
  };

  const handleRebirth = () => {
    if (level < MAX_LEVEL) {
      alert("You must be Level 100 to Rebirth!");
      return;
    }
    
    if (window.confirm(`Are you sure you want to Rebirth?\n\n- Level resets to 1\n- XP resets to 0\n- Gain +25% PERMANENT STAT MULTIPLIER\n- Keep all Items and Races`)) {
      setLevel(1);
      setXp(0);
      setRebirths(prev => prev + 1);
      triggerNotification("REBIRTH SUCCESSFUL!", `You are now Rebirth ${rebirths + 1}! Stats increased by 25%!`, Rarity.MYTHICAL);
    }
  };

  const handleFusion = () => {
    if (!fusionSlot1 || !fusionSlot2) return;
    if (shards < FUSION_COST) {
      alert(`Need ${FUSION_COST} Shards to fuse!`);
      return;
    }
    if (fusionSlot1.id === fusionSlot2.id) {
      alert("Cannot fuse a race with itself!");
      return;
    }

    setShards(prev => prev - FUSION_COST);

    const newName = getFusionName(fusionSlot1, fusionSlot2);
    const newRarity = getFusionRarity(fusionSlot1, fusionSlot2);

    // Combine Stats (Sum of both * 1.2 Fusion Bonus)
    const newStats: Partial<Stats> = {};
    const keys: (keyof Stats)[] = ['health', 'attack', 'defense', 'speed', 'luck'];
    
    keys.forEach(key => {
      const val1 = fusionSlot1.statModifiers?.[key] || 0;
      const val2 = fusionSlot2.statModifiers?.[key] || 0;
      if (val1 !== 0 || val2 !== 0) {
        newStats[key] = Math.floor((val1 + val2) * 1.2); // 20% Bonus on combined stats
      }
    });

    // Combine Traits
    const newTraits = [...fusionSlot1.traits, ...fusionSlot2.traits];

    const newRace: Race = {
      id: `fusion-${fusionSlot1.id}-${fusionSlot2.id}-${Date.now()}`,
      name: newName,
      rarity: newRarity, 
      chance: 0, // Cannot be rolled
      traits: newTraits,
      statModifiers: newStats,
      description: `A powerful fusion between ${fusionSlot1.name} and ${fusionSlot2.name}.`,
      isCustom: true,
      drops: [...(fusionSlot1.drops || []), ...(fusionSlot2.drops || [])]
    };

    setRaces(prev => [newRace, ...prev]);
    setOwnedRaceIds(prev => new Set(prev).add(newRace.id));
    setEquippedRace(newRace);
    setFusionSlot1(null);
    setFusionSlot2(null);

    triggerNotification("FUSION COMPLETE!", `Created ${newName} (${newRarity})!`, newRarity);
    setActiveTab('hero');
  };

  const handleRoll = () => {
    if (isRolling) return;
    if (shards < ROLL_COST) {
      alert("Not enough Soul Shards!");
      return;
    }
    
    setShards(prev => prev - ROLL_COST);
    setIsRolling(true);
    setCurrentRace(null);

    let steps = 0;
    const maxSteps = 20;
    const intervalSpeed = 100;

    rollIntervalRef.current = window.setInterval(() => {
      // Filter out custom/fusion races from the roll pool
      const rollableRaces = races.filter(r => !r.isCustom && r.chance > 0);
      const randomPreviewIndex = Math.floor(Math.random() * rollableRaces.length);
      setCurrentRace(rollableRaces[randomPreviewIndex]);
      steps++;

      if (steps >= maxSteps) {
        if (rollIntervalRef.current !== null) {
          clearInterval(rollIntervalRef.current);
        }
        finalizeRoll();
      }
    }, intervalSpeed);
  };

  const finalizeRoll = () => {
    // Weighted RNG
    const rollableRaces = races.filter(r => !r.isCustom && r.chance > 0);
    const totalWeight = rollableRaces.reduce((sum, race) => sum + race.chance, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedRace = rollableRaces[0];

    for (const race of rollableRaces) {
      if (randomNum < race.chance) {
        selectedRace = race;
        break;
      }
      randomNum -= race.chance;
    }

    setCurrentRace(selectedRace);
    setRollHistory(prev => [selectedRace, ...prev].slice(0, 50));
    setOwnedRaceIds(prev => new Set(prev).add(selectedRace.id));
    setIsRolling(false);

    // Notification for high rarity
    if (selectedRace.rarity === Rarity.LEGENDARY || selectedRace.rarity === Rarity.MYTHICAL) {
      triggerNotification("RACE UNLOCKED!", `You rolled the ${selectedRace.rarity} ${selectedRace.name}!`, selectedRace.rarity);
    }
  };

  const handleEquipRace = (race: Race) => {
    setEquippedRace(race);
    if (activeTab === 'forge') {
      setCurrentRace(race);
    }
  };

  const handleEquipItem = (item: Item) => {
    if (item.type === 'potion') return; // Cannot equip potions
    setEquipment(prev => ({
      ...prev,
      [item.type]: item
    }));
    setInventory(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      const oldItem = equipment[item.type];
      if (oldItem) filtered.push(oldItem);
      return filtered;
    });
  };

  const handleUnequipItem = (type: ItemType) => {
    const item = equipment[type as "weapon" | "armor" | "accessory"];
    if (item) {
      setInventory(prev => [...prev, item]);
      setEquipment(prev => {
        const copy = { ...prev };
        delete copy[type as "weapon" | "armor" | "accessory"];
        return copy;
      });
      // Also clear secondary race if unequipped fusion core
      if (type === 'accessory' && (item.id.includes('ac_fusion_core') || item.name === 'Fusion Core')) {
          setSecondaryRace(null);
      }
    }
  };

  const handleSellItem = (item: Item) => {
     setShards(prev => prev + item.value);
     setInventory(prev => prev.filter(i => i.id !== item.id));
  };

  const generateRandomShopStock = () => {
    // Combine explicit shop items with the general item pool
    const allPossibleItems = [...SHOP_ITEMS, ...ITEMS_POOL];
    const stockSize = 9;
    const newStock: Item[] = [];

    // Select random items
    for (let i = 0; i < stockSize; i++) {
      const randomItem = allPossibleItems[Math.floor(Math.random() * allPossibleItems.length)];
      
      // Calculate cost if missing (Value * 5 is a rough estimate for economy balance)
      const cost = randomItem.cost || (randomItem.value * 5);
      
      // Create a unique instance for the shop to ensure unique keys
      newStock.push({
        ...randomItem,
        id: `shop-${randomItem.id}-${Date.now()}-${i}`,
        cost: cost
      });
    }
    
    // Always ensure at least one potion is available for utility
    const potion = SHOP_ITEMS.find(i => i.type === 'potion');
    if (potion) {
        newStock[0] = { ...potion, id: `shop-pot-${Date.now()}`, cost: potion.cost };
    }

    setShopStock(newStock);
  };

  const handleRefreshShop = (free = false) => {
    if (!free) {
      if (shards < SHOP_REFRESH_COST) {
        alert("Not enough Shards to refresh!");
        return;
      }
      setShards(prev => prev - SHOP_REFRESH_COST);
    }
    generateRandomShopStock();
  };

  const handleBuyItem = (item: Item) => {
    if (!item.cost) return;
    
    // Goblin Bargain Trait: 12% Discount
    let finalCost = item.cost;
    if (playerHasRaceAbility('goblin')) {
      finalCost = Math.floor(item.cost * 0.88);
    }

    if (shards < finalCost) {
      alert("Not enough shards!");
      return;
    }
    setShards(prev => prev - finalCost);
    
    // Create new instance of item for inventory
    // Remove "shop-" prefix and timestamp from ID for inventory
    const baseId = item.id.split('-').slice(1, -2).join('-') || item.id;
    const inventoryItem = { ...item, id: `${baseId}-${Date.now()}` };
    
    setInventory(prev => [...prev, inventoryItem]);

    // Remove from shop stock (Sold Out logic)
    setShopStock(prev => prev.filter(i => i.id !== item.id));
    
    triggerNotification("ITEM PURCHASED", `You bought ${item.name}`, item.rarity);
  };

  const handleRedeemCode = () => {
    const code = codeScan.trim().toUpperCase();
    if (redeemedCodes.has(code)) {
      alert("Code already redeemed!");
      return;
    }

    if (code === 'ULTIMATE') {
      // 1. Unlock ALL Races
      const allRaceIds = INITIAL_RACES.map(r => r.id);
      setOwnedRaceIds(prev => new Set([...prev, ...allRaceIds]));
      
      // 2. Add ALL Items (Pool + Shop)
      const poolItems = ITEMS_POOL.map(i => ({
        ...i,
        id: `ult-pool-${i.id}-${Date.now()}`
      }));
      
      const shopItems = SHOP_ITEMS.map(i => ({
        ...i,
        id: `ult-shop-${i.id}-${Date.now()}`
      }));

      setInventory(prev => [...prev, ...poolItems, ...shopItems]);

      // 3. Max Stats / Shards
      setLevel(MAX_LEVEL);
      setXp(0);
      setShards(prev => prev + 9999999);
      
      setRedeemedCodes(prev => new Set(prev).add(code));
      setCodeScan('');
      triggerNotification("ULTIMATE UNLOCKED", "All Races, Items & Max Level!", Rarity.MYTHICAL);
      return;
    }

    if (REDEEM_CODES[code]) {
      const reward = REDEEM_CODES[code];
      setShards(prev => prev + reward);
      setRedeemedCodes(prev => new Set(prev).add(code));
      setCodeScan('');
      alert(`Code Accepted! Received ${reward} Soul Shards.`);
    } else {
      alert("Invalid Code.");
    }
  };

  const startMission = (mission: Mission) => {
    if (activeMission) return;
    
    // Check requirements
    if (mission.minRarity && RARITY_POWER[equippedRace.rarity] < RARITY_POWER[mission.minRarity]) {
      alert(`Your race is too weak! Need ${mission.minRarity} or better.`);
      return;
    }

    setActiveMission(mission.id);
    setMissionProgress(0);

    const baseTickRate = 100;
    
    // --- MISSION SPEED MECHANIC ---
    // Formula: Total Time = Base Time / (1 + Speed / 100)
    // Example: 100 Speed = 2x Faster. 200 Speed = 3x Faster.
    const speedMultiplier = 1 + (heroStats.speed / 100);
    const duration = mission.duration / speedMultiplier;
    
    const totalTicks = duration / baseTickRate;
    let currentTick = 0;

    missionIntervalRef.current = window.setInterval(() => {
      currentTick++;
      setMissionProgress(Math.min(100, (currentTick / totalTicks) * 100));

      if (currentTick >= totalTicks) {
        if (missionIntervalRef.current) clearInterval(missionIntervalRef.current);
        completeMission(mission);
      }
    }, baseTickRate);
  };

  const completeMission = (mission: Mission) => {
    setShards(prev => prev + mission.reward);
    addXp(mission.xpReward);
    setActiveMission(null);
    setMissionProgress(0);
  };

  // --- COMBAT LOGIC ---
  const generateLoot = (enemyRace: Race): Item[] => {
    const roll = Math.random() + (heroStats.luck * 0.005);
    const drops: Item[] = [];

    // 1. Check for Race Specific Drop
    if (enemyRace.drops && enemyRace.drops.length > 0) {
      const dropChance = 0.2 + (heroStats.luck * 0.01); // 20% base chance for specific drop
      if (Math.random() < dropChance) {
        const dropId = enemyRace.drops[Math.floor(Math.random() * enemyRace.drops.length)];
        const item = ITEMS_POOL.find(i => i.id === dropId);
        if (item) {
          drops.push({ ...item, id: `${item.id}-${Date.now()}` });
        }
      }
    }

    // 2. Generic Loot Pool (Fallback or Bonus)
    if (drops.length === 0 || Math.random() < 0.3) {
      let rarityPool = [Rarity.COMMON];
      if (roll > 0.6) rarityPool.push(Rarity.UNCOMMON);
      if (roll > 0.8) rarityPool.push(Rarity.RARE);
      if (roll > 0.95) rarityPool.push(Rarity.EPIC);
      
      const validItems = ITEMS_POOL.filter(i => rarityPool.includes(i.rarity));

      if (validItems.length > 0) {
         const item = validItems[Math.floor(Math.random() * validItems.length)];
         drops.push({ ...item, id: `${item.id}-${Date.now()}-2` });
      }
    }

    return drops;
  };

  const initializeCombat = () => {
    if (combatState?.isActive) return;

    // 1. Determine Enemy Race and Level
    // Don't fight custom/fused races for now, only base game races
    const validEnemies = races.filter(r => !r.isCustom);
    const enemyRace = validEnemies[Math.floor(Math.random() * validEnemies.length)];
    
    // Enemy Level: Random between [PlayerLevel - 10] and [PlayerLevel + 10], clamped 1-100.
    const lvlRange = 10;
    const minLvl = Math.max(1, level - lvlRange);
    const maxLvl = Math.min(MAX_LEVEL, level + lvlRange);
    const enemyLevel = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;

    // 2. Calculate Base Stats based on Level (using player's base curve)
    // Formula: Base + Level * Multiplier
    const baseHp = 100 + (enemyLevel * 10);
    const baseAtk = 10 + (enemyLevel * 2);
    const baseDef = 5 + (enemyLevel * 1);
    const baseSpd = 10 + (enemyLevel * 0.5);

    // 3. Apply Rarity Multiplier to make higher rarity enemies stronger
    let rarityMult = 1.0;
    switch(enemyRace.rarity) {
        case Rarity.COMMON: rarityMult = 0.8; break;
        case Rarity.UNCOMMON: rarityMult = 1.0; break;
        case Rarity.RARE: rarityMult = 1.2; break;
        case Rarity.EPIC: rarityMult = 1.5; break;
        case Rarity.LEGENDARY: rarityMult = 2.0; break;
        case Rarity.MYTHICAL: rarityMult = 3.0; break;
    }

    // 4. Add slight variation so not all same-level enemies are identical
    const variation = () => 1 + (Math.random() * 0.2 - 0.1); // +/- 10%

    const enemyStats: Stats = {
      health: Math.floor(baseHp * rarityMult * variation()),
      attack: Math.floor(baseAtk * rarityMult * variation()),
      defense: Math.floor(baseDef * rarityMult * variation()),
      speed: Math.floor(baseSpd * variation()),
      luck: 0
    };

    setCombatState({
      isActive: true,
      turn: 0,
      log: [
        `Encountered Lvl ${enemyLevel} ${enemyRace.name}!`, 
        isFusionCoreActive && secondaryRace ? `Fusion Core Active: ${equippedRace.name} + ${secondaryRace.name} Traits engaged!` : `Traits Active: ${equippedRace.name}`
      ],
      playerCurrentHp: heroStats.health,
      playerMaxHp: heroStats.health,
      enemyCurrentHp: enemyStats.health,
      enemyMaxHp: enemyStats.health,
      enemyRace: enemyRace,
      enemyLevel: enemyLevel,
      enemyStats: enemyStats,
      isFinished: false,
      won: false,
      effects: {
        playerBurnStacks: 0,
        enemyBurnStacks: 0,
        playerBurnDamage: 0,
        enemyBurnDamage: 0,
        playerSecondChanceUsed: false,
        enemySecondChanceUsed: false
      }
    });
  };

  // Combat Turn Loop
  useEffect(() => {
    if (!combatState || !combatState.isActive || combatState.isFinished) {
      if (combatIntervalRef.current) clearInterval(combatIntervalRef.current);
      return;
    }

    combatIntervalRef.current = window.setInterval(() => {
      setCombatState(prevState => {
        if (!prevState || prevState.isFinished) return prevState;

        const newState = { ...prevState };
        const { enemyRace, enemyStats, turn, log, effects } = newState;
        
        if (turn === 0) {
          newState.turn = 1;
          newState.log = [...log, "Battle Started!"];
          return newState;
        }

        const currentTurnLog: string[] = [];
        let newPlayerHp = newState.playerCurrentHp;
        let newEnemyHp = newState.enemyCurrentHp;

        // Helper to check race traits inside the interval loop
        // We use state variables directly.
        const hasTrait = (rId: string) => equippedRace.id === rId || (isFusionCoreActive && secondaryRace?.id === rId);

        // --- START OF TURN EFFECTS ---

        // Zombie Mutated Genes (Player): +2% Regen per turn (Description says every 5s)
        if (hasTrait('zombie') && newPlayerHp < heroStats.health) {
          const heal = Math.max(1, Math.floor(heroStats.health * 0.02));
          newPlayerHp = Math.min(heroStats.health, newPlayerHp + heal);
          currentTurnLog.push(`Mutated Genes regenerated ${heal} HP.`);
        }
        // Zombie (Enemy)
        if (enemyRace.id === 'zombie' && newEnemyHp < enemyStats.health) {
           const heal = Math.max(1, Math.floor(enemyStats.health * 0.02));
           newEnemyHp = Math.min(enemyStats.health, newEnemyHp + heal);
           currentTurnLog.push(`${enemyRace.name} regenerated ${heal} HP.`);
        }

        // Demon Cursed Aura: Deals 10% weapon damage per turn automatically
        if (enemyRace.id === 'demon') {
          const auraDmg = Math.floor(enemyStats.attack * 0.1);
          newPlayerHp -= auraDmg;
          currentTurnLog.push(`Cursed Aura drains ${auraDmg} HP from you.`);
        }
        if (hasTrait('demon')) {
          const auraDmg = Math.floor(heroStats.attack * 0.1);
          newEnemyHp -= auraDmg;
          currentTurnLog.push(`Your Cursed Aura drains ${auraDmg} HP from foe.`);
        }

        // Burn / Fire Circle Damage
        if (effects.playerBurnStacks > 0) {
          const dmg = effects.playerBurnDamage || Math.floor(enemyStats.attack * 0.2);
          newPlayerHp -= dmg;
          newState.effects.playerBurnStacks -= 1;
          currentTurnLog.push(`You take ${dmg} fire damage!`);
        }
        if (effects.enemyBurnStacks > 0) {
          const dmg = effects.enemyBurnDamage || Math.floor(heroStats.attack * 0.2);
          newEnemyHp -= dmg;
          newState.effects.enemyBurnStacks -= 1;
          currentTurnLog.push(`${enemyRace.name} takes ${dmg} fire damage!`);
        }


        // --- PLAYER ATTACK PHASE ---
        
        // Calculate Attack Power
        let pDmgRaw = heroStats.attack;
        
        // Minotaur Bull's Fury: Under 50% HP -> +30% Speed/Phys Damage
        if (hasTrait('minotaur') && newPlayerHp < heroStats.health * 0.5) {
          pDmgRaw = Math.floor(pDmgRaw * 1.3);
          currentTurnLog.push("Bull's Fury enraged you! (+Damage)");
        }
        
        // Dwarf Critical Mining: 20% chance to deal +50% Damage
        if (hasTrait('dwarf') && Math.random() < 0.20) {
           pDmgRaw = Math.floor(pDmgRaw * 1.5);
           currentTurnLog.push("Critical Strike!");
        }

        // Defense Calculation
        let pDmg = Math.max(1, Math.floor(pDmgRaw * (100 / (100 + enemyStats.defense))));
        
        // Angel Smite: 50% chance to deal 30% extra Holy damage
        if (hasTrait('angel') && Math.random() < 0.5) {
          const smiteDmg = Math.floor(pDmg * 0.3);
          pDmg += smiteDmg;
          currentTurnLog.push("Holy Smite triggered!");
        }

        // --- ENEMY DEFENSE CHECKS ---

        // Shadow Phantom Step: 15% chance to dodge
        let enemyDodged = false;
        if (enemyRace.id === 'shadow' && Math.random() < 0.15) {
          enemyDodged = true;
          currentTurnLog.push(`${enemyRace.name} used Phantom Step to dodge!`);
        }

        // Angel Holy Hand (Enemy): < 20% HP -> Infinite Stamina (Max Evasion for us)
        if (enemyRace.id === 'angel' && newEnemyHp < enemyStats.health * 0.2 && Math.random() < 0.5) {
           enemyDodged = true; // Simulating "Infinite Stamina" as dodging everything
           currentTurnLog.push(`${enemyRace.name}'s Holy Hand evades the attack!`);
        }

        if (!enemyDodged) {
           // Golem Stone Heart: 50% chance to lower incoming dmg by 25%
           if (enemyRace.id === 'golem' && Math.random() < 0.5) {
             pDmg = Math.floor(pDmg * 0.75);
             currentTurnLog.push("Stone Heart reduced damage.");
           }

           // Zombie Absorb (Enemy): 15% chance to convert incoming damage to health
           if (enemyRace.id === 'zombie' && Math.random() < 0.15) {
              newEnemyHp += pDmg;
              currentTurnLog.push(`${enemyRace.name} absorbed the attack as HP!`);
           } else {
              // Deal Damage
              newEnemyHp -= pDmg;
              currentTurnLog.push(`You hit for ${pDmg}.`);

              // Demon Backfire (Enemy): 25% chance to burn attacker
              if (enemyRace.id === 'demon' && Math.random() < 0.25) {
                newState.effects.playerBurnStacks = 3;
                newState.effects.playerBurnDamage = Math.floor(enemyStats.attack * 0.2); // Generic burn
                currentTurnLog.push(`${enemyRace.name}'s Backfire burned you!`);
              }

              // Undead Sharp Surface: Reflect 10% damage
              if (enemyRace.id === 'undead') {
                const reflect = Math.floor(pDmg * 0.1);
                newPlayerHp -= reflect;
                currentTurnLog.push(`${enemyRace.name} reflects ${reflect} damage.`);
              }
           }
        }

        // Player Offense Special Triggers
        
        // Dragonborn Dragon's Breath: 40% chance to burn (30% weapon dmg/sec for 3s)
        if (hasTrait('dragonborn') && Math.random() < 0.4) {
           newState.effects.enemyBurnStacks = 3;
           newState.effects.enemyBurnDamage = Math.floor(heroStats.attack * 0.3);
           currentTurnLog.push("Dragon's Breath engulfed the enemy!");
        }

        // Demon Devil's Finger: 20% chance to create fire circle (45% weapon dmg/sec for 3s)
        if (hasTrait('demon') && Math.random() < 0.2) {
           newState.effects.enemyBurnStacks = 3;
           newState.effects.enemyBurnDamage = Math.floor(heroStats.attack * 0.45);
           currentTurnLog.push("Devil's Finger created a Hellfire Circle!");
        }


        // --- ENEMY ATTACK PHASE ---

        if (newEnemyHp > 0) {
          let eDmgRaw = enemyStats.attack;

          // Minotaur Bull's Fury (Enemy)
          if (enemyRace.id === 'minotaur' && newEnemyHp < enemyStats.health * 0.5) {
             eDmgRaw = Math.floor(eDmgRaw * 1.3);
             currentTurnLog.push(`${enemyRace.name} is enraged!`);
          }

          // Dwarf Crit (Enemy)
          if (enemyRace.id === 'dwarf' && Math.random() < 0.2) {
             eDmgRaw = Math.floor(eDmgRaw * 1.5);
             currentTurnLog.push(`${enemyRace.name} lands a Critical Hit!`);
          }

          let eDmg = Math.max(1, Math.floor(eDmgRaw * (100 / (100 + heroStats.defense))));

          // Goblin Sneaky: Chance to attack twice (mapped from "Attack Speed")
          let attacks = 1;
          if (enemyRace.id === 'goblin' && Math.random() < 0.25) { 
            attacks = 2;
            currentTurnLog.push(`${enemyRace.name} attacks twice!`);
          }

          for (let i = 0; i < attacks; i++) {
             // Player Dodge Checks
             let playerDodged = false;
             
             // Shadow Phantom Step (Player)
             if (hasTrait('shadow') && Math.random() < 0.15) {
               playerDodged = true;
               currentTurnLog.push(`You used Phantom Step to dodge!`);
             }
             
             // Angel Holy Hand (Player)
             if (hasTrait('angel') && newPlayerHp < heroStats.health * 0.2 && Math.random() < 0.5) {
               playerDodged = true;
               currentTurnLog.push(`Holy Hand grants infinite stamina! You evaded!`);
             }

             // Regular speed dodge
             if (!playerDodged) {
                const speedDodge = Math.min(0.5, (heroStats.speed - enemyStats.speed) * 0.02);
                if (Math.random() < speedDodge && speedDodge > 0) {
                   playerDodged = true;
                   currentTurnLog.push(`You dodged based on Speed!`);
                }
             }

             if (!playerDodged) {
               let incomingDmg = eDmg;

               // Golem Stone Heart (Player)
               if (hasTrait('golem') && Math.random() < 0.5) {
                 incomingDmg = Math.floor(incomingDmg * 0.75);
                 currentTurnLog.push("Stone Heart reduced damage.");
               }

               // Zombie Absorb (Player)
               if (hasTrait('zombie') && Math.random() < 0.15) {
                  newPlayerHp += incomingDmg;
                  currentTurnLog.push(`Absorb converted ${incomingDmg} damage into Health!`);
               } else {
                  newPlayerHp -= incomingDmg;
                  currentTurnLog.push(`${enemyRace.name} hits you for ${incomingDmg}.`);

                  // Undead Reflect (Player)
                  if (hasTrait('undead')) {
                    const reflect = Math.floor(incomingDmg * 0.1);
                    newEnemyHp -= reflect;
                    currentTurnLog.push(`You reflected ${reflect} damage.`);
                  }

                   // Demon Backfire (Player is Demon)
                   if (hasTrait('demon') && Math.random() < 0.25) {
                     newState.effects.enemyBurnStacks = 3;
                     newState.effects.enemyBurnDamage = Math.floor(heroStats.attack * 0.2);
                     currentTurnLog.push(`Your Backfire burned ${enemyRace.name}!`);
                   }
               }
             }
          }
           
           // Dragonborn Breath (Enemy)
           if (enemyRace.id === 'dragonborn' && Math.random() < 0.4) {
              newState.effects.playerBurnStacks = 3;
              newState.effects.playerBurnDamage = Math.floor(enemyStats.attack * 0.3);
              currentTurnLog.push(`${enemyRace.name} breathes fire on you!`);
           }

           // Demon Devil's Finger (Enemy)
           if (enemyRace.id === 'demon' && Math.random() < 0.2) {
             newState.effects.playerBurnStacks = 3;
             newState.effects.playerBurnDamage = Math.floor(enemyStats.attack * 0.45);
             currentTurnLog.push(`${enemyRace.name} summons a Hellfire Circle!`);
           }
        }

        // --- DEATH CHECKS & SECOND CHANCE ---

        // Undead Second Chance (Enemy): Refills 50% health when health is under 10%
        if (newEnemyHp < (enemyStats.health * 0.1) && !newState.effects.enemySecondChanceUsed && enemyRace.id === 'undead') {
           newEnemyHp = Math.floor(enemyStats.health * 0.5);
           newState.effects.enemySecondChanceUsed = true;
           currentTurnLog.push(`${enemyRace.name} activates Second Chance! (HP Restored)`);
        }

        // Undead Second Chance (Player)
        if (newPlayerHp < (heroStats.health * 0.1) && !newState.effects.playerSecondChanceUsed && hasTrait('undead')) {
           newPlayerHp = Math.floor(heroStats.health * 0.5);
           newState.effects.playerSecondChanceUsed = true;
           currentTurnLog.push(`Second Chance activates! You refuse to die.`);
        }

        // --- FINAL RESOLUTION ---

        if (newEnemyHp <= 0) {
          // Reward Scaling: More rewards for higher level/rarity
          const shardReward = Math.floor((RARITY_POWER[enemyRace.rarity] * 0.5) + (newState.enemyLevel * 3));
          const xpReward = Math.floor((RARITY_POWER[enemyRace.rarity] * 0.2) + (newState.enemyLevel * 5));
          const drops = generateLoot(enemyRace);

          newState.isFinished = true;
          newState.won = true;
          newState.enemyCurrentHp = 0;
          newState.playerCurrentHp = newPlayerHp;
          newState.rewards = { shards: shardReward, xp: xpReward, drops };
          newState.log = [...log, ...currentTurnLog, `Victory!`, `Gained ${shardReward} Shards & ${xpReward} XP.`];
          if (drops.length > 0) newState.log.push(`Loot: ${drops.map(d => d.name).join(', ')}`);
          
          setShards(s => s + shardReward);
          addXp(xpReward);
          setInventory(i => [...i, ...drops]);
          
          return newState;
        }

        if (newPlayerHp <= 0) {
          newState.isFinished = true;
          newState.won = false;
          newState.playerCurrentHp = 0;
          newState.enemyCurrentHp = newEnemyHp;
          newState.log = [...log, ...currentTurnLog, `You were defeated.`];
          setShards(s => s + 5); // Pity shards
          return newState;
        }

        newState.turn += 1;
        newState.playerCurrentHp = newPlayerHp;
        newState.enemyCurrentHp = newEnemyHp;
        newState.log = [...log, ...currentTurnLog];
        
        return newState;
      });
    }, 1500);

    return () => {
      if (combatIntervalRef.current) clearInterval(combatIntervalRef.current);
    };
  }, [combatState?.isActive, combatState?.isFinished, combatState?.turn, equippedRace, secondaryRace, isFusionCoreActive]);

  const leaveCombat = () => {
    setCombatState(null);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current !== null) clearInterval(rollIntervalRef.current);
      if (missionIntervalRef.current !== null) clearInterval(missionIntervalRef.current);
      if (combatIntervalRef.current !== null) clearInterval(combatIntervalRef.current);
      if (notificationTimeoutRef.current !== null) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden shadow-2xl border-x border-slate-800 relative">
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Notifications Overlay */}
      {notification && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[60] w-[90%] md:w-full max-w-lg px-4 animate-in slide-in-from-top duration-500">
          <div className={`
            p-6 rounded-xl border-2 shadow-2xl flex items-center gap-4 relative overflow-hidden backdrop-blur-xl
            ${notification.rarity === Rarity.MYTHICAL ? 'bg-rose-950/90 border-rose-500 shadow-rose-500/50' : 
              notification.rarity === Rarity.LEGENDARY ? 'bg-amber-950/90 border-amber-500 shadow-amber-500/50' : 
              'bg-slate-800/90 border-slate-500'}
          `}>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            
            <div className={`p-3 rounded-full ${notification.rarity === Rarity.MYTHICAL ? 'bg-rose-500' : 'bg-amber-500'} text-white shadow-lg`}>
              {notification.rarity === Rarity.MYTHICAL ? <Sparkles className="w-8 h-8 animate-spin-slow" /> : <Trophy className="w-8 h-8" />}
            </div>
            <div>
              <h3 className={`text-2xl font-bold uppercase fantasy-font ${notification.rarity === Rarity.MYTHICAL ? 'text-rose-200' : 'text-amber-200'}`}>
                {notification.title}
              </h3>
              <p className="text-white font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
             <img 
               src="https://images.unsplash.com/photo-1542259681-d262d9699666?q=80&w=200&auto=format&fit=crop" 
               alt="Soul Forge" 
               className="w-10 h-10 rounded-full border-2 border-amber-500 object-cover shadow-amber-500/50 shadow-md"
             />
             <h1 className="text-2xl font-bold fantasy-font text-amber-500 drop-shadow-md">
               Soul Forge
             </h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Currency & Level Display */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-400">Shards</span>
            </div>
            <span className="text-lg font-bold text-purple-300 font-mono">{shards}</span>
          </div>
          
          <div className="border-t border-slate-800 pt-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Lvl {level} {rebirths > 0 && <span className="text-amber-500 font-bold">(R{rebirths})</span>}</span>
              <span>{Math.floor(xp)} / {maxXp} XP</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-green-500 h-full rounded-full transition-all" 
                style={{width: `${Math.min(100, (xp/maxXp)*100)}%`}}
              />
            </div>
            {level >= MAX_LEVEL && (
               <div className="text-center mt-1 text-[10px] text-amber-500 font-bold uppercase animate-pulse">
                 Max Level Reached
               </div>
            )}
             {rebirths > 0 && (
               <div className="text-center mt-2 text-xs text-amber-500 font-bold">
                 Rebirth Multiplier: {1 + (rebirths * 0.25)}x
               </div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
          <button onClick={() => { setActiveTab('forge'); setIsMobileMenuOpen(false); }} className={`nav-btn ${activeTab === 'forge' ? 'active-nav' : ''}`}>
            <Dices className="w-5 h-5" /> The Forge
          </button>
          
          <button onClick={() => { setActiveTab('fusion'); setIsMobileMenuOpen(false); }} className={`nav-btn ${activeTab === 'fusion' ? 'active-nav' : ''}`}>
            <Atom className="w-5 h-5" /> Fusion Reactor
          </button>

          <button onClick={() => { setActiveTab('hero'); setIsMobileMenuOpen(false); }} className={`nav-btn ${activeTab === 'hero' ? 'active-nav' : ''}`}>
            <User className="w-5 h-5" /> Hero Status
          </button>

          <button onClick={() => { setActiveTab('shop'); setIsMobileMenuOpen(false); }} className={`nav-btn ${activeTab === 'shop' ? 'active-nav' : ''}`}>
            <ShoppingBag className="w-5 h-5" /> Item Shop
          </button>

          <button onClick={() => { setActiveTab('adventure'); setIsMobileMenuOpen(false); }} className={`nav-btn ${activeTab === 'adventure' ? 'active-nav' : ''}`}>
            <Swords className="w-5 h-5" /> Adventure
          </button>

          <button onClick={() => { setActiveTab('collection'); setIsMobileMenuOpen(false); }} className={`nav-btn ${activeTab === 'collection' ? 'active-nav' : ''}`}>
            <BookOpen className="w-5 h-5" /> Collection
          </button>

          <button onClick={() => { setActiveTab('codes'); setIsMobileMenuOpen(false); }} className={`nav-btn ${activeTab === 'codes' ? 'active-nav' : ''}`}>
            <KeyRound className="w-5 h-5" /> Redeem Codes
          </button>
          
          <button onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }} className={`nav-btn ${activeTab === 'stats' ? 'active-nav' : ''}`}>
            <History className="w-5 h-5" /> Statistics
          </button>
        </div>

        <div className="mt-auto p-4 bg-slate-800/50 rounded-lg">
          <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Equipped Race</h4>
          <div className={`text-sm font-bold ${RARITY_COLORS[equippedRace.rarity].split(' ')[0]}`}>
            {equippedRace.name}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40">
           <div className="flex items-center gap-3">
             <img 
               src="https://images.unsplash.com/photo-1542259681-d262d9699666?q=80&w=200&auto=format&fit=crop" 
               alt="Soul Forge" 
               className="w-8 h-8 rounded-full border border-amber-500 object-cover"
             />
             <h1 className="text-xl font-bold fantasy-font text-amber-500">Soul Forge</h1>
           </div>
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="text-slate-300 hover:text-white p-2"
           >
             <Menu className="w-6 h-6" />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          
          {/* --- TAB: THE FORGE --- */}
          {activeTab === 'forge' && (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
              <div className="relative w-full max-w-md perspective-1000">
                {currentRace ? (
                  <RaceCard 
                    race={currentRace} 
                    animate={!isRolling} 
                    isOwned={ownedRaceIds.has(currentRace.id)}
                    isEquipped={currentRace.id === equippedRace.id}
                  />
                ) : (
                  <div className="h-96 w-full border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-600">
                    <span className="fantasy-font text-xl">Ready to Forge...</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleRoll}
                disabled={isRolling || shards < ROLL_COST}
                className={`
                  group relative px-8 py-4 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full 
                  font-bold text-xl uppercase tracking-widest text-white shadow-lg 
                  transform transition-all duration-100 
                  ${(isRolling || shards < ROLL_COST) ? 'scale-95 opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 hover:shadow-amber-500/50 active:scale-95'}
                `}
              >
                {isRolling ? (
                  <span className="flex items-center gap-2">
                    <Dices className="w-6 h-6 animate-spin" /> Forging...
                  </span>
                ) : (
                  <span className="flex items-col md:flex-row items-center gap-2">
                    <div className="flex items-center gap-2"><Dices className="w-6 h-6" /> Roll Race</div>
                    <div className="text-xs bg-black/30 px-2 py-1 rounded flex items-center gap-1">
                        <Gem className="w-3 h-3 text-purple-300" /> {ROLL_COST}
                    </div>
                  </span>
                )}
              </button>
              {shards < ROLL_COST && <p className="text-red-400 text-sm animate-pulse">Insufficient Soul Shards</p>}
            </div>
          )}

          {/* ... [Rest of the tabs: FUSION, SHOP, HERO, ADVENTURE, COLLECTION, CODES, STATS] ... */}
          {/* I am re-including all other tab content here to ensure full functionality is restored. */}
          
          {/* --- TAB: FUSION --- */}
          {activeTab === 'fusion' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="text-center border-b border-slate-800 pb-6">
                  <h2 className="text-3xl fantasy-font text-purple-400 flex items-center justify-center gap-3 mb-2">
                    <Atom className="animate-spin-slow" /> Fusion Reactor
                  </h2>
                  <p className="text-slate-400">Combine two owned races to create a powerful Hybrid.</p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  {/* Slot 1 */}
                  <div className="w-full md:w-1/3 min-h-[300px] border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center p-4 relative bg-slate-900/50">
                    {fusionSlot1 ? (
                      <>
                          <RaceCard race={fusionSlot1} isOwned={true} />
                          <button 
                            onClick={() => setFusionSlot1(null)}
                            className="absolute top-2 right-2 text-red-500 hover:text-white bg-black/50 rounded-full p-1"
                          >
                            X
                          </button>
                      </>
                    ) : (
                      <span className="text-slate-600 font-bold">Select Race 1</span>
                    )}
                  </div>

                  {/* Action Area */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-3xl font-bold text-slate-700">+</div>
                    <button
                      onClick={handleFusion}
                      disabled={!fusionSlot1 || !fusionSlot2 || shards < FUSION_COST || fusionSlot1.id === fusionSlot2.id}
                      className={`
                        px-8 py-4 rounded-full font-bold text-lg shadow-lg flex flex-col items-center transition-all
                        ${(!fusionSlot1 || !fusionSlot2 || shards < FUSION_COST || fusionSlot1.id === fusionSlot2.id) 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 hover:shadow-purple-500/40 text-white'}
                      `}
                    >
                      <span>FUSE</span>
                      <span className="text-xs bg-black/20 px-2 py-0.5 rounded flex items-center gap-1 mt-1">
                          <Gem className="w-3 h-3" /> {FUSION_COST}
                      </span>
                    </button>
                    {fusionSlot1 && fusionSlot2 && fusionSlot1.id === fusionSlot2.id && (
                      <p className="text-xs text-red-400">Cannot fuse same race!</p>
                    )}
                  </div>

                  {/* Slot 2 */}
                  <div className="w-full md:w-1/3 min-h-[300px] border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center p-4 relative bg-slate-900/50">
                    {fusionSlot2 ? (
                      <>
                          <RaceCard race={fusionSlot2} isOwned={true} />
                          <button 
                            onClick={() => setFusionSlot2(null)}
                            className="absolute top-2 right-2 text-red-500 hover:text-white bg-black/50 rounded-full p-1"
                          >
                            X
                          </button>
                      </>
                    ) : (
                      <span className="text-slate-600 font-bold">Select Race 2</span>
                    )}
                  </div>
              </div>

              {/* Selection List */}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-400 mb-4">Select from Collection</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {races.filter(r => ownedRaceIds.has(r.id)).map(race => (
                    <button
                      key={race.id}
                      onClick={() => {
                          if (!fusionSlot1) setFusionSlot1(race);
                          else if (!fusionSlot2) setFusionSlot2(race);
                      }}
                      disabled={fusionSlot1?.id === race.id || fusionSlot2?.id === race.id}
                      className={`
                        p-3 rounded border text-left transition-all
                        ${RARITY_COLORS[race.rarity]} 
                        ${(fusionSlot1?.id === race.id || fusionSlot2?.id === race.id) ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 hover:brightness-125'}
                      `}
                    >
                      <div className="font-bold text-sm truncate">{race.name}</div>
                      <div className="text-[10px] uppercase">{race.rarity}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: SHOP --- */}
          {activeTab === 'shop' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-4 gap-4">
                <h2 className="text-3xl fantasy-font text-amber-400 flex items-center gap-2">
                  <ShoppingBag /> Merchant's Wares
                </h2>
                
                <button
                  onClick={() => handleRefreshShop(false)}
                  className="group flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="font-bold text-sm">Restock</span>
                  <span className="bg-black/30 px-2 py-0.5 rounded text-xs flex items-center gap-1 text-purple-300">
                    <Gem className="w-3 h-3" /> {SHOP_REFRESH_COST}
                  </span>
                </button>
              </div>

              {playerHasRaceAbility('goblin') && (
                <div className="bg-green-900/30 p-2 rounded text-green-400 text-sm text-center border border-green-800">
                  Goblin Bargain Active! 12% Discount on all items.
                </div>
              )}

              {shopStock.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4 border-2 border-dashed border-slate-800 rounded-xl">
                  <ShoppingBag className="w-12 h-12 opacity-50" />
                  <p>Sold Out!</p>
                  <button 
                    onClick={() => handleRefreshShop(false)}
                    className="text-amber-500 hover:underline"
                  >
                    Refresh Stock ({SHOP_REFRESH_COST} Shards)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shopStock.map((item) => (
                    <div key={item.id} className="relative group animate-in fade-in zoom-in duration-300">
                      <div className="h-full">
                        <ItemCard item={item} />
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <button
                          onClick={() => handleBuyItem(item)}
                          disabled={shards < (playerHasRaceAbility('goblin') ? Math.floor((item.cost || 99999) * 0.88) : (item.cost || 99999))}
                          className={`
                            px-4 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-lg transition-all
                            ${shards >= (playerHasRaceAbility('goblin') ? Math.floor((item.cost || 99999) * 0.88) : (item.cost || 99999))
                              ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                          `}
                        >
                          <span>Buy</span>
                          <span className="bg-black/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Gem className="w-3 h-3" /> 
                            {playerHasRaceAbility('goblin') ? Math.floor((item.cost || 0) * 0.88) : item.cost}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB: HERO STATUS --- */}
          {activeTab === 'hero' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Stats Panel */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h2 className="text-3xl fantasy-font text-blue-400">Status</h2>
                  {level >= MAX_LEVEL && (
                    <button 
                      onClick={handleRebirth}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 rounded-full font-bold text-xs uppercase shadow-lg hover:scale-105 transition-transform animate-pulse"
                    >
                      <RefreshCw className="w-4 h-4" /> REBIRTH NOW
                    </button>
                  )}
                </div>
                
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
                  {rebirths > 0 && (
                    <div className="absolute top-0 right-0 p-2 bg-amber-500/20 rounded-bl-xl text-amber-500 text-xs font-bold border-l border-b border-amber-500/50">
                      Active Multiplier: x{1 + (rebirths * 0.25)}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">{equippedRace.name} Hero</h3>
                      <div className="flex flex-col gap-1">
                        <p className="text-slate-400 flex items-center gap-2">
                          Level {level} {level >= MAX_LEVEL && <span className="text-amber-500 text-xs font-bold px-2 py-0.5 bg-amber-900/30 rounded border border-amber-700">MAX</span>}
                        </p>
                        {rebirths > 0 && (
                          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mt-1 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/30 w-fit shadow-sm">
                            <RefreshCw className="w-3 h-3" />
                            <span>Rebirth {rebirths}</span>
                            <span className="text-white/30">|</span>
                            <span className="text-white">Multiplier: <span className="text-amber-300">x{1 + (rebirths * 0.25)}</span></span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded border ${RARITY_COLORS[equippedRace.rarity]}`}>
                      {equippedRace.rarity}
                    </div>
                  </div>

                  {/* Secondary Soul Slot (Fusion Core) */}
                  {isFusionCoreActive && (
                    <div className="mb-6 bg-purple-900/20 rounded-lg p-3 border border-purple-500/30 relative">
                      <span className="absolute -top-2 left-2 bg-purple-600 text-[10px] text-white px-2 rounded-full font-bold shadow-lg">FUSION CORE ACTIVE</span>
                      <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2">
                            <Atom className="w-5 h-5 text-purple-400 animate-spin-slow" />
                            <span className="text-sm font-bold text-purple-200">Secondary Soul:</span>
                            {secondaryRace ? (
                              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${RARITY_COLORS[secondaryRace.rarity]}`}>{secondaryRace.name}</span>
                            ) : (
                              <span className="text-slate-500 italic text-sm">None Selected</span>
                            )}
                          </div>
                          {secondaryRace && (
                            <button onClick={() => setSecondaryRace(null)} className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-800 hover:bg-red-900/50">
                              Unequip
                            </button>
                          )}
                      </div>
                      {!secondaryRace && (
                          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar bg-black/20 p-2 rounded">
                            {Array.from(ownedRaceIds).map(id => {
                              const race = races.find(r => r.id === id);
                              if (!race || race.id === equippedRace.id) return null;
                              return (
                                <button 
                                  key={id}
                                  onClick={() => setSecondaryRace(race)}
                                  className={`text-[10px] p-2 rounded border ${RARITY_COLORS[race.rarity]} truncate hover:brightness-125 transition-all text-center`}
                                >
                                  {race.name}
                                </button>
                              );
                            })}
                          </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="stat-box text-red-400 border-red-900/50">
                      <div className="flex items-center gap-2 mb-1"><Swords className="w-4 h-4" /> Attack</div>
                      <span className="text-2xl font-mono">{heroStats.attack}</span>
                    </div>
                    <div className="stat-box text-blue-400 border-blue-900/50">
                      <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4" /> Defense</div>
                      <span className="text-2xl font-mono">{heroStats.defense}</span>
                    </div>
                    <div className="stat-box text-green-400 border-green-900/50">
                      <div className="flex items-center gap-2 mb-1"><Heart className="w-4 h-4" /> Health</div>
                      <span className="text-2xl font-mono">{heroStats.health}</span>
                    </div>
                    <div className="stat-box text-yellow-400 border-yellow-900/50">
                      <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4" /> Speed</div>
                      <span className="text-2xl font-mono">{heroStats.speed}</span>
                    </div>
                    <div className="stat-box text-purple-400 border-purple-900/50 col-span-2">
                      <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4" /> Luck</div>
                      <span className="text-2xl font-mono">{heroStats.luck}</span>
                    </div>
                  </div>
                </div>

                {/* Equipment Slots */}
                <h3 className="text-xl font-bold text-slate-300 mt-6 mb-2">Equipment</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['weapon', 'armor', 'accessory'].map((slot) => {
                    const item = equipment[slot as ItemType];
                    return (
                      <div key={slot} className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 min-h-[120px] flex flex-col items-center justify-center text-center relative group">
                        <span className="absolute top-1 left-2 text-[10px] uppercase text-slate-500">{slot}</span>
                        {item ? (
                          <div className="w-full">
                            <ItemCard item={item} />
                            <button 
                                onClick={() => handleUnequipItem(slot as ItemType)}
                                className="mt-1 text-[10px] text-red-400 hover:text-red-300 w-full"
                            >
                              Unequip
                            </button>
                          </div>
                        ) : (
                          <div className="opacity-30">
                            <Shield className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-xs">Empty</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inventory Panel */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4 h-full flex flex-col">
                <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                  <Gem /> Inventory ({inventory.length})
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {inventory.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">Inventory is empty. <br/>Go on adventures to find loot!</div>
                  ) : (
                    inventory.map((item, idx) => (
                      <div key={item.id || idx} className="flex gap-2">
                          <div className="flex-1">
                            <ItemCard 
                              item={item} 
                              onAction={handleEquipItem} 
                              actionLabel={item.type === 'potion' ? '' : 'Equip'} 
                            />
                          </div>
                          <button 
                            onClick={() => handleSellItem(item)}
                            className="px-2 bg-red-900/20 border border-red-900/50 rounded flex flex-col items-center justify-center text-red-400 hover:bg-red-900/40"
                            title="Sell"
                          >
                            <Coins className="w-4 h-4 mb-1" />
                            <span className="text-xs">Sell</span>
                          </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* --- TAB: ADVENTURE --- */}
          {activeTab === 'adventure' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <h2 className="text-3xl fantasy-font text-red-400 mb-8 border-b border-slate-800 pb-4 flex items-center gap-3">
                <Swords /> Adventure
              </h2>

              {/* Battle Arena Visualizer */}
              <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative">
                  
                  {combatState ? (
                    <div className="animate-in fade-in zoom-in duration-300">
                      {/* Header: Turn Indicator & VS */}
                      <div className="text-center mb-6">
                        {combatState.isFinished ? (
                          <div className={`text-4xl font-bold fantasy-font ${combatState.won ? 'text-green-400' : 'text-red-500'}`}>
                            {combatState.won ? 'VICTORY' : 'DEFEATED'}
                          </div>
                        ) : (
                          <div className="text-xl font-bold text-amber-400 fantasy-font">
                            {combatState.turn === 0 ? 'PREPARING BATTLE...' : `TURN ${combatState.turn}`}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-6">
                        
                        {/* PLAYER */}
                        <div className="flex-1 w-full relative">
                          <div className={`p-4 rounded-lg border-2 ${RARITY_COLORS[equippedRace.rarity]} bg-slate-900/50 text-center transition-all ${combatState.playerCurrentHp < combatState.playerMaxHp && !combatState.isFinished ? 'animate-pulse bg-red-900/20' : ''}`}>
                            <h3 className="font-bold text-xl mb-1">{equippedRace.name}</h3>
                            {isFusionCoreActive && secondaryRace && (
                                <div className="text-xs font-bold text-purple-300 mb-1 flex items-center justify-center gap-1">
                                  <Atom className="w-3 h-3" /> {secondaryRace.name} Soul Active
                                </div>
                            )}
                            <div className="text-xs uppercase text-slate-400 mb-2">Lvl {level} Hero</div>
                            
                            {/* HP Bar */}
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-700">
                                <div 
                                  className="h-full bg-green-500 transition-all duration-500"
                                  style={{ width: `${Math.max(0, (combatState.playerCurrentHp / combatState.playerMaxHp) * 100)}%` }}
                                />
                            </div>
                            <div className="text-sm font-mono">{combatState.playerCurrentHp} / {combatState.playerMaxHp} HP</div>
                            
                            {/* Status Icons */}
                            <div className="flex justify-center gap-1 mt-2">
                              {combatState.effects.playerBurnStacks > 0 && <span title="Burned" className="text-xs bg-red-900 px-1 rounded">🔥 {combatState.effects.playerBurnStacks}</span>}
                            </div>
                          </div>
                        </div>

                        {/* VS & STAT COMPARISON */}
                        <div className="flex flex-col items-center justify-center min-w-[150px]">
                          <div className="text-3xl font-bold text-red-500 italic mb-4">VS</div>
                          
                          {/* Stats Grid */}
                          <div className="bg-black/40 p-3 rounded-lg text-xs space-y-2 w-full">
                            <div className="flex justify-between items-center text-slate-400 border-b border-slate-700 pb-1 mb-1">
                              <span>YOU</span> <span>STATS</span> <span>FOE</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-red-400">{heroStats.attack}</span> 
                                <Swords className="w-3 h-3 text-slate-600"/> 
                                <span className="text-red-400">{combatState.enemyStats.attack}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-400">{heroStats.defense}</span> 
                                <Shield className="w-3 h-3 text-slate-600"/> 
                                <span className="text-blue-400">{combatState.enemyStats.defense}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-yellow-400">{heroStats.speed}</span> 
                                <Zap className="w-3 h-3 text-slate-600"/> 
                                <span className="text-yellow-400">{combatState.enemyStats.speed}</span>
                            </div>
                          </div>
                        </div>

                        {/* ENEMY */}
                        <div className="flex-1 w-full relative">
                          <div className={`p-4 rounded-lg border-2 ${RARITY_COLORS[combatState.enemyRace.rarity]} bg-slate-900/50 text-center transition-all ${combatState.enemyCurrentHp < combatState.enemyMaxHp && !combatState.isFinished ? 'animate-pulse bg-red-900/20' : ''}`}>
                            <h3 className="font-bold text-xl mb-1">{combatState.enemyRace.name}</h3>
                            <div className="text-xs uppercase text-slate-400 mb-2">Lvl {combatState.enemyLevel} {combatState.enemyRace.rarity}</div>
                            
                            {/* HP Bar */}
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-700">
                                <div 
                                  className="h-full bg-red-500 transition-all duration-500"
                                  style={{ width: `${Math.max(0, (combatState.enemyCurrentHp / combatState.enemyMaxHp) * 100)}%` }}
                                />
                            </div>
                            <div className="text-sm font-mono">{combatState.enemyCurrentHp} / {combatState.enemyMaxHp} HP</div>

                            {/* Status Icons */}
                            <div className="flex justify-center gap-1 mt-2">
                              {combatState.effects.enemyBurnStacks > 0 && <span title="Burned" className="text-xs bg-red-900 px-1 rounded">🔥 {combatState.effects.enemyBurnStacks}</span>}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Combat Log */}
                      <div 
                        ref={logContainerRef}
                        className="bg-black/50 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm space-y-1 border border-slate-800 scroll-smooth"
                      >
                        {combatState.log.map((entry, i) => (
                          <div key={i} className={`
                            ${entry.includes('Victory') ? 'text-green-400 font-bold text-lg' : ''}
                            ${entry.includes('defeated') ? 'text-red-400 font-bold text-lg' : ''}
                            ${entry.includes('hit') ? 'text-slate-200' : 'text-slate-500'}
                            ${entry.includes('Loot') ? 'text-amber-300' : ''}
                            ${entry.includes('crit') || entry.includes('CRIT') || entry.includes('Critical') ? 'text-yellow-400 font-bold' : ''}
                            ${entry.includes('burn') || entry.includes('fire') || entry.includes('Hellfire') ? 'text-orange-400' : ''}
                            ${entry.includes('heal') || entry.includes('regenerated') || entry.includes('absorbed') ? 'text-green-300' : ''}
                          `}>
                            <span className="opacity-50 mr-2">[{i}]</span> {entry}
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      {combatState.isFinished && (
                        <div className="mt-4 flex justify-center">
                          <button 
                            onClick={leaveCombat}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all"
                          >
                            Return to Camp
                          </button>
                        </div>
                      )}

                    </div>
                  ) : (
                    // Idle State
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6">
                      <div className="bg-red-900/20 p-6 rounded-full">
                        <Swords className="w-16 h-16 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-200">Arena Battle</h3>
                        <p className="text-slate-400 max-w-md mx-auto mt-2">
                          Challenge a random opponent from the multiverse. Enemies will scale to your level.
                        </p>
                      </div>
                      
                      <button 
                        onClick={initializeCombat}
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-red-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 hover:bg-red-500"
                      >
                        Find Match
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
              </div>

              {/* Active Mission (Simplified if in combat, or just below) */}
              {!combatState && (
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Scroll className="text-amber-500" /> Active Mission
                  </h3>
                  {activeMission ? (
                    <div className="flex flex-col h-full justify-center gap-4">
                      <div className="text-lg font-bold text-amber-200 text-center">
                        {MISSIONS.find(m => m.id === activeMission)?.name}
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full transition-all duration-100"
                          style={{ width: `${missionProgress}%` }}
                        />
                      </div>
                      <p className="text-center text-xs text-slate-500">
                          Completing... {heroStats.speed > 0 && <span className="text-yellow-400">(Speed Bonus: {Math.floor(heroStats.speed)}%)</span>}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-24 text-slate-500 italic border-2 border-dashed border-slate-800 rounded-lg">
                      No active mission running.
                    </div>
                  )}
                </div>
              )}

              {/* Mission List */}
              {!combatState && (
                <div>
                  <h3 className="text-lg font-bold text-slate-400 mb-4">Available Missions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MISSIONS.map(mission => (
                      <button
                        key={mission.id}
                        onClick={() => startMission(mission)}
                        disabled={!!activeMission}
                        className={`
                          flex justify-between items-center p-4 rounded-lg border text-left transition-all
                          ${!!activeMission ? 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-amber-500/50'}
                        `}
                      >
                        <div>
                          <div className="font-bold text-slate-200">{mission.name}</div>
                          <div className="text-xs text-slate-400">{mission.description}</div>
                          {mission.minRarity && (
                            <div className="text-[10px] mt-1 text-red-400 uppercase">Requires: {mission.minRarity}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-bold text-purple-400">
                            <Gem className="w-3 h-3" /> {mission.reward}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-green-400 justify-end mt-1">
                            +{mission.xpReward} XP
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{mission.duration / 1000}s</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB: COLLECTION --- */}
          {activeTab === 'collection' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-8">
                <h2 className="text-3xl fantasy-font text-indigo-400">Race Collection</h2>
                <div className="text-slate-400">
                  Owned: <span className="text-white font-bold">{ownedRaceIds.size}</span> / {races.length}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {races.map((race) => (
                  <RaceCard 
                    key={race.id} 
                    race={race} 
                    isOwned={ownedRaceIds.has(race.id)}
                    isEquipped={equippedRace.id === race.id}
                    onEquip={handleEquipRace}
                  />
                ))}
              </div>
            </div>
          )}

          {/* --- TAB: CODES --- */}
          {activeTab === 'codes' && (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full min-h-[60vh]">
              <div className="w-full bg-slate-900/90 p-10 rounded-2xl border border-emerald-900/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                
                <h2 className="text-3xl fantasy-font text-emerald-400 mb-2 text-center flex items-center justify-center gap-2">
                  <KeyRound /> Secret Codes
                </h2>
                <p className="text-slate-400 text-center mb-8">
                  Whisper the ancient words to the forge to receive its blessings.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Enter Code</label>
                    <input 
                      type="text" 
                      value={codeScan}
                      onChange={(e) => setCodeScan(e.target.value)}
                      placeholder="e.g. WELCOME"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white text-center tracking-widest uppercase font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <button 
                    onClick={handleRedeemCode}
                    disabled={!codeScan.trim()}
                    className={`
                      w-full py-4 rounded-lg font-bold text-lg uppercase tracking-widest transition-all
                      flex items-center justify-center gap-2
                      bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    Redeem
                  </button>
                </div>

                <div className="mt-8">
                  <h4 className="text-xs uppercase font-bold text-slate-500 mb-2 text-center">Hints</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="text-xs bg-black/20 px-2 py-1 rounded text-slate-600">Start</span>
                    <span className="text-xs bg-black/20 px-2 py-1 rounded text-slate-600">The Forge</span>
                    <span className="text-xs bg-black/20 px-2 py-1 rounded text-slate-600">Legend</span>
                    <span className="text-xs bg-black/20 px-2 py-1 rounded text-slate-600">Ultimate</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: STATS --- */}
          {activeTab === 'stats' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl fantasy-font text-emerald-400 mb-8 border-b border-slate-800 pb-4">Forge Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-lg font-bold text-slate-400 mb-2">Total Rolls Session</h3>
                  <p className="text-4xl font-bold text-white">{rollHistory.length}</p>
                </div>
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-lg font-bold text-slate-400 mb-2">Highest Rarity Owned</h3>
                  <p className="text-2xl font-bold text-amber-400">
                    {Array.from(ownedRaceIds).map(id => races.find(r => r.id === id)).reduce((prev, current) => {
                        const pRank = RARITY_POWER[prev?.rarity || Rarity.COMMON];
                        const cRank = RARITY_POWER[current?.rarity || Rarity.COMMON];
                        return cRank > pRank ? current : prev;
                    }, INITIAL_RACES[0])?.rarity}
                  </p>
                </div>
              </div>

              <StatsChart races={races} />

              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Roll History</h3>
                <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800">
                  {rollHistory.map((race, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/50">
                      <span className={`font-bold ${
                        race.rarity === Rarity.MYTHICAL ? 'text-rose-500' : 
                        race.rarity === Rarity.LEGENDARY ? 'text-amber-400' : 'text-slate-300'
                      }`}>{race.name}</span>
                      <span className="text-xs uppercase px-2 py-1 rounded bg-slate-950 text-slate-500">{race.rarity}</span>
                    </div>
                  ))}
                  {rollHistory.length === 0 && <div className="p-4 text-center text-slate-500">No history available</div>}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <style>{`
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          transition: all 0.2s;
          color: #94a3b8;
        }
        .nav-btn:hover {
          background-color: #1e293b;
          color: #cbd5e1;
        }
        .active-nav {
          background-color: #d97706;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        button[onClick*='adventure'].active-nav { background-color: #dc2626; }
        button[onClick*='collection'].active-nav { background-color: #4f46e5; }
        button[onClick*='hero'].active-nav { background-color: #2563eb; }
        button[onClick*='codes'].active-nav { background-color: #059669; }
        button[onClick*='stats'].active-nav { background-color: #10b981; }
        button[onClick*='shop'].active-nav { background-color: #ca8a04; }
        button[onClick*='fusion'].active-nav { background-color: #9333ea; }
        
        .stat-box {
          background: rgba(0,0,0,0.3);
          border: 1px solid;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;