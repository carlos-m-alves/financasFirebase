import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '../../utils/format';

const COLORS = ['#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#ba68c8', '#4dd0e1', '#aed581', '#ff8a65', '#90a4ae', '#7986cb'];

export default function PortfolioPieChart({ data }) {
  if (!data?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="ticker"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `R$ ${formatNumber(v)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
