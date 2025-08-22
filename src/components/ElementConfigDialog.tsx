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

interface ElementConfigDialogProps {
  element: FloorElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (element: FloorElement) => void;
}

export default function ElementConfigDialog({
  element,
  open,
  onOpenChange,
  onSave
}: ElementConfigDialogProps) {
  const [config, setConfig] = useState({
    nom: '',
    capacite: 4,
    min_spend: 100,
    prix: 0,
    couleur: '#3B82F6'
  });

  useEffect(() => {
    if (element) {
      setConfig({
        nom: element.nom || '',
        capacite: element.config?.capacite || 4,
        min_spend: element.config?.min_spend || 100,
        prix: element.config?.prix || 0,
        couleur: element.couleur || '#3B82F6'
      });
    }
  }, [element]);

  const handleSave = () => {
    if (!element) return;

    const updatedElement: FloorElement = {
      ...element,
      nom: config.nom,
      couleur: config.couleur,
      config: {
        ...element.config,
        capacite: config.capacite,
        min_spend: config.min_spend,
        prix: config.prix
      }
    };

    onSave(updatedElement);
    onOpenChange(false);
  };

  if (!element) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Configuration de l'élément</DialogTitle>
          <DialogDescription>
            Configurez les paramètres de votre élément.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="elementName">Nom de l'élément</Label>
            <Input
              id="elementName"
              value={config.nom}
              onChange={(e) => setConfig({ ...config, nom: e.target.value })}
              placeholder="Ex: Table VIP 1"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="color">Couleur</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="color"
                type="color"
                value={config.couleur}
                onChange={(e) => setConfig({ ...config, couleur: e.target.value })}
                className="w-16 h-10 border-border"
              />
              <Input
                value={config.couleur}
                onChange={(e) => setConfig({ ...config, couleur: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          {element.type === 'table' && (
            <>
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
            </>
          )}

          {(['table', 'bed', 'sofa'].includes(element.type)) && (
            <div>
              <Label htmlFor="prix">Prix (€)</Label>
              <Input
                id="prix"
                type="number"
                min="0"
                step="10"
                value={config.prix}
                onChange={(e) => setConfig({ ...config, prix: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          )}
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