import { useState } from "react";
import { AlertTriangle, Calendar, Clock, Users } from "lucide-react";
import { AulaAlerta } from "@/data/mockDashboardData";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface AlertListProps {
  aulas: AulaAlerta[];
}

export function AlertList({ aulas }: AlertListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cálculos da paginação
  const totalPages = Math.ceil(aulas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAulas = aulas.slice(startIndex, startIndex + itemsPerPage);

  // Função para mudar de página
  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do link
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
    <div className="dashboard-section opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title text-danger">
            <AlertTriangle className="w-5 h-5" />
            Aulas que precisam de Atenção
          </h2>
          <p className="section-subtitle">Clique em uma aula para ver detalhes e tomar ação</p>
        </div>
        {/* Mostra contador discreto se houver paginação */}
        {totalPages > 1 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Pág {currentPage} de {totalPages}
          </span>
        )}
      </div>

      <div className="space-y-3 min-h-[300px]">
        {" "}
        {/* Altura mínima para evitar pulo de layout */}
        {currentAulas.map((aula, index) => (
          <div
            key={aula.id}
            className="alert-row opacity-0 animate-fade-in cursor-pointer"
            style={{ animationDelay: `${100 + index * 50}ms` }} // Delay mais rápido para transição de página
          >
            <div className="flex items-center gap-6 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{aula.data}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{aula.horario}</span>
              </div>

              <div className="flex items-center gap-2 text-sm flex-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{aula.professores}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-danger">{aula.qtdAlunos}</span>
                <span className="text-muted-foreground">alunos</span>
              </div>
            </div>

            <span className="status-badge status-danger ml-4">{aula.status.replace("🔴 ", "")}</span>
          </div>
        ))}
      </div>

      {/* Componente de Paginação */}
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

              {/* Gera os números das páginas */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Lógica simples para não mostrar muitos números se houver muitas páginas
                // Mostra: Primeira, Última, Atual, e vizinhos da Atual
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
                  // Renderiza reticências (...) se pulou números
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
  );
}
