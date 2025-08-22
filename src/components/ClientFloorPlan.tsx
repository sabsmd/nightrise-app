import React from "react";

export interface FloorElement {
  id: string;
  type: 'table' | 'entree' | 'bar' | 'piscine' | 'bed' | 'sofa' | 'piste' | 'dj_set' | 'scene';
  nom: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config?: any;
  couleur?: string;
}

interface ClientFloorPlanProps {
  elements: FloorElement[];
  onElementClick: (element: FloorElement) => void;
}

export default function ClientFloorPlan({
  elements,
  onElementClick
}: ClientFloorPlanProps) {

  const getElementStyle = (element: FloorElement) => {
    const baseStyles = {
      position: 'absolute' as const,
      left: `${element.position_x}px`,
      top: `${element.position_y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      cursor: ['table', 'bed', 'sofa'].includes(element.type) ? 'pointer' : 'default',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      border: '2px solid',
      userSelect: 'none' as const,
      transition: 'transform 0.2s, box-shadow 0.2s',
      minWidth: '40px',
      minHeight: '40px'
    };

    // If custom color is set, use it instead of default type styles
    if (element.couleur) {
      return {
        ...baseStyles,
        backgroundColor: element.couleur + '20', // Add transparency
        borderColor: element.couleur,
        color: element.couleur,
        borderStyle: element.type === 'entree' ? 'dashed' : 'solid'
      };
    }

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

  const isReservable = (type: string) => {
    return ['table', 'bed', 'sofa'].includes(type);
  };

  if (elements.length === 0) {
    return (
      <div className="relative bg-secondary/20 rounded-lg border-2 border-dashed border-border min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏗️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun plan disponible</h3>
          <p className="text-muted-foreground text-sm">Le plan de salle n'a pas encore été configuré pour cet événement</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative bg-secondary/20 rounded-lg border-2 border-dashed border-border min-h-[400px] md:min-h-[600px] overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border)/0.3) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border)/0.3) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}
    >
      {elements.map((element) => (
        <div
          key={element.id}
          style={getElementStyle(element)}
          onClick={() => onElementClick(element)}
          className={`
            group relative
            ${isReservable(element.type) ? 'hover:scale-105 hover:shadow-lg hover:shadow-primary/20' : ''}
            ${element.type === 'table' ? 'hover:shadow-primary/30' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">{getElementIcon(element.type)}</span>
            <span className="text-xs leading-tight">{element.nom}</span>
            {element.config?.prix && isReservable(element.type) && (
              <span className="text-xs bg-primary/20 px-1 rounded">
                {element.config.prix}€
              </span>
            )}
          </div>

          {/* Hover indicator for reservable elements */}
          {isReservable(element.type) && (
            <div className="absolute inset-0 border-2 border-primary rounded-lg opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" />
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border">
        <div className="text-xs font-medium mb-2">Légende:</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary/20 border border-primary rounded"></div>
            <span>Table / Bed / Sofa (cliquable)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-muted border border-border rounded"></div>
            <span>Autres éléments (info seulement)</span>
          </div>
        </div>
      </div>
    </div>
  );
}