'use client';

import React, { useState, useEffect } from 'react';
import { Radio, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface ScanItem {
  checkin_id: string;
  member_id: string;
  scan_time: string;
  facility_zone: string;
  access_granted: boolean;
  denial_reason: string | null;
}

export default function TurnstileView() {
  const [recentScans, setRecentScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Scanning Station State
  const [memberId, setMemberId] = useState('MBR-1150');
  const [facilityZone, setFacilityZone] = useState('High-Intensity HIIT Studio');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const fetchRecentScans = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/roles/turnstile/recent-scans');
      const data = await res.json();
      if (data.success) {
        setRecentScans(data.scans || []);
      }
    } catch (err) {
      console.error('Failed to load recent turnstile scans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentScans();
  }, []);

  const handleSimulateScan = async (overrideId?: string) => {
    const targetId = overrideId || memberId;
    if (!targetId) return;

    setScanning(true);
    setScanResult(null);
    try {
      const res = await apiFetch('/roles/turnstile/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: targetId.trim(),
          facility_zone: facilityZone
        })
      });
      const data = await res.json();
      setScanResult(data);
      fetchRecentScans();
    } catch (err) {
      setScanResult({
        accessGranted: false,
        denialReason: 'Turnstile IoT communication timeout with warehouse'
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">Source 03 · facility access</span>
          <h1>Member access terminal</h1>
          <p>
            Automated physical access barrier. Verifies real-time member health clearance against the PostgreSQL warehouse.
          </p>
        </div>
        <button onClick={fetchRecentScans} className="btn btn-secondary">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Scan Feed</span>
        </button>
      </div>

      {/* Summary Metrics Strip */}
      <dl className="dashboard-summary">
        <div>
          <dt>Total Logged Gate Scans</dt>
          <dd className="tabular-nums">{recentScans.length}</dd>
          <span>Source 3: Facility Turnstile IoT</span>
        </div>
        <div>
          <dt>Access Granted (Unlocked)</dt>
          <dd className="tabular-nums text-emerald-700">
            {recentScans.filter((s) => s.access_granted).length}
          </dd>
          <span>Active clearance verified</span>
        </div>
        <div>
          <dt>Access Denied (Locked)</dt>
          <dd className="tabular-nums text-red-700">
            {recentScans.filter((s) => !s.access_granted).length}
          </dd>
          <span>Cardiovascular flags / unassessed</span>
        </div>
        <div>
          <dt>Machine IoT Authority</dt>
          <dd className="text-sm font-semibold text-blue-900 mt-2">Zero Manual Override</dd>
          <span>Strict warehouse status enforcement</span>
        </div>
      </dl>

      {/* Interactive RFID Terminal Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Input Station */}
        <div className="form-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">RFID Scanner Terminal #01</h2>
              <p className="text-xs text-slate-500">Tap RFID keycard or simulate member arrival.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded">
              Machine ID: BGC_GATE_01
            </span>
          </div>

          <div className="space-y-4">
            <div className="form-group">
              <label>RFID Keycard / Member ID *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="e.g. MBR-1150"
                  className="flex-1 font-mono font-bold text-base"
                />
                <button
                  type="button"
                  onClick={() => handleSimulateScan()}
                  disabled={scanning}
                  className="btn btn-primary"
                >
                  <Radio className="h-4 w-4" />
                  <span>{scanning ? 'Reading...' : 'Tap RFID Keycard'}</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Facility Zone Access Gate</label>
              <select
                value={facilityZone}
                onChange={(e) => setFacilityZone(e.target.value)}
              >
                <option value="Main Gym Floor (Free Weights & Machines)">Main Gym Floor (Free Weights &amp; Machines)</option>
                <option value="High-Intensity HIIT Studio">High-Intensity HIIT Studio (Strict PAR-Q)</option>
                <option value="Cardio Deck (Treadmills & Ellipticals)">Cardio Deck (Treadmills &amp; Ellipticals)</option>
                <option value="Sauna & Steam Wellness Room">Sauna &amp; Steam Wellness Room</option>
                <option value="Olympic Swimming Pool">Olympic Swimming Pool</option>
                <option value="Boxing & MMA Ring">Boxing &amp; MMA Ring</option>
              </select>
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block mb-2">Classroom Demo Test Scenarios:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMemberId('MBR-1150');
                    handleSimulateScan('MBR-1150');
                  }}
                  className="btn btn-secondary text-xs px-2.5 py-1 text-red-700 hover:bg-red-50 border-red-200"
                >
                  Scan Danilo Mercado (Flagged HR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemberId('MBR-1146');
                    handleSimulateScan('MBR-1146');
                  }}
                  className="btn btn-secondary text-xs px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                >
                  Scan Divina Manalo (Cleared)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemberId('MBR-9999');
                    handleSimulateScan('MBR-9999');
                  }}
                  className="btn btn-secondary text-xs px-2.5 py-1 text-amber-700 hover:bg-amber-50 border-amber-200"
                >
                  Scan Unregistered RFID (Orphan Scan)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Physical Barrier Display */}
        <div className="form-card flex flex-col justify-center">
          <div className="mb-4 pb-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Physical Barrier Gate Status</h2>
            <span className="text-xs font-mono text-slate-400">Response: &lt;5ms</span>
          </div>

          {!scanResult ? (
            <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
              <Radio className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Ready for RFID Keycard Tap</p>
              <span className="text-xs text-slate-400">Scanner active at {facilityZone}</span>
            </div>
          ) : scanResult.accessGranted ? (
            <div className="p-6 rounded-lg bg-emerald-50 border-2 border-emerald-300 text-center">
              <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700 mb-3">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-1">ACCESS GRANTED</h3>
              <p className="text-sm font-semibold text-emerald-800 mb-3">Barrier Unlocked • Enjoy Your Workout</p>
              <div className="text-xs text-emerald-800 bg-white/70 p-3 rounded border border-emerald-200 max-w-sm mx-auto text-left space-y-1">
                <div><strong>Member ID:</strong> {scanResult.member?.member_id}</div>
                <div><strong>Health Clearance:</strong> ACTIVE_CLEARANCE</div>
                <div><strong>Zone:</strong> {scanResult.facility_zone}</div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-red-50 border-2 border-red-300 text-center">
              <div className="inline-flex p-3 rounded-full bg-red-100 text-red-700 mb-3">
                <XCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-red-900 mb-1">ACCESS DENIED</h3>
              <p className="text-sm font-semibold text-red-800 mb-3">Barrier Locked • Entry Prohibited</p>
              <div className="text-xs text-red-900 bg-white/80 p-3 rounded border border-red-200 max-w-sm mx-auto text-left space-y-1.5">
                <div><strong>Denial Reason:</strong> {scanResult.denialReason}</div>
                {scanResult.member && (
                  <div><strong>Member ID:</strong> {scanResult.member.member_id}</div>
                )}
                <div className="pt-1 text-[11px] text-red-700 border-t border-red-200">
                  Please report to the Front Desk or Clinic Station for health re-evaluation.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Turnstile Audit Feed Table */}
      <div className="data-table-container">
        <div className="table-toolbar">
          <strong className="text-sm text-slate-800">Turnstile Scan Audit Log (Source 3)</strong>
          <span className="text-xs text-slate-500 tabular-nums">Showing latest {recentScans.length} events</span>
        </div>

        <div className="table-scroll">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Scan ID</th>
                <th>Member ID</th>
                <th>Scan Timestamp</th>
                <th>Facility Zone</th>
                <th>Barrier Decision</th>
                <th>Denial Reason / Note</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No turnstile scans recorded yet.
                  </td>
                </tr>
              ) : (
                recentScans.slice(0, 15).map((scan) => (
                  <tr key={scan.checkin_id}>
                    <td className="font-mono text-xs font-semibold text-slate-700">{scan.checkin_id}</td>
                    <td className="font-mono text-xs font-semibold text-slate-900">{scan.member_id}</td>
                    <td className="tabular-nums text-xs text-slate-500">{scan.scan_time}</td>
                    <td className="text-xs text-slate-700">{scan.facility_zone}</td>
                    <td>
                      {scan.access_granted ? (
                        <span className="status-pill positive">GRANTED</span>
                      ) : (
                        <span className="status-pill negative">DENIED</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600 max-w-xs truncate">
                      {scan.denial_reason || 'Safety cleared — normal entry'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
