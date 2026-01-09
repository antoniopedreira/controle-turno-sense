import { useState, useMemo, useEffect } from "react";
import { Users, UserCheck, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader, FilterPeriod } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertList } from "@/components/dashboard/AlertList";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ProfessorRanking } from "@/components/dashboard/ProfessorRanking";
import { ClassTypeFilter } from "@/components/dashboard/ClassTypeFilter";
import { startOfMonth, endOfMonth, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type {
  AulaAlerta,
  PerformanceHorario,
  ProfessorRanking as ProfessorRankingType,
} from "@/data/mockDashboardData";

// Interface para os dados brutos do banco
interface PresencaRaw {
  id: string;
  data_aula: string;
  horario: string;
  arena: string;
  tipo_aula: string;
  professores: string;
  aluno: string;
}

// Interface da Aula Agrupada (simulando o que a View fazia)
interface AulaAgrupada {
  aula_id: string;
  data_aula: string;
  data_iso: string; // Para ordenação
  horario: string;
  tipo_aula: string;
  professores: string;
  qtd_alunos: number;
  qtd_professores: number;
  razao_aluno_prof: number;
  status_aula: string;
  cor_indicadora: string;
}

const Index = () => {
  const today = new Date();

  // Filtro padrão: Este Mês
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  const [selectedClassType, setSelectedClassType] = useState<string>("all");

  // 1. BUSCA DADOS BRUTOS (SEM FILTRO DE DATA NO SUPABASE PARA GARANTIR)
  // Trazemos tudo e filtramos no JS para evitar erros de conversão do SQL
  const {
    data: rawData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["controle_presenca_raw"],
    queryFn: async () => {
      // Busca tudo da tabela bruta.
      // Se ficar muito pesado no futuro, podemos adicionar um filtro .gte('created_at', ...)
      const { data, error } = await supabase.from("controle_presenca").select("*");

      if (error) {
        console.error("Erro ao buscar dados:", error);
        throw error;
      }
      return data as PresencaRaw[];
    },
  });

  // 2. PROCESSAMENTO E AGRUPAMENTO (O CÉREBRO DA OPERAÇÃO)
  const dashboardData = useMemo(() => {
    if (!rawData) return [];

    // Map para agrupar alunos em turmas
    // Chave única: Data + Horario + Arena + Tipo + Professores
    const aulasMap = new Map<
      string,
      {
        ids: string[];
        raw: PresencaRaw;
        count: number;
      }
    >();

    // Filtra por data e Agrupa
    rawData.forEach((row) => {
      if (!row.data_aula) return;

      // Parse da data texto (ex: "05/01/2026") para Objeto JS
      // O n8n garante DD/MM/YYYY
      let rowDate: Date;
      try {
        rowDate = parse(row.data_aula, "dd/MM/yyyy", new Date());
      } catch (e) {
        console.warn("Data inválida ignorada:", row.data_aula);
        return;
      }

      // Aplica o Filtro de Data Selecionado
      if (dateRange?.from && dateRange?.to) {
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to);
        // Verifica se a data da aula está dentro do intervalo
        if (!isWithinInterval(rowDate, { start, end })) {
          return;
        }
      }

      // Cria a chave única da aula
      const key = `${row.data_aula}-${row.horario}-${row.arena}-${row.tipo_aula}-${row.professores}`;

      if (!aulasMap.has(key)) {
        aulasMap.set(key, { ids: [], raw: row, count: 0 });
      }

      const entry = aulasMap.get(key)!;
      entry.ids.push(row.id);
      entry.count += 1;
    });

    // Transforma o Map em Array de Aulas (Calculando métricas)
    const aulasProcessadas: AulaAgrupada[] = [];

    aulasMap.forEach((entry, key) => {
      const { raw, count } = entry;

      // Conta professores (separa por vírgula ou 'e')
      // Ex: "Rafael, Thieres" -> 2
      const profsList = raw.professores ? raw.professores.split(/[,e]/).filter((p) => p.trim().length > 0) : [];
      const qtdProfs = profsList.length || 1; // Mínimo 1 para não dividir por zero

      const razao = Number((count / qtdProfs).toFixed(2));

      // Lógica do Semáforo (Copiada do SQL para JS)
      let status = "⚪ Analisar";
      let cor = "#eab308"; // Amarelo padrão

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
        aula_id: key, // Chave gerada serve como ID
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
      });
    });

    return aulasProcessadas;
  }, [rawData, dateRange]); // Recalcula sempre que os dados brutos ou a data mudarem

  // LOG DE DEBUG
  useEffect(() => {
    if (dashboardData) {
      const totalRows = dashboardData.length; // qtd de aulas
      const totalAlunos = dashboardData.reduce((acc, aula) => acc + aula.qtd_alunos, 0);
      console.log(`[DEBUG JS] Aulas Montadas: ${totalRows} | Total Alunos Real: ${totalAlunos}`);
    }
  }, [dashboardData]);

  // --- RESTO DA LÓGICA DE UI (Gráficos, KPIs) ---

  const classTypes = useMemo(() => {
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

  const handleRefresh = () => refetch();

  const processedData = useMemo(() => {
    const filterType = selectedClassType === "Geral" ? "all" : selectedClassType;
    if (filterType === "all") return dashboardData;
    return dashboardData.filter((aula) => aula.tipo_aula === filterType);
  }, [dashboardData, selectedClassType]);

  const isVipFilter = selectedClassType.toLowerCase() === "vip";
  const metaValue = isVipFilter ? 2 : 3;

  // KPIs
  const totalAlunos = processedData.reduce((acc, aula) => acc + aula.qtd_alunos, 0);

  const totalRazao = processedData.reduce((acc, aula) => acc + aula.razao_aluno_prof, 0);
  const mediaAlunosPorProfessor = processedData.length > 0 ? totalRazao / processedData.length : 0;

  const aulasEmAlerta: AulaAlerta[] = processedData
    .filter((aula) => aula.status_aula?.includes("🔴"))
    .map((aula) => ({
      id: aula.aula_id,
      data: aula.data_aula,
      horario: aula.horario,
      professores: aula.professores,
      qtdAlunos: aula.qtd_alunos,
      status: aula.status_aula,
      corIndicadora: (aula.cor_indicadora as "red" | "yellow" | "green") || "red",
    }));

  // Gráfico Horário
  const horarioMap = new Map<string, { total: number; count: number }>();
  processedData.forEach((aula) => {
    if (!aula.horario) return;
    const hora = aula.horario.split(":")[0].padStart(2, "0") + "h";
    const existing = horarioMap.get(hora) || { total: 0, count: 0 };
    horarioMap.set(hora, {
      total: existing.total + aula.razao_aluno_prof,
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

  // Ranking Professores
  const professorMap = new Map<string, number>();
  processedData.forEach((aula) => {
    if (!aula.professores) return;
    const profs = aula.professores.split(/[,e]/).map((p) => p.trim());
    profs.forEach((prof) => {
      if (prof) {
        professorMap.set(prof, (professorMap.get(prof) || 0) + aula.qtd_alunos);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <KPICard
              label="Total de Alunos"
              value={totalAlunos}
              icon={<Users className="w-6 h-6" />}
              status="neutral"
              subtitle="Alunos no período"
              delay={0}
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
