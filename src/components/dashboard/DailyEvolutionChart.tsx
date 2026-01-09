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
  selectedTime: string;
}

// --- CUSTOM TOOLTIP (Igual ao PerformanceChart) ---
const CustomTooltip = ({ active, payload, label, classType }: any) => {
  if (active && payload && payload.length > 0) {
    const dataItem = payload[0].payload;
    const totalAlunos = dataItem.totalAlunos;
    const totalHoras = dataItem.totalHoras;
    const razao = dataItem.razaoDia;
    const barColor = dataItem.barColor;

    const isVip = classType.toLowerCase() === "vip";

    const getStatusText = () => {
      // Se não houver horas pagas, não calculamos status
      if (totalHoras === 0) return "";

      if (isVip) {
        if (razao > 2) return "Lucro";
        if (razao === 2) return "Atenção";
        return "Prejuízo";
      }
      // Regra Geral
      if (razao < 3) return "Prejuízo";
      if (razao >= 3 && razao < 5) return "Atenção";
      return "Lucro";
    };

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl min-w-[150px]">
        <p className="font-semibold text-foreground mb-2">Dia {dataItem.fullDate}</p>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex justify-between">
            <span>Alunos:</span>
            <span className="font-bold text-foreground">{totalAlunos}</span>
          </p>
          <p className="text-sm text-muted-foreground flex justify-between">
            <span>Horas Pagas:</span>
            <span className="font-bold text-foreground">{totalHoras}</span>
          </p>
        </div>

        <div className="border-t border-border my-2 pt-2">
          <p className="text-sm text-muted-foreground">
            Média: <span className="font-bold text-foreground">{razao.toFixed(2)}</span> /prof
          </p>
          <p className="text-xs font-bold mt-1 uppercase" style={{ color: barColor }}>
            {getStatusText()}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function DailyEvolutionChart({ data, isLoading, classType, selectedTime }: DailyEvolutionChartProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const isVip = classType.toLowerCase() === "vip";

  // Lógica de Cores (Consistente com PerformanceChart)
  const getBarColor = (razao: number) => {
    if (isVip) {
      if (razao > 2) return "hsl(142, 71%, 45%)"; // green
      if (razao === 2) return "hsl(38, 92%, 50%)"; // yellow
      return "hsl(0, 84%, 60%)"; // red
    } else {
      if (razao < 3) return "hsl(0, 84%, 60%)"; // red
      if (razao >= 3 && razao < 5) return "hsl(38, 92%, 50%)"; // yellow
      return "hsl(142, 71%, 45%)"; // green
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

      // Filtro de Horário (com normalização)
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
        barColor: "hsl(217, 91%, 60%)", // default blueish
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
        entry.barColor = "hsl(215, 20%, 90%)"; // Cinza claro se sem dados
      }
    });

    return Array.from(daysMap.values());
  }, [data, currentMonth, classType, selectedTime]);

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
                    style: { fill: "hsl(215, 20%, 55%)", fontSize: 10 },
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
                    style: { fill: "hsl(217, 91%, 60%)", fontSize: 10 },
                  }}
                />

                {/* TOOLTIP ATUALIZADA AQUI */}
                <Tooltip
                  content={<CustomTooltip classType={classType} />}
                  cursor={{ fill: "hsl(217, 33%, 17%, 0.1)" }} // Cursor sutil
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
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={3}
                  dot={{ r: 2, fill: "hsl(217, 91%, 60%)", strokeWidth: 1, stroke: "#fff" }}
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
