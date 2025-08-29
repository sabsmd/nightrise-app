import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Eye, Loader2, LogIn } from "lucide-react";
import { WalletService, WalletData } from "@/services/walletService";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

interface WalletCodeInputProps {
  eventId: string;
  onWalletValidated: (wallet: WalletData) => void;
}

export default function WalletCodeInput({ eventId, onWalletValidated }: WalletCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatedWallet, setValidatedWallet] = useState<WalletData | null>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { 
        state: { from: location.pathname } 
      });
    }
  }, [user, authLoading, navigate, location.pathname]);

  const validateCode = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour utiliser un code');
      navigate('/auth', { 
        state: { from: location.pathname } 
      });
      return;
    }

    if (!code.trim()) {
      toast.error('Veuillez entrer votre code');
      return;
    }

    setLoading(true);
    try {
      console.log('Validating code:', code.trim().toUpperCase());
      const wallet = await WalletService.getWallet(code.trim().toUpperCase());
      
      if (!wallet) {
        console.log('No wallet found for code');
        toast.error('Code incorrect ou inexistant');
        setLoading(false);
        return;
      }

      console.log('Wallet found:', wallet);
      if (wallet.status !== 'active') {
        const statusMessages = {
          expired: 'Ce code a expiré',
          suspended: 'Ce code est temporairement suspendu',
          closed: 'Ce code a été fermé'
        };
        toast.error(statusMessages[wallet.status as keyof typeof statusMessages] || 'Code non valide');
        setLoading(false);
        return;
      }

      setValidatedWallet(wallet);
      toast.success('Code validé avec succès !');
      setLoading(false);
    } catch (error) {
      console.error('Error validating code:', error);
      toast.error('Erreur lors de la validation du code');
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Vérification de l'authentification...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            Connexion requise
          </CardTitle>
          <CardDescription>
            Vous devez être connecté pour utiliser votre code minimum spend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                L'accès aux codes minimum spend est réservé aux utilisateurs connectés.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/auth', { state: { from: location.pathname } })}
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Se connecter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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