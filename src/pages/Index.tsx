import { useState, useMemo } from "react";
import { Users, UserCheck, AlertTriangle, Clock, Filter, Calendar, X, ChevronDown, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader, FilterPeriod } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertList } from "@/components/dashboard/AlertList";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ProfessorRanking, ProfessorStats } from "@/components/dashboard/ProfessorRanking";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";
import { FullHistoryDialog } from "@/components/dashboard/FullHistoryDialog";
import { AIAnalysisDialog } from "@/components/dashboard/AIAnalysisDialog";
import { startOfMonth, endOfMonth, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DateRange } from "react-day-picker";
import type { PerformanceHorario } from "@/data/mockDashboardData";

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

  // Filtros de Data
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  // Filtros de Dados
  const [selectedClassType, setSelectedClassType] = useState<string>("all");
  const [selectedTime, setSelectedTime] = useState<string>("all");

  // Controle dos Dropdowns
  const [openFilter, setOpenFilter] = useState<"type" | "time" | null>(null);

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

  // --- PROCESSAMENTO DE DADOS ---
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

      // Excluir "Aulão" dos indicadores e gráficos
      if (row.tipo_aula?.toLowerCase() === "aulão") return;

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
        // VIP: Meta 2
        if (razao < 2) {
          status = "🔴 Prejuízo";
          cor = "#ef4444";
        } else {
          status = "🟢 Lucrativa";
          cor = "#22c55e";
        }
      } else {
        // GERAL: Meta 3
        if (razao < 3) {
          status = "🔴 Prejuízo";
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

  // Funções Auxiliares
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

  // Reset de Filtros
  const clearFilters = () => {
    setSelectedClassType("all");
    setSelectedTime("all");
    setOpenFilter(null);
  };

  const hasActiveFilters = selectedClassType !== "all" || selectedTime !== "all";

  // --- FILTRAGEM FINAL ---
  const processedData = useMemo(() => {
    let data = dashboardData || [];
    if (selectedClassType !== "all") data = data.filter((aula) => aula.tipo_aula === selectedClassType);
    if (selectedTime !== "all") data = data.filter((aula) => aula.horario === selectedTime);
    return data;
  }, [dashboardData, selectedClassType, selectedTime]);

  const isVipFilter = selectedClassType.toLowerCase() === "vip";

  // --- CÁLCULO DE KPIS ---
  // Alunos Únicos
  const uniqueStudentsSet = new Set<string>();
  processedData.forEach((aula) => {
    if (aula.lista_alunos && Array.isArray(aula.lista_alunos)) {
      aula.lista_alunos.forEach((aluno) => uniqueStudentsSet.add(aluno));
    }
  });
  const totalAlunosUnicos = uniqueStudentsSet.size;
  const totalPresencas = processedData.reduce((acc, aula) => acc + (aula.qtd_alunos || 0), 0);

  const totalHorasPagas = processedData.reduce((acc, aula) => acc + (aula.qtd_professores || 0), 0);
  const totalRazao = processedData.reduce((acc, aula) => acc + (aula.razao_aluno_prof || 0), 0);
  const mediaAlunosPorProfessor = processedData.length > 0 ? totalRazao / processedData.length : 0;
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
      dataIso: aula.data_iso,
    }))
    // Ordenar pela data mais recente
    .sort((a, b) => new Date(b.dataIso).getTime() - new Date(a.dataIso).getTime());

  const percentAlertas = totalAulas > 0 ? ((aulasEmAlerta.length / totalAulas) * 100).toFixed(0) : 0;

  // Gráficos
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

  // Ranking Professores
  const professorMap = new Map<string, { totalAlunos: number; horasPagas: number }>();
  processedData.forEach((aula) => {
    if (!aula.professores) return;
    const profs = aula.professores.split(/,\s*|\s+e\s+/).filter((p) => p.trim().length > 0);
    profs.forEach((prof) => {
      let nomeTratado = prof.trim();
      if (nomeTratado === "Peu") nomeTratado = "Peu Beck";

      const current = professorMap.get(nomeTratado) || { totalAlunos: 0, horasPagas: 0 };
      professorMap.set(nomeTratado, {
        totalAlunos: current.totalAlunos + (aula.qtd_alunos || 0),
        horasPagas: current.horasPagas + 1,
      });
    });
  });

  const professorRanking: ProfessorStats[] = Array.from(professorMap.entries())
    .map(([nome, stats]) => ({
      nome,
      totalAlunos: stats.totalAlunos,
      horasPagas: stats.horasPagas,
    }))
    .sort((a, b) => b.horasPagas - a.horasPagas)
    .slice(0, 10);

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
    <div className="min-h-screen bg-background p-4 md:p-8" onClick={() => setOpenFilter(null)}>
      <div className="max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <DashboardHeader
          onRefresh={handleRefresh}
          isLoading={isLoading}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          filterPeriod={filterPeriod}
          onFilterPeriodChange={setFilterPeriod}
        />

        {/* === ZONA DE FILTROS (NOVA UI/UX) === */}
        <div className="mb-6 flex flex-wrap items-center gap-3 animate-fade-in relative z-20">
          {/* Botão de Análise IA (INTEGRAÇÃO FEITA) */}
          <AIAnalysisDialog data={processedData} />

          <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-1">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtrar por:</span>
          </div>

          {/* 1. Dropdown Tipo de Aula */}
          <div className="relative">
            <Button
              variant={selectedClassType !== "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setOpenFilter(openFilter === "type" ? null : "type")}
              className={`gap-2 h-9 border-dashed ${selectedClassType === "all" ? "text-muted-foreground hover:text-foreground" : ""}`}
            >
              {selectedClassType === "all" ? "Tipo de Aula" : selectedClassType}
              <ChevronDown className={`w-3 h-3 transition-transform ${openFilter === "type" ? "rotate-180" : ""}`} />
            </Button>

            {openFilter === "type" && (
              <div className="absolute top-10 left-0 w-[200px] p-2 bg-popover rounded-lg border shadow-lg animate-in fade-in zoom-in-95 z-50">
                <div className="flex flex-col gap-1">
                  <Button
                    variant={selectedClassType === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="justify-start font-normal h-8"
                    onClick={() => {
                      setSelectedClassType("all");
                      setOpenFilter(null);
                    }}
                  >
                    Todos
                    {selectedClassType === "all" && <Check className="ml-auto w-3 h-3" />}
                  </Button>
                  <Separator className="my-1" />
                  {classTypes.map((type) => (
                    <Button
                      key={type}
                      variant={selectedClassType === type ? "secondary" : "ghost"}
                      size="sm"
                      className="justify-start font-normal h-8"
                      onClick={() => {
                        setSelectedClassType(type);
                        setOpenFilter(null);
                      }}
                    >
                      {type}
                      {selectedClassType === type && <Check className="ml-auto w-3 h-3" />}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Dropdown Horários */}
          <div className="relative">
            <Button
              variant={selectedTime !== "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setOpenFilter(openFilter === "time" ? null : "time")}
              className={`gap-2 h-9 border-dashed ${selectedTime === "all" ? "text-muted-foreground hover:text-foreground" : ""}`}
            >
              <Clock className="w-3.5 h-3.5" />
              {selectedTime === "all" ? "Horários" : selectedTime}
              <ChevronDown className={`w-3 h-3 transition-transform ${openFilter === "time" ? "rotate-180" : ""}`} />
            </Button>

            {openFilter === "time" && (
              <div className="absolute top-10 left-0 w-[280px] p-3 bg-popover rounded-lg border shadow-lg animate-in fade-in zoom-in-95 z-50">
                <div className="space-y-2">
                  <Button
                    variant={selectedTime === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start font-normal h-8"
                    onClick={() => {
                      setSelectedTime("all");
                      setOpenFilter(null);
                    }}
                  >
                    Todos os Horários
                    {selectedTime === "all" && <Check className="ml-auto w-3 h-3" />}
                  </Button>
                  <Separator />
                  <div className="grid grid-cols-4 gap-1">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        className={`h-8 text-xs px-0 ${selectedTime === time ? "" : "border-transparent bg-muted/50 hover:bg-muted"}`}
                        onClick={() => {
                          setSelectedTime(time);
                          setOpenFilter(null);
                        }}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Botão Limpar Filtros */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 animate-in fade-in slide-in-from-left-2"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar Filtros
            </Button>
          )}

          {openFilter && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpenFilter(null)} />}
        </div>

        {/* === KPIS === */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            <KPICard
              label="Total de Alunos"
              value={totalAlunosUnicos}
              icon={<Users className="w-6 h-6" />}
              status="neutral"
              subtitle={`Alunos únicos (${totalPresencas} presenças)`}
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
              subtitle={aulasEmAlerta.length > 0 ? `${percentAlertas}% do total requer atenção` : "Nenhum alerta!"}
              delay={200}
            />
          </div>
        </section>

        {/* === ALERTAS E HISTÓRICO === */}
        <section className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div />
            {/* Passando processedData filtrado para o histórico */}
            <FullHistoryDialog aulas={processedData} dateRange={dateRange} />
          </div>
          <AlertList aulas={aulasEmAlerta as any} />
        </section>

        {/* === EVOLUÇÃO DIÁRIA === */}
        <section className="mb-8">
          <DailyEvolutionChart
            data={rawData || []}
            isLoading={isLoading}
            classType={selectedClassType}
            selectedTime={selectedTime}
          />
        </section>

        {/* === GRÁFICOS FINAIS === */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart data={performanceHorario} metaValue={metaValue} isVipFilter={isVipFilter} />
          <ProfessorRanking data={professorRanking} />
        </section>
      </div>
    </div>
  );
};

export default Index;
