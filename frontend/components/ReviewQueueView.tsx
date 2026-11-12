'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Check,
  X,
  Clock,
  Edit2,
  Save,
  MessageSquare,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { fetchReviewQueue, updateReviewItem } from '../lib/api';
import { ReviewQueueItem } from '../types/dqm';

interface ReviewQueueViewProps {
  sessionId: string | null;
}

export default function ReviewQueueView({ sessionId }: ReviewQueueViewProps) {
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadQueue = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetchReviewQueue(sessionId);
      if (res.success) {
        setQueue(res.reviewQueue || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [sessionId]);

  const handleUpdateStatus = async (item: ReviewQueueItem, newStatus: string) => {
    if (!sessionId) return;
    setSavingId(item.id);
    try {
      const res = await updateReviewItem(sessionId, { id: item.id, status: newStatus });
      if (res.success) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: newStatus as any } : q))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveEdit = async (item: ReviewQueueItem) => {
    if (!sessionId) return;
    setSavingId(item.id);
    try {
      const res = await updateReviewItem(sessionId, {
        id: item.id,
        notes: editNotes,
        manualValue: editValue
      });
      if (res.success) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, notes: editNotes, manualValue: editValue, status: 'Reviewed' }
              : q
          )
        );
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const filteredQueue = queue.filter(
    (item) => statusFilter === 'All' || item.status === statusFilter
  );

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Data Steward Human Review Queue</span>
          </h2>
          <p className="text-xs text-slate-500">
            Ambiguous, incomplete, or critical findings requiring manual verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="All">Filter Status: All ({queue.length})</option>
            <option value="Pending">Pending ({queue.filter((q) => q.status === 'Pending').length})</option>
            <option value="Reviewed">Reviewed ({queue.filter((q) => q.status === 'Reviewed').length})</option>
            <option value="Approved">Approved ({queue.filter((q) => q.status === 'Approved').length})</option>
            <option value="Rejected">Rejected ({queue.filter((q) => q.status === 'Rejected').length})</option>
          </select>

          <button
            onClick={loadQueue}
            disabled={isLoading || !sessionId}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Queue List Cards */}
      {filteredQueue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500 shadow-sm">
          No review items found for the selected filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item) => {
            const isEditing = editingId === item.id;
            const isSaving = savingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      Row #{item.rowNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Field: <strong className="text-slate-900">{item.field}</strong>
                    </span>
                    <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-medium">
                      {item.category}
                    </span>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : item.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : item.status === 'Reviewed'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {item.status}
                    </span>

                    <button
                      onClick={() => handleUpdateStatus(item, 'Approved')}
                      disabled={isSaving}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-medium flex items-center space-x-1"
                    >
                      <Check className="h-3 w-3" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(item, 'Rejected')}
                      disabled={isSaving}
                      className="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded font-medium flex items-center space-x-1"
                    >
                      <X className="h-3 w-3" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {/* Values & Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Original Value:</span>
                    <span className="font-mono bg-slate-50 border border-slate-100 p-1.5 rounded block text-slate-800 mt-0.5">
                      {item.currentValue === '' ? (
                        <em className="text-slate-400">&lt;empty&gt;</em>
                      ) : (
                        item.currentValue
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Reason for Review:</span>
                    <span className="text-slate-600 block mt-0.5">{item.reasonForReview}</span>
                  </div>
                </div>

                {/* Note / Manual Correction Box */}
                {isEditing ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Corrected Manual Value:
                      </label>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full mt-1 border border-slate-300 rounded px-2 py-1 text-xs"
                        placeholder="Enter verified value..."
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Steward Notes:
                      </label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full mt-1 border border-slate-300 rounded px-2 py-1 text-xs"
                        placeholder="Reason for manual adjustment..."
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded font-medium flex items-center space-x-1"
                      >
                        <Save className="h-3 w-3" />
                        <span>Save Correction</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="text-slate-500 flex items-center space-x-2">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.notes ? `Note: ${item.notes}` : 'No steward notes logged.'}</span>
                      {item.manualValue && (
                        <span className="text-emerald-700 font-mono font-medium">
                          • Corrected: {item.manualValue}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditNotes(item.notes || '');
                        setEditValue(item.manualValue || item.currentValue || '');
                      }}
                      className="text-slate-500 hover:text-slate-800 font-medium flex items-center space-x-1 text-[11px]"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit Value / Note</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

