import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, Medal } from "lucide-react";

export interface ProfessorStats {
  nome: string;
  totalAlunos: number; // Mantido na interface para compatibilidade, mas ignorado no visual
  horasPagas: number;
}

interface ProfessorRankingProps {
  data: ProfessorStats[];
}

export function ProfessorRanking({ data }: ProfessorRankingProps) {
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
        <div className="space-y-4">
          {data.map((professor, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${professor.nome}`} />
                    <AvatarFallback>{professor.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-white">
                      <Medal className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="font-semibold text-sm leading-none mb-1 group-hover:text-primary transition-colors">
                    {professor.nome}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded">#{index + 1}</span>
                  </div>
                </div>
              </div>

              {/* Apenas Horas Pagas */}
              <div className="flex items-center gap-4 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Horas Pagas <Clock className="w-3 h-3" />
                  </span>
                  <span className="font-bold text-lg text-primary">{professor.horasPagas}h</span>
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
