// src/components/DataExport.jsx - GDPR Data Export Component
import React, { useState, useEffect } from 'react';
import { MD3Button, MD3Card, useSnackbar } from './Material3';
import API from '../config/api';
import './DataExport.css';

const DataExport = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  // Load export summary on component mount
  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setSummaryLoading(true);
      const response = await API.get('/api/data-export/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load export summary:', error);
      showSnackbar({
        message: 'Failed to load data summary',
        variant: 'error',
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      showSnackbar({
        message: 'Preparing your data export...',
        variant: 'info',
      });

      // Request the export
      const response = await API.get('/api/data-export/user-data', {
        responseType: 'blob', // Important for file download
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `shelfquest-data-export-${Date.now()}.json`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      showSnackbar({
        message: 'Data export downloaded successfully!',
        variant: 'success',
      });

    } catch (error) {
      console.error('Data export failed:', error);
      showSnackbar({
        message: error.response?.data?.error || 'Failed to export data',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MD3Card className="data-export-card">
      <div className="data-export-header">
        <div className="data-export-icon">📦</div>
        <div className="data-export-header-text">
          <h3 className="md-title-large">Export Your Data</h3>
          <p className="md-body-small data-export-subtitle">
            Download all your personal data in JSON format (GDPR compliant)
          </p>
        </div>
      </div>

      <div className="data-export-content">
        <p className="md-body-medium data-export-description">
          You have the right to access and download all the data we store about you.
          This export includes your account information, library, notes, reading progress,
          and statistics.
        </p>

        {summaryLoading ? (
          <div className="data-export-summary data-export-loading">
            <div className="loading-spinner"></div>
            <span className="md-body-small">Loading data summary...</span>
          </div>
        ) : summary ? (
          <div className="data-export-summary">
            <h4 className="md-title-medium">What will be exported:</h4>
            <ul className="data-export-summary-list">
              <li className="md-body-medium">
                <span className="summary-icon">📚</span>
                <span className="summary-label">Books:</span>
                <span className="summary-value">{summary.books_count}</span>
              </li>
              <li className="md-body-medium">
                <span className="summary-icon">📝</span>
                <span className="summary-label">Notes & Highlights:</span>
                <span className="summary-value">{summary.notes_count}</span>
              </li>
              <li className="md-body-medium">
                <span className="summary-icon">📖</span>
                <span className="summary-label">Reading Sessions:</span>
                <span className="summary-value">{summary.sessions_count}</span>
              </li>
              <li className="md-body-medium">
                <span className="summary-icon">🏆</span>
                <span className="summary-label">Achievements:</span>
                <span className="summary-value">{summary.achievements_count}</span>
              </li>
              <li className="md-body-medium">
                <span className="summary-icon">📊</span>
                <span className="summary-label">Daily Statistics:</span>
                <span className="summary-value">{summary.reading_stats_days} days</span>
              </li>
            </ul>
          </div>
        ) : null}

        <div className="data-export-info">
          <h4 className="md-title-small">Important Information:</h4>
          <ul className="md-body-small data-export-info-list">
            <li>The export file is in JSON format and can be viewed in any text editor</li>
            <li>Book files are not included in the export (download them separately from your library)</li>
            <li>This export complies with GDPR Article 20 (Right to Data Portability)</li>
            <li>Your data is never sold or shared with third parties</li>
          </ul>
        </div>

        <div className="data-export-actions">
          <MD3Button
            variant="filled"
            onClick={handleExport}
            disabled={loading}
            className="export-button"
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Preparing Export...
              </>
            ) : (
              <>
                <span className="button-icon">⬇️</span>
                Export My Data
              </>
            )}
          </MD3Button>
        </div>

        <p className="md-body-small data-export-footer">
          Questions about your data? Contact us at <a href="mailto:info@shelfquest.pro">info@shelfquest.pro</a>
        </p>
      </div>
    </MD3Card>
  );
};

export default DataExport;
