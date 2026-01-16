import { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown, Calendar, Bot, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, getWeekOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Interface baseada nos dados que você já tem no Index
interface AulaData {
  data_aula: string;
  horario: string;
  professores: string;
  razao_aluno_prof: number;
  tipo_aula: string;
  qtd_alunos: number;
}

interface AIAnalysisDialogProps {
  data: AulaData[]; // Recebe todos os dados do dashboard
}

export function AIAnalysisDialog({ data }: AIAnalysisDialogProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(today.getMonth().toString());
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);

  // --- 1. FILTRAGEM INTELIGENTE DE DADOS ---
  const filteredData = useMemo(() => {
    return data.filter(aula => {
      let aulaDate: Date;
      try {
        // Tenta parsear DD/MM/YYYY ou ISO
        if (aula.data_aula.includes('/')) {
            const parts = aula.data_aula.split('/');
            aulaDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else {
            aulaDate = parseISO(aula.data_aula);
        }
      } catch (e) { return false; }

      // Filtro Mês
      const aulaMonth = aulaDate.getMonth().toString();
      if (aulaMonth !== selectedMonth) return false;

      // Filtro Semana
      if (selectedWeek !== "all") {
        const week = getWeekOfMonth(aulaDate);
        if (week.toString() !== selectedWeek) return false;
      }

      return true;
    });
  }, [data, selectedMonth, selectedWeek]);

  // --- 2. MOTOR DE ANÁLISE (Cálculos Locais) ---
  const analysis = useMemo(() => {
    if (filteredData.length === 0) return null;

    // Ordena por performance (Razão Aluno/Prof)
    const sortedByPerformance = [...filteredData].sort((a, b) => b.razao_aluno_prof - a.razao_aluno_prof);
    
    const bestClass = sortedByPerformance[0];
    const worstClass = sortedByPerformance[sortedByPerformance.length - 1];
    
    // Cálculos de média
    const avgRatio = filteredData.reduce((acc, curr) => acc + curr.razao_aluno_prof, 0) / filteredData.length;
    
    // Contagem de Status
    const prejuizoCount = filteredData.filter(a => a.razao_aluno_prof < 2).length;
    const superlotadasCount = filteredData.filter(a => a.razao_aluno_prof > 4).length;

    return {
      bestClass,
      worstClass,
      avgRatio,
      totalAulas: filteredData.length,
      prejuizoCount,
      superlotadasCount
    };
  }, [filteredData]);

  // --- 3. GERADOR DE INSIGHTS (Simulação de IA) ---
  const aiText = useMemo(() => {
    if (!analysis) return "Não há dados suficientes para gerar uma análise neste período.";
    
    const { avgRatio, totalAulas, prejuizoCount, superlotadasCount, bestClass, worstClass } = analysis;
    let text = "";

    // Parágrafo 1: Visão Geral
    text += `Analisei **${totalAulas} aulas** neste recorte. `;
    if (avgRatio < 2.5) {
      text += `O cenário requer atenção imediata: a média geral é de **${avgRatio.toFixed(1)} alunos/prof**, o que indica ociosidade na grade. `;
    } else if (avgRatio > 4) {
      text += `Performance excelente! A média de **${avgRatio.toFixed(1)} alunos/prof** sugere alta demanda e possível necessidade de expansão. `;
    } else {
      text += `A operação está saudável, com média de **${avgRatio.toFixed(1)} alunos/prof**, dentro da meta esperada. `;
    }

    text += "\n\n";

    // Parágrafo 2: Pontos Críticos
    if (prejuizoCount > 0) {
      text += `⚠️ **Atenção:** Detectei **${prejuizoCount} aulas** operando no vermelho (razão < 2). Isso representa ${(prejuizoCount/totalAulas*100).toFixed(0)}% da grade deste período. `;
    }
    if (superlotadasCount > 0) {
      text += `🚀 **Oportunidade:** Temos **${superlotadasCount} turmas superlotadas**. Considere abrir horários paralelos ou aumentar o ticket destas sessões. `;
    }

    text += "\n\n";

    // Parágrafo 3: Destaques Específicos
    text += `O destaque positivo vai para o horário das **${bestClass.horario} (${bestClass.tipo_aula})** com a equipe **${bestClass.professores}**, que atingiu a máxima eficiência do período. `;
    
    if (worstClass.razao_aluno_prof < 2) {
      text += `Por outro lado, sugiro revisar a estratégia para as **${worstClass.horario}**, especificamente as aulas de **${worstClass.tipo_aula}**, que tiveram a menor adesão.`;
    }

    return text;
  }, [analysis]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md border-0 transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
          Análise IA
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800">
        
        {/* HEADER & FILTROS */}
        <div className="p-6 border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/20">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-2xl text-primary font-bold">
              <Bot className="w-7 h-7 text-violet-600" />
              Inteligência de Turnos
            </DialogTitle>
            <DialogDescription className="text-base">
              Selecione o período abaixo para gerar insights automáticos sobre a performance.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-4">
            {/* Filtro Mês */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] bg-background">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Selecione o Mês" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {format(new Date(2026, i, 1), 'MMMM', { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Semana */}
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Semana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mês Completo</SelectItem>
                <SelectItem value="1">Semana 1</SelectItem>
                <SelectItem value="2">Semana 2</SelectItem>
                <SelectItem value="3">Semana 3</SelectItem>
                <SelectItem value="4">Semana 4</SelectItem>
                <SelectItem value="5">Semana 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CONTEÚDO */}
        <ScrollArea className="flex-1 p-6 md:p-8">
          {analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* BLOCO DE INSIGHTS DA IA */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <Bot className="w-48 h-48" />
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-violet-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                        Diagnóstico do Período
                    </h3>
                </div>
                
                <p className="text-slate-300 leading-relaxed whitespace-pre-line relative z-10 text-base md:text-lg font-light">
                    {aiText}
                </p>
              </div>

              {/* CARDS DE DESTAQUE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Melhor Aula */}
                <Card className="border-0 shadow-md bg-green-50 dark:bg-green-900/10 ring-1 ring-green-100 dark:ring-green-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-green-700 dark:text-green-400 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Melhor Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-green-700 dark:text-green-300">
                                {analysis.bestClass.razao_aluno_prof.toFixed(1)}
                            </span>
                            <span className="text-sm font-medium text-green-600/80">alunos/prof</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800/50">
                            <div className="flex justify-between items-center mb-1">
                                <Badge variant="outline" className="bg-white/50 border-green-200 text-green-700">
                                    {analysis.bestClass.tipo_aula}
                                </Badge>
                                <span className="text-sm font-mono text-green-800 font-medium">
                                    {analysis.bestClass.horario}
                                </span>
                            </div>
                            <p className="text-sm text-green-800/80 truncate">
                                Profs: {analysis.bestClass.professores}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Pior Aula */}
                <Card className="border-0 shadow-md bg-red-50 dark:bg-red-900/10 ring-1 ring-red-100 dark:ring-red-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Requer Atenção
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-red-700 dark:text-red-300">
                                {analysis.worstClass.razao_aluno_prof.toFixed(1)}
                            </span>
                            <span className="text-sm font-medium text-red-600/80">alunos/prof</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800/50">
                            <div className="flex justify-between items-center mb-1">
                                <Badge variant="outline" className="bg-white/50 border-red-200 text-red-700">
                                    {analysis.worstClass.tipo_aula}
                                </Badge>
                                <span className="text-sm font-mono text-red-800 font-medium">
                                    {analysis.worstClass.horario}
                                </span>
                            </div>
                            <p className="text-sm text-red-800/80 truncate">
                                Profs: {analysis.worstClass.professores}
                            </p>
                        </div>
                    </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center pb-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Análise gerada com base em {analysis.totalAulas} registros do sistema.
                </p>
              </div>

            </div>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <div className="p-4 bg-muted rounded-full mb-4">
                    <Bot className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Aguardando dados</h3>
                <p className="text-sm">Selecione um mês com aulas para iniciar a análise.</p>
             </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
