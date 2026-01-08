import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { PerformanceHorario } from '@/data/mockDashboardData';
import { TrendingUp } from 'lucide-react';

interface PerformanceChartProps {
  data: PerformanceHorario[];
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const status = value < 3 ? 'Prejuízo' : value < 5 ? 'Atenção' : 'Lucro';
    
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          Média: <span className="font-bold text-foreground">{value.toFixed(1)}</span> alunos/prof
        </p>
        <p className="text-xs mt-1" style={{ color: getBarColor(payload[0].payload.corIndicadora) }}>
          {status}
        </p>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ data }: PerformanceChartProps) {
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(217, 33%, 17%, 0.3)' }} />
            <ReferenceLine 
              y={3} 
              stroke="hsl(0, 84%, 60%)" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: 'Meta Mínima (3)', 
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
