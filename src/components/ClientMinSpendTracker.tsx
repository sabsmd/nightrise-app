import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MinSpendCode {
  id: string;
  code: string;
  nom_client: string;
  prenom_client: string;
  min_spend: number;
  solde_restant: number;
  statut: 'actif' | 'utilise' | 'expire';
  event_id: string;
}

interface ClientMinSpendTrackerProps {
  eventId: string;
  onCodeValidated?: (code: MinSpendCode) => void;
}

export default function ClientMinSpendTracker({ eventId, onCodeValidated }: ClientMinSpendTrackerProps) {
  const [codeInput, setCodeInput] = useState("");
  const [validatedCode, setValidatedCode] = useState<MinSpendCode | null>(null);
  const [loading, setLoading] = useState(false);

  const validateCode = async () => {
    if (!codeInput.trim()) {
      toast.error('Veuillez entrer un code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('min_spend_codes')
        .select('id, code, nom_client, prenom_client, min_spend, solde_restant, statut, event_id')
        .eq('code', codeInput.toUpperCase())
        .eq('event_id', eventId)
        .eq('statut', 'actif')
        .single();

      if (error) {
        console.error('Error validating code:', error);
        toast.error('Code invalide ou expiré');
        return;
      }

      if (!data) {
        toast.error('Code invalide ou expiré');
        return;
      }

      setValidatedCode(data as MinSpendCode);
      onCodeValidated?.(data as MinSpendCode);
      toast.success('Code validé avec succès !');
    } catch (error) {
      console.error('Error validating code:', error);
      toast.error('Erreur lors de la validation du code');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const getProgressPercentage = () => {
    if (!validatedCode || validatedCode.min_spend === 0) return 0;
    const consumed = validatedCode.min_spend - validatedCode.solde_restant;
    return Math.min((consumed / validatedCode.min_spend) * 100, 100);
  };

  const resetCode = () => {
    setValidatedCode(null);
    setCodeInput("");
  };

  if (validatedCode) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-primary" />
            <span>Code validé</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
              Actif
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              Bonjour {validatedCode.prenom_client} {validatedCode.nom_client}
            </h3>
            <p className="text-sm text-muted-foreground">
              Code: <span className="font-mono font-bold">{validatedCode.code}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Minimum spend</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(validatedCode.min_spend)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Consommé</p>
              <p className="text-xl font-bold text-accent">
                {formatCurrency(validatedCode.min_spend - validatedCode.solde_restant)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Restant</p>
              <p className={`text-xl font-bold ${validatedCode.solde_restant <= 0 ? 'text-destructive' : 'text-green-500'}`}>
                {formatCurrency(validatedCode.solde_restant)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
          </div>

          {validatedCode.solde_restant <= 0 && (
            <div className="flex items-center space-x-2 p-4 bg-accent/10 border border-accent rounded-lg">
              <AlertCircle className="w-5 h-5 text-accent" />
              <p className="text-sm font-medium">
                Minimum spend atteint ! Vous ne pouvez plus commander avec ce code.
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={resetCode}
            className="w-full"
          >
            Changer de code
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Entrer votre code</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="code">Code de minimum spend</Label>
          <Input
            id="code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="Entrez votre code (ex: ABC12345)"
            className="font-mono"
            onKeyPress={(e) => e.key === 'Enter' && validateCode()}
          />
        </div>
        
        <Button 
          onClick={validateCode} 
          disabled={loading || !codeInput.trim()}
          className="w-full bg-gradient-primary"
        >
          {loading ? "Validation..." : "Valider le code"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>Entrez le code reçu après votre paiement sur place</p>
          <p>pour accéder à vos consommations</p>
        </div>
      </CardContent>
    </Card>
  );
}