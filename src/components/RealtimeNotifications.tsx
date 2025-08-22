import React, { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Notification {
  id: string;
  type: 'new_reservation' | 'new_order' | 'order_update';
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}

interface RealtimeNotificationsProps {
  eventId?: string;
}

export default function RealtimeNotifications({ eventId }: RealtimeNotificationsProps) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile || profile.role !== 'admin' || !eventId) return;

    // Subscribe to reservations
    const reservationsChannel = supabase
      .channel('admin-reservations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          // Get element and user details
          const { data: elementData } = await supabase
            .from('floor_elements')
            .select('nom, type')
            .eq('id', payload.new.floor_element_id)
            .single();

          const { data: codeData } = await supabase
            .from('min_spend_codes')
            .select('nom_client, prenom_client')
            .eq('id', payload.new.min_spend_code_id)
            .single();

          const notification: Notification = {
            id: payload.new.id,
            type: 'new_reservation',
            message: `${codeData?.prenom_client} ${codeData?.nom_client} a réservé ${elementData?.nom} (${elementData?.type})`,
            data: payload.new,
            timestamp: new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);
          
          toast.success(`Nouvelle réservation: ${elementData?.nom}`, {
            description: `${codeData?.prenom_client} ${codeData?.nom_client}`,
            action: {
              label: "Voir",
              onClick: () => {/* Navigate to reservations */}
            }
          });
        }
      )
      .subscribe();

    // Subscribe to orders
    const ordersChannel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          // Get order details
          const { data: orderData } = await supabase
            .from('orders')
            .select(`
              *,
              order_items(
                quantite,
                products(nom)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          const { data: tableData } = await supabase
            .from('floor_elements')
            .select('nom')
            .eq('id', payload.new.table_id)
            .single();

          const itemsCount = orderData?.order_items?.reduce((sum, item) => sum + item.quantite, 0) || 0;

          const notification: Notification = {
            id: payload.new.id,
            type: 'new_order',
            message: `Nouvelle commande - ${tableData?.nom} - ${itemsCount} article(s) - €${Number(payload.new.montant_total).toFixed(2)}`,
            data: payload.new,
            timestamp: new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);
          
          toast.success(`Nouvelle commande: ${tableData?.nom}`, {
            description: `${itemsCount} article(s) - €${Number(payload.new.montant_total).toFixed(2)}`,
            action: {
              label: "Voir",
              onClick: () => {/* Navigate to orders */}
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          if (payload.old.statut !== payload.new.statut) {
            const { data: tableData } = await supabase
              .from('floor_elements')
              .select('nom')
              .eq('id', payload.new.table_id)
              .single();

            const statusLabels = {
              pending: 'en attente',
              preparing: 'en préparation',
              ready: 'prête',
              served: 'servie'
            };

            const notification: Notification = {
              id: `${payload.new.id}-update`,
              type: 'order_update',
              message: `Commande ${tableData?.nom} ${statusLabels[payload.new.statut as keyof typeof statusLabels] || payload.new.statut}`,
              data: payload.new,
              timestamp: new Date(),
              read: false
            };

            setNotifications(prev => [notification, ...prev.slice(0, 19)]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [profile, eventId]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 py-0 text-xs min-w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearNotifications}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                  !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full ml-2 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}