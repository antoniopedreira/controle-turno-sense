import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  UserCog,
  GraduationCap,
  AlertTriangle,
  History
} from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Reutilizando a interface (ou defina-a aqui se não estiver exportada globalmente)
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
  aulas: any[]; // Usando any para flexibilidade, mas o ideal é AulaAgrupada
}

export function FullHistoryDialog({ aulas }: FullHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<AulaFull | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtragem simples
  const filteredAulas = aulas.filter(aula => 
    aula.professores.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aula.tipo_aula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aula.horario.includes(searchTerm)
  );

  // Paginação
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredAulas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAulas = filteredAulas.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleRowClick = (aula: any) => {
    setSelectedAula(aula);
  };

  const handleBackToList = () => {
    setSelectedAula(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) setSelectedAula(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto gap-2 border-primary/20 hover:bg-primary/10">
          <History className="w-4 h-4 text-primary" />
          Ver Todas as Aulas ({aulas.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
        
        {/* HEADER DO MODAL */}
        <div className="p-6 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedAula ? (
                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent gap-2" onClick={handleBackToList}>
                  <ArrowLeft className="w-5 h-5" />
                  Voltar para Lista
                </Button>
              ) : (
                <>
                  <History className="w-5 h-5 text-primary" />
                  Histórico Completo do Período
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAula 
                ? `Detalhes de ${selectedAula.tipo_aula} - ${selectedAula.horario}`
                : "Visualize todas as aulas, alunos e professores registrados."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* CONTEÚDO (LISTA OU DETALHE) */}
        <div className="flex-1 overflow-hidden p-6 pt-4">
          
          {selectedAula ? (
            // === VISÃO DETALHADA (Igual ao AlertList) ===
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* Coordenador */}
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-full">
                  <UserCog className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Coordenador</p>
                  <p className="font-medium">{selectedAula.coordenador || 'Não informado'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Professores */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Professores</span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm border font-medium">
                    {selectedAula.professores}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: selectedAula.cor_indicadora }} />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <div 
                    className="p-3 rounded-lg text-sm font-medium border"
                    style={{ 
                      backgroundColor: `${selectedAula.cor_indicadora}15`, 
                      color: selectedAula.cor_indicadora,
                      borderColor: `${selectedAula.cor_indicadora}30`
                    }}
                  >
                    {selectedAula.status_aula}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lista de Alunos */}
              <div className="space-y-2 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Alunos Presentes</span>
                  </div>
                  <Badge variant="secondary">{selectedAula.lista_alunos?.length || 0}</Badge>
                </div>
                
                <ScrollArea className="h-[250px] w-full rounded-md border p-4 bg-muted/10">
                  {selectedAula.lista_alunos && selectedAula.lista_alunos.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedAula.lista_alunos.map((aluno: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-center gap-2 pb-2 border-b last:border-0 last:pb-0 border-border/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {aluno}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum aluno registrado nesta lista.
                    </p>
                  )}
                </ScrollArea>
              </div>
            </div>
          ) : (
            // === VISÃO DE LISTA (TABELA) ===
            <div className="flex flex-col h-full gap-4 animate-in slide-in-from-left-4 duration-300">
              {/* Barra de Busca */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por professor, tipo ou horário..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>

              {/* Tabela */}
              <div className="border rounded-md flex-1 overflow-hidden relative">
                 <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Professores</TableHead>
                        <TableHead className="text-right">Alunos</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentAulas.length > 0 ? (
                        currentAulas.map((aula, index) => (
                          <TableRow 
                            key={index} 
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleRowClick(aula)}
                          >
                            <TableCell className="font-medium text-xs text-muted-foreground">
                              {aula.data_aula.substring(0, 5)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{aula.horario}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal text-xs">
                                {aula.tipo_aula}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                              {aula.professores}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {aula.qtd_alunos}
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Nenhuma aula encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Pág {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
