import { createContext, useContext, useState, useEffect } from "react";
import { INITIAL_REPORTS } from "../data/mockReports";

const ReportsContext = createContext(null);

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState(() => {
    const stored = localStorage.getItem("reports");
    if (stored) {
      // Migrar reportes viejos que no tengan status/comments
      return JSON.parse(stored).map((r) => ({
        status: "pendiente",
        comments: [],
        ...r,
      }));
    }
    return INITIAL_REPORTS;
  });

  useEffect(() => {
    localStorage.setItem("reports", JSON.stringify(reports));
  }, [reports]);

  function addReport(report) {
    setReports((prev) => [report, ...prev]);
  }

  function updateReport(reportId, changes) {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, ...changes } : r))
    );
  }

  function toggleVote(reportId, userId) {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        const hasVoted = r.votes.includes(userId);
        return {
          ...r,
          votes: hasVoted
            ? r.votes.filter((id) => id !== userId)
            : [...r.votes, userId],
        };
      })
    );
  }

  function updateStatus(reportId, status) {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status } : r))
    );
  }

  function addComment(reportId, comment) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, comments: [...(r.comments || []), comment] }
          : r
      )
    );
  }

  function deleteComment(reportId, commentId) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, comments: r.comments.filter((c) => c.id !== commentId) }
          : r
      )
    );
  }

  function deleteReport(reportId) {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  function getReport(reportId) {
    return reports.find((r) => r.id === reportId);
  }

  return (
    <ReportsContext.Provider
      value={{
        reports,
        addReport,
        updateReport,
        toggleVote,
        updateStatus,
        addComment,
        deleteComment,
        deleteReport,
        getReport,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  return useContext(ReportsContext);
}
