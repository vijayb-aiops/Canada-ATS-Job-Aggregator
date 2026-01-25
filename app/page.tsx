'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Building2,
  Briefcase
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { startScan } from '@/app/actions/scan';
import { exportScanToExcel } from '@/app/actions/export';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ATS_SYSTEMS = [
  'Greenhouse', 'Lever', 'Workday', 'SmartRecruiters', 'Ashby',
  'BambooHR', 'iCIMS', 'Jobvite', 'ADP Workforce Now', 'SAP SuccessFactors'
];

const JOB_ROLES = [
  'AI Engineer', 'Data Scientist', 'ML Engineer', 'GenAI Engineer',
  'MLOps / LLMOps', 'Python Developer', 'NLP Engineer', 'Computer Vision Engineer'
];

export default function Home() {
  const [selectedAts, setSelectedAts] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const [scanId, setScanId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const toggleAts = (ats: string) => {
    setSelectedAts(prev => 
      prev.includes(ats) ? prev.filter(a => a !== ats) : [...prev, ats]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleRunScan = async () => {
    if (selectedAts.length === 0 || selectedRoles.length === 0) return;
    
    setIsScanning(true);
    setScanComplete(false);
    setProgress(10);
    
    try {
      const result = await startScan(selectedAts, selectedRoles);
      setProgress(100);
      setResultsCount(result.count);
      setScanId(result.scanId);
      setScanComplete(true);
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownload = async () => {
    if (!scanId) return;
    
    setIsExporting(true);
    try {
      const base64 = await exportScanToExcel(scanId);
      
      // Create a download link on the client
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canada-jobs-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate Excel file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 py-6 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Search className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Canada ATS Job Aggregator</h1>
              <p className="text-slate-500 text-sm">Discover AI/ML opportunities across top ATS platforms</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Canada Only
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Configuration */}
          <div className="md:col-span-1 space-y-6">
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold">ATS Sources</h2>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {ATS_SYSTEMS.map(ats => (
                  <label key={ats} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedAts.includes(ats)}
                      onChange={() => toggleAts(ats)}
                    />
                    <span className="text-sm text-slate-700">{ats}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <button 
                  onClick={() => setSelectedAts(ATS_SYSTEMS)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Select All
                </button>
                <button 
                  onClick={() => setSelectedAts([])}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold">Job Roles</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {JOB_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      selectedRoles.includes(role)
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Action & Results */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
              {!isScanning && !scanComplete && (
                <div className="max-w-sm">
                  <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-8 h-8 text-blue-600 ml-1" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Ready to Scan</h3>
                  <p className="text-slate-500 mb-8">
                    Select your target ATS systems and job roles to begin aggregating postings from across Canada.
                  </p>
                  <button
                    onClick={handleRunScan}
                    disabled={selectedAts.length === 0 || selectedRoles.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                  >
                    Run Scan
                  </button>
                </div>
              )}

              {isScanning && (
                <div className="w-full max-w-md">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-2">Scanning ATS Systems...</h3>
                  <p className="text-slate-500 mb-8">This may take a few minutes depending on the number of sources.</p>
                  
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-blue-600">{progress}% Complete</span>
                    <span className="text-slate-400">Processing {selectedAts[Math.floor((progress/100) * selectedAts.length)] || 'Finalizing'}...</span>
                  </div>
                </div>
              )}

              {scanComplete && (
                <div className="max-w-sm">
                  <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Scan Complete!</h3>
                  <p className="text-slate-500 mb-8">
                    Found <span className="font-bold text-slate-900">{resultsCount}</span> relevant job postings across {selectedAts.length} ATS systems.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDownload}
                      disabled={isExporting}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                    >
                      {isExporting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      {isExporting ? 'Generating...' : 'Download Excel (.xlsx)'}
                    </button>
                    <button
                      onClick={() => {
                        setScanComplete(false);
                        setScanId(null);
                      }}
                      className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Start New Scan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This tool performs real-time scraping. Some ATS systems may have rate limits or temporary blocks. If a source fails, it will be skipped gracefully.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
