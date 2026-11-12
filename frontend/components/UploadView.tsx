'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { uploadDataset, generateSampleDataset } from '../lib/api';

interface UploadViewProps {
  onDatasetLoaded: (data: any) => void;
}

export default function UploadView({ onDatasetLoaded }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid .csv file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await uploadDataset(file);
      if (res.success) {
        setSuccessMsg(res.message);
        onDatasetLoaded(res);
      } else {
        setError(res.error || 'Failed to upload and audit CSV file.');
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSample = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await generateSampleDataset();
      if (res.success) {
        setSuccessMsg('Loaded 500 synthetic Gym Member Health Screening records.');
        onDatasetLoaded(res);
      } else {
        setError(res.error || 'Failed to generate dataset.');
      }
    } catch (err: any) {
      setError(err.message || 'Error generating dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded border border-emerald-500/30">
              Tab 1 • Ingestion & Audit
            </span>
            <h1 className="text-2xl font-bold mt-2">Gym Member Health Screening Ingestion</h1>
            <p className="text-emerald-100 text-xs mt-1 max-w-xl">
              Ingest PAR-Q (Physical Activity Readiness Questionnaire) screening records. The automated
              DQM detective engine audits schema compliance, identifies field anomalies, and classifies
              findings under the 6 DQM principles.
            </p>
          </div>

          <button
            onClick={handleGenerateSample}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow transition duration-150 disabled:opacity-50 text-xs shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>⚡ Load Synthetic Dataset (500 records)</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center space-x-3 text-xs shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-3 text-xs shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Drag & Drop Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all bg-white shadow-sm ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/40 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <UploadCloud className="h-7 w-7" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Drag and drop your gym screening CSV here
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports multi-format CSV files up to 10MB
            </p>
          </div>

          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm disabled:opacity-50"
            >
              Browse Local CSV
            </button>
          </div>
        </div>
      </div>

      {/* Schema Requirement Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-700 font-bold">
          <FileText className="h-4 w-4 text-emerald-600" />
          <span>Expected Schema Constraints (5 Required Columns)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {[
            { name: 'Name', desc: 'Member legal name (First & Last required)' },
            { name: 'DOB', desc: 'Date of birth (ISO YYYY-MM-DD standard)' },
            { name: 'Email', desc: 'Member RFC-compliant email address' },
            { name: 'Screening Result', desc: 'PAR-Q result (Cleared, Flagged, Pending)' },
            { name: 'Date Recorded', desc: 'Session timestamp (valid chronological date)' }
          ].map((col) => (
            <div key={col.name} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block">{col.name}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">{col.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

