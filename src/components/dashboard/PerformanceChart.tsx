import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { PerformanceHorario } from '@/data/mockDashboardData';
import { TrendingUp } from 'lucide-react';

interface PerformanceChartProps {
  data: PerformanceHorario[];
  metaValue?: number;
  isVipFilter?: boolean;
}

const getBarColor = (corIndicadora: 'red' | 'yellow' | 'green') => {
  switch (corIndicadora) {
    case 'red':
      return 'hsl(0, 84%, 60%)';
    case 'yellow':
      return 'hsl(38, 92%, 50%)';
    case 'green':
      return 'hsl(142, 71%, 45%)';
    default:
      return 'hsl(217, 91%, 60%)';
  }
};

const CustomTooltip = ({ active, payload, label, isVipFilter }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const corIndicadora = payload[0].payload.corIndicadora;
    
    const getStatusText = () => {
      if (isVipFilter) {
        if (value > 2) return 'Lucro';
        if (value === 2) return 'Atenção';
        return 'Prejuízo';
      }
      if (value < 3) return 'Prejuízo';
      if (value <= 4) return 'Atenção';
      return 'Lucro';
    };
    
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          Média: <span className="font-bold text-foreground">{value.toFixed(1)}</span> alunos/prof
        </p>
        <p className="text-xs mt-1" style={{ color: getBarColor(corIndicadora) }}>
          {getStatusText()}
        </p>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ data, metaValue = 3, isVipFilter = false }: PerformanceChartProps) {
  const metaLabel = isVipFilter ? `Meta VIP (${metaValue})` : `Meta Mínima (${metaValue})`;
  
  return (
    <div className="dashboard-section opacity-0 animate-fade-in" style={{ animationDelay: '500ms' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="section-title">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance por Horário
          </h2>
          <p className="section-subtitle">
            Barras <span className="text-danger font-medium">vermelhas</span> estão abaixo da meta. 
            Barras <span className="text-success font-medium">verdes</span> estão dando lucro.
            {isVipFilter && <span className="ml-1 text-primary">(Meta VIP: 2 alunos/prof)</span>}
          </p>
        </div>
      </div>

      <div className="h-80 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(217, 33%, 17%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="horario" 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
              label={{ 
                value: 'Alunos/Professor', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(215, 20%, 55%)', fontSize: 12 }
              }}
            />
            <Tooltip 
              content={<CustomTooltip isVipFilter={isVipFilter} />} 
              cursor={{ fill: 'hsl(217, 33%, 17%, 0.3)' }} 
            />
            <ReferenceLine 
              y={metaValue} 
              stroke="hsl(0, 84%, 60%)" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: metaLabel, 
                position: 'right',
                style: { fill: 'hsl(0, 84%, 60%)', fontSize: 11, fontWeight: 600 }
              }}
            />
            <Bar 
              dataKey="mediaAlunos" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.corIndicadora)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

