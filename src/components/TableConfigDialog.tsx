import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloorElement } from "./FloorPlanCanvas";

interface TableConfigDialogProps {
  element: FloorElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (element: FloorElement) => void;
}

export default function TableConfigDialog({
  element,
  open,
  onOpenChange,
  onSave
}: TableConfigDialogProps) {
  const [config, setConfig] = useState({
    nom: '',
    capacite: 4,
    min_spend: 100
  });

  useEffect(() => {
    if (element && element.type === 'table') {
      setConfig({
        nom: element.nom || '',
        capacite: element.config?.capacite || 4,
        min_spend: element.config?.min_spend || 100
      });
    }
  }, [element]);

  const handleSave = () => {
    if (!element) return;

    const updatedElement: FloorElement = {
      ...element,
      nom: config.nom,
      config: {
        ...element.config,
        capacite: config.capacite,
        min_spend: config.min_spend
      }
    };

    onSave(updatedElement);
    onOpenChange(false);
  };

  if (!element || element.type !== 'table') return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Configuration de la table</DialogTitle>
          <DialogDescription>
            Configurez les paramètres de votre table.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="tableName">Nom de la table</Label>
            <Input
              id="tableName"
              value={config.nom}
              onChange={(e) => setConfig({ ...config, nom: e.target.value })}
              placeholder="Ex: Table VIP 1"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacité (nombre de personnes)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              value={config.capacite}
              onChange={(e) => setConfig({ ...config, capacite: Number(e.target.value) })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="minSpend">Minimum Spend (€)</Label>
            <Input
              id="minSpend"
              type="number"
              min="0"
              step="10"
              value={config.min_spend}
              onChange={(e) => setConfig({ ...config, min_spend: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary">
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}