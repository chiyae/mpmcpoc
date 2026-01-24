
'use client';

import * as React from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';

interface UploadStepProps {
  onComplete: (data: Record<string, string>[], headers: string[]) => void;
}

export function UploadStep({ onComplete }: UploadStepProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type !== 'text/csv') {
          toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a CSV file.'});
          return;
      }
      setFile(selectedFile);
    }
  };

  const handleParse = () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select a CSV file to upload.'});
      return;
    }
    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);
        if (results.errors.length) {
            toast({ variant: 'destructive', title: 'Error Parsing CSV', description: results.errors[0].message });
        } else if (results.meta.fields) {
            onComplete(results.data as Record<string, string>[], results.meta.fields);
        }
      },
      error: (error) => {
        setIsParsing(false);
        toast({ variant: 'destructive', title: 'Parsing Error', description: error.message });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Download Template</CardTitle>
                <CardDescription>
                To ensure a smooth import, download our CSV template. This file has all the columns needed for the item master list.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <a href="/item-master-template.csv" download>
                    <Button variant="secondary" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Template CSV
                    </Button>
                </a>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Upload Your File</CardTitle>
                <CardDescription>
                Select the CSV file containing your item master data.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
                <Button onClick={handleParse} disabled={!file || isParsing} className="w-full">
                    {isParsing ? 'Parsing...' : 'Upload & Continue'}
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}

