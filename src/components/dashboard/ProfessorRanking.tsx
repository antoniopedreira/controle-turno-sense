import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, Medal } from "lucide-react";

export interface ProfessorStats {
  nome: string;
  totalAlunos: number;
  horasPagas: number;
}

interface ProfessorRankingProps {
  data: ProfessorStats[];
}

export function ProfessorRanking({ data }: ProfessorRankingProps) {
  // Função auxiliar para renderizar a medalha ou a posição
  const renderRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 border border-yellow-200 shadow-sm">
          <Medal className="w-5 h-5 text-yellow-600 fill-current" />
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shadow-sm">
          <Medal className="w-5 h-5 text-slate-500 fill-current" />
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 border border-orange-200 shadow-sm">
          <Medal className="w-5 h-5 text-orange-600 fill-current" />
        </div>
      );
    }
    // Para o 4º lugar em diante, mostra apenas o número discreto
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted border border-transparent font-medium text-sm text-muted-foreground">
        #{index + 1}
      </div>
    );
  };

  return (
    <Card className="col-span-1 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
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
                flex items-center justify-between p-3 rounded-lg border transition-all
                ${index < 3 ? "bg-card shadow-sm border-primary/20" : "bg-transparent border-transparent hover:bg-muted/50"}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Badge de Posição / Medalha */}
                <div className="shrink-0">{renderRankBadge(index)}</div>

                {/* Nome do Professor */}
                <div className="flex flex-col">
                  <span className={`font-semibold ${index < 3 ? "text-base text-primary" : "text-sm text-foreground"}`}>
                    {professor.nome}
                  </span>
                  {index < 3 && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
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
                    <span className="font-bold text-lg tabular-nums">{professor.horasPagas}h</span>
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
