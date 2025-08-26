import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Eye, Loader2 } from "lucide-react";
import { WalletService, WalletData } from "@/services/walletService";
import { toast } from "sonner";

interface WalletCodeInputProps {
  eventId: string;
  onWalletValidated: (wallet: WalletData) => void;
}

export default function WalletCodeInput({ eventId, onWalletValidated }: WalletCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatedWallet, setValidatedWallet] = useState<WalletData | null>(null);

  const validateCode = async () => {
    if (!code.trim()) {
      toast.error('Veuillez entrer votre code');
      return;
    }

    setLoading(true);
    try {
      const wallet = await WalletService.getWallet(code.trim().toUpperCase());
      
      if (!wallet) {
        toast.error('Code incorrect ou inexistant');
        return;
      }

      if (wallet.status !== 'active') {
        const statusMessages = {
          expired: 'Ce code a expiré',
          suspended: 'Ce code est temporairement suspendu',
          closed: 'Ce code a été fermé'
        };
        toast.error(statusMessages[wallet.status as keyof typeof statusMessages] || 'Code non valide');
        return;
      }

      setValidatedWallet(wallet);
      toast.success('Code validé avec succès !');
    } catch (error) {
      console.error('Error validating code:', error);
      toast.error('Erreur lors de la validation du code');
    } finally {
      setLoading(false);
    }
  };

  const showWalletCard = () => {
    if (validatedWallet) {
      onWalletValidated(validatedWallet);
    }
  };

  const resetCode = () => {
    setCode("");
    setValidatedWallet(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Code Minimum Spend
        </CardTitle>
        <CardDescription>
          Entrez votre code pour accéder à votre carte de crédit minimum spend
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!validatedWallet ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="minSpendCode">Code de réservation</Label>
              <Input
                id="minSpendCode"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ex: LHFG91K5"
                className="font-mono"
                maxLength={8}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    validateCode();
                  }
                }}
              />
            </div>
            
            <Button 
              onClick={validateCode}
              disabled={loading || !code.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                'Valider le code'
              )}
            </Button>

            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Votre code vous a été fourni lors de votre réservation.
                Il vous permet d'accéder à votre crédit minimum spend.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <CreditCard className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-primary">Code validé !</h3>
              <p className="text-sm text-muted-foreground">
                Votre carte minimum spend est disponible
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={resetCode}
                className="w-full"
              >
                Changer de code
              </Button>
              <Button
                onClick={showWalletCard}
                className="w-full bg-gradient-primary"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir ma carte
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}