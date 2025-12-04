import React from 'react';
import { Item, Rarity } from '../types';
import { RARITY_COLORS } from '../constants';
import { Sword, Shield, Gem, Coins } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  isEquipped?: boolean;
  onAction?: (item: Item) => void;
  actionLabel?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'weapon': return <Sword className="w-4 h-4" />;
    case 'armor': return <Shield className="w-4 h-4" />;
    case 'accessory': return <Gem className="w-4 h-4" />;
    default: return null;
  }
};

const ItemCard: React.FC<ItemCardProps> = ({ item, isEquipped, onAction, actionLabel }) => {
  return (
    <div className={`relative p-3 rounded-lg border ${RARITY_COLORS[item.rarity]} flex flex-col gap-2 transition-all hover:bg-opacity-40`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-black/40 rounded">
            {getTypeIcon(item.type)}
          </div>
          <div>
            <div className="font-bold text-sm text-white/90">{item.name}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">{item.rarity} {item.type}</div>
          </div>
        </div>
        {isEquipped && (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/50">
            Equipped
          </span>
        )}
      </div>

      <p className="text-xs italic opacity-60 line-clamp-1">{item.description}</p>
      
      <div className="grid grid-cols-2 gap-1 text-xs">
        {item.stats.attack && <span className="text-red-300">ATK +{item.stats.attack}</span>}
        {item.stats.defense && <span className="text-blue-300">DEF +{item.stats.defense}</span>}
        {item.stats.speed && <span className="text-yellow-300">SPD {item.stats.speed > 0 ? '+' : ''}{item.stats.speed}</span>}
        {item.stats.health && <span className="text-green-300">HP +{item.stats.health}</span>}
        {item.stats.luck && <span className="text-purple-300">LUCK +{item.stats.luck}</span>}
      </div>

      <div className="flex justify-between items-end mt-auto pt-2">
         <div className="text-[10px] text-amber-200 flex items-center gap-1">
            <Coins className="w-3 h-3" /> {item.value}
         </div>
         {onAction && (
           <button 
             onClick={(e) => { e.stopPropagation(); onAction(item); }}
             className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-600 transition-colors"
           >
             {actionLabel}
           </button>
         )}
      </div>
    </div>
  );
};

export default ItemCard;