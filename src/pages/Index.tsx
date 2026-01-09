import { useState, useMemo } from "react";
import { Users, UserCheck, AlertTriangle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader, FilterPeriod } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertList } from "@/components/dashboard/AlertList";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ProfessorRanking } from "@/components/dashboard/ProfessorRanking";
import { ClassTypeFilter } from "@/components/dashboard/ClassTypeFilter";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";
import { startOfMonth, endOfMonth, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type {
  AulaAlerta,
  PerformanceHorario,
  ProfessorRanking as ProfessorRankingType,
} from "@/data/mockDashboardData";

// Interface ajustada para incluir dados brutos necessários
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

// Interface expandida para passar os detalhes
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

  // Filtro de data global da página
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  // Filtro de Tipo de Aula (VIP, Geral, etc)
  const [selectedClassType, setSelectedClassType] = useState<string>("all");

  // 1. BUSCA DADOS BRUTOS DO SUPABASE
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

  // 2. PROCESSAMENTO E AGRUPAMENTO DOS DADOS (PRINCIPAL)
  const dashboardData = useMemo(() => {
    if (!rawData) return [];

    const aulasMap = new Map<
      string,
      {
        ids: string[];
        raw: PresencaRaw;
        count: number;
        alunos: string[];
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

      // Aplica o filtro de data global
      if (dateRange?.from && dateRange?.to) {
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to);
        if (!isWithinInterval(rowDate, { start, end })) {
          return;
        }
      }

      // Chave única para agrupar alunos na mesma turma
      const key = `${row.data_aula}-${row.horario}-${row.arena}-${row.tipo_aula}-${row.professores}`;

      if (!aulasMap.has(key)) {
        aulasMap.set(key, { ids: [], raw: row, count: 0, alunos: [] });
      }

      const entry = aulasMap.get(key)!;
      entry.ids.push(row.id);
      entry.count += 1;
      if (row.aluno) entry.alunos.push(row.aluno);
    });

    const aulasProcessadas: AulaAgrupada[] = [];

    aulasMap.forEach((entry, key) => {
      const { raw, count, alunos } = entry;

      // Conta professores (separados por vírgula ou ' e ')
      const profsList = raw.professores ? raw.professores.split(/,\s*|\s+e\s+/).filter((p) => p.trim().length > 0) : [];
      const qtdProfs = profsList.length || 1;

      const razao = Number((count / qtdProfs).toFixed(2));

      let status = "⚪ Analisar";
      let cor = "#eab308";

      const isVip = raw.tipo_aula?.toUpperCase().includes("VIP");

      // Regra de Cores (Semáforo)
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
        horario: raw.horario,
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

  // Lista de tipos de aula para o filtro
  const classTypes = useMemo(() => {
    if (!dashboardData) return [];
    const types = new Set<string>();
    dashboardData.forEach((aula) => {
      if (aula.tipo_aula) types.add(aula.tipo_aula);
    });
    return Array.from(types).sort();
  }, [dashboardData]);

  // Função auxiliar de cores para gráficos
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

  const handleRefresh = () => refetch();

  // Filtra os dados processados com base no Tipo de Aula selecionado
  const processedData = useMemo(() => {
    const data = dashboardData || [];
    if (selectedClassType === "all") return data;
    return data.filter((aula) => aula.tipo_aula === selectedClassType);
  }, [dashboardData, selectedClassType]);

  const isVipFilter = selectedClassType.toLowerCase() === "vip";
  const metaValue = isVipFilter ? 2 : 3;

  // CÁLCULO DOS KPIS
  const totalAlunos = processedData.reduce((acc, aula) => acc + (aula.qtd_alunos || 0), 0);
  const totalHorasPagas = processedData.reduce((acc, aula) => acc + (aula.qtd_professores || 0), 0);
  const totalRazao = processedData.reduce((acc, aula) => acc + (aula.razao_aluno_prof || 0), 0);
  const mediaAlunosPorProfessor = processedData.length > 0 ? totalRazao / processedData.length : 0;

  // Lista de aulas em alerta
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

  // Dados para Gráfico de Performance por Horário
  const horarioMap = new Map<string, { total: number; count: number }>();
  processedData.forEach((aula) => {
    if (!aula.horario) return;

    // [CORREÇÃO] Remove 'h' se existir e garante formatação correta (05h)
    // Se vier "5:00" -> "05h". Se vier "05h" -> "05h".
    const rawHour = aula.horario.replace(/h/gi, "").split(":")[0];
    const hora = rawHour.padStart(2, "0") + "h";

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

  // Dados para Ranking de Professores
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

        <div className="mb-6">
          <ClassTypeFilter
            classTypes={classTypes}
            selectedType={selectedClassType}
            onTypeChange={setSelectedClassType}
          />
        </div>

        {/* KPIs Principais */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
              subtitle={aulasEmAlerta.length > 0 ? "Precisam de atenção imediata" : "Nenhum alerta!"}
              delay={200}
            />
          </div>
        </section>

        {/* Lista de Alertas */}
        <section className="mb-8">
          <AlertList aulas={aulasEmAlerta as any} />
        </section>

        {/* GRÁFICO DE EVOLUÇÃO DIÁRIA */}
        <section className="mb-8">
          <DailyEvolutionChart data={rawData || []} isLoading={isLoading} classType={selectedClassType} />
        </section>

        {/* Gráficos Finais */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart data={performanceHorario} metaValue={metaValue} isVipFilter={isVipFilter} />
          <ProfessorRanking data={professorRanking} />
        </section>
      </div>
    </div>
  );
};

export default Index;
