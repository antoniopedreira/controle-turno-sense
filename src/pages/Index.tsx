import { useState } from 'react';
import { Users, UserCheck, AlertTriangle } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertList } from '@/components/dashboard/AlertList';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { ProfessorRanking } from '@/components/dashboard/ProfessorRanking';
import { 
  mockKPIs, 
  mockAulasAlerta, 
  mockPerformanceHorario, 
  mockProfessorRanking 
} from '@/data/mockDashboardData';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simula um refresh - será substituído por chamada real ao banco
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Determina o status da média de alunos por professor
  const getMediaStatus = (media: number): 'danger' | 'warning' | 'success' => {
    if (media < 3) return 'danger';
    if (media > 5) return 'success';
    return 'warning';
  };

  // Filtra apenas aulas em alerta (status vermelho)
  const aulasEmAlerta = mockAulasAlerta.filter(
    aula => aula.status.includes('🔴')
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader onRefresh={handleRefresh} isLoading={isLoading} />

        {/* Seção 1: O Placar do Dia - KPIs Gigantes */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <KPICard
              label="Total de Alunos"
              value={mockKPIs.totalAlunos}
              icon={<Users className="w-6 h-6" />}
              status="neutral"
              subtitle="Alunos ativos hoje"
              delay={0}
            />
            
            <KPICard
              label="Média Alunos/Professor"
              value={mockKPIs.mediaAlunosPorProfessor.toFixed(1)}
              icon={<UserCheck className="w-6 h-6" />}
              status={getMediaStatus(mockKPIs.mediaAlunosPorProfessor)}
              subtitle={
                mockKPIs.mediaAlunosPorProfessor < 3 
                  ? 'Abaixo do ideal! Meta: 3+' 
                  : mockKPIs.mediaAlunosPorProfessor > 5 
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
          <PerformanceChart data={mockPerformanceHorario} />
          <ProfessorRanking data={mockProfessorRanking} />
        </section>
      </div>
    </div>
  );
};

export default Index;
