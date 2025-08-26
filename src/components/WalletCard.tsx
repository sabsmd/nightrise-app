import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, CreditCard, History, ShoppingCart, X, ArrowLeft } from "lucide-react";
import { WalletData } from "@/services/walletService";
import ProductCatalog from "@/components/ProductCatalog";

interface WalletCardProps {
  wallet: WalletData;
  eventId: string;
  onWalletUpdated: () => void;
  onClose: () => void;
}

export default function WalletCard({ wallet, eventId, onWalletUpdated, onClose }: WalletCardProps) {
  const [showProductCatalog, setShowProductCatalog] = useState(false);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const progress = wallet.progress * 100;
  const isMinSpendReached = progress >= 100;

  return (
    <Card className="wallet-card bg-gradient-primary border-0 text-primary-foreground shadow-elegant">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            <CardTitle className="text-xl">Ma Carte Minimum Spend</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription className="text-primary-foreground/80">
          Code: <span className="font-mono font-bold">{wallet.code}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Credit Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-primary-foreground/70">Crédit initial</p>
              <p className="text-2xl font-bold">{formatCurrency(wallet.initialCredit)}</p>
            </div>
            <div>
              <p className="text-sm text-primary-foreground/70">Crédit restant</p>
              <p className={`text-2xl font-bold ${wallet.remainingCredit <= 0 ? 'text-orange-300' : ''}`}>
                {formatCurrency(wallet.remainingCredit)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-primary-foreground/70">
              <span>Progression</span>
              <span>{Math.round(progress)}% consommé</span>
            </div>
            <Progress 
              value={progress} 
              className="h-3 bg-white/20" 
            />
            {isMinSpendReached && (
              <div className="flex items-center gap-2 text-green-300 text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Objectif de minimum spend atteint !</span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-primary-foreground/70">Statut</span>
          {getStatusBadge(wallet.status)}
        </div>

        {/* Recent Transactions */}
        {wallet.history && wallet.history.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary-foreground/70 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Transactions récentes
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {wallet.history.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center text-sm bg-white/10 rounded p-2">
                    <div>
                      <span className="font-medium">
                        {transaction.type === 'debit' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </span>
                      {transaction.orderId && (
                        <span className="text-primary-foreground/60 ml-2">
                          Commande #{transaction.orderId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <span className="text-primary-foreground/60">
                      {formatDate(transaction.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-white/20">
          {wallet.status === 'active' && (
            <Button
              onClick={() => setShowProductCatalog(true)}
              className="w-full bg-white text-primary hover:bg-white/90"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Passer une commande
            </Button>
          )}
          
          {wallet.status !== 'active' && (
            <div className="text-center p-4 bg-white/10 rounded-lg">
              <p className="text-sm text-primary-foreground/80">
                {wallet.status === 'expired' && 'Cette carte a expiré'}
                {wallet.status === 'suspended' && 'Cette carte est temporairement suspendue'}
                {wallet.status === 'closed' && 'Cette carte a été fermée'}
              </p>
            </div>
          )}
        </div>

        {/* Product Catalog */}
        <ProductCatalog 
          open={showProductCatalog}
          onOpenChange={setShowProductCatalog}
          wallet={wallet}
          eventId={eventId}
          onWalletUpdated={onWalletUpdated}
        />
      </CardContent>
    </Card>
  );
}