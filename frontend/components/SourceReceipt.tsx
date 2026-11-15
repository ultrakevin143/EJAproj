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
  crmCount = 0,
  clinicCount = 0,
  turnstileCount = 0,
  warehouseCount = 0
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
        <div className="receipt-warehouse-count" aria-label={`${warehouseCount} integrated warehouse rows`}>
          <ArrowRight className="h-3.5 w-3.5" />
          <Database className="h-3.5 w-3.5" />
          <span>{warehouseCount}</span>
        </div>
      </div>
    </div>
  );
}

