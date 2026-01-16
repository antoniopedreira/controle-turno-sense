import { useMemo, useState } from "react";
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
import { Sparkles, TrendingUp, TrendingDown, Bot, CheckCircle2, AlertTriangle, Clock, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AulaData {
  data_aula: string;
  horario: string;
  professores: string;
  razao_aluno_prof: number;
  tipo_aula: string;
  qtd_alunos: number;
}

interface AIAnalysisDialogProps {
  data: AulaData[];
}

export function AIAnalysisDialog({ data }: AIAnalysisDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // --- 1. MOTOR DE ANÁLISE ---
  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    // A. Estatísticas Gerais
    const avgRatio = data.reduce((acc, curr) => acc + curr.razao_aluno_prof, 0) / data.length;

    // LÓGICA DE ALERTA (Sincronizada com o Dashboard)
    // VIP < 2 = Ruim
    // Geral < 3 = Ruim
    const isAlert = (a: AulaData) => {
      const isVip = a.tipo_aula.toUpperCase().includes("VIP");
      return isVip ? a.razao_aluno_prof < 2 : a.razao_aluno_prof < 3;
    };

    const alertsList = data.filter(isAlert);
    const alertsCount = alertsList.length;

    // B. Mapeamento de Horários
    const timeMap = new Map<string, { totalRatio: number; count: number; alertCount: number }>();
    const profMap = new Map<string, number>();

    data.forEach((aula) => {
      // Horários
      const currentH = timeMap.get(aula.horario) || { totalRatio: 0, count: 0, alertCount: 0 };
      timeMap.set(aula.horario, {
        totalRatio: currentH.totalRatio + aula.razao_aluno_prof,
        count: currentH.count + 1,
        alertCount: currentH.alertCount + (isAlert(aula) ? 1 : 0),
      });

      // Professores
      if (aula.professores) {
        const nomes = aula.professores.split(/,\s*|\s+e\s+/).filter((p) => p.trim().length > 0);
        nomes.forEach((nome) => {
          let cleanName = nome.trim();
          if (cleanName === "Peu") cleanName = "Peu Beck";
          const currentP = profMap.get(cleanName) || 0;
          profMap.set(cleanName, currentP + 1);
        });
      }
    });

    // Ranking de Horários
    const timeStats = Array.from(timeMap.entries()).map(([horario, stats]) => ({
      horario,
      media: stats.totalRatio / stats.count,
      alertCount: stats.alertCount,
    }));

    // Melhor Horário (Maior Média)
    const bestTime = [...timeStats].sort((a, b) => b.media - a.media)[0];

    // Horário Crítico (Mais Alertas > Menor Média)
    const criticalTime = [...timeStats].sort((a, b) => {
      if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount;
      return a.media - b.media;
    })[0];

    // Top Professor
    const topProfessor = Array.from(profMap.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      avgRatio,
      totalAulas: data.length,
      alertsCount,
      percentAlerts: ((alertsCount / data.length) * 100).toFixed(0),
      bestTime,
      criticalTime,
      topProfessor: topProfessor ? { nome: topProfessor[0], aulas: topProfessor[1] } : null,
    };
  }, [data]);

  // --- 2. GERADOR DE TEXTO ---
  const aiText = useMemo(() => {
    if (!analysis) return "Não há dados suficientes.";

    const { avgRatio, totalAulas, alertsCount, percentAlerts, bestTime, criticalTime, topProfessor } = analysis;

    let text = "";

    // BLOCO 1
    text += `Com base nos ${totalAulas} registros analisados, a média global é de **${avgRatio.toFixed(1)} alunos por professor**. `;

    if (avgRatio < 3.0) {
      text += `Este índice está **abaixo da meta ideal (3.0)**, indicando que a operação ainda não atingiu o ponto de equilíbrio desejado. `;
    } else {
      text += `A operação está **saudável e dentro da meta**, demonstrando boa eficiência na alocação de turmas. `;
    }
    text += "\n\n";

    // BLOCO 2
    if (alertsCount > 0) {
      text += `⚠️ Detectei **${alertsCount} aulas operando na zona de prejuízo ou baixa adesão** (${percentAlerts}% da grade). `;

      if (criticalTime.alertCount > 0) {
        text += `A atenção deve ser redobrada no horário das **${criticalTime.horario}**, que concentra **${criticalTime.alertCount} ocorrências negativas**. `;
        text += `Este horário específico apresenta uma média de apenas **${criticalTime.media.toFixed(1)} alunos/prof**, sendo o principal gargalo financeiro do período.`;
      } else {
        text += `Esses alertas estão distribuídos pela grade, sem concentração em um único horário específico.`;
      }
    } else {
      text += `✅ Excelente! Não detectei nenhuma aula operando abaixo da meta mínima neste período.`;
    }
    text += "\n\n";

    // BLOCO 3
    text += `Em contrapartida, o horário das **${bestTime.horario}** é a referência de eficiência, com média de **${bestTime.media.toFixed(1)}**. `;

    if (topProfessor) {
      text += `No corpo docente, **${topProfessor.nome}** lidera o volume de atividades com **${topProfessor.aulas} horas** registradas.`;
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
        {/* Substituímos ScrollArea por div com overflow-y-auto para garantir a barra de rolagem */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
          {analysis ? (
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
                    <div className="text-2xl font-bold text-card-foreground">{analysis.bestTime.horario}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Eficiência média: {analysis.bestTime.media.toFixed(1)}
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
                    <div className="text-2xl font-bold text-card-foreground">{analysis.criticalTime.horario}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Concentra <strong>{analysis.criticalTime.alertCount} alertas</strong>
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
                      {analysis.topProfessor?.aulas || 0} horas registradas
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
          ) : (
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
