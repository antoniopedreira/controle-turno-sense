import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Bot, CheckCircle2, AlertTriangle, Clock, Crown, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AulaData {
  data_aula: string;
  data_iso?: string;
  horario: string;
  professores: string;
  razao_aluno_prof: number;
  tipo_aula: string;
  qtd_alunos: number;
  qtd_professores?: number;
  status_aula?: string;
  cor_indicadora?: string;
}

interface AIAnalysisDialogProps {
  data: AulaData[];
}

export function AIAnalysisDialog({ data }: AIAnalysisDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Simula tempo de "análise" ao abrir o modal
  useEffect(() => {
    if (isOpen && data && data.length > 0) {
      setIsAnalyzing(true);
      setShowResults(false);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 1500); // 1.5s de delay para simular análise
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setShowResults(false);
      setIsAnalyzing(false);
    }
  }, [isOpen, data]);

  // --- 1. MOTOR DE ANÁLISE ---
  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    // A. Estatísticas Gerais
    const totalAlunos = data.reduce((acc, curr) => acc + curr.qtd_alunos, 0);
    const avgRatio = data.reduce((acc, curr) => acc + curr.razao_aluno_prof, 0) / data.length;

    // LÓGICA DE ALERTA (Sincronizada com o Dashboard)
    const isAlert = (a: AulaData) => {
      const isVip = a.tipo_aula?.toUpperCase().includes("VIP");
      return isVip ? a.razao_aluno_prof < 2 : a.razao_aluno_prof < 3;
    };

    const alertsList = data.filter(isAlert);
    const alertsCount = alertsList.length;

    // Aulas verdes (lucrativas)
    const greenAulas = data.filter((a) => {
      const isVip = a.tipo_aula?.toUpperCase().includes("VIP");
      return isVip ? a.razao_aluno_prof >= 2 : a.razao_aluno_prof >= 5;
    });

    // B. Mapeamento de Horários
    const timeMap = new Map<string, { totalRatio: number; count: number; alertCount: number; totalAlunos: number }>();
    const profMap = new Map<string, { aulas: number; totalAlunos: number }>();

    data.forEach((aula) => {
      // Horários
      const currentH = timeMap.get(aula.horario) || { totalRatio: 0, count: 0, alertCount: 0, totalAlunos: 0 };
      timeMap.set(aula.horario, {
        totalRatio: currentH.totalRatio + aula.razao_aluno_prof,
        count: currentH.count + 1,
        alertCount: currentH.alertCount + (isAlert(aula) ? 1 : 0),
        totalAlunos: currentH.totalAlunos + aula.qtd_alunos,
      });

      // Professores
      if (aula.professores) {
        const nomes = aula.professores.split(/,\s*|\s+e\s+/).filter((p) => p.trim().length > 0);
        nomes.forEach((nome) => {
          let cleanName = nome.trim();
          if (cleanName === "Peu") cleanName = "Peu Beck";
          const currentP = profMap.get(cleanName) || { aulas: 0, totalAlunos: 0 };
          profMap.set(cleanName, {
            aulas: currentP.aulas + 1,
            totalAlunos: currentP.totalAlunos + aula.qtd_alunos,
          });
        });
      }
    });

    // Ranking de Horários
    const timeStats = Array.from(timeMap.entries()).map(([horario, stats]) => ({
      horario,
      media: stats.totalRatio / stats.count,
      alertCount: stats.alertCount,
      totalAlunos: stats.totalAlunos,
      count: stats.count,
    }));

    // Melhor Horário (Maior Média)
    const bestTime = [...timeStats].sort((a, b) => b.media - a.media)[0];

    // Horário Crítico (Mais Alertas > Menor Média)
    const criticalTime = [...timeStats].sort((a, b) => {
      if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount;
      return a.media - b.media;
    })[0];

    // Top Professor (por aulas)
    const topProfessor = Array.from(profMap.entries()).sort((a, b) => b[1].aulas - a[1].aulas)[0];

    // Evolução Diária - agrupar por data
    const dailyMap = new Map<string, { count: number; totalRatio: number; alerts: number }>();
    data.forEach((aula) => {
      const dateKey = aula.data_aula;
      const current = dailyMap.get(dateKey) || { count: 0, totalRatio: 0, alerts: 0 };
      dailyMap.set(dateKey, {
        count: current.count + 1,
        totalRatio: current.totalRatio + aula.razao_aluno_prof,
        alerts: current.alerts + (isAlert(aula) ? 1 : 0),
      });
    });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        avgRatio: stats.totalRatio / stats.count,
        alerts: stats.alerts,
        count: stats.count,
      }))
      .sort((a, b) => {
        // Ordenar por data (mais recente primeiro para análise)
        const dateA = a.date.split("/").reverse().join("-");
        const dateB = b.date.split("/").reverse().join("-");
        return dateB.localeCompare(dateA);
      });

    return {
      avgRatio,
      totalAulas: data.length,
      totalAlunos,
      alertsCount,
      greenCount: greenAulas.length,
      percentAlerts: ((alertsCount / data.length) * 100).toFixed(0),
      percentGreen: ((greenAulas.length / data.length) * 100).toFixed(0),
      bestTime,
      criticalTime,
      topProfessor: topProfessor ? { nome: topProfessor[0], aulas: topProfessor[1].aulas, alunos: topProfessor[1].totalAlunos } : null,
      timeStats,
      dailyStats,
    };
  }, [data]);

  // --- 2. GERADOR DE TEXTO ---
  const aiText = useMemo(() => {
    if (!analysis) return "Não há dados suficientes.";

    const { avgRatio, totalAulas, totalAlunos, alertsCount, greenCount, percentAlerts, percentGreen, bestTime, criticalTime, topProfessor, dailyStats } = analysis;

    let text = "";

    // BLOCO 1 - Resumo Geral
    text += `📊 **Resumo do Período Filtrado**\n`;
    text += `Foram analisadas **${totalAulas} aulas** com um total de **${totalAlunos} presenças registradas**. `;
    text += `A média global é de **${avgRatio.toFixed(1)} alunos por professor**. `;

    if (avgRatio < 3.0) {
      text += `Este índice está **abaixo da meta ideal (3.0)**, indicando oportunidade de otimização na alocação de turmas.`;
    } else if (avgRatio >= 5) {
      text += `A operação está **excelente**, com alta eficiência na ocupação das aulas.`;
    } else {
      text += `A operação está **saudável e dentro da meta**, demonstrando boa eficiência.`;
    }
    text += "\n\n";

    // BLOCO 2 - Alertas e Performance
    text += `⚡ **Performance das Aulas**\n`;
    text += `• **${greenCount} aulas** (${percentGreen}%) estão operando com alta eficiência (verde)\n`;
    
    if (alertsCount > 0) {
      text += `• **${alertsCount} aulas** (${percentAlerts}%) precisam de atenção (vermelho)\n\n`;

      if (criticalTime && criticalTime.alertCount > 0) {
        text += `⚠️ O horário das **${criticalTime.horario}** é o mais crítico, concentrando **${criticalTime.alertCount} alertas** com média de apenas **${criticalTime.media.toFixed(1)} alunos/prof**.`;
      }
    } else {
      text += `\n✅ **Excelente!** Nenhuma aula está operando abaixo da meta mínima neste período.`;
    }
    text += "\n\n";

    // BLOCO 3 - Destaques
    text += `🏆 **Destaques**\n`;
    if (bestTime) {
      text += `• Melhor horário: **${bestTime.horario}** com média de **${bestTime.media.toFixed(1)}** alunos/prof\n`;
    }

    if (topProfessor) {
      text += `• Professor mais ativo: **${topProfessor.nome}** com **${topProfessor.aulas} aulas** ministradas\n`;
    }

    // BLOCO 4 - Tendência (se houver dados suficientes)
    if (dailyStats.length >= 2) {
      const recentDays = dailyStats.slice(0, 3);
      const avgRecent = recentDays.reduce((acc, d) => acc + d.avgRatio, 0) / recentDays.length;
      
      text += `\n📈 **Tendência Recente**\n`;
      if (avgRecent > avgRatio) {
        text += `Os últimos dias mostram **melhora** na média (${avgRecent.toFixed(1)} vs ${avgRatio.toFixed(1)} geral).`;
      } else if (avgRecent < avgRatio - 0.5) {
        text += `Os últimos dias mostram **queda** na média (${avgRecent.toFixed(1)} vs ${avgRatio.toFixed(1)} geral). Recomenda-se atenção.`;
      } else {
        text += `A performance está **estável** nos últimos dias.`;
      }
    }

    return text;
  }, [analysis]);

  // Renderizar com destaque colorido
  const renderStyledText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={index} className="font-bold text-violet-400">
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md border-0 transition-all duration-300 hover:scale-105">
          <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
          Análise IA
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border text-foreground shadow-2xl">
        {/* HEADER */}
        <div className="p-6 border-b border-border bg-muted/10 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Bot className="w-7 h-7 text-violet-500" />
              Inteligência de Turnos
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base mt-2">
              Análise gerada automaticamente com base no período selecionado.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* CONTEÚDO COM SCROLL NATIVO */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
          {/* Estado de Loading/Analisando */}
          {isAnalyzing && (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in">
              <div className="p-4 bg-violet-500/10 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
              <h3 className="font-semibold text-lg mb-1 text-foreground">Analisando...</h3>
              <p className="text-sm text-center max-w-xs">
                Processando {data?.length || 0} aulas, alertas, performance por horário e ranking de professores.
              </p>
            </div>
          )}

          {/* Resultados da Análise */}
          {showResults && analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* BLOCO DE TEXTO DA ANÁLISE */}
              <div className="bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-violet-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">Diagnóstico do Período</h3>
                </div>

                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
                  {renderStyledText(aiText)}
                </p>
              </div>

              {/* GRID DE KPIs ANALÍTICOS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                {/* 1. Melhor Horário */}
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Melhor Horário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground">{analysis.bestTime?.horario || "-"}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Eficiência média: {analysis.bestTime?.media.toFixed(1) || "-"}
                    </p>
                  </CardContent>
                </Card>

                {/* 2. Horário Crítico */}
                <Card className="bg-card border-red-500/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-red-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Foco de Atenção
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground">{analysis.criticalTime?.horario || "-"}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Concentra <strong>{analysis.criticalTime?.alertCount || 0} alertas</strong>
                    </p>
                  </CardContent>
                </Card>

                {/* 3. Top Professor */}
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Mais Aulas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground truncate">
                      {analysis.topProfessor?.nome || "-"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analysis.topProfessor?.aulas || 0} aulas registradas
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Separator className="bg-border" />

              <div className="flex justify-center pb-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Dados processados a partir de {analysis.totalAulas} aulas filtradas.
                </p>
              </div>
            </div>
          ) : !isAnalyzing && (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-muted">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                <Bot className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Aguardando dados</h3>
              <p className="text-sm">Selecione um período com aulas no dashboard.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
