
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { ProcurementSession } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProcurementSessionsPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const sessionsQuery = useMemoFirebase(() => (
        firestore ? collection(firestore, 'procurementSessions') : null
    ), [firestore]);
    const { data: sessions, isLoading } = useCollection<ProcurementSession>(sessionsQuery);

    const handleNewSession = async () => {
        if (!firestore) return;
        const newSessionId = `SESS-${Date.now()}`;
        const sessionRef = doc(firestore, 'procurementSessions', newSessionId);

        const newSession: ProcurementSession = {
            id: newSessionId,
            createdAt: new Date().toISOString(),
            status: 'Draft',
            procurementList: [],
            vendorQuotes: {},
            lpoQuantities: {}
        };
        
        try {
            await setDoc(sessionRef, newSession);
            toast({ title: 'New Session Created', description: `Session ${newSessionId} has been created.`});
            router.push(`/tools/procurement-assistant?session=${newSessionId}`);
        } catch(error) {
            console.error("Failed to create new session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create a new session.'});
        }
    };
    
    const draftSessions = React.useMemo(() => {
        return sessions?.filter(s => s.status === 'Draft')
                       .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
    }, [sessions]);


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <header className="space-y-1.5">
                    <h1 className="text-3xl font-bold tracking-tight">Procurement Sessions</h1>
                    <p className="text-muted-foreground">
                        Manage ongoing and completed procurement workflows.
                    </p>
                </header>
                <Button onClick={handleNewSession}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Start New Session
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Draft Sessions</CardTitle>
                    <CardDescription>
                        Select a draft session to resume your work.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session ID</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4}><Skeleton className="h-8 w-full"/></TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && draftSessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No draft sessions found.
                                    </TableCell>
                                </TableRow>
                            ) : null}
                            {!isLoading && draftSessions.map(session => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-mono">{session.id}</TableCell>
                                    <TableCell>{format(new Date(session.createdAt), 'PPpp')}</TableCell>
                                    <TableCell>{session.procurementList.length}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" onClick={() => router.push(`/tools/procurement-assistant?session=${session.id}`)}>
                                            Resume
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    