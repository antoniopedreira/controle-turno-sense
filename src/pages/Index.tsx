import { useState, useMemo } from "react";
import { Users, UserCheck, AlertTriangle, Clock, Filter, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader, FilterPeriod } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertList } from "@/components/dashboard/AlertList";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ProfessorRanking } from "@/components/dashboard/ProfessorRanking";
import { ClassTypeFilter } from "@/components/dashboard/ClassTypeFilter";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";
import { TimeFilter } from "@/components/dashboard/TimeFilter";
import { FullHistoryDialog } from "@/components/dashboard/FullHistoryDialog";
import { startOfMonth, endOfMonth, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DateRange } from "react-day-picker";
import type { PerformanceHorario, ProfessorRanking as ProfessorRankingType } from "@/data/mockDashboardData";

interface PresencaRaw {
  id: string;
  data_aula: string;
  horario: string;
  arena: string;
  tipo_aula: string;
  professores: string;
  aluno: string;
  coordenador: string;
}

export interface AulaAgrupada {
  aula_id: string;
  data_aula: string;
  data_iso: string;
  horario: string;
  tipo_aula: string;
  professores: string;
  qtd_alunos: number;
  qtd_professores: number;
  razao_aluno_prof: number;
  status_aula: string;
  cor_indicadora: string;
  coordenador: string;
  lista_alunos: string[];
}

