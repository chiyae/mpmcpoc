
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
import type { StockTakeItem, StockTakeSession } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function BulkStoreReportsPage() {
  const firestore = useFirestore();
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | undefined>();
  const [sessionItems, setSessionItems] = React.useState<StockTakeItem[]>([]);
  const [isReportLoading, setIsReportLoading] = React.useState(false);


  const sessionsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'stockTakeSessions')) : null,
    [firestore]
  );
  const { data: allSessions, isLoading: areSessionsLoading } = useCollection<StockTakeSession>(sessionsQuery);

  const completedSessions = React.useMemo(() => {
    return allSessions?.filter(s => s.status === 'Completed').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  }, [allSessions]);

  React.useEffect(() => {
    if (completedSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(completedSessions[0].id);
    }
  }, [completedSessions, selectedSessionId]);

  React.useEffect(() => {
    const fetchSessionItems = async () => {
        if (!firestore || !selectedSessionId) {
            setSessionItems([]);
            return;
        };
        setIsReportLoading(true);

        const itemsRef = collection(firestore, 'stockTakeSessions', selectedSessionId, 'items');
        const itemsSnapshot = await getDocs(itemsRef);
        const items = itemsSnapshot.docs.map(doc => doc.data() as StockTakeItem);
        const varianceItems = items.filter(item => item.variance !== 0);
        setSessionItems(varianceItems);
        setIsReportLoading(false);
    }
    fetchSessionItems();
  }, [firestore, selectedSessionId]);

  const isLoading = areSessionsLoading || isReportLoading;

  return (
    <div className="space-y-6">
       <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Bulk Store Reports</h1>
            <p className="text-muted-foreground">
                Review reports related to bulk store operations.
            </p>
        </header>

      <Card>
        <CardHeader>
          <CardTitle>Stock-Take Variance Report</CardTitle>
          <CardDescription>
            Review discrepancies from completed stock-take sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="max-w-sm">
                <Label htmlFor="session-select">Select a Stock-Take Session</Label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId} disabled={areSessionsLoading}>
                    <SelectTrigger id="session-select">
                        <SelectValue placeholder={areSessionsLoading ? "Loading sessions..." : "Select a session"} />
                    </SelectTrigger>
                    <SelectContent>
                        {completedSessions.map(session => (
                            <SelectItem key={session.id} value={session.id}>
                                {session.id} ({format(new Date(session.date), 'dd/MM/yyyy')})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-center">System Qty</TableHead>
                    <TableHead className="text-center">Physical Qty</TableHead>
                    <TableHead className="text-center">Variance</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
                ))}
                {!isLoading && sessionItems.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        {selectedSessionId ? "No variance found for this session." : "Please select a session."}
                    </TableCell>
                    </TableRow>
                ) : (
                    sessionItems.map((item) => {
                        const varianceColor = item.variance < 0 ? 'text-destructive' : 'text-green-600';
                        return (
                             <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell className="text-center">{item.systemQty}</TableCell>
                                <TableCell className="text-center">{item.physicalQty}</TableCell>
                                <TableCell className={`text-center font-bold ${varianceColor}`}>
                                    {item.variance > 0 ? `+${item.variance}` : item.variance}
                                </TableCell>
                            </TableRow>
                        )
                    })
                )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
