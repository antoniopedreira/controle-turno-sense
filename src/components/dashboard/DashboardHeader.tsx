import { Activity, RefreshCw, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export type FilterPeriod = 'today' | 'week' | 'month' | 'custom';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isLoading?: boolean;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  filterPeriod: FilterPeriod;
  onFilterPeriodChange: (period: FilterPeriod) => void;
}

export function DashboardHeader({ 
  onRefresh, 
  isLoading,
  dateRange,
  onDateRangeChange,
  filterPeriod,
  onFilterPeriodChange,
}: DashboardHeaderProps) {
  const today = new Date();

  const handlePeriodChange = (period: FilterPeriod) => {
    onFilterPeriodChange(period);
    
    switch (period) {
      case 'today':
        onDateRangeChange({ from: today, to: today });
        break;
      case 'week':
        onDateRangeChange({ 
          from: startOfWeek(today, { locale: ptBR }), 
          to: endOfWeek(today, { locale: ptBR }) 
        });
        break;
      case 'month':
        onDateRangeChange({ 
          from: startOfMonth(today), 
          to: endOfMonth(today) 
        });
        break;
      case 'custom':
        // Keep current range for custom
        break;
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Selecione um período';
    if (!dateRange.to) return format(dateRange.from, "dd 'de' MMMM", { locale: ptBR });
    return `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Activity className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Gestão da Arena
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDateRange()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filterPeriod} onValueChange={(v) => handlePeriodChange(v as FilterPeriod)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                onDateRangeChange(range);
                if (range) onFilterPeriodChange('custom');
              }}
              numberOfMonths={2}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Button 
          variant="outline" 
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </header>
  );
}
