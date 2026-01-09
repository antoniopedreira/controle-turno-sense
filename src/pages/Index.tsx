import { useState, useMemo } from "react";
import { Users, UserCheck, AlertTriangle, Clock } from "lucide-react"; // Adicionado Clock
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader, FilterPeriod } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertList } from "@/components/dashboard/AlertList";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ProfessorRanking } from "@/components/dashboard/ProfessorRanking";
import { ClassTypeFilter } from "@/components/dashboard/ClassTypeFilter";
import { startOfMonth, endOfMonth, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type {
  AulaAlerta,
  PerformanceHorario,
  ProfessorRanking as ProfessorRankingType,
} from "@/data/mockDashboardData";

const Index = () => {
  const today = new Date();

  // Filtro padrão: Este Mês
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  // Filtro por tipo de aula
  const [selectedClassType, setSelectedClassType] = useState<string>("all");

  // Buscar dados da view_dashboard_didatico com filtro de data
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-data", dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let query = supabase.from("view_dashboard_didatico").select("*");

      if (dateRange?.from) {
        const fromDate = format(dateRange.from, "yyyy-MM-dd");
        query = query.gte("data_iso", fromDate);
      }
      if (dateRange?.to) {
        const toDate = format(dateRange.to, "yyyy-MM-dd");
        query = query.lte("data_iso", toDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  // Extrair tipos de aula únicos
  const classTypes = useMemo(() => {
    if (!dashboardData) return [];
    const types = new Set<string>();
    dashboardData.forEach((aula) => {
      if (aula.tipo_aula) types.add(aula.tipo_aula);
    });
    return Array.from(types).sort();
  }, [dashboardData]);

  // Função para determinar a cor baseada na meta
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

  const handleRefresh = () => {
    refetch();
  };

  // Processar dados para os componentes
  const processedData = useMemo(() => {
    const data = dashboardData || [];
    if (selectedClassType === "all") return data;
    return data.filter((aula) => aula.tipo_aula === selectedClassType);
  }, [dashboardData, selectedClassType]);

  const isVipFilter = selectedClassType.toLowerCase() === "vip";

  // Total de alunos únicos
  const totalAlunos = processedData.reduce((acc, aula) => acc + (aula.qtd_alunos || 0), 0);

  // [NOVO] Total de Horas Pagas (soma da coluna qtd_professores da view)
  // Como a view já calcula isso corretamente, usamos direto!
  const totalHorasPagas = processedData.reduce((acc, aula) => acc + (aula.qtd_professores || 0), 0);

  // Média de alunos por professor
  const totalRazao = processedData.reduce((acc, aula) => acc + (aula.razao_aluno_prof || 0), 0);
  const mediaAlunosPorProfessor = processedData.length > 0 ? totalRazao / processedData.length : 0;

  // Aulas em alerta
  const aulasEmAlerta: AulaAlerta[] = processedData
    .filter((aula) => aula.status_aula?.includes("🔴"))
    .map((aula) => ({
      id: aula.aula_id || "",
      data: aula.data_aula || "",
      horario: aula.horario || "",
      professores: aula.professores || "",
      qtdAlunos: aula.qtd_alunos || 0,
      status: aula.status_aula || "",
      corIndicadora: (aula.cor_indicadora as "red" | "yellow" | "green") || "red",
    }));

  // Performance por horário
  const horarioMap = new Map<string, { total: number; count: number }>();
  processedData.forEach((aula) => {
    if (!aula.horario) return;
    const hora = aula.horario.split(":")[0].padStart(2, "0") + "h";
    const existing = horarioMap.get(hora) || { total: 0, count: 0 };
    horarioMap.set(hora, {
      total: existing.total + (aula.razao_aluno_prof || 0),
      count: existing.count + 1,
    });
  });

  const performanceHorario: PerformanceHorario[] = Array.from(horarioMap.entries())
    .map(([horario, data]) => {
      const mediaAlunos = data.count > 0 ? data.total / data.count : 0;
      return {
        horario,
        mediaAlunos,
        corIndicadora: getColorByMeta(mediaAlunos, isVipFilter),
      };
    })
    .sort((a, b) => a.horario.localeCompare(b.horario));

  // Ranking de professores
  const professorMap = new Map<string, number>();
  processedData.forEach((aula) => {
    if (!aula.professores) return;
    const profs = aula.professores.split(",").map((p) => p.trim());
    profs.forEach((prof) => {
      if (prof) {
        professorMap.set(prof, (professorMap.get(prof) || 0) + (aula.qtd_alunos || 0));
      }
    });
  });

  const professorRanking: ProfessorRankingType[] = Array.from(professorMap.entries())
    .map(([nome, totalAlunos]) => ({ nome, totalAlunos }))
    .sort((a, b) => b.totalAlunos - a.totalAlunos)
    .slice(0, 5);

  const getMediaStatus = (media: number): "danger" | "warning" | "success" => {
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
    if (isVipFilter) {
      return mediaAlunosPorProfessor < 2
        ? "Abaixo do ideal! Meta: 2+"
        : mediaAlunosPorProfessor > 2
          ? "Excelente performance!"
          : "Dentro da meta";
    }
    return mediaAlunosPorProfessor < 3
      ? "Abaixo do ideal! Meta: 3+"
      : mediaAlunosPorProfessor > 5
        ? "Excelente performance!"
        : "Dentro da meta";
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

            {/* Card de Horas Pagas usando a soma da view */}
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

        <section className="mb-8">
          <AlertList aulas={aulasEmAlerta} />
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
