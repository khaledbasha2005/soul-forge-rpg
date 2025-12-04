import React from 'react';
import { Race, Rarity } from '../types';
import { RARITY_COLORS, RARITY_BG_GLOW } from '../constants';
import { Shield, Zap, Sparkles, Skull, Crown, Ghost, Lock, Check } from 'lucide-react';

interface RaceCardProps {
  race: Race;
  animate?: boolean;
  isOwned?: boolean;
  isEquipped?: boolean;
  onEquip?: (race: Race) => void;
}

const getIcon = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.COMMON: return <Shield className="w-6 h-6" />;
    case Rarity.UNCOMMON: return <Zap className="w-6 h-6" />;
    case Rarity.RARE: return <Skull className="w-6 h-6" />;
    case Rarity.EPIC: return <Ghost className="w-6 h-6" />;
    case Rarity.LEGENDARY: return <Crown className="w-6 h-6" />;
    case Rarity.MYTHICAL: return <Sparkles className="w-6 h-6" />;
  }
};

const RaceCard: React.FC<RaceCardProps> = ({ race, animate = false, isOwned = true, isEquipped = false, onEquip }) => {
  const colorClass = isOwned ? RARITY_COLORS[race.rarity] : 'text-slate-600 border-slate-800 bg-slate-900/20';
  const glowClass = isOwned ? RARITY_BG_GLOW[race.rarity] : 'shadow-none';

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-500
        ${colorClass} ${glowClass} shadow-lg backdrop-blur-md
        ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-90 hover:scale-100 hover:opacity-100'}
        ${race.rarity === Rarity.MYTHICAL && isOwned ? 'mythical-glow border-opacity-80' : ''}
        ${!isOwned ? 'grayscale opacity-70' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-black/20 ${race.rarity === Rarity.MYTHICAL && isOwned ? 'animate-bounce' : ''}`}>
            {isOwned ? getIcon(race.rarity) : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-2xl font-bold fantasy-font tracking-wide">{race.name}</h3>
            <span className="text-xs uppercase font-bold tracking-widest opacity-80">{race.rarity}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-mono font-bold">{race.chance}%</span>
          <p className="text-xs opacity-60">Drop Rate</p>
        </div>
      </div>

      {race.description && (
        <p className="mb-4 text-sm italic opacity-80 border-l-2 border-current pl-3">
          "{race.description}"
        </p>
      )}

      <div className="space-y-3">
        {race.traits.map((trait, idx) => (
          <div key={idx} className="bg-black/20 rounded p-3">
            <span className="font-bold block text-sm mb-1 text-white/90">{trait.name}</span>
            <span className="text-sm opacity-80 leading-relaxed">{trait.description}</span>
          </div>
        ))}
      </div>
      
      {isEquipped && (
        <div className="absolute top-4 right-4 bg-green-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-10">
          <Check className="w-3 h-3" /> EQUIPPED
        </div>
      )}

      {isOwned && !isEquipped && onEquip && (
        <button 
          onClick={() => onEquip(race)}
          className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-sm font-bold uppercase tracking-wider transition-colors"
        >
          Equip Race
        </button>
      )}
      
      {race.isCustom && (
        <div className="absolute top-0 right-0 p-1 bg-indigo-600 text-[10px] rounded-bl-lg font-bold text-white">
          CUSTOM
        </div>
      )}
    </div>
  );
};

export default RaceCard;