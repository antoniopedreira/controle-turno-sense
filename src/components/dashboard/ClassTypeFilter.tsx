import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClassTypeFilterProps {
  classTypes: string[];
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function ClassTypeFilter({ classTypes, selectedType, onTypeChange }: ClassTypeFilterProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Tipo de Aula:</span>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('all')}
          className={cn(
            'transition-all duration-200',
            selectedType === 'all' && 'shadow-lg shadow-primary/20'
          )}
        >
          Geral
        </Button>
        
        {classTypes.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange(type)}
            className={cn(
              'transition-all duration-200',
              selectedType === type && 'shadow-lg shadow-primary/20'
            )}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  );
}
