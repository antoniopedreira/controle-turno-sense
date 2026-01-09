import { useState } from "react";
import { AlertTriangle, Calendar, Clock, Users, UserCog, GraduationCap } from "lucide-react";
import { AulaAlerta } from "@/data/mockDashboardData";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Estendemos a interface para incluir os campos novos que mandamos do Index
interface AulaDetalhada extends AulaAlerta {
  tipo?: string;
  coordenador?: string;
  listaAlunos?: string[];
}

interface AlertListProps {
  aulas: AulaDetalhada[];
}

export function AlertList({ aulas }: AlertListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAula, setSelectedAula] = useState<AulaDetalhada | null>(null); // Estado para o modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = 5;

  const totalPages = Math.ceil(aulas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAulas = aulas.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAulaClick = (aula: AulaDetalhada) => {
    setSelectedAula(aula);
    setIsModalOpen(true);
  };

  if (aulas.length === 0) {
    return (
      <div className="dashboard-section">
        <h2 className="section-title">
          <AlertTriangle className="w-5 h-5 text-success" />
          Tudo certo!
        </h2>
        <p className="section-subtitle">Nenhuma aula precisa de atenção no momento. 🎉</p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-section opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title text-danger">
              <AlertTriangle className="w-5 h-5" />
              Aulas que precisam de Atenção
            </h2>
            <p className="section-subtitle">Clique em uma aula para ver detalhes completos</p>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Pág {currentPage} de {totalPages}
            </span>
          )}
        </div>

        <div className="space-y-3 min-h-[300px]">
          {currentAulas.map((aula, index) => (
            <div
              key={aula.id}
              onClick={() => handleAulaClick(aula)}
              className="alert-row opacity-0 animate-fade-in cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ animationDelay: `${100 + index * 50}ms` }}
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-2 text-sm w-24">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{aula.data}</span>
                </div>

                <div className="flex items-center gap-2 text-sm w-16">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{aula.horario}</span>
                </div>

                <div className="flex items-center gap-2 text-sm flex-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate max-w-[200px]">{aula.professores}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-danger">{aula.qtdAlunos}</span>
                  <span className="text-muted-foreground hidden sm:inline">alunos</span>
                </div>
              </div>

              <Badge variant="outline" className="ml-4 border-red-500/50 text-red-500">
                {aula.status.replace("🔴 ", "")}
              </Badge>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => handlePageChange(currentPage - 1, e)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => handlePageChange(page, e)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <span className="px-2 text-muted-foreground">...</span>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => handlePageChange(currentPage + 1, e)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DA AULA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-primary">{selectedAula?.tipo || "Aula"}</span>
              <span className="text-muted-foreground text-base font-normal">
                - {selectedAula?.data} às {selectedAula?.horario}
              </span>
            </DialogTitle>
            <DialogDescription>Detalhes completos do turno e participantes.</DialogDescription>
          </DialogHeader>

          {selectedAula && (
            <div className="grid gap-4 py-4">
              {/* Coordenador */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <UserCog className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Coordenador</p>
                  <p className="font-medium">{selectedAula.coordenador || "Não informado"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Professores */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Professores</span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm">{selectedAula.professores}</div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-danger" />
                    <span className="text-sm font-medium">Situação</span>
                  </div>
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium border border-red-500/20">
                    {selectedAula.status}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lista de Alunos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Alunos Presentes</span>
                  </div>
                  <Badge variant="secondary">{selectedAula.listaAlunos?.length || 0}</Badge>
                </div>

                <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/10">
                  {selectedAula.listaAlunos && selectedAula.listaAlunos.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedAula.listaAlunos.map((aluno, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-center gap-2 pb-2 border-b last:border-0 last:pb-0 border-border/50"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {aluno}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluno listado.</p>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
