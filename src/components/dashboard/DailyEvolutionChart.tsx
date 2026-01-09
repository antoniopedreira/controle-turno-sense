import { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parse,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

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
  classType: string;
  selectedTime: string; // [NOVO] Prop para filtro de horário
}

export function DailyEvolutionChart({ data, isLoading, classType, selectedTime }: DailyEvolutionChartProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const isVip = classType.toLowerCase() === "vip";

  const getBarColor = (razao: number) => {
    if (isVip) {
      if (razao > 2) return "#22c55e";
      if (razao === 2) return "#eab308";
      return "#ef4444";
    } else {
      if (razao < 3) return "#ef4444";
      if (razao >= 3 && razao < 5) return "#eab308";
      return "#22c55e";
    }
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // 1. Agrupar dados por Aula
    const aulasMap = new Map<
      string,
      {
        date: Date;
        professores: string;
        studentCount: number;
      }
    >();

    data.forEach((row) => {
      if (!row.data_aula || !row.horario) return;

      // Filtro de Tipo
      if (classType !== "all" && row.tipo_aula !== classType) {
        return;
      }

      // [NOVO] Filtro de Horário (com normalização)
      // Normaliza "5:00" ou "05h" para "05h" para comparar
      const rawHour = row.horario.replace(/h/gi, "").split(":")[0];
      const normalizedRowTime = rawHour.padStart(2, "0") + "h";

      if (selectedTime !== "all" && normalizedRowTime !== selectedTime) {
        return;
      }

      let rowDate: Date;
      try {
        rowDate = parse(row.data_aula, "dd/MM/yyyy", new Date());
      } catch (e) {
        return;
      }

      if (!isWithinInterval(rowDate, { start: startOfDay(monthStart), end: endOfDay(monthEnd) })) {
        return;
      }

      const key = `${row.data_aula}-${row.horario}-${row.arena}-${row.professores}-${row.tipo_aula}`;

      if (!aulasMap.has(key)) {
        aulasMap.set(key, {
          date: rowDate,
          professores: row.professores,
          studentCount: 0,
        });
      }

      const entry = aulasMap.get(key)!;
      entry.studentCount += 1;
    });

    // 2. Agrupar por Dia
    const daysMap = new Map<
      string,
      {
        day: string;
        fullDate: string;
        totalAlunos: number;
        totalHoras: number;
        razaoDia: number;
        barColor: string;
      }
    >();

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    daysInMonth.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      daysMap.set(dayKey, {
        day: format(day, "dd"),
        fullDate: format(day, "dd/MM"),
        totalAlunos: 0,
        totalHoras: 0,
        razaoDia: 0,
        barColor: "#eab308",
      });
    });

    aulasMap.forEach((aula) => {
      const dayKey = format(aula.date, "yyyy-MM-dd");
      const dayEntry = daysMap.get(dayKey);

      if (dayEntry) {
        dayEntry.totalAlunos += aula.studentCount;

        const profsList = aula.professores
          ? aula.professores.split(/,\s*|\s+e\s+/).filter((p) => p.trim().length > 0)
          : [];
        const qtdProfs = profsList.length || 1;

        dayEntry.totalHoras += qtdProfs;
      }
    });

    daysMap.forEach((entry) => {
      if (entry.totalHoras > 0) {
        entry.razaoDia = Number((entry.totalAlunos / entry.totalHoras).toFixed(2));
        entry.barColor = getBarColor(entry.razaoDia);
      } else {
        entry.barColor = "#e2e8f0";
      }
    });

    return Array.from(daysMap.values());
  }, [data, currentMonth, classType, selectedTime]); // [NOVO] Dependência selectedTime

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Evolução Diária
            {selectedTime !== "all" && <span className="text-primary text-sm ml-2">({selectedTime})</span>}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Alunos vs. Horas Pagas</p>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-32 text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
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
                <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  label={{
                    value: "Alunos",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#64748b", fontSize: 10 },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  label={{
                    value: "Horas Pagas",
                    angle: 90,
                    position: "insideRight",
                    style: { fill: "#3b82f6", fontSize: 10 },
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                  labelFormatter={(label, payload) =>
                    payload && payload.length > 0 ? `Dia ${payload[0].payload.fullDate}` : `Dia ${label}`
                  }
                  formatter={(value: any, name: any, props: any) => {
                    if (name === "Alunos") return [value, `Alunos (Média: ${props.payload.razaoDia.toFixed(2)})`];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="totalAlunos"
                  name="Alunos"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  fillOpacity={0.9}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.barColor} />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalHoras"
                  name="Horas Pagas"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 2, fill: "#3b82f6", strokeWidth: 1, stroke: "#fff" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
