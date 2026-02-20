import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../lib/finance';

type ChartDatum = {
  name: string;
  Ingresos: number;
  Gastos: number;
};

export function MonthlyIncomeExpenseChart({
  chartData,
  currency,
}: {
  chartData: ChartDatum[];
  currency: string;
}) {
  return (
    <div className="h-[200px] w-full p-4 glass rounded-3xl border border-border/30">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis dataKey="name" stroke="currentColor" opacity={0.5} />
          <YAxis stroke="currentColor" opacity={0.5} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              backdropFilter: 'blur(20px)',
            }}
          />
          <Legend />
          <Bar dataKey="Ingresos" fill="#059669" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Gastos" fill="#e11d48" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
