'use client';

import React from 'react';
import { Users, Stethoscope, Radio, Database, ArrowRight } from 'lucide-react';

interface SourceReceiptProps {
  crmCount?: number;
  clinicCount?: number;
  turnstileCount?: number;
  warehouseCount?: number;
}

export default function SourceReceipt({
  crmCount = 150,
  clinicCount = 133,
  turnstileCount = 296,
  warehouseCount = 150
}: SourceReceiptProps) {
  return (
    <div className="source-receipt" aria-label="Multi-source ingestion pipeline receipt">
      <div className="receipt-source">
        <Users className="h-5 w-5 text-slate-500 shrink-0" />
        <div>
          <strong>Source 1: Front-Desk CRM</strong>
          <span>Members, tiers, contact data</span>
        </div>
        <span className="receipt-count">{crmCount} rows</span>
      </div>

      <div className="receipt-source">
        <Stethoscope className="h-5 w-5 text-slate-500 shrink-0" />
        <div>
          <strong>Source 2: Clinic Screenings</strong>
          <span>PAR-Q assessments, heart rates</span>
        </div>
        <span className="receipt-count">{clinicCount} rows</span>
      </div>

      <div className="receipt-source">
        <Radio className="h-5 w-5 text-slate-500 shrink-0" />
        <div>
          <strong>Source 3: Facility Turnstile IoT</strong>
          <span>RFID keycard check-in scans</span>
        </div>
        <span className="receipt-count">{turnstileCount} rows</span>
      </div>

      <div className="receipt-target">
        <div>
          <strong>Target Warehouse</strong>
          <span>integrated_members_360</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded">
          <Database className="h-3.5 w-3.5" />
          <span>{warehouseCount}</span>
        </div>
      </div>
    </div>
  );
}

