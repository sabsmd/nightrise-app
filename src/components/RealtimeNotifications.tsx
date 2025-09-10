import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Notification {
  id: string;
  type: 'new_reservation' | 'status_update';
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}

export default function RealtimeNotifications({ eventId }: { eventId?: string }) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile || profile.role !== 'admin' || !eventId) return;

    // Subscribe to new reservations
    const newReservationsChannel = supabase
      .channel('admin-new-reservations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_reservations',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          // Get reservation details with proper joins
          const { data: reservationData } = await supabase
            .from('client_reservations')
            .select(`
              *,
              floor_elements!client_reservations_floor_element_id_fkey(nom),
              min_spend_codes!client_reservations_min_spend_code_id_fkey(nom_client, prenom_client)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!reservationData) return;

          const floorElement = reservationData.floor_elements as any;
          const minSpendCode = reservationData.min_spend_codes as any;

          const notification: Notification = {
            id: payload.new.id,
            type: 'new_reservation',
            message: `Nouvelle réservation - ${floorElement?.nom || 'Element'} - ${minSpendCode?.prenom_client || ''} ${minSpendCode?.nom_client || ''}`,
            data: payload.new,
            timestamp: new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);
          
          toast.success("Nouvelle réservation", {
            description: notification.message,
            action: {
              label: "Voir",
              onClick: () => {/* Navigate to reservations */}
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_reservations',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.old.statut !== payload.new.statut) {
            const notification: Notification = {
              id: `${payload.new.id}-status`,
              type: 'status_update',
              message: `Réservation ${payload.new.statut}`,
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
      supabase.removeChannel(newReservationsChannel);
    };
  }, [profile, eventId]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    return `Il y a ${Math.floor(seconds / 86400)} j`;
  };

  if (!profile || profile.role !== 'admin') return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Tout lire
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex flex-col space-y-1 w-full">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium line-clamp-2">
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(notification.timestamp)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}