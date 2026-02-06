
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Log } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AuditLogPage() {
  const firestore = useFirestore();
  const router = useRouter();

  const logsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'logs'), orderBy('timestamp', 'desc')) : null,
    [firestore]
  );
  const { data: logs, isLoading, error } = useCollection<Log>(logsQuery);
  const [selectedLog, setSelectedLog] = React.useState<Log | null>(null);

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the audit log.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full space-y-6">
        <header className="space-y-1.5">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground">
                        A chronological record of significant actions taken within the application.
                    </p>
                </div>
            </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>
              Displaying the most recent activities first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && logs && logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.timestamp), 'dd/MM/yy, hh:mm:ss a')}
                    </TableCell>
                    <TableCell>{log.userDisplayName}</TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            View
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && (!logs || logs.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No audit log entries found.
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(isOpen) => !isOpen && setSelectedLog(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Details</DialogTitle>
                    <DialogDescription>
                        Detailed information for action: <span className="font-semibold">{selectedLog.action}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                    <pre>
                        <code>
                            {JSON.stringify(selectedLog.details, null, 2)}
                        </code>
                    </pre>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
