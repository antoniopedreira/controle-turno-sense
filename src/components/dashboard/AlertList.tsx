import { AlertTriangle, Calendar, Clock, Users } from 'lucide-react';
import { AulaAlerta } from '@/data/mockDashboardData';

interface AlertListProps {
  aulas: AulaAlerta[];
}

export function AlertList({ aulas }: AlertListProps) {
  if (aulas.length === 0) {
    return (
      <div className="dashboard-section">
        <h2 className="section-title">
          <AlertTriangle className="w-5 h-5 text-success" />
          Tudo certo!
        </h2>
        <p className="section-subtitle">
          Nenhuma aula precisa de atenção no momento. 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-section opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
      <h2 className="section-title text-danger">
        <AlertTriangle className="w-5 h-5" />
        Aulas que precisam de Atenção
      </h2>
      <p className="section-subtitle mb-4">
        Clique em uma aula para ver detalhes e tomar ação
      </p>

      <div className="space-y-3">
        {aulas.map((aula, index) => (
          <div 
            key={aula.id} 
            className="alert-row opacity-0 animate-fade-in cursor-pointer"
            style={{ animationDelay: `${400 + index * 100}ms` }}
          >
            <div className="flex items-center gap-6 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{aula.data}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{aula.horario}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm flex-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{aula.professores}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-danger">{aula.qtdAlunos}</span>
                <span className="text-muted-foreground">alunos</span>
              </div>
            </div>
            
            <span className="status-badge status-danger ml-4">
              {aula.status.replace('🔴 ', '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
