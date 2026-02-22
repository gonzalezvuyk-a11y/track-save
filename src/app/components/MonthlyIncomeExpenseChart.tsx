import {
  Area,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatNumberWithDots } from '../lib/finance';

type ChartDatum = {
  day: string;
  income: number;
  expenses: number;
  balance: number;
};

export function MonthlyIncomeExpenseChart({
  chartData,
  currency,
}: {
  chartData: ChartDatum[];
  currency: string;
}) {
  const maxAbsValue = chartData.reduce((max, item) => Math.max(max, Math.abs(item.balance)), 0);
  const maxValueLabel = formatNumberWithDots(maxAbsValue);
  const yAxisWidth = Math.max(64, Math.min(112, maxValueLabel.length * 9 + 20));
  const latestBalance = chartData[chartData.length - 1]?.balance ?? 0;
  const isNegative = latestBalance < 0;
  const alertColor = 'color-mix(in srgb, var(--destructive) 78%, var(--primary) 22%)';
  const lineColor = isNegative ? alertColor : 'var(--primary)';

  const formatCompact = (value: number) =>
    new Intl.NumberFormat('es-PY', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);

  return (
    <div
      className="h-[250px] w-full p-3 sm:p-4 glass rounded-3xl border border-border/30 bg-gradient-to-b from-card/95 to-card/70"
      style={{ ['--chart-breathe-glow' as string]: lineColor }}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/90">ANALYTICS</p>
        <p className={`text-2xl font-semibold tracking-tight ${isNegative ? '' : 'text-primary'}`} style={isNegative ? { color: alertColor } : undefined}>
          {latestBalance < 0 ? '-' : ''}
          {formatCompact(Math.abs(latestBalance))}
        </p>
      </div>
      <div className="h-[calc(100%-36px)]">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
        >
          <defs>
            <linearGradient id="balanceFillPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="balanceFillNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={alertColor} stopOpacity={0.22} />
              <stop offset="100%" stopColor={alertColor} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="currentColor" opacity={0.12} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            minTickGap={20}
            stroke="currentColor"
            opacity={0.55}
            tickFormatter={(value) => {
              const day = Number(value);
              if (day === 1 || day === 7 || day === 14 || day === 21 || day === 28) {
                return value;
              }
              return '';
            }}
          />
          <YAxis
            width={yAxisWidth}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            stroke="currentColor"
            opacity={0.55}
            tickFormatter={(value: number) => (value === 0 ? '0' : formatCompact(Math.abs(value)))}
          />
          <ReferenceLine y={0} stroke="currentColor" opacity={0.2} strokeDasharray="3 3" />
          <Tooltip
            formatter={(value, key) => {
              const typedValue = Number(value);
              if (key === 'balance') return [formatCurrency(typedValue, currency), 'Balance acumulado'];
              if (key === 'income') return [formatCurrency(typedValue, currency), 'Ingresos del día'];
              if (key === 'expenses') return [formatCurrency(typedValue, currency), 'Gastos del día'];
              return [formatCurrency(typedValue, currency), key];
            }}
            labelFormatter={(label) => `Día ${label}`}
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              backdropFilter: 'blur(20px)',
            }}
          />
          <Area
            dataKey="balance"
            type="monotone"
            fill={isNegative ? 'url(#balanceFillNegative)' : 'url(#balanceFillPositive)'}
            stroke="none"
            isAnimationActive
            animationBegin={0}
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Line
            className="chart-breathe-line"
            dataKey="balance"
            type="monotone"
            stroke={lineColor}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4.5, fill: 'var(--background)', stroke: lineColor, strokeWidth: 2.5 }}
            isAnimationActive
            animationBegin={120}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
