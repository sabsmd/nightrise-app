import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Crown, Plus, Calendar, Users, DollarSign, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MinSpendCodeForm from "@/components/MinSpendCodeForm";
import MinSpendCodeTable from "@/components/MinSpendCodeTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletService, WalletData } from "@/services/walletService";
import WalletManagement from "@/components/WalletManagement";

interface Event {
  id: string;
  titre: string;
  date: string;
  lieu: string;
}

interface FloorElement {
  id: string;
  nom: string;
  type: string;
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
  floor_element_id: string | null;
}

export default function MinSpendCodes() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
  const [minSpendCodes, setMinSpendCodes] = useState<MinSpendCode[]>([]);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("legacy");
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    totalMinSpend: 0,
    remainingAmount: 0
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventData();
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, titre, date, lieu')
        .order('date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
      
      if (data && data.length > 0) {
        setSelectedEventId(data[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const loadEventData = async () => {
    if (!selectedEventId) return;

    try {
      setLoading(true);

      // Charger les éléments de plan de salle
      const { data: elementsData, error: elementsError } = await supabase
        .from('floor_elements')
        .select('id, nom, type')
        .eq('event_id', selectedEventId);

      if (elementsError) throw elementsError;

      // Charger les codes minimum spend
      const { data: codesData, error: codesError } = await supabase
        .from('min_spend_codes')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      setFloorElements(elementsData || []);
      setMinSpendCodes((codesData || []) as MinSpendCode[]);

      // Load wallets using the new system
      try {
        const eventWallets = await WalletService.getEventWallets(selectedEventId);
        setWallets(eventWallets);
      } catch (error) {
        console.error('Error loading wallets:', error);
        setWallets([]);
      }

      // Calculer les statistiques
      const codes = codesData || [];
      const activeCodes = codes.filter(code => code.statut === 'actif');
      const totalMinSpend = codes.reduce((sum, code) => sum + Number(code.min_spend), 0);
      const remainingAmount = codes.reduce((sum, code) => sum + Number(code.solde_restant), 0);

      setStats({
        totalCodes: codes.length,
        activeCodes: activeCodes.length,
        totalMinSpend,
        remainingAmount
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeCreated = () => {
    setShowForm(false);
    loadEventData();
    toast.success('Code créé avec succès!');
  };

  const selectedEvent = events.find(event => event.id === selectedEventId);

  if (loading && events.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-hero rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Codes Minimum Spend</h1>
          </div>
          <p className="text-primary-foreground/80 mb-6">
            Gérez les codes de consommation minimum pour vos événements
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
      </div>

      {/* Event Selection */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Sélection de l'événement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un événement" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{event.titre}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('fr-FR')} - {event.lieu}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEventId && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau code
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEventId && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total codes</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalCodes}</p>
                  </div>
                  <Crown className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Codes actifs</p>
                    <p className="text-2xl font-bold text-foreground">{stats.activeCodes}</p>
                  </div>
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Min. spend total</p>
                    <p className="text-2xl font-bold text-foreground">€{stats.totalMinSpend.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Solde restant</p>
                    <p className="text-2xl font-bold text-foreground">€{stats.remainingAmount.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Management Tabs */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Gestion des codes pour: {selectedEvent?.titre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="legacy">Codes existants</TabsTrigger>
                  <TabsTrigger value="wallets">Système Wallet</TabsTrigger>
                </TabsList>
                
                <TabsContent value="legacy" className="mt-6">
                  <MinSpendCodeTable 
                    codes={minSpendCodes}
                    onCodeDeleted={loadEventData}
                  />
                </TabsContent>
                
                <TabsContent value="wallets" className="mt-6">
                  <WalletManagement 
                    eventId={selectedEventId}
                    wallets={wallets}
                    onWalletUpdated={loadEventData}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Code Dialog */}
      {showForm && selectedEventId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Créer un nouveau code</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  ✕
                </Button>
              </div>
              <MinSpendCodeForm
                eventId={selectedEventId}
                onCodeCreated={handleCodeCreated}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}