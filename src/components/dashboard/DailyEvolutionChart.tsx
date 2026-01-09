import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  parse, 
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface PresencaRaw {
  id: string;
  data_aula: string;
  horario: string;
  arena: string;
  tipo_aula: string;
  professores: string;
  aluno: string;
}

interface DailyEvolutionChartProps {
  data: PresencaRaw[];
  isLoading?: boolean;
}

export function DailyEvolutionChart({ data, isLoading }: DailyEvolutionChartProps) {
  // Estado local para o mês selecionado (independente do filtro global)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  // Processamento dos dados para o gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // 1. Agrupar dados brutos por Aula (para contar professores corretamente)
    // Chave: Data + Horario + Arena + Professores
    const aulasMap = new Map<string, {
      date: Date;
      professores: string;
      studentCount: number;
    }>();

    data.forEach(row => {
      if (!row.data_aula) return;
      
      let rowDate: Date;
      try {
        rowDate = parse(row.data_aula, 'dd/MM/yyyy', new Date());
      } catch (e) {
        return;
      }

      // Filtrar apenas dados do mês selecionado
      if (!isWithinInterval(rowDate, { start: startOfDay(monthStart), end: endOfDay(monthEnd) })) {
        return;
      }

      // Chave única para identificar a turma
      const key = `${row.data_aula}-${row.horario}-${row.arena}-${row.professores}-${row.tipo_aula}`;
      
      if (!aulasMap.has(key)) {
        aulasMap.set(key, {
          date: rowDate,
          professores: row.professores,
          studentCount: 0
        });
      }
      
      const entry = aulasMap.get(key)!;
      entry.studentCount += 1;
    });

    // 2. Agrupar por Dia do Mês
    const daysMap = new Map<string, {
      day: string;
      date: Date;
      totalAlunos: number;
      totalHoras: number;
    }>();

    // Inicializar todos os dias do mês com zero
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    daysInMonth.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      daysMap.set(dayKey, {
        day: format(day, 'dd'),
        date: day,
        totalAlunos: 0,
        totalHoras: 0
      });
    });

    // Preencher com os dados calculados
    aulasMap.forEach((aula) => {
      const dayKey = format(aula.date, 'yyyy-MM-dd');
      const dayEntry = daysMap.get(dayKey);
      
      if (dayEntry) {
        // Alunos: Soma a contagem de alunos da turma
        dayEntry.totalAlunos += aula.studentCount;

        // Horas Pagas: Conta quantos professores deram essa aula
        // Usa a mesma lógica corrigida (separar por vírgula ou " e ")
        const profsList = aula.professores 
          ? aula.professores.split(/,\s*|\s+e\s+/).filter(p => p.trim().length > 0) 
          : [];
        const qtdProfs = profsList.length || 1;
        
        dayEntry.totalHoras += qtdProfs;
      }
    });

    return Array.from(daysMap.values());
  }, [data, currentMonth]);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Evolução Diária
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparativo de Alunos vs. Horas Pagas por dia
          </p>
        </div>
        
        {/* Controles de Navegação de Mês */}
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium w-32 text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[350px] w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-lg animate-pulse">
              <span className="text-muted-foreground">Carregando dados...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-lg">
              <span className="text-muted-foreground">Sem dados para este mês</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12}
                  label={{ value: 'Alunos', angle: -90, position: 'insideLeft', style: { fill: '#22c55e', fontSize: 10 } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12}
                  label={{ value: 'Horas Pagas', angle: 90, position: 'insideRight', style: { fill: '#3b82f6', fontSize: 10 } }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                  labelFormatter={(label) => `Dia ${label}`}
                />
                <Legend />
                
                {/* Barra: Número de Alunos */}
                <Bar 
                  yAxisId="left"
                  dataKey="totalAlunos" 
                  name="Alunos" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                  fillOpacity={0.8}
                />
                
                {/* Linha: Horas Pagas */}
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="totalHoras" 
                  name="Horas Pagas" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
