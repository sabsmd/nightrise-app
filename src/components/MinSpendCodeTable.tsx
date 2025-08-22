import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Trash2, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FloorElement {
  id: string;
  type: string;
  nom: string;
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

interface MinSpendCodeTableProps {
  codes: MinSpendCode[];
  onCodeDeleted: () => void;
}

export default function MinSpendCodeTable({ codes, onCodeDeleted }: MinSpendCodeTableProps) {
  const deleteMinSpendCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('min_spend_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      toast.success('Code de minimum spend supprimé');
      onCodeDeleted();
    } catch (error) {
      console.error('Error deleting min spend code:', error);
      toast.error('Erreur lors de la suppression du code');
    }
  };

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

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary">Actif</Badge>;
      case 'utilise':
        return <Badge variant="outline" className="bg-accent/10 text-accent border-accent">Utilisé</Badge>;
      case 'expire':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Expiré</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Codes de minimum spend générés</CardTitle>
        <CardDescription>
          Gérez tous les codes de minimum spend créés pour cet événement
        </CardDescription>
      </CardHeader>
      <CardContent>
        {codes.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Aucun code de minimum spend créé</p>
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
                  <TableHead>Min. Spend</TableHead>
                  <TableHead>Restant</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
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
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(code.min_spend)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <span className={code.solde_restant <= 0 ? "text-destructive" : "text-accent"}>
                        {formatCurrency(code.solde_restant)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(code.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(code.statut)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMinSpendCode(code.id)}
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
  );
}