const Index = () => {
  const today = new Date();

  // Filtros
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  const [selectedClassType, setSelectedClassType] = useState<string>("all");
  const [selectedTime, setSelectedTime] = useState<string>("all");

  // Estado visual dos filtros retráteis
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);

  // Busca dados
  const {
    data: rawData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["controle_presenca_raw"],
    queryFn: async () => {
      const { data, error } = await supabase.from("controle_presenca").select("*");
      if (error) throw error;
      return data as PresencaRaw[];
    },
  });

  // Processamento Mestre
  const dashboardData = useMemo(() => {
    if (!rawData) return [];

    const aulasMap = new Map<
      string,
      {
        ids: string[];
        raw: PresencaRaw;
        count: number;
        alunos: string[];
        normalizedTime: string;
      }
    >();

    rawData.forEach((row) => {
      if (!row.data_aula) return;

      let rowDate: Date;
      try {
        rowDate = parse(row.data_aula, "dd/MM/yyyy", new Date());
      } catch (e) {
        return;
      }

      if (dateRange?.from && dateRange?.to) {
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to);
        if (!isWithinInterval(rowDate, { start, end })) return;
      }

      // Normalização de Hora
      const rawHour = row.horario ? row.horario.replace(/h/gi, "").split(":")[0] : "00";
      const normalizedTime = rawHour.padStart(2, "0") + "h";

      const key = `${row.data_aula}-${normalizedTime}-${row.arena}-${row.tipo_aula}-${row.professores}`;

      if (!aulasMap.has(key)) {
        aulasMap.set(key, { ids: [], raw: row, count: 0, alunos: [], normalizedTime });
      }

      const entry = aulasMap.get(key)!;
      entry.ids.push(row.id);
      entry.count += 1;
      if (row.aluno) entry.alunos.push(row.aluno);
    });

    const aulasProcessadas: AulaAgrupada[] = [];

    aulasMap.forEach((entry, key) => {
      const { raw, count, alunos, normalizedTime } = entry;

      const profsList = raw.professores ? raw.professores.split(/,\s*|\s+e\s+/).filter((p) => p.trim().length > 0) : [];
      const qtdProfs = profsList.length || 1;

      const razao = Number((count / qtdProfs).toFixed(2));

      let status = "⚪ Analisar";
      let cor = "#eab308";
      const isVip = raw.tipo_aula?.toUpperCase().includes("VIP");

      if (isVip) {
        if (razao < 2) {
          status = "🔴 Prejuízo";
          cor = "#ef4444";
        } else {
          status = "🟢 Lucrativa";
          cor = "#22c55e";
        }
      } else {
        if (razao < 3) {
          status = "🔴 Baixa Adesão";
          cor = "#ef4444";
        } else if (razao >= 3 && razao < 5) {
          status = "🟡 Normal";
          cor = "#eab308";
        } else {
          status = "🟢 Super Lotada";
          cor = "#22c55e";
        }
      }

      aulasProcessadas.push({
        aula_id: key,
        data_aula: raw.data_aula,
        data_iso: parse(raw.data_aula, "dd/MM/yyyy", new Date()).toISOString(),
        horario: normalizedTime,
        tipo_aula: raw.tipo_aula || "Geral",
        professores: raw.professores,
        qtd_alunos: count,
        qtd_professores: qtdProfs,
        razao_aluno_prof: razao,
        status_aula: status,
        cor_indicadora: cor,
        coordenador: raw.coordenador || "Não informado",
        lista_alunos: alunos,
      });
    });

    return aulasProcessadas;
  }, [rawData, dateRange]);

  // Listas para Filtros
  const availableTimes = useMemo(() => {
    if (!dashboardData) return [];
    const times = new Set<string>();
    dashboardData.forEach((aula) => times.add(aula.horario));
    return Array.from(times).sort();
  }, [dashboardData]);

  const classTypes = useMemo(() => {
    if (!dashboardData) return [];
    const types = new Set<string>();
    dashboardData.forEach((aula) => {
      if (aula.tipo_aula) types.add(aula.tipo_aula);
    });
    return Array.from(types).sort();
  }, [dashboardData]);

  const getColorByMeta = (razao: number, isVip: boolean): "red" | "yellow" | "green" => {
    if (isVip) {
      if (razao > 2) return "green";
      if (razao === 2) return "yellow";
      return "red";
    } else {
      if (razao < 3) return "red";
      if (razao >= 3 && razao <= 4) return "yellow";
      return "green";
    }
  };

  const metaValue = selectedClassType.toLowerCase() === "vip" ? 2 : 3;
  const handleRefresh = () => refetch();

  // FILTRAGEM GLOBAL
  const processedData = useMemo(() => {
    let data = dashboardData || [];

    if (selectedClassType !== "all") {
      data = data.filter((aula) => aula.tipo_aula === selectedClassType);
    }

    if (selectedTime !== "all") {
      data = data.filter((aula) => aula.horario === selectedTime);
    }

    return data;
  }, [dashboardData, selectedClassType, selectedTime]);

  const isVipFilter = selectedClassType.toLowerCase() === "vip";

  // KPIS
  const totalAlunos = processedData.reduce((acc, aula) => acc + (aula.qtd_alunos || 0), 0);
  const totalHorasPagas = processedData.reduce((acc, aula) => acc + (aula.qtd_professores || 0), 0);
  const totalRazao = processedData.reduce((acc, aula) => acc + (aula.razao_aluno_prof || 0), 0);
  const mediaAlunosPorProfessor = processedData.length > 0 ? totalRazao / processedData.length : 0;

  // KPI Total de Aulas
  const totalAulas = processedData.length;

  const aulasEmAlerta = processedData
    .filter((aula) => aula.status_aula?.includes("🔴"))
    .map((aula) => ({
      id: aula.aula_id,
      data: aula.data_aula,
      horario: aula.horario,
      professores: aula.professores,
      qtdAlunos: aula.qtd_alunos,
      status: aula.status_aula,
      corIndicadora: aula.cor_indicadora as "red" | "yellow" | "green",
      tipo: aula.tipo_aula,
      coordenador: aula.coordenador,
      listaAlunos: aula.lista_alunos,
    }));

  const horarioMap = new Map<string, { total: number; count: number }>();
  processedData.forEach((aula) => {
    if (!aula.horario) return;
    const hora = aula.horario;
    const existing = horarioMap.get(hora) || { total: 0, count: 0 };
    horarioMap.set(hora, { total: existing.total + (aula.razao_aluno_prof || 0), count: existing.count + 1 });
  });

  const performanceHorario: PerformanceHorario[] = Array.from(horarioMap.entries())
    .map(([horario, data]) => ({
      horario,
      mediaAlunos: data.count > 0 ? data.total / data.count : 0,
      corIndicadora: getColorByMeta(data.count > 0 ? data.total / data.count : 0, isVipFilter),
    }))
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const professorMap = new Map<string, number>();
  processedData.forEach((aula) => {
    if (!aula.professores) return;
    const profs = aula.professores.split(",").map((p) => p.trim());
    profs.forEach((prof) => {
      if (prof) professorMap.set(prof, (professorMap.get(prof) || 0) + (aula.qtd_alunos || 0));
    });
  });

  const professorRanking: ProfessorRankingType[] = Array.from(professorMap.entries())
    .map(([nome, totalAlunos]) => ({ nome, totalAlunos }))
    .sort((a, b) => b.totalAlunos - a.totalAlunos)
    .slice(0, 5);

  const getMediaStatus = (media: number) => {
    if (isVipFilter) {
      if (media < 2) return "danger";
      if (media > 2) return "success";
      return "warning";
    }
    if (media < 3) return "danger";
    if (media > 5) return "success";
    return "warning";
  };

  const getMetaText = () => {
    if (isVipFilter) return mediaAlunosPorProfessor < 2 ? "Abaixo do ideal! Meta: 2+" : "Dentro da meta";
    return mediaAlunosPorProfessor < 3 ? "Abaixo do ideal! Meta: 3+" : "Dentro da meta";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          onRefresh={handleRefresh}
          isLoading={isLoading}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          filterPeriod={filterPeriod}
          onFilterPeriodChange={setFilterPeriod}
        />

        {/* === ZONA DE FILTROS RETRÁTEIS === */}
        <div className="mb-6 flex flex-wrap items-center gap-4 animate-fade-in">
          {/* 1. Filtro Tipo de Aula */}
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border transition-all duration-300">
            <Button
              variant={isTypeFilterOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
              className="gap-2 h-9"
            >
              <Filter className="w-4 h-4 text-primary" />
              {/* Nome só aparece se fechado */}
              {!isTypeFilterOpen && <span className="font-medium">Tipo de Aula</span>}

              {selectedClassType !== "all" && !isTypeFilterOpen && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {selectedClassType}
                </Badge>
              )}
            </Button>

            {/* Conteúdo Retrátil:
              - max-w-[800px] permite expandir até esse tamanho (cobre telas normais)
              - se a tela acabar antes, o ScrollArea dentro cuidará do scroll
            */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isTypeFilterOpen ? "max-w-[800px] opacity-100" : "max-w-0 opacity-0"}`}
            >
              <div className="min-w-0 max-w-[85vw] md:max-w-lg">
                {" "}
                {/* Limite responsivo */}
                <ClassTypeFilter
                  classTypes={classTypes}
                  selectedType={selectedClassType}
                  onTypeChange={setSelectedClassType}
                />
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* 2. Filtro Horários */}
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border transition-all duration-300">
            <Button
              variant={isTimeFilterOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
              className="gap-2 h-9"
            >
              <Clock className="w-4 h-4 text-primary" />
              {/* Nome só aparece se fechado */}
              {!isTimeFilterOpen && <span className="font-medium">Horários</span>}

              {selectedTime !== "all" && !isTimeFilterOpen && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {selectedTime}
                </Badge>
              )}
            </Button>

            {/* Conteúdo Retrátil */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isTimeFilterOpen ? "max-w-[800px] opacity-100" : "max-w-0 opacity-0"}`}
            >
              <div className="min-w-0 max-w-[85vw] md:max-w-lg">
                <TimeFilter times={availableTimes} selectedTime={selectedTime} onTimeChange={setSelectedTime} />
              </div>
            </div>
          </div>
        </div>
        {/* ================================= */}

        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            <KPICard
              label="Total de Alunos"
              value={totalAlunos}
              icon={<Users className="w-6 h-6" />}
              status="neutral"
              subtitle="Alunos no período"
              delay={0}
            />

            <KPICard
              label="Horas Pagas"
              value={totalHorasPagas}
              icon={<Clock className="w-6 h-6" />}
              status="neutral"
              subtitle="Total horas de aula"
              delay={50}
            />

            <KPICard
              label="Total de Aulas"
              value={totalAulas}
              icon={<Calendar className="w-6 h-6" />}
              status="neutral"
              subtitle="Turmas realizadas"
              delay={75}
            />

            <KPICard
              label="Média Alunos/Professor"
              value={mediaAlunosPorProfessor.toFixed(1)}
              icon={<UserCheck className="w-6 h-6" />}
              status={getMediaStatus(mediaAlunosPorProfessor)}
              subtitle={getMetaText()}
              delay={100}
            />

            <KPICard
              label="Aulas em Alerta"
              value={aulasEmAlerta.length}
              icon={<AlertTriangle className="w-6 h-6" />}
              status={aulasEmAlerta.length > 0 ? "danger" : "success"}
              subtitle={aulasEmAlerta.length > 0 ? "Precisam de atenção" : "Nenhum alerta!"}
              delay={200}
            />
          </div>
        </section>

        <section className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div />
            <FullHistoryDialog aulas={processedData} />
          </div>
          <AlertList aulas={aulasEmAlerta as any} />
        </section>

        <section className="mb-8">
          <DailyEvolutionChart
            data={rawData || []}
            isLoading={isLoading}
            classType={selectedClassType}
            selectedTime={selectedTime}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart data={performanceHorario} metaValue={metaValue} isVipFilter={isVipFilter} />
          <ProfessorRanking data={professorRanking} />
        </section>
      </div>
    </div>
  );
};

export default Index;
