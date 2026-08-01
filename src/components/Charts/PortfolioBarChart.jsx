import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatNumber, formatPercent } from '../../utils/format';

const COLORS = ['#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#ba68c8', '#4dd0e1', '#aed581', '#ff8a65', '#90a4ae', '#7986cb'];

const tooltipStyle = {
  background: '#1a1a2e',
  border: '1px solid #2a2a3e',
  borderRadius: 8,
  fontSize: '0.85rem',
};

export default function PortfolioBarChart({ data, sortBy = 'valueDesc' }) {
  if (!data?.length) return null;

  const sorted = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'valueAsc':
        return a.value - b.value;
      case 'alpha':
        return a.ticker.localeCompare(b.ticker);
      case 'profitDesc':
        return (b.profitPercent ?? -Infinity) - (a.profitPercent ?? -Infinity);
      case 'profitAsc':
        return (a.profitPercent ?? -Infinity) - (b.profitPercent ?? -Infinity);
      default:
        return b.value - a.value;
    }
  });
  const total = sorted.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 26)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="ticker" width={70} tick={{ fontSize: 12, fill: '#b0b0b0' }} />
        <Tooltip
          formatter={(v) => `R$ ${formatNumber(v)} (${formatPercent(total > 0 ? (v / total) * 100 : 0)})`}
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#888', fontWeight: 600 }}
          itemStyle={{ color: '#fff' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Valor Atual">
          {sorted.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
