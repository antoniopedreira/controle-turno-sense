import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock } from "lucide-react";

export interface ProfessorStats {
  nome: string;
  totalAlunos: number;
  horasPagas: number;
}

interface ProfessorRankingProps {
  data: ProfessorStats[];
}

export function ProfessorRanking({ data }: ProfessorRankingProps) {
  // Função auxiliar para renderizar o troféu ou a posição
  const renderRankIcon = (index: number) => {
    if (index === 0) {
      // Ouro
      return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500 filter drop-shadow-sm" />;
    }
    if (index === 1) {
      // Prata
      return <Trophy className="w-6 h-6 text-slate-400 fill-slate-400 filter drop-shadow-sm" />;
    }
    if (index === 2) {
      // Bronze
      return <Trophy className="w-6 h-6 text-orange-500 fill-orange-500 filter drop-shadow-sm" />;
    }
    // Para o 4º lugar em diante, mostra apenas o número discreto
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted/50 border border-muted font-medium text-xs text-muted-foreground">
        #{index + 1}
      </div>
    );
  };

  return (
    <Card className="col-span-1 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Ranking de Horas
        </CardTitle>
        <p className="text-sm text-muted-foreground">Top professores por horas trabalhadas no período</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((professor, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-all group
                ${index < 3 ? "bg-card shadow-sm border-border/50 hover:border-primary/30" : "bg-transparent border-transparent hover:bg-muted/30"}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Ícone de Troféu / Posição */}
                <div className="shrink-0 flex items-center justify-center w-8">{renderRankIcon(index)}</div>

                {/* Nome do Professor e Título */}
                <div className="flex flex-col">
                  <span
                    className={`font-semibold ${index < 3 ? "text-base" : "text-sm text-foreground group-hover:text-primary"}`}
                  >
                    {professor.nome}
                  </span>
                  {index < 3 && (
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider
                        ${index === 0 ? "text-yellow-600" : index === 1 ? "text-slate-500" : "text-orange-600"}
                      `}
                    >
                      {index === 0 ? "Líder" : index === 1 ? "Vice-Líder" : "Top 3"}
                    </span>
                  )}
                </div>
              </div>

              {/* Horas Pagas */}
              <div className="flex items-center gap-2 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase text-muted-foreground font-medium">Horas</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-bold text-lg tabular-nums text-primary">{professor.horasPagas}h</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Nenhum dado disponível para o período.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
