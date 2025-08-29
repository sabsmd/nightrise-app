import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, CreditCard, User } from 'lucide-react';

interface ReservationRow {
  id: string;
  created_at: string;
  floor_element_id: string;
  floor_element?: { nom: string; type: string } | null;
  min_spend_code?: {
    code: string;
    nom_client: string;
    prenom_client: string;
  } | null;
}

type Props = {
  reservations: ReservationRow[];
};

export default function ProReservationsTable({ reservations }: Props) {
  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Suivi des réservations ({reservations.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Aucune réservation pour l'instant
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Élément</TableHead>
                  <TableHead>Réservé le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {r.min_spend_code?.prenom_client} {r.min_spend_code?.nom_client}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{r.min_spend_code?.code}</TableCell>
                    <TableCell>
                      {r.floor_element?.nom || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatDateTime(r.created_at)}
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
