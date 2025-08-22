import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ElementType {
  type: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const elementTypes: ElementType[] = [
  {
    type: 'table',
    name: 'Table',
    icon: '🪑',
    description: 'Table avec configuration',
    color: 'border-primary bg-primary/10'
  },
  {
    type: 'entree',
    name: 'Entrée',
    icon: '🚪',
    description: 'Point d\'entrée',
    color: 'border-green-500 bg-green-500/10'
  },
  {
    type: 'bar',
    name: 'Bar',
    icon: '🍹',
    description: 'Zone de bar',
    color: 'border-orange-500 bg-orange-500/10'
  },
  {
    type: 'piscine',
    name: 'Piscine',
    icon: '🏊',
    description: 'Espace piscine',
    color: 'border-blue-500 bg-blue-500/10'
  },
  {
    type: 'bed',
    name: 'Bed',
    icon: '🛏️',
    description: 'Zone bed/VIP',
    color: 'border-purple-500 bg-purple-500/10'
  },
  {
    type: 'sofa',
    name: 'Sofa',
    icon: '🛋️',
    description: 'Zone lounge',
    color: 'border-gray-500 bg-gray-500/10'
  },
  {
    type: 'piste',
    name: 'Piste',
    icon: '💃',
    description: 'Piste de danse',
    color: 'border-pink-500 bg-pink-500/10'
  },
  {
    type: 'dj_set',
    name: 'DJ Set',
    icon: '🎧',
    description: 'Zone DJ',
    color: 'border-black bg-black/10'
  },
  {
    type: 'scene',
    name: 'Scène',
    icon: '🎭',
    description: 'Scène/podium',
    color: 'border-yellow-500 bg-yellow-500/10'
  }
];

interface ElementPaletteProps {
  editMode: boolean;
}

export default function ElementPalette({ editMode }: ElementPaletteProps) {
  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    e.dataTransfer.setData('elementType', elementType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (!editMode) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Légende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {elementTypes.map((element) => (
              <div key={element.type} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{element.icon}</span>
                <span>{element.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Palette d'éléments</CardTitle>
        <p className="text-sm text-muted-foreground">
          Glissez les éléments sur le plan
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {elementTypes.map((element) => (
            <Button
              key={element.type}
              variant="outline"
              className={`
                h-auto p-3 flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing
                transition-all duration-200 hover:scale-105
                ${element.color}
              `}
              draggable
              onDragStart={(e) => handleDragStart(e, element.type)}
            >
              <span className="text-2xl">{element.icon}</span>
              <div className="text-center">
                <div className="font-medium text-sm">{element.name}</div>
                <div className="text-xs text-muted-foreground">
                  {element.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}