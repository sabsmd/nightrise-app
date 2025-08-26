import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Trash2, Wallet, Plus, Edit, CreditCard, Minus } from "lucide-react";
import { WalletService, WalletData } from "@/services/walletService";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface WalletManagementProps {
  eventId: string;
  wallets: WalletData[];
  onWalletUpdated: () => void;
}

export default function WalletManagement({ eventId, wallets, onWalletUpdated }: WalletManagementProps) {
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [newWalletData, setNewWalletData] = useState({
    code: "",
    initialCredit: "",
    clientName: "",
    clientPhone: ""
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papiers');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary">Actif</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Suspendu</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-accent/10 text-accent border-accent">Fermé</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Expiré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      
      if (!newWalletData.code || !newWalletData.initialCredit) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const initialCredit = parseFloat(newWalletData.initialCredit);
      if (isNaN(initialCredit) || initialCredit <= 0) {
        toast.error('Le montant initial doit être supérieur à 0');
        return;
      }

      await WalletService.createWallet({
        code: newWalletData.code.toUpperCase(),
        initialCredit,
        currency: 'EUR',
        clientName: newWalletData.clientName,
        clientPhone: newWalletData.clientPhone
      });

      toast.success('Wallet créé avec succès');
      setShowCreateDialog(false);
      setNewWalletData({ code: "", initialCredit: "", clientName: "", clientPhone: "" });
      onWalletUpdated();
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('Erreur lors de la création du wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustWallet = async (type: 'credit' | 'debit') => {
    if (!selectedWallet || !adjustAmount) return;

    try {
      setLoading(true);
      const amount = parseFloat(adjustAmount);
      
      if (isNaN(amount) || amount <= 0) {
        toast.error('Le montant doit être supérieur à 0');
        return;
      }

      if (type === 'credit') {
        await WalletService.creditWallet(
          selectedWallet.code,
          amount,
          'adjustment',
          undefined,
          'staff',
          `manual-adjust-${Date.now()}`,
          adjustNotes
        );
        toast.success('Crédit ajouté avec succès');
      } else {
        await WalletService.debitWallet(
          selectedWallet.code,
          amount,
          undefined,
          'staff',
          `manual-debit-${Date.now()}`
        );
        toast.success('Débit effectué avec succès');
      }

      setShowAdjustDialog(false);
      setSelectedWallet(null);
      setAdjustAmount("");
      setAdjustNotes("");
      onWalletUpdated();
    } catch (error) {
      console.error('Error adjusting wallet:', error);
      toast.error('Erreur lors de l\'ajustement du wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (wallet: WalletData, newStatus: 'active' | 'suspended' | 'closed') => {
    try {
      setLoading(true);
      await WalletService.updateWalletStatus(wallet.code, newStatus);
      toast.success('Statut mis à jour avec succès');
      onWalletUpdated();
    } catch (error) {
      console.error('Error updating wallet status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Wallet Dialog */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Wallets système avancé</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Créer un wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau wallet</DialogTitle>
              <DialogDescription>
                Créez un wallet avec le système avancé de minimum spend
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Code unique *</Label>
                <Input
                  id="code"
                  value={newWalletData.code}
                  onChange={(e) => setNewWalletData({...newWalletData, code: e.target.value.toUpperCase()})}
                  placeholder="ex: ABCD1234"
                />
              </div>
              <div>
                <Label htmlFor="initialCredit">Crédit initial (€) *</Label>
                <Input
                  id="initialCredit"
                  type="number"
                  step="0.01"
                  value={newWalletData.initialCredit}
                  onChange={(e) => setNewWalletData({...newWalletData, initialCredit: e.target.value})}
                  placeholder="ex: 250.00"
                />
              </div>
              <div>
                <Label htmlFor="clientName">Nom du client</Label>
                <Input
                  id="clientName"
                  value={newWalletData.clientName}
                  onChange={(e) => setNewWalletData({...newWalletData, clientName: e.target.value})}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Téléphone</Label>
                <Input
                  id="clientPhone"
                  value={newWalletData.clientPhone}
                  onChange={(e) => setNewWalletData({...newWalletData, clientPhone: e.target.value})}
                  placeholder="Numéro de téléphone"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateWallet} disabled={loading}>
                Créer le wallet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wallets créés</CardTitle>
          <CardDescription>
            Système avancé de gestion des minimum spend avec transactions atomiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Aucun wallet créé</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Crédit initial</TableHead>
                    <TableHead>Crédit restant</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell className="font-mono font-bold">
                        <div className="flex items-center space-x-2">
                          <span>{wallet.code}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{wallet.clientName || 'Non renseigné'}</div>
                          <div className="text-sm text-muted-foreground">{wallet.clientPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(wallet.initialCredit)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span className={wallet.remainingCredit <= 0 ? "text-destructive" : "text-accent"}>
                          {formatCurrency(wallet.remainingCredit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-full max-w-[100px]">
                          <Progress value={wallet.progress * 100} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(wallet.progress * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(wallet.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setShowAdjustDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          {wallet.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(wallet, 'suspended')}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          )}
                          {wallet.status === 'suspended' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(wallet, 'active')}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Adjust Wallet Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster le wallet {selectedWallet?.code}</DialogTitle>
            <DialogDescription>
              Ajouter ou retirer du crédit du wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustAmount">Montant (€)</Label>
              <Input
                id="adjustAmount"
                type="number"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="ex: 50.00"
              />
            </div>
            <div>
              <Label htmlFor="adjustNotes">Notes (optionnel)</Label>
              <Input
                id="adjustNotes"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Raison de l'ajustement"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
                Annuler
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleAdjustWallet('debit')}
                disabled={loading}
                className="text-destructive hover:text-destructive"
              >
                <Minus className="w-4 h-4 mr-2" />
                Débiter
              </Button>
              <Button 
                onClick={() => handleAdjustWallet('credit')}
                disabled={loading}
                className="bg-gradient-primary"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Créditer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}