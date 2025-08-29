import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FloorElement {
  id: string;
  type: string;
  nom: string;
}

interface MinSpendCodeFormProps {
  eventId: string;
  onCodeCreated: () => void;
}

export default function MinSpendCodeForm({ eventId, onCodeCreated }: MinSpendCodeFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
  const [newCode, setNewCode] = useState({
    nom_client: "",
    prenom_client: "",
    telephone_client: "",
    floor_element_id: "",
    min_spend: ""
  });

  useEffect(() => {
    if (eventId) {
      fetchFloorElements();
    }
  }, [eventId]);

  const fetchFloorElements = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_elements')
        .select('id, type, nom')
        .eq('event_id', eventId)
        .in('type', ['table', 'bed', 'sofa']);

      if (error) throw error;
      setFloorElements(data || []);
    } catch (error) {
      console.error('Error fetching floor elements:', error);
      toast.error('Erreur lors du chargement des éléments');
    }
  };

  const generateUniqueCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const createMinSpendCode = async () => {
    try {
      if (!newCode.nom_client || !newCode.prenom_client || !newCode.telephone_client || !newCode.min_spend || !newCode.floor_element_id) {
        toast.error('Veuillez remplir tous les champs obligatoires, y compris l\'élément du plan');
        return;
      }

      const minSpendAmount = parseFloat(newCode.min_spend);
      if (isNaN(minSpendAmount) || minSpendAmount <= 0) {
        toast.error('Le montant minimum doit être supérieur à 0');
        return;
      }

      const code = generateUniqueCode();
      
      // Create in legacy table for compatibility
      const codeData = {
        event_id: eventId,
        floor_element_id: newCode.floor_element_id,
        code,
        nom_client: newCode.nom_client,
        prenom_client: newCode.prenom_client,
        telephone_client: newCode.telephone_client,
        min_spend: minSpendAmount,
        solde_restant: minSpendAmount,
        statut: 'actif'
      };

      const { error } = await supabase
        .from('min_spend_codes')
        .insert([codeData]);

      if (error) throw error;

      toast.success(`Code de minimum spend créé : ${code}`);
      setIsDialogOpen(false);
      resetForm();
      onCodeCreated();
    } catch (error) {
      console.error('Error creating min spend code:', error);
      toast.error('Erreur lors de la création du code');
    }
  };

  const resetForm = () => {
    setNewCode({
      nom_client: "",
      prenom_client: "",
      telephone_client: "",
      floor_element_id: "",
      min_spend: ""
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Générer un code de minimum spend</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Créer un code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader className="pb-4">
                <DialogTitle>Nouveau code de minimum spend</DialogTitle>
                <DialogDescription>
                  Créez un code pour permettre à un client de consommer jusqu'à son minimum spend.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      value={newCode.prenom_client}
                      onChange={(e) => setNewCode({...newCode, prenom_client: e.target.value})}
                      placeholder="Prénom du client"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={newCode.nom_client}
                      onChange={(e) => setNewCode({...newCode, nom_client: e.target.value})}
                      placeholder="Nom du client"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <Input
                    id="telephone"
                    value={newCode.telephone_client}
                    onChange={(e) => setNewCode({...newCode, telephone_client: e.target.value})}
                    placeholder="Numéro de téléphone"
                  />
                </div>

                <div>
                  <Label htmlFor="min_spend">Montant minimum spend (€) *</Label>
                  <Input
                    id="min_spend"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCode.min_spend}
                    onChange={(e) => setNewCode({...newCode, min_spend: e.target.value})}
                    placeholder="ex: 250.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="element">Élément du plan *</Label>
                  <Select
                    value={newCode.floor_element_id}
                    onValueChange={(value) => setNewCode({...newCode, floor_element_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un élément obligatoire" />
                    </SelectTrigger>
                    <SelectContent>
                      {floorElements.map((element) => (
                        <SelectItem key={element.id} value={element.id}>
                          {element.type === 'table' && '🪑'} 
                          {element.type === 'bed' && '🛏️'} 
                          {element.type === 'sofa' && '🛋️'} 
                          {element.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={createMinSpendCode} className="bg-gradient-primary">
                  Générer le code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}