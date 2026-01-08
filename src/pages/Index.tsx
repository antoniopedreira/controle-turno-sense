import { useState } from 'react';
import { Users, UserCheck, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader, FilterPeriod } from '@/components/dashboard/DashboardHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertList } from '@/components/dashboard/AlertList';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { ProfessorRanking } from '@/components/dashboard/ProfessorRanking';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { AulaAlerta, PerformanceHorario, ProfessorRanking as ProfessorRankingType } from '@/data/mockDashboardData';

const Index = () => {
  const today = new Date();
  
  // Filtro padrão: Este Mês
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  // Buscar dados da view_dashboard_didatico com filtro de data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-data', dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let query = supabase.from('view_dashboard_didatico').select('*');
      
      if (dateRange?.from) {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd');
        query = query.gte('data_iso', fromDate);
      }
      if (dateRange?.to) {
        const toDate = format(dateRange.to, 'yyyy-MM-dd');
        query = query.lte('data_iso', toDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  // Processar dados para os componentes
  const processedData = dashboardData || [];

  // Total de alunos únicos
  const totalAlunos = processedData.reduce((acc, aula) => acc + (aula.qtd_alunos || 0), 0);

  // Média de alunos por professor
  const totalRazao = processedData.reduce((acc, aula) => acc + (aula.razao_aluno_prof || 0), 0);
  const mediaAlunosPorProfessor = processedData.length > 0 ? totalRazao / processedData.length : 0;

  // Aulas em alerta (status vermelho)
  const aulasEmAlerta: AulaAlerta[] = processedData
    .filter(aula => aula.status_aula?.includes('🔴'))
    .map(aula => ({
      id: aula.aula_id || '',
      data: aula.data_aula || '',
      horario: aula.horario || '',
      professores: aula.professores || '',
      qtdAlunos: aula.qtd_alunos || 0,
      status: aula.status_aula || '',
      corIndicadora: (aula.cor_indicadora as 'red' | 'yellow' | 'green') || 'red',
    }));

  // Performance por horário (agrupa por horário)
  const horarioMap = new Map<string, { total: number; count: number; cor: string }>();
  processedData.forEach(aula => {
    if (!aula.horario) return;
    const hora = aula.horario.split(':')[0] + 'h';
    const existing = horarioMap.get(hora) || { total: 0, count: 0, cor: 'green' };
    horarioMap.set(hora, {
      total: existing.total + (aula.razao_aluno_prof || 0),
      count: existing.count + 1,
      cor: aula.cor_indicadora || 'green',
    });
  });

  const performanceHorario: PerformanceHorario[] = Array.from(horarioMap.entries())
    .map(([horario, data]) => ({
      horario,
      mediaAlunos: data.count > 0 ? data.total / data.count : 0,
      corIndicadora: (data.cor as 'red' | 'yellow' | 'green'),
    }))
    .sort((a, b) => a.horario.localeCompare(b.horario));

  // Ranking de professores
  const professorMap = new Map<string, number>();
  processedData.forEach(aula => {
    if (!aula.professores) return;
    const profs = aula.professores.split(',').map(p => p.trim());
    profs.forEach(prof => {
      if (prof) {
        professorMap.set(prof, (professorMap.get(prof) || 0) + (aula.qtd_alunos || 0));
      }
    });
  });

  const professorRanking: ProfessorRankingType[] = Array.from(professorMap.entries())
    .map(([nome, totalAlunos]) => ({ nome, totalAlunos }))
    .sort((a, b) => b.totalAlunos - a.totalAlunos)
    .slice(0, 5);

  // Determina o status da média de alunos por professor
  const getMediaStatus = (media: number): 'danger' | 'warning' | 'success' => {
    if (media < 3) return 'danger';
    if (media > 5) return 'success';
    return 'warning';
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

        {/* Seção 1: O Placar do Dia - KPIs Gigantes */}
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
              subtitle={
                mediaAlunosPorProfessor < 3 
                  ? 'Abaixo do ideal! Meta: 3+' 
                  : mediaAlunosPorProfessor > 5 
                    ? 'Excelente performance!'
                    : 'Dentro da meta'
              }
              delay={100}
            />
            
            <KPICard
              label="Aulas em Alerta"
              value={aulasEmAlerta.length}
              icon={<AlertTriangle className="w-6 h-6" />}
              status={aulasEmAlerta.length > 0 ? 'danger' : 'success'}
              subtitle={
                aulasEmAlerta.length > 0 
                  ? 'Precisam de atenção imediata' 
                  : 'Nenhum alerta!'
              }
              delay={200}
            />
          </div>
        </section>

        {/* Seção 2: Lista de Alertas */}
        <section className="mb-8">
          <AlertList aulas={aulasEmAlerta} />
        </section>

        {/* Seção 3 e 4: Gráficos lado a lado em telas grandes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart data={performanceHorario} />
          <ProfessorRanking data={professorRanking} />
        </section>
      </div>
    </div>
  );
};

export default Index;
