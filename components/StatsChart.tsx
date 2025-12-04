import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Race, Rarity } from '../types';

interface StatsChartProps {
  races: Race[];
}

const RARITY_HEX_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: '#9ca3af',
  [Rarity.UNCOMMON]: '#4ade80',
  [Rarity.RARE]: '#60a5fa',
  [Rarity.EPIC]: '#c084fc',
  [Rarity.LEGENDARY]: '#fbbf24',
  [Rarity.MYTHICAL]: '#f43f5e',
};

const StatsChart: React.FC<StatsChartProps> = ({ races }) => {
  // Group by rarity for a cleaner chart
  const data = races.map(r => ({
    name: r.name,
    chance: r.chance,
    rarity: r.rarity
  })).sort((a, b) => b.chance - a.chance);

  return (
    <div className="h-[400px] w-full bg-slate-900/50 rounded-xl p-4 border border-slate-700">
      <h3 className="text-xl font-bold mb-4 text-center fantasy-font text-slate-200">Probability Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" stroke="#94a3b8" />
          <YAxis type="category" dataKey="name" width={100} stroke="#94a3b8" tick={{fontSize: 12}} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            cursor={{fill: 'rgba(255,255,255,0.05)'}}
          />
          <Bar dataKey="chance" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={RARITY_HEX_COLORS[entry.rarity]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;