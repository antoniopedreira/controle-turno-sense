import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ClassTypeFilterProps {
  classTypes: string[];
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function ClassTypeFilter({ classTypes, selectedType, onTypeChange }: ClassTypeFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md bg-transparent">
      <div className="flex w-max space-x-2 p-1">
        <Button
          variant={selectedType === "all" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onTypeChange("all")}
          className="rounded-full h-7 text-xs font-medium"
        >
          Todos
        </Button>

        {classTypes.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onTypeChange(type)}
            className="rounded-full h-7 text-xs font-medium"
          >
            {type}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  );
}
