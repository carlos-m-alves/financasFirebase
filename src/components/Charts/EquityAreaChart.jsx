import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatNumber } from '../../utils/format';

export default function EquityAreaChart({ data }) {
  if (!data?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#81c784" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#81c784" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
        <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
        <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${formatNumber(v, 0)}`} />
        <Tooltip formatter={(v) => `R$ ${formatNumber(v)}`} />
        <Area type="monotone" dataKey="invested" stroke="#4fc3f7" fill="url(#colorInvested)" name="Investido" />
        <Area type="monotone" dataKey="value" stroke="#81c784" fill="url(#colorValue)" name="Valor Atual" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
