
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { StockTakeSession } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function StockTakeHistoryPage() {
  const firestore = useFirestore();
  const router = useRouter();

  const sessionsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'stockTakeSessions')) : null,
    [firestore]
  );
  const { data: sessions, isLoading } = useCollection<StockTakeSession>(sessionsQuery);

  const sortedSessions = React.useMemo(() => {
    return sessions?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  }, [sessions]);

  return (
    <div className="space-y-6">
       <header className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock-Take History</h1>
                    <p className="text-muted-foreground">A chronological list of all stock-take sessions.</p>
                </div>
            </div>
        </header>
      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>
            A chronological list of all completed and ongoing stock-take sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
              ))}
              {!isLoading && sortedSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No stock-take sessions found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedSessions?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono">{session.id}</TableCell>
                    <TableCell>{format(new Date(session.date), 'dd/MM/yyyy, h:mm a')}</TableCell>
                    <TableCell>{session.locationId}</TableCell>
                    <TableCell>
                      <Badge variant={session.status === 'Completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" onClick={() => router.push(`/dispensary/stock-taking?session=${session.id}`)}>
                        {session.status === 'Ongoing' ? 'Resume' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
