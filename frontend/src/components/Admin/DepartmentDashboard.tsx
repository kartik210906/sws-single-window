// frontend/src/components/Admin/DepartmentDashboard.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface Application {
  businessName: string;
  applicantId: string;
  submittedAt: string;
  overallStatus: string;
}

interface QueueItem {
  id: string;
  applicationId: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTION_REQUIRED';
  extractedData: Record<string, any>;
  reviewerRemarks?: string;
  createdAt: string;
  application: Application;
}

interface DepartmentDashboardProps {
  department: 'fire' | 'water';
}

export default function DepartmentDashboard({ department }: DepartmentDashboardProps) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<QueueItem | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/submissions/queue/${department}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch queue list.');
      setFormQueue(data.data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with database API.');
    } finally {
      setLoading(false);
    }
  };

  const setFormQueue = (data: QueueItem[]) => {
    setQueueItems(data);
  };

  useEffect(() => {
    fetchQueue();
  }, [department]);

  const handleStatusUpdate = async (itemId: string, nextStatus: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/submissions/queue/${department}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          remarks: remarks,
          reviewerId: 'gov_officer_sih26130'
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed updating status.');
      
      // Reset state and reload queue
      setActiveItem(null);
      setRemarks('');
      await fetchQueue();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: QueueItem['status']) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Under Review</span>;
      case 'ACTION_REQUIRED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Action Req.</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Pending</span>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 capitalize">
              {department} Department Compliance Queue
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Smart India Hackathon (SIH26130) Single Window System
            </p>
          </div>
          <button
            onClick={fetchQueue}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition"
          >
            Refresh Queue
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
        ) : queueItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500 border">
            No compliance submissions pending in the {department} queue.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Submission Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Overall App Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dept Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queueItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{item.application.businessName}</div>
                      <div className="text-xs text-gray-400 font-mono">AppID: {item.applicationId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.application.submittedAt).toLocaleDateString()} {new Date(item.application.submittedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium text-gray-700 capitalize">{item.application.overallStatus.replace('_', ' ').toLowerCase()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => { setActiveItem(item); setRemarks(item.reviewerRemarks || ''); }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inspection / Execution Modal */}
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{activeItem.application.businessName}</h3>
                  <p className="text-xs text-gray-500">Departmental Submission Data Inspector</p>
                </div>
                <button
                  onClick={() => { setActiveItem(null); setRemarks(''); }}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              {/* Data Content */}
              <div className="p-6 space-y-6 flex-1">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Split Compliance Data</h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm overflow-x-auto">
                    <pre>{JSON.stringify(activeItem.extractedData, null, 2)}</pre>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Reviewer Remarks / Feedback
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Input conditions, verification notes, or reason for rejection..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleStatusUpdate(activeItem.id, 'UNDER_REVIEW')}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                      Hold Under Review
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(activeItem.id, 'REJECTED')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(activeItem.id, 'APPROVED')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition"
                    >
                      Approve Compliance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
