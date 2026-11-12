'use client';

import React, { useState, useEffect } from 'react';
import { DoorClosed, CheckCircle2, AlertOctagon, Clock, RefreshCw, KeyRound, Radio } from 'lucide-react';

export default function TurnstileView() {
  const [badgeId, setBadgeId] = useState('MBR-1001');
  const [zone, setZone] = useState('Main Gym Floor');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const fetchRecentScans = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/roles/turnstile/recent-scans');
      const data = await res.json();
      if (data.success) {
        setRecentScans(data.scans || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecentScans();
  }, []);

  const handleScan = async (idToScan?: string) => {
    const id = idToScan || badgeId;
    if (!id.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch('http://localhost:3000/api/roles/turnstile/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: id.trim().toUpperCase(),
          facility_zone: zone
        })
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data);
        fetchRecentScans();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded border border-indigo-500/30">
              Role: Turnstile Gate IoT System (Machine Account)
            </span>
            <span className="text-slate-400 text-xs">• Source 3 Domain: RFID Gate Scans</span>
          </div>
          <h1 className="text-xl font-bold mt-1.5 text-white">Facility Turnstile Access Gate Simulator</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time physical gate control checking integrated PostgreSQL Member 360 clearance status before unlocking turnstile.
          </p>
        </div>

        <button
          onClick={fetchRecentScans}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Scan Log</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tap RFID Keycard Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs border-b border-slate-100 pb-2">
              <Radio className="h-4 w-4 text-indigo-600 animate-pulse" />
              <span>RFID Keycard Scanner Terminal</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Facility Zone</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="Main Gym Floor">Main Gym Floor (General Workout)</option>
                  <option value="Cardio Deck">Cardio Deck</option>
                  <option value="Swimming Pool">Swimming Pool & Sauna</option>
                  <option value="CrossFit Box">CrossFit High-Intensity Box</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Enter Member Badge ID</label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder="e.g. MBR-1001"
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono uppercase text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Fast test buttons */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-1 font-medium">Quick Demo Test Badges:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'MBR-1001', label: 'MBR-1001' },
                    { id: 'MBR-1002', label: 'MBR-1002' },
                    { id: 'MBR-1003', label: 'MBR-1003' },
                    { id: 'MBR-9999', label: 'MBR-9999 (Unregistered)' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => {
                        setBadgeId(btn.id);
                        handleScan(btn.id);
                      }}
                      className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-mono font-medium text-slate-700"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleScan()}
                disabled={isScanning || !badgeId.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition duration-150 disabled:opacity-50 mt-2 shadow-sm"
              >
                <KeyRound className="h-4 w-4" />
                <span>{isScanning ? 'Interrogating Database...' : 'TAP RFID BADGE AT GATE'}</span>
              </button>
            </div>

            {/* Visual Gate Output Screen */}
            {scanResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 mt-4 animate-fade-in ${
                  scanResult.accessGranted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm flex items-center space-x-1.5">
                    {scanResult.accessGranted ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-emerald-800">TURNSTILE UNLOCKED: ACCESS GRANTED</span>
                      </>
                    ) : (
                      <>
                        <AlertOctagon className="h-5 w-5 text-rose-600" />
                        <span className="text-rose-800">GATE LOCKED: ACCESS DENIED</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{scanResult.scanId}</span>
                </div>

                {scanResult.accessGranted ? (
                  <div className="text-xs text-emerald-900 pt-1 space-y-1">
                    <div>Welcome, <strong>{scanResult.member?.full_name}</strong>!</div>
                    <div className="text-[11px] text-emerald-700">
                      PAR-Q Health Clearance: <strong>{scanResult.member?.parq_status}</strong> • Zone: <strong>{scanResult.facility_zone}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-rose-900 pt-1 space-y-1">
                    <div className="font-semibold">{scanResult.denialReason}</div>
                    {scanResult.member && (
                      <div className="text-[11px] text-rose-700">
                        Member: <strong>{scanResult.member.full_name}</strong> • Clearance: <strong>{scanResult.member.safety_clearance_status}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Real-Time Gate Scan Logs */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-800">
                Source 3: Real-Time Facility Turnstile Scan Logs
              </h2>
              <p className="text-[11px] text-slate-500">
                Audit log of live RFID turnstile scans persisted in PostgreSQL table <code>turnstile_scans</code>.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              Live Feed
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[520px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Scan ID</th>
                  <th className="py-2.5 px-3">Member ID</th>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Gate Outcome</th>
                  <th className="py-2.5 px-3">Scan Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No scans logged yet. Tap an RFID badge above!
                    </td>
                  </tr>
                ) : (
                  recentScans.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {s.checkin_id || s.id.slice(0, 8)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {s.member_id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {s.full_name || <em className="text-slate-400">Unregistered</em>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {s.facility_zone}
                      </td>
                      <td className="py-2.5 px-3">
                        {s.access_granted ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center space-x-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>GRANTED</span>
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center space-x-1" title={s.denial_reason}>
                            <AlertOctagon className="h-3 w-3" />
                            <span>DENIED</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[10px]">
                        {new Date(s.scan_time).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
