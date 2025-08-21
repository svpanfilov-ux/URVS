import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { QualityRating } from "./quality-rating";
import { ContextMenu } from "@/components/modals/context-menu";

interface TimesheetCellProps {
  value: string | number;
  qualityScore?: number;
  isLocked?: boolean;
  onChange: (value: string | number, qualityScore?: number) => void;
  onContextMenu?: (action: string) => void;
}

export function TimesheetCell({ 
  value, 
  qualityScore = 3, 
  isLocked = false, 
  onChange, 
  onContextMenu 
}: TimesheetCellProps) {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [localValue, setLocalValue] = useState(value);
  const cellRef = useRef<HTMLDivElement>(null);

  const handleRightClick = (e: React.MouseEvent) => {
    if (isLocked) return;
    
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleChange = (newValue: string) => {
    if (isLocked) return;
    
    setLocalValue(newValue);
    
    // Handle special cases
    if (newValue === "Б" || newValue === "О" || newValue === "НН" || newValue === "У") {
      onChange(newValue);
    } else {
      const numValue = parseInt(newValue);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 24) {
        onChange(numValue, qualityScore);
      }
    }
  };

  const handleQualityChange = (score: number) => {
    if (isLocked || typeof value !== "number") return;
    onChange(value, score);
  };

  const handleContextAction = (action: string) => {
    if (onContextMenu) {
      onContextMenu(action);
    }
  };

  const isNumeric = typeof value === "number";
  const displayValue = value?.toString() || "";

  // Determine cell background color based on value type and quality
  let cellClass = "text-center relative";
  
  if (isLocked) {
    cellClass += " bg-gray-200 dark:bg-gray-700 text-gray-500 pointer-events-none";
  } else if (value === "Б") {
    cellClass += " bg-blue-100 dark:bg-blue-900/20";
  } else if (value === "О") {
    cellClass += " bg-purple-100 dark:bg-purple-900/20";
  } else if (value === "НН") {
    cellClass += " bg-gray-100 dark:bg-gray-800";
  } else if (value === "У") {
    cellClass += " bg-red-100 dark:bg-red-900/20";
  } else if (isNumeric && qualityScore) {
    // Color based on quality score
    const qualityColors = {
      1: "bg-red-100 dark:bg-red-900/20",
      2: "bg-orange-100 dark:bg-orange-900/20", 
      3: "bg-yellow-100 dark:bg-yellow-900/20",
      4: "bg-green-100 dark:bg-green-900/20"
    };
    cellClass += " " + qualityColors[qualityScore as keyof typeof qualityColors];
  }

  return (
    <div 
      ref={cellRef}
      className={cellClass}
      onContextMenu={handleRightClick}
      data-testid="timesheet-cell"
    >
      {isNumeric || ["Б", "О", "НН", "У"].includes(displayValue) ? (
        <div className="p-2">
          <div className="text-sm font-medium">{displayValue}</div>
          {isNumeric && !isLocked && (
            <QualityRating
              score={qualityScore}
              onChange={handleQualityChange}
              size="sm"
            />
          )}
        </div>
      ) : (
        <Input
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isLocked}
          className="w-12 h-8 text-center text-sm border-0 bg-transparent"
          placeholder="—"
          data-testid="timesheet-input"
        />
      )}

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        onAction={handleContextAction}
      />
    </div>
  );
}
