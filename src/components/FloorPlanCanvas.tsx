import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";

export interface FloorElement {
  id: string;
  type: 'table' | 'entree' | 'bar' | 'piscine' | 'bed' | 'sofa' | 'piste' | 'dj_set' | 'scene';
  nom: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config?: any;
}

interface FloorPlanCanvasProps {
  elements: FloorElement[];
  selectedEvent: string;
  editMode: boolean;
  onElementMove: (id: string, x: number, y: number) => void;
  onElementDelete: (id: string) => void;
  onElementClick: (element: FloorElement) => void;
  onCanvasDrop: (elementType: string, x: number, y: number) => void;
}

const GRID_SIZE = 20;

export default function FloorPlanCanvas({
  elements,
  selectedEvent,
  editMode,
  onElementMove,
  onElementDelete,
  onElementClick,
  onCanvasDrop
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getElementStyle = (element: FloorElement) => {
    const baseStyles = {
      position: 'absolute' as const,
      left: `${element.position_x}px`,
      top: `${element.position_y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      cursor: editMode ? 'move' : 'pointer',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      border: '2px solid',
      userSelect: 'none' as const,
      transition: 'transform 0.2s, box-shadow 0.2s'
    };

    const typeStyles = {
      table: {
        backgroundColor: 'hsl(var(--primary)/0.1)',
        borderColor: 'hsl(var(--primary))',
        color: 'hsl(var(--primary))'
      },
      entree: {
        backgroundColor: 'hsl(142 76% 36%/0.1)',
        borderColor: 'hsl(142 76% 36%)',
        borderStyle: 'dashed',
        color: 'hsl(142 76% 36%)'
      },
      bar: {
        backgroundColor: 'hsl(var(--muted))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--muted-foreground))'
      },
      piscine: {
        backgroundColor: 'hsl(200 100% 85%)',
        borderColor: 'hsl(200 100% 50%)',
        color: 'hsl(200 100% 30%)'
      },
      bed: {
        backgroundColor: 'hsl(var(--background))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--foreground))'
      },
      sofa: {
        backgroundColor: 'hsl(0 0% 60%/0.2)',
        borderColor: 'hsl(0 0% 40%)',
        color: 'hsl(0 0% 20%)'
      },
      piste: {
        backgroundColor: 'hsl(270 100% 70%/0.2)',
        borderColor: 'hsl(270 100% 50%)',
        color: 'hsl(270 100% 30%)'
      },
      dj_set: {
        backgroundColor: 'hsl(0 0% 10%)',
        borderColor: 'hsl(0 0% 30%)',
        color: 'hsl(0 0% 90%)'
      },
      scene: {
        backgroundColor: 'hsl(45 100% 50%/0.2)',
        borderColor: 'hsl(45 100% 40%)',
        color: 'hsl(45 100% 20%)'
      }
    };

    return { ...baseStyles, ...typeStyles[element.type] };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (!editMode) return;
    
    e.preventDefault();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - element.position_x,
      y: e.clientY - element.position_y
    });
    setDraggedElement(elementId);
  }, [editMode, elements]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedElement || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(
      canvasRect.width - 80,
      Math.round((e.clientX - canvasRect.left - dragOffset.x) / GRID_SIZE) * GRID_SIZE
    ));
    const newY = Math.max(0, Math.min(
      canvasRect.height - 80,
      Math.round((e.clientY - canvasRect.top - dragOffset.y) / GRID_SIZE) * GRID_SIZE
    ));

    onElementMove(draggedElement, newX, newY);
  }, [draggedElement, dragOffset, onElementMove]);

  const handleMouseUp = useCallback(() => {
    setDraggedElement(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Attach global mouse events
  React.useEffect(() => {
    if (draggedElement) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedElement, handleMouseMove, handleMouseUp]);

  // Handle drag and drop from palette
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!editMode || !canvasRef.current) return;

    const elementType = e.dataTransfer.getData('elementType');
    if (!elementType) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - canvasRect.left) / GRID_SIZE) * GRID_SIZE;
    const y = Math.round((e.clientY - canvasRect.top) / GRID_SIZE) * GRID_SIZE;

    onCanvasDrop(elementType, x, y);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getElementIcon = (type: string) => {
    const icons = {
      table: '🪑',
      entree: '🚪',
      bar: '🍹',
      piscine: '🏊',
      bed: '🛏️',
      sofa: '🛋️',
      piste: '💃',
      dj_set: '🎧',
      scene: '🎭'
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  if (!selectedEvent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/20 rounded-lg border-2 border-dashed border-border min-h-[600px]">
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Sélectionnez un événement</h3>
          <p className="text-muted-foreground">Choisissez un événement pour commencer à créer votre plan de salle</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="relative bg-secondary/20 rounded-lg border-2 border-dashed border-border min-h-[600px] overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border)/0.3) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border)/0.3) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
      }}
    >
      {elements.map((element) => (
        <div
          key={element.id}
          style={getElementStyle(element)}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
          onClick={() => !draggedElement && onElementClick(element)}
          className={`
            group relative
            ${draggedElement === element.id ? 'scale-105 shadow-lg z-10' : 'hover:scale-105 hover:shadow-md'}
            ${element.type === 'table' ? 'hover:shadow-primary/20' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">{getElementIcon(element.type)}</span>
            <span className="text-xs leading-tight">{element.nom}</span>
          </div>

          {editMode && (
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="w-6 h-6 p-0 bg-background hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  onElementClick(element);
                }}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-6 h-6 p-0 bg-background hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onElementDelete(element.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🏗️</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Plan vierge</h3>
            <p className="text-muted-foreground mb-4">
              {editMode ? "Glissez des éléments depuis la palette pour commencer" : "Aucun élément configuré pour cet événement"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}