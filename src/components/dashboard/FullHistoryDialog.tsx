import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calendar,
  Users,
  Search,
  ChevronRight,
  ArrowLeft,
  UserCog,
  GraduationCap,
  AlertTriangle,
  History,
  User,
  CalendarDays,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AulaFull {
  aula_id: string;
  data_aula: string;
  horario: string;
  tipo_aula: string;
  professores: string;
  qtd_alunos: number;
  status_aula: string;
  cor_indicadora: string;
  coordenador?: string;
  lista_alunos?: string[];
}

interface FullHistoryDialogProps {
  aulas: any[];
  dateRange?: DateRange;
}

export function FullHistoryDialog({ aulas, dateRange }: FullHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<AulaFull | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("aulas");

  // --- LÓGICA DA ABA AULAS ---
  const filteredAulas = aulas.filter(
    (aula) =>
      aula.professores.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aula.tipo_aula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aula.horario.includes(searchTerm),
  );

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredAulas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAulas = filteredAulas.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // --- LÓGICA DA ABA ALUNOS ---
  const studentStats = useMemo(() => {
    const stats = new Map<string, number>();

    aulas.forEach((aula) => {
      if (aula.lista_alunos && Array.isArray(aula.lista_alunos)) {
        aula.lista_alunos.forEach((aluno: string) => {
          const current = stats.get(aluno) || 0;
          stats.set(aluno, current + 1);
        });
      }
    });

    return Array.from(stats.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [aulas, searchTerm]);

  // --- LÓGICA DO CABEÇALHO ---
  const formatPeriodo = () => {
    if (!dateRange?.from) return "Todo o Período";
    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      return format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    return `${format(dateRange.from, "dd/MM/yyyy")} até ${format(dateRange.to, "dd/MM/yyyy")}`;
  };

  const diasComAula = useMemo(() => {
    const diasUnicos = new Set(aulas.map((a) => a.data_aula));
    return diasUnicos.size;
  }, [aulas]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedAula(null);
      setSearchTerm("");
      setActiveTab("aulas");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto gap-2 border-primary/20 hover:bg-primary/10">
          <History className="w-4 h-4 text-primary" />
          Ver Histórico Completo
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* HEADER FIXO */}
        <div className="p-6 pb-4 border-b bg-background z-10">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedAula ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:bg-transparent gap-2"
                  onClick={() => setSelectedAula(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar para Lista
                </Button>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <span>Visão Geral: {formatPeriodo()}</span>
                  </div>
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAula ? (
                "Detalhes completos do turno selecionado."
              ) : (
                <span className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Foram realizadas <strong>{aulas.length} aulas</strong> em <strong>{diasComAula} dias</strong> de
                  atividade.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {!selectedAula && (
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="aulas" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Aulas ({aulas.length})
                  </TabsTrigger>
                  <TabsTrigger value="alunos" className="gap-2">
                    <Users className="w-4 h-4" />
                    Alunos ({studentStats.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "aulas" ? "Buscar aula..." : "Buscar aluno..."}
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-hidden bg-muted/5 relative">
          {selectedAula ? (
            // === VISÃO DETALHADA DA AULA ===
            <div className="h-full flex flex-col p-6 animate-in slide-in-from-right-10 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
                <div className="p-4 bg-background rounded-lg border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserCog className="w-4 h-4" />
                    <span className="text-sm font-medium uppercase">Coordenador</span>
                  </div>
                  <p className="text-lg font-semibold">{selectedAula.coordenador || "Não informado"}</p>
                </div>

                <div className="p-4 bg-background rounded-lg border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium uppercase">Status</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-sm px-3 py-1"
                    style={{
                      borderColor: selectedAula.cor_indicadora,
                      color: selectedAula.cor_indicadora,
                      backgroundColor: `${selectedAula.cor_indicadora}10`,
                    }}
                  >
                    {selectedAula.status_aula}
                  </Badge>
                </div>

                <div className="md:col-span-2 p-4 bg-background rounded-lg border shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm font-medium uppercase">Professores</span>
                  </div>
                  <p className="text-base font-medium">{selectedAula.professores}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-background rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-muted/10">
                  <div className="flex items-center gap-2 font-semibold">
                    <Users className="w-4 h-4 text-primary" />
                    Alunos Presentes
                  </div>
                  <Badge variant="secondary">{selectedAula.lista_alunos?.length || 0}</Badge>
                </div>

                <ScrollArea className="flex-1 p-0">
                  <div className="p-4">
                    {selectedAula.lista_alunos && selectedAula.lista_alunos.length > 0 ? (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedAula.lista_alunos.map((aluno: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                            <span className="truncate">{aluno}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                        <Users className="w-8 h-8 mb-2 opacity-20" />
                        Nenhum aluno registrado.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            // === CONTEÚDO DAS ABAS (LISTA) ===
            <div className="h-full p-6 pt-2">
              <Tabs value={activeTab} className="h-full flex flex-col">
                <TabsContent value="aulas" className="h-full mt-0 flex flex-col gap-4 animate-in fade-in-50">
                  <div className="border rounded-md bg-background flex-1 overflow-hidden shadow-sm">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                          <TableRow>
                            <TableHead className="w-[60px]">Hora</TableHead>
                            <TableHead className="w-[80px]">Data</TableHead>
                            <TableHead className="w-[100px]">Tipo</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead> {/* Nova Coluna */}
                            <TableHead>Professores</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentAulas.length > 0 ? (
                            currentAulas.map((aula, index) => (
                              <TableRow
                                key={index}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setSelectedAula(aula)}
                              >
                                <TableCell className="font-medium font-mono text-xs">{aula.horario}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {aula.data_aula.substring(0, 5)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wide">
                                    {aula.tipo_aula}
                                  </Badge>
                                </TableCell>
                                {/* Célula do Status com Badge Colorida */}
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] whitespace-nowrap px-2 py-0.5 border"
                                    style={{
                                      borderColor: aula.cor_indicadora,
                                      color: aula.cor_indicadora,
                                      backgroundColor: `${aula.cor_indicadora}10`,
                                    }}
                                  >
                                    {aula.status_aula}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm max-w-[180px] truncate text-muted-foreground">
                                  {aula.professores}
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm">{aula.qtd_alunos}</TableCell>
                                <TableCell>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                Nenhuma aula encontrada para o filtro.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between shrink-0 bg-background p-2 rounded-lg border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground font-medium">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="alunos" className="h-full mt-0 animate-in fade-in-50">
                  <div className="h-full border rounded-md bg-background shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 border-b bg-muted/10 text-xs font-medium text-muted-foreground flex justify-between">
                      <span>NOME DO ALUNO</span>
                      <span>TOTAL ALUNOS: {studentStats.length}</span>
                    </div>

                    <ScrollArea className="flex-1">
                      {studentStats.length > 0 ? (
                        <div className="divide-y">
                          {studentStats.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                              <Badge variant="secondary" className="font-normal text-xs">
                                {item.count} {item.count === 1 ? "aula" : "aulas"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <Users className="w-10 h-10 mb-2 opacity-20" />
                          <p>Nenhum aluno encontrado.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
