'use client';

import * as React from 'react';
import { Database, FileSpreadsheet, Key, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api-client';

export interface SheetsTestStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  sheetTitle?: string;
}

interface SystemIntegrationsTabProps {
  counts: Record<string, number>;
  defaultSpreadsheetId: string;
  webhookSecret: string;
  initialSheetsTest: SheetsTestStatus;
}

export function SystemIntegrationsTab({
  counts,
  defaultSpreadsheetId,
  webhookSecret,
  initialSheetsTest,
}: SystemIntegrationsTabProps) {
  const [defaultSheetId, setDefaultSheetId] = React.useState(defaultSpreadsheetId);
  const [sheetsStatus, setSheetsStatus] = React.useState(initialSheetsTest);
  const [testingSheet, setTestingSheet] = React.useState(false);

  const handleTestSheets = async () => {
    try {
      setTestingSheet(true);
      const data = await apiFetch<SheetsTestStatus>('/api/system/test-sheet', {
        method: 'POST',
        body: { spreadsheet_id: defaultSheetId.trim() || undefined },
      });
      setSheetsStatus(data);
      if (data.connected) {
        toast.success(data.message);
      } else {
        toast.warning(data.message);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Koneksi gagal.');
    } finally {
      setTestingSheet(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Ringkasan Koleksi Database */}
      <div className="bg-white p-6 rounded-3xl border border-border shadow-xs space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Metrik Dokumen Firestore Database
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(counts).map(([col, count]) => (
            <div key={col} className="p-3 rounded-2xl bg-secondary/30 border border-border">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                {col}
              </span>
              <span className="text-xl font-black text-foreground mt-0.5 block">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pengujian Google Sheets API */}
      <div className="bg-white p-6 rounded-3xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Status Integrasi Google Sheets API v4
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              sheetsStatus.connected
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {sheetsStatus.connected ? 'Terhubung' : 'Kredensial Belum Terhubung'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{sheetsStatus.message}</p>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Input
            placeholder="Uji akses Spreadsheet ID tertentu..."
            value={defaultSheetId}
            onChange={(e) => setDefaultSheetId(e.target.value)}
            className="text-xs"
          />
          <Button
            onClick={handleTestSheets}
            disabled={testingSheet}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
          >
            {testingSheet ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-white" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1.5 text-white" />
            )}
            Uji Koneksi Sheet
          </Button>
        </div>
      </div>

      {/* Webhook Secret Key */}
      <div className="bg-white p-6 rounded-3xl border border-border shadow-xs space-y-3">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Key className="w-5 h-5 text-accent-gold" />
          Webhook Secret Key untuk Google Form
        </h3>
        <p className="text-xs text-muted-foreground">
          Gunakan kunci rahasia ini pada skrip pemicu (Google Apps Script) di Google Form / Spreadsheet untuk mengirimkan data responden ke endpoint <code>/api/webhooks/gform</code>:
        </p>
        <div className="p-3 rounded-xl bg-secondary/50 font-mono text-xs text-foreground border border-border select-all">
          {webhookSecret}
        </div>
      </div>
    </div>
  );
}

