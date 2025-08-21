import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  Settings
} from "lucide-react";

export default function FloorPlan() {
  const [selectedEvent, setSelectedEvent] = useState("1");
  const [editMode, setEditMode] = useState(false);
  
  // Mock data
  const events = [
    { id: "1", name: "Pool Party VIP Summer" },
    { id: "2", name: "Latino Night Fever" },
    { id: "3", name: "Electronic House Session" }
  ];

  const tables = [
    {
      id: 1,
      name: "VIP 1",
      type: "VIP",
      capacity: 8,
      minSpend: 800,
      status: "occupied",
      x: 150,
      y: 100,
      currentSpend: 1200
    },
    {
      id: 2,
      name: "VIP 2",
      type: "VIP",
      capacity: 6,
      minSpend: 600,
      status: "reserved",
      x: 350,
      y: 100,
      currentSpend: 0
    },
    {
      id: 3,
      name: "Table 1",
      type: "Standard",
      capacity: 4,
      minSpend: 200,
      status: "available",
      x: 100,
      y: 250,
      currentSpend: 0
    },
    {
      id: 4,
      name: "Table 2",
      type: "Standard",
      capacity: 4,
      minSpend: 200,
      status: "occupied",
      x: 250,
      y: 250,
      currentSpend: 380
    },
    {
      id: 5,
      name: "Bar 1",
      type: "Bar",
      capacity: 10,
      minSpend: 0,
      status: "available",
      x: 400,
      y: 300,
      currentSpend: 0
    }
  ];

  const getTableColor = (status: string, type: string) => {
    if (type === "VIP") {
      switch (status) {
        case "occupied": return "bg-gradient-primary border-primary shadow-glow";
        case "reserved": return "bg-primary/20 border-primary border-2";
        case "available": return "bg-primary/10 border-primary border-dashed";
        default: return "bg-secondary border-border";
      }
    } else {
      switch (status) {
        case "occupied": return "bg-accent/80 border-accent shadow-accent-glow";
        case "reserved": return "bg-accent/20 border-accent border-2";
        case "available": return "bg-secondary border-border";
        default: return "bg-muted border-border";
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "occupied": return "Occupée";
      case "reserved": return "Réservée";
      case "available": return "Libre";
      default: return "Inconnue";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plan de salle</h1>
          <p className="text-muted-foreground">Gérez l'agencement et le statut de vos tables</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner un événement" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
            className={editMode ? "bg-accent text-accent-foreground" : ""}
          >
            {editMode ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
            {editMode ? "Sauvegarder" : "Modifier"}
          </Button>
          
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Floor Plan */}
        <div className="lg:col-span-3">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Plan interactif
                {editMode && (
                  <Badge variant="outline" className="ml-2 text-accent border-accent">
                    Mode édition
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-secondary/20 rounded-lg p-4 min-h-[500px] border-2 border-dashed border-border">
                {/* Stage/DJ Area */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-accent text-accent-foreground px-6 py-3 rounded-lg font-bold shadow-accent-glow">
                  🎵 DJ STAGE 🎵
                </div>
                
                {/* Bar Area */}
                <div className="absolute top-4 right-4 bg-muted text-muted-foreground px-4 py-2 rounded border-2 border-border">
                  BAR PRINCIPAL
                </div>
                
                {/* Tables */}
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`absolute w-24 h-24 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 ${getTableColor(table.status, table.type)}`}
                    style={{ left: table.x, top: table.y }}
                  >
                    <div className="text-center">
                      <div className="text-xs font-bold">{table.name}</div>
                      <div className="text-xs opacity-80">{table.capacity}p</div>
                      {table.status === "occupied" && (
                        <div className="text-xs font-bold">€{table.currentSpend}</div>
                      )}
                    </div>
                    
                    {editMode && (
                      <div className="absolute -top-2 -right-2 flex gap-1">
                        <Button size="sm" variant="outline" className="w-6 h-6 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="w-6 h-6 p-0 hover:bg-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Entrance */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500/20 text-green-400 px-6 py-2 rounded border-2 border-green-500/30">
                  🚪 ENTRÉE
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Details Panel */}
        <div className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Statut des tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-primary rounded"></div>
                  <span className="text-sm">VIP Occupée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary/20 border-2 border-primary rounded"></div>
                  <span className="text-sm">VIP Réservée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-accent/80 rounded"></div>
                  <span className="text-sm">Standard Occupée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary border border-border rounded"></div>
                  <span className="text-sm">Libre</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Tables occupées</span>
                    <span className="font-bold">3/5</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 mt-1">
                    <div className="bg-gradient-primary h-2 rounded-full" style={{ width: "60%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Taux de remplissage</span>
                    <span className="font-bold text-primary">60%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Revenus tables</span>
                    <span className="font-bold text-accent">€1,580</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  Vue 3D (bientôt)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}