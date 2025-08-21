import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  visible: boolean;
}

export function ContextMenu({ x, y, onClose, onAction, visible }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const actions = [
    { id: "copy-to-end", label: "Скопировать до конца периода" },
    { id: "fill-5-2", label: "Заполнить график 5/2" },
    { id: "fill-2-2", label: "Заполнить график 2/2" },
  ];

  return (
    <Card
      ref={menuRef}
      className="fixed z-50 w-64 py-2 shadow-lg"
      style={{ left: x, top: y }}
      data-testid="context-menu"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => {
            onAction(action.id);
            onClose();
          }}
          data-testid={`context-action-${action.id}`}
          className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {action.label}
        </button>
      ))}
    </Card>
  );
}
