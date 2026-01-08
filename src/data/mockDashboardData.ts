// Dados simulados para o dashboard - serão substituídos por dados reais do banco

export interface AulaAlerta {
  id: string;
  data: string;
  horario: string;
  professores: string;
  qtdAlunos: number;
  status: string;
  corIndicadora: 'red' | 'yellow' | 'green';
}

export interface PerformanceHorario {
  horario: string;
  mediaAlunos: number;
  corIndicadora: 'red' | 'yellow' | 'green';
}

export interface ProfessorRanking {
  nome: string;
  totalAlunos: number;
}

export const mockAulasAlerta: AulaAlerta[] = [
  {
    id: '1',
    data: '08/01/2026',
    horario: '06:00',
    professores: 'Carlos Silva',
    qtdAlunos: 2,
    status: '🔴 Baixa Adesão',
    corIndicadora: 'red',
  },
  {
    id: '2',
    data: '08/01/2026',
    horario: '07:00',
    professores: 'Ana Santos',
    qtdAlunos: 1,
    status: '🔴 Prejuízo',
    corIndicadora: 'red',
  },
  {
    id: '3',
    data: '08/01/2026',
    horario: '14:00',
    professores: 'Pedro Lima',
    qtdAlunos: 2,
    status: '🔴 Baixa Adesão',
    corIndicadora: 'red',
  },
  {
    id: '4',
    data: '07/01/2026',
    horario: '19:00',
    professores: 'Maria Costa',
    qtdAlunos: 1,
    status: '🔴 Prejuízo',
    corIndicadora: 'red',
  },
];

export const mockPerformanceHorario: PerformanceHorario[] = [
  { horario: '06h', mediaAlunos: 2.5, corIndicadora: 'red' },
  { horario: '07h', mediaAlunos: 3.2, corIndicadora: 'yellow' },
  { horario: '08h', mediaAlunos: 5.8, corIndicadora: 'green' },
  { horario: '09h', mediaAlunos: 6.2, corIndicadora: 'green' },
  { horario: '10h', mediaAlunos: 4.5, corIndicadora: 'yellow' },
  { horario: '11h', mediaAlunos: 3.8, corIndicadora: 'yellow' },
  { horario: '14h', mediaAlunos: 2.1, corIndicadora: 'red' },
  { horario: '15h', mediaAlunos: 3.5, corIndicadora: 'yellow' },
  { horario: '16h', mediaAlunos: 4.8, corIndicadora: 'yellow' },
  { horario: '17h', mediaAlunos: 7.2, corIndicadora: 'green' },
  { horario: '18h', mediaAlunos: 8.5, corIndicadora: 'green' },
  { horario: '19h', mediaAlunos: 6.8, corIndicadora: 'green' },
  { horario: '20h', mediaAlunos: 5.2, corIndicadora: 'green' },
  { horario: '21h', mediaAlunos: 2.8, corIndicadora: 'red' },
];

export const mockProfessorRanking: ProfessorRanking[] = [
  { nome: 'João Oliveira', totalAlunos: 156 },
  { nome: 'Maria Costa', totalAlunos: 142 },
  { nome: 'Carlos Silva', totalAlunos: 128 },
  { nome: 'Ana Santos', totalAlunos: 115 },
  { nome: 'Pedro Lima', totalAlunos: 98 },
];

export const mockKPIs = {
  totalAlunos: 847,
  mediaAlunosPorProfessor: 4.2,
  aulasEmAlerta: 4,
};
