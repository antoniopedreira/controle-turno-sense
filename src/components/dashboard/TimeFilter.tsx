import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

interface TimeFilterProps {
  times: string[];
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

export function TimeFilter({ times, selectedTime, onTimeChange }: TimeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
        <Clock className="w-4 h-4" />
        <span className="hidden sm:inline">Horários:</span>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-background/50">
        <div className="flex w-max space-x-2 p-2">
          <Button
            variant={selectedTime === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => onTimeChange("all")}
            className="rounded-full"
          >
            Todos
          </Button>
          
          {times.map((time) => (
            <Button
              key={time}
              variant={selectedTime === time ? "default" : "ghost"}
              size="sm"
              onClick={() => onTimeChange(time)}
              className="rounded-full"
            >
              {time}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
