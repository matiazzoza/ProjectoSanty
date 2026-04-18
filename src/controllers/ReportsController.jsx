import { createContext, useContext, useState, useEffect } from 'react';
import * as reporteModel from '../models/reporteModel';
import { useAuth } from './AuthController';

const ReportsContext = createContext(null);

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    reporteModel.getAll()
      .then(setReports)
      .catch((err) => console.error('Error cargando reportes:', err))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  async function addReport(reportData) {
    const created = await reporteModel.create(reportData);
    setReports((prev) => [created, ...prev]);
    return created;
  }

  async function updateReport(reportId, changes) {
    const updated = await reporteModel.update(reportId, changes);
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
  }

  async function toggleVote(reportId, userId) {
    const newVotes = await reporteModel.toggleVote(reportId, userId);
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, votes: newVotes } : r))
    );
  }

  async function updateStatus(reportId, status) {
    await updateReport(reportId, { status });
  }

  async function addComment(reportId, comment) {
    const created = await reporteModel.addComment(reportId, comment);
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, comments: [...(r.comments || []), created] } : r
      )
    );
  }

  async function deleteComment(reportId, commentId) {
    await reporteModel.deleteComment(reportId, commentId);
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, comments: r.comments.filter((c) => c.id !== commentId) }
          : r
      )
    );
  }

  async function deleteReport(reportId) {
    await reporteModel.remove(reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  function getReport(reportId) {
    return reports.find((r) => r.id === reportId);
  }

  return (
    <ReportsContext.Provider
      value={{ reports, loading, addReport, updateReport, toggleVote, updateStatus, addComment, deleteComment, deleteReport, getReport }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  return useContext(ReportsContext);
}
