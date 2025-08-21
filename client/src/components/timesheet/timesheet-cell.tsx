import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface TimesheetCellProps {
  value?: string | number;
  qualityScore?: number;
  isLocked?: boolean;
  isTerminated?: boolean;
  employeeId?: string;
  date?: string;
  onChange: (value: string | number, qualityScore?: number) => void;
  onClearRow?: () => void;
  onFillToEnd?: () => void;
  onFill5_2?: () => void;
  onFill2_2?: () => void;
}

export function TimesheetCell({ 
  value, 
  qualityScore = 3, 
  isLocked = false, 
  isTerminated = false,
  employeeId,
  date,
  onChange, 
  onClearRow,
  onFillToEnd,
  onFill5_2,
  onFill2_2
}: TimesheetCellProps) {
  const [localValue, setLocalValue] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value.toString());
    } else {
      setLocalValue("");
    }
  }, [value]);

  const handleCellClick = () => {
    if (isLocked || isTerminated) return;
    setEditing(true);
    // Set current value for editing
    setLocalValue(value?.toString() || "");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.toUpperCase();
    
    // Handle special case for НН
    if (inputValue === "Н" || inputValue === "НН") {
      inputValue = "НН";
    }
    
    // Allow only valid characters
    if (inputValue.match(/^[0-9БОННУ]*$/)) {
      setLocalValue(inputValue);
    }
  };

  const handleInputBlur = () => {
    setEditing(false);
    processValue(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditing(false);
      processValue(localValue);
    } else if (e.key === 'Escape') {
      setEditing(false);
      setLocalValue(value?.toString() || "");
    }
  };

  const processValue = (inputValue: string) => {
    if (!inputValue.trim()) {
      // Empty value - reset to default dash
      setLocalValue("");
      onChange("", undefined);
      return;
    }

    // Handle letter codes (ensure uppercase)
    const upperValue = inputValue.toUpperCase();
    if (["Б", "О", "НН", "У"].includes(upperValue)) {
      onChange(upperValue, undefined);
      return;
    }

    // Handle numeric values (1-24)
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 24) {
      onChange(numValue, 3); // Default quality score of 3
      return;
    }

    // Invalid input - revert
    setLocalValue(value?.toString() || "");
  };

  const handleQualityChange = (newQuality: number) => {
    if (typeof value === "number") {
      onChange(value, newQuality);
    }
  };

  // Determine cell styling
  const getCellClass = () => {
    let classes = "w-7 h-8 border border-gray-300 dark:border-gray-600 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ";
    
    if (isTerminated) {
      classes += "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 ";
    } else if (isLocked) {
      classes += "bg-gray-100 dark:bg-gray-700 cursor-not-allowed ";
    } else if (value === "Б") {
      classes += "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 ";
    } else if (value === "О") {
      classes += "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 ";
    } else if (value === "НН") {
      classes += "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ";
    } else if (value === "У") {
      classes += "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 ";
    } else if (typeof value === "number" && qualityScore) {
      // Quality-based coloring
      const qualityColors = {
        1: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
        2: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200", 
        3: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
        4: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
      };
      classes += qualityColors[qualityScore as keyof typeof qualityColors] + " ";
    }
    
    return classes;
  };

  const displayValue = isTerminated ? "У" : (value !== undefined ? value.toString() : "—");

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          className={getCellClass()}
          onClick={handleCellClick}
          data-testid="timesheet-cell"
        >
          {editing ? (
            <Input
              ref={inputRef}
              value={localValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full text-center text-[10px] border-0 bg-transparent p-0 focus:ring-0"
              maxLength={3}
              data-testid="timesheet-input"
            />
          ) : (
            <div 
              className="text-center text-[10px] font-medium p-1 cursor-pointer leading-tight"
              onClick={handleCellClick}
            >
              {displayValue}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      
      {!isLocked && !isTerminated && (
        <ContextMenuContent>
          {typeof value === "number" && (
            <>
              <ContextMenuItem onClick={() => handleQualityChange(1)}>
                Оценка 1 (Плохо)
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleQualityChange(2)}>
                Оценка 2 (Удовлетворительно)
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleQualityChange(3)}>
                Оценка 3 (Хорошо)
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleQualityChange(4)}>
                Оценка 4 (Отлично)
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          
          <ContextMenuItem onClick={onClearRow} data-testid="context-clear-row">
            Очистить строку
          </ContextMenuItem>
          
          <ContextMenuItem onClick={onFillToEnd} data-testid="context-fill-to-end">
            Заполнить до конца периода
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem onClick={onFill5_2} data-testid="context-fill-5-2">
            Заполнить по графику 5/2
          </ContextMenuItem>
          
          <ContextMenuItem onClick={onFill2_2} data-testid="context-fill-2-2">
            Заполнить по графику 2/2
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
