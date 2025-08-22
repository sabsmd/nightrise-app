import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Calendar, MapPin, Users, Plus, Trash2, Copy, Key, QrCode, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import MinSpendCodeForm from "@/components/MinSpendCodeForm";
import MinSpendCodeTable from "@/components/MinSpendCodeTable";

interface Event {
  id: string;
  titre: string;
  description?: string;
  image?: string;
  date: string;
  lieu: string;
  artiste_dj?: string;
  type_evenement?: string;
  created_at: string;
}

interface FloorElement {
  id: string;
  type: string;
  nom: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config?: any;
  couleur?: string;
}

interface ReservationCode {
  id: string;
  code: string;
  nom_client: string;
  prenom_client: string;
  telephone_client: string;
  expiration_date?: string;
  statut: 'non_utilise' | 'utilise' | 'expire';
  created_at: string;
  floor_element?: FloorElement;
}

interface MinSpendCode {
  id: string;
  code: string;
  nom_client: string;
  prenom_client: string;
  telephone_client: string;
  min_spend: number;
  solde_restant: number;
  statut: 'actif' | 'utilise' | 'expire';
  created_at: string;
  floor_element?: FloorElement;
}

export default function ProEventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
  const [reservationCodes, setReservationCodes] = useState<ReservationCode[]>([]);
  const [minSpendCodes, setMinSpendCodes] = useState<MinSpendCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newCode, setNewCode] = useState({
    nom_client: "",
    prenom_client: "",
    telephone_client: "",
    floor_element_id: "",
    expiration_date: ""
  });

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchFloorElements();
      fetchReservationCodes();
      fetchMinSpendCodes();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erreur lors du chargement de l\'événement');
      navigate('/pro/events');
    }
  };

  const fetchFloorElements = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_elements')
        .select('*')
        .eq('event_id', eventId)
        .in('type', ['table', 'bed', 'sofa']);

      if (error) throw error;
      setFloorElements(data || []);
    } catch (error) {
      console.error('Error fetching floor elements:', error);
      toast.error('Erreur lors du chargement des éléments');
    }
  };

  const fetchReservationCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('reservation_codes')
        .select(`
          *,
          floor_element:floor_elements(*)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservationCodes((data || []).map(item => ({
        ...item,
        statut: item.statut as 'non_utilise' | 'utilise' | 'expire'
      })));
    } catch (error) {
      console.error('Error fetching reservation codes:', error);
      toast.error('Erreur lors du chargement des codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchMinSpendCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('min_spend_codes')
        .select(`
          *,
          floor_element:floor_elements(*)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMinSpendCodes((data || []).map(item => ({
        ...item,
        statut: item.statut as 'actif' | 'utilise' | 'expire'
      })));
    } catch (error) {
      console.error('Error fetching min spend codes:', error);
      toast.error('Erreur lors du chargement des codes de minimum spend');
    } finally {
      setLoading(false);
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

  const createReservationCode = async () => {
    try {
      if (!newCode.nom_client || !newCode.prenom_client || !newCode.telephone_client || !newCode.floor_element_id) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const code = generateUniqueCode();
      
      const codeData = {
        event_id: eventId,
        floor_element_id: newCode.floor_element_id,
        code,
        nom_client: newCode.nom_client,
        prenom_client: newCode.prenom_client,
        telephone_client: newCode.telephone_client,
        expiration_date: newCode.expiration_date || null,
        statut: 'non_utilise'
      };

      const { error } = await supabase
        .from('reservation_codes')
        .insert([codeData]);

      if (error) throw error;

      toast.success(`Code de réservation créé : ${code}`);
      setIsDialogOpen(false);
      resetForm();
      fetchReservationCodes();
    } catch (error) {
      console.error('Error creating reservation code:', error);
      toast.error('Erreur lors de la création du code');
    }
  };

  const deleteReservationCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('reservation_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      toast.success('Code de réservation supprimé');
      fetchReservationCodes();
    } catch (error) {
      console.error('Error deleting reservation code:', error);
      toast.error('Erreur lors de la suppression du code');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papiers');
  };

  const resetForm = () => {
    setNewCode({
      nom_client: "",
      prenom_client: "",
      telephone_client: "",
      floor_element_id: "",
      expiration_date: ""
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'non_utilise':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary">Non utilisé</Badge>;
      case 'utilise':
        return <Badge variant="outline" className="bg-accent/10 text-accent border-accent">Utilisé</Badge>;
      case 'expire':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Expiré</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Événement non trouvé</h2>
          <Button onClick={() => navigate('/pro/events')}>Retour aux événements</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/pro/events')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux événements
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{event.titre}</h1>
            <p className="text-muted-foreground">
              {new Date(event.date).toLocaleDateString('fr-FR')} • {event.lieu}
            </p>
          </div>
        </div>
      </div>

      {/* Event Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Informations de l'événement</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{event.lieu}</span>
          </div>
          {event.artiste_dj && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{event.artiste_dj}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="codes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="codes" className="flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>Codes de réservation</span>
          </TabsTrigger>
          <TabsTrigger value="minspend" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Codes minimum spend</span>
          </TabsTrigger>
          <TabsTrigger value="details">Détails de l'événement</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-6">
          {/* Generate Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Générer un nouveau code</span>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Générer un code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <ScrollArea className="max-h-[80vh]">
                      <DialogHeader className="pb-4">
                        <DialogTitle>Nouveau code de réservation</DialogTitle>
                        <DialogDescription>
                          Créez un code pour permettre à un client de réserver un élément.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 px-1">
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
                          <Label htmlFor="element">Élément du plan *</Label>
                          <Select
                            value={newCode.floor_element_id}
                            onValueChange={(value) => setNewCode({...newCode, floor_element_id: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un élément" />
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
                        
                        <div>
                          <Label htmlFor="expiration">Date d'expiration (optionnelle)</Label>
                          <Input
                            id="expiration"
                            type="datetime-local"
                            value={newCode.expiration_date}
                            onChange={(e) => setNewCode({...newCode, expiration_date: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={createReservationCode} className="bg-gradient-primary">
                          Générer le code
                        </Button>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Codes History */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des codes générés</CardTitle>
              <CardDescription>
                Gérez tous les codes de réservation créés pour cet événement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservationCodes.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Aucun code de réservation créé</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Générer le premier code
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Élément</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservationCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono font-bold">
                            <div className="flex items-center space-x-2">
                              <span>{code.code}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(code.code)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {code.prenom_client} {code.nom_client}
                          </TableCell>
                          <TableCell>{code.telephone_client}</TableCell>
                          <TableCell>
                            {code.floor_element ? (
                              <div className="flex items-center space-x-1">
                                <span>
                                  {code.floor_element.type === 'table' && '🪑'}
                                  {code.floor_element.type === 'bed' && '🛏️'}
                                  {code.floor_element.type === 'sofa' && '🛋️'}
                                </span>
                                <span>{code.floor_element.nom}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Élément supprimé</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(code.created_at)}</TableCell>
                          <TableCell>
                            {code.expiration_date ? formatDate(code.expiration_date) : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(code.statut)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteReservationCode(code.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minspend" className="space-y-6">
          <MinSpendCodeForm eventId={eventId!} onCodeCreated={fetchMinSpendCodes} />
          <MinSpendCodeTable codes={minSpendCodes} onCodeDeleted={fetchMinSpendCodes} />
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Détails de l'événement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                </div>
              )}
              
              {event.type_evenement && (
                <div>
                  <Label>Type d'événement</Label>
                  <p className="text-sm text-muted-foreground mt-1">{event.type_evenement}</p>
                </div>
              )}
              
              <div>
                <Label>Éléments configurables disponibles</Label>
                <div className="mt-2 space-y-2">
                  {floorElements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun élément configurable pour cet événement</p>
                  ) : (
                    floorElements.map((element) => (
                      <div key={element.id} className="flex items-center space-x-2 p-2 bg-secondary rounded-lg">
                        <span>
                          {element.type === 'table' && '🪑'}
                          {element.type === 'bed' && '🛏️'}
                          {element.type === 'sofa' && '🛋️'}
                        </span>
                        <span className="font-medium">{element.nom}</span>
                        <Badge variant="outline">{element.type}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}