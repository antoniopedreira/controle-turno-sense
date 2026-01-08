import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProfessorRanking as ProfessorRankingType } from '@/data/mockDashboardData';
import { Trophy } from 'lucide-react';

interface ProfessorRankingProps {
  data: ProfessorRankingType[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-foreground">{payload[0].payload.nome}</p>
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-bold text-primary">{payload[0].value}</span> alunos
        </p>
      </div>
    );
  }
  return null;
};

const getMedalColor = (index: number) => {
  switch (index) {
    case 0:
      return 'hsl(45, 93%, 47%)'; // Gold
    case 1:
      return 'hsl(0, 0%, 70%)'; // Silver
    case 2:
      return 'hsl(30, 50%, 50%)'; // Bronze
    default:
      return 'hsl(217, 91%, 60%)'; // Primary
  }
};

export function ProfessorRanking({ data }: ProfessorRankingProps) {
  // Pegar apenas os top 5
  const top5 = data.slice(0, 5).reverse(); // Reverse para mostrar do menor para maior no gráfico horizontal

  return (
    <div className="dashboard-section opacity-0 animate-fade-in" style={{ animationDelay: '600ms' }}>
      <h2 className="section-title">
        <Trophy className="w-5 h-5 text-warning" />
        Ranking de Professores
      </h2>
      <p className="section-subtitle mb-4">
        Top 5 professores com mais alunos no período
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={top5} 
            layout="vertical"
            margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
          >
            <XAxis 
              type="number" 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
            />
            <YAxis 
              type="category" 
              dataKey="nome" 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(217, 33%, 17%, 0.3)' }} />
            <Bar 
              dataKey="totalAlunos" 
              radius={[0, 4, 4, 0]}
              maxBarSize={35}
            >
              {top5.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getMedalColor(top5.length - 1 - index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
