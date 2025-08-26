import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, ShoppingCart, Clock, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Product {
  id: string;
  nom: string;
  prix: number;
  categorie: string;
  actif: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: string;
  statut: string;
  montant_total: number;
  created_at: string;
  order_items?: Array<{
    product_id: string;
    quantite: number;
    prix_unitaire: number;
    products?: {
      nom: string;
      categorie: string;
    };
  }>;
}

interface ProductCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: any;
  eventId: string;
  onWalletUpdated: () => void;
}

export default function ProductCatalog({ 
  open, 
  onOpenChange, 
  wallet, 
  eventId, 
  onWalletUpdated 
}: ProductCatalogProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProducts();
      loadOrders();
    }
  }, [open, eventId]);

  useEffect(() => {
    if (eventId && user) {
      // Subscribe to real-time order updates
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [eventId, user]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('actif', true)
        .order('categorie', { ascending: true })
        .order('nom', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!user || !eventId || !wallet) return;

    try {
      // For now, skip the reservation lookup and just load orders for the user/event
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            product_id,
            quantite,
            prix_unitaire,
            products(nom, categorie)
          )
        `)
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      return prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.prix * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    if (!user || !wallet) {
      toast.error('Erreur d\'authentification');
      return;
    }

    const total = getCartTotal();
    if (total > wallet.remainingCredit) {
      toast.error('Montant supérieur au solde restant');
      return;
    }

    setOrderLoading(true);
    try {
      // Use wallet API to debit the amount
      const { data, error } = await supabase.functions.invoke('wallet-debit', {
        body: {
          code: wallet.code,
          amount: total,
          source: 'app',
          idempotencyKey: `order-${Date.now()}-${user.id}`
        }
      });

      if (error) throw error;

      toast.success('Commande passée avec succès !');
      setCart([]);
      loadOrders();
      onWalletUpdated();
    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast.error('Erreur lors de la commande');
    } finally {
      setOrderLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!wallet || wallet.initialCredit === 0) return 0;
    const consumed = wallet.initialCredit - wallet.remainingCredit;
    return Math.min((consumed / wallet.initialCredit) * 100, 100);
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'default' as const, icon: Clock },
      preparing: { label: 'En préparation', variant: 'secondary' as const, icon: ShoppingCart },
      ready: { label: 'Prêt', variant: 'outline' as const, icon: Check },
      served: { label: 'Servi', variant: 'default' as const, icon: Check }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const categories = [...new Set(products.map(p => p.categorie))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Catalogue des produits
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* Progress Bar */}
          <div className="mb-4 p-4 bg-card rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progression minimum spend</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(wallet.initialCredit - wallet.remainingCredit)} / {formatCurrency(wallet.initialCredit)}
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-muted-foreground">
                Solde restant: <span className="font-bold text-foreground">{formatCurrency(wallet.remainingCredit)}</span>
              </span>
              {getProgressPercentage() >= 100 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Objectif atteint!</span>
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="products" className="flex-1 overflow-hidden">
            <TabsList>
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="cart" className="relative">
                Panier
                {cart.length > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders">Mes commandes</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="flex-1 overflow-auto mt-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <ShoppingCart className="w-8 h-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
                    <p>Chargement des produits...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {categories.map(category => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3 sticky top-0 bg-background py-2 border-b">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.filter(p => p.categorie === category).map(product => (
                          <Card key={product.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{product.nom}</CardTitle>
                              <CardDescription className="text-lg font-bold text-primary">
                                {formatCurrency(product.prix)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button 
                                onClick={() => addToCart(product)}
                                className="w-full"
                                size="sm"
                                disabled={product.prix > wallet.remainingCredit}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter au panier
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cart" className="flex-1 overflow-auto mt-4">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Votre panier est vide</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.product.nom}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.product.prix)} × {item.quantity} = {formatCurrency(item.product.prix * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(item.product)}
                          disabled={item.product.prix > wallet.remainingCredit - getCartTotal() + (item.product.prix * item.quantity)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total: {formatCurrency(getCartTotal())}</span>
                      {getCartTotal() > wallet.remainingCredit && (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Solde insuffisant</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={submitOrder}
                      disabled={orderLoading || getCartTotal() > wallet.remainingCredit || cart.length === 0}
                      className="w-full"
                    >
                      {orderLoading ? 'Commande en cours...' : 'Passer la commande'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="flex-1 overflow-auto mt-4">
              {orders.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucune commande</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              Commande #{order.id.slice(0, 8)}
                            </CardTitle>
                            <CardDescription>
                              {new Date(order.created_at).toLocaleString('fr-FR')}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            {getOrderStatusBadge(order.statut)}
                            <p className="text-lg font-bold mt-1">
                              {formatCurrency(order.montant_total)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.order_items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.products?.nom} × {item.quantite}</span>
                              <span>{formatCurrency(item.prix_unitaire * item.quantite)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}