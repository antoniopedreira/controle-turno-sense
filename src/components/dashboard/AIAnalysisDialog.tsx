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
import { ScrollArea } from "@/components/ui/scroll-area";
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
    const prejuizoCount = data.filter((a) => a.razao_aluno_prof < 2).length;
    const superlotadasCount = data.filter((a) => a.razao_aluno_prof > 4).length;

    // B. Agrupamento por Horário (Para média real do horário)
    const timeMap = new Map<string, { totalRatio: number; count: number }>();

    // C. Contagem de Horas por Professor
    const profMap = new Map<string, number>();

    data.forEach((aula) => {
      // B. Horários
      const currentH = timeMap.get(aula.horario) || { totalRatio: 0, count: 0 };
      timeMap.set(aula.horario, {
        totalRatio: currentH.totalRatio + aula.razao_aluno_prof,
        count: currentH.count + 1,
      });

      // C. Professores
      if (aula.professores) {
        const nomes = aula.professores.split(/,\s*|\s+e\s+/).filter((p) => p.trim().length > 0);
        nomes.forEach((nome) => {
          let cleanName = nome.trim();
          if (cleanName === "Peu") cleanName = "Peu Beck"; // Normalização
          const currentP = profMap.get(cleanName) || 0;
          profMap.set(cleanName, currentP + 1);
        });
      }
    });

    // Ranking de Horários (Média)
    const timeStats = Array.from(timeMap.entries())
      .map(([horario, stats]) => ({
        horario,
        media: stats.totalRatio / stats.count,
      }))
      .sort((a, b) => b.media - a.media);

    const bestTime = timeStats[0];
    const worstTime = timeStats[timeStats.length - 1];

    // Top Professor
    const topProfessor = Array.from(profMap.entries()).sort((a, b) => b[1] - a[1])[0]; // [Nome, Qtd]

    // Melhores/Piores Aulas Individuais
    const sortedByPerformance = [...data].sort((a, b) => b.razao_aluno_prof - a.razao_aluno_prof);

    return {
      avgRatio,
      totalAulas: data.length,
      prejuizoCount,
      superlotadasCount,
      bestTime, // Objeto {horario, media}
      worstTime, // Objeto {horario, media}
      topProfessor: topProfessor ? { nome: topProfessor[0], aulas: topProfessor[1] } : null,
      bestClassIndividual: sortedByPerformance[0], // Para o card
      worstClassIndividual: sortedByPerformance[sortedByPerformance.length - 1], // Para o card
    };
  }, [data]);

  // --- 2. GERADOR DE TEXTO (Limpo e Analítico) ---
  const aiText = useMemo(() => {
    if (!analysis) return "Não há dados suficientes para gerar uma análise.";

    const { avgRatio, totalAulas, prejuizoCount, bestTime, worstTime, topProfessor } = analysis;

    let text = "";

    // Introdução
    text += `Com base nos ${totalAulas} registros analisados, a média global de ocupação é de ${avgRatio.toFixed(1)} alunos por professor. `;

    if (avgRatio < 2.5) {
      text += `Este índice está abaixo do ideal, indicando capacidade ociosa significativa na grade. `;
    } else if (avgRatio > 4) {
      text += `O índice aponta alta demanda, sugerindo que a grade atual está próxima do limite. `;
    } else {
      text += `A operação demonstra equilíbrio saudável. `;
    }

    text += "\n\n";

    // Análise de Horários (Foco na dor)
    text += `Em relação aos turnos, o horário das ${worstTime.horario} requer atenção prioritária. `;
    text += `Ele apresenta a menor média de adesão (${worstTime.media.toFixed(1)} alunos/prof), sendo o principal gargalo de eficiência atual. `;
    text += `Em contrapartida, o horário das ${bestTime.horario} é o mais eficiente, com média de ${bestTime.media.toFixed(1)}.`;

    text += "\n\n";

    // Dados Financeiros/Operacionais
    if (prejuizoCount > 0) {
      text += `Foram identificadas ${prejuizoCount} aulas operando na zona de prejuízo (razão menor que 2). `;
      text += `Recomendo revisão imediata da estratégia para estas sessões específicas para evitar queima de caixa.`;
    }

    // Destaque Professor
    if (topProfessor) {
      text += `\n\nNo corpo docente, ${topProfessor.nome} lidera o volume de atividades, acumulando ${topProfessor.aulas} horas de aula neste período.`;
    }

    return text;
  }, [analysis]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md border-0 transition-all duration-300 hover:scale-105">
          <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
          Análise IA
        </Button>
      </DialogTrigger>

      {/* MUDANÇA VISUAL: Fundo Dark e Bordas Dark */}
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border text-foreground shadow-2xl">
        {/* HEADER */}
        <div className="p-6 border-b border-border bg-muted/10">
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

        {/* CONTEÚDO */}
        <ScrollArea className="flex-1 p-6 md:p-8 bg-background">
          {analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* BLOCO DE TEXTO DA ANÁLISE (Estilo Dark Clean) */}
              <div className="bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-violet-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">Diagnóstico do Período</h3>
                </div>

                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">{aiText}</p>
              </div>

              {/* GRID DE KPIs ANALÍTICOS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Melhor Horário (Média) */}
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
                      Média de {analysis.bestTime.media.toFixed(1)} alunos
                    </p>
                  </CardContent>
                </Card>

                {/* 2. Pior Horário (Média) */}
                <Card className="bg-card border-red-500/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-red-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Atenção Necessária
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground">{analysis.worstTime.horario}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Baixa média de {analysis.worstTime.media.toFixed(1)} alunos
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
