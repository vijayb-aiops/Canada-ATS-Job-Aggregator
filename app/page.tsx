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
  'AI Engineer', 'AI Developer', 'Data Scientist', 'ML Engineer', 'GenAI Engineer',
  'MLOps / LLMOps', 'Python Developer', 'Devops Engineer',
  'Site Reliability Engineer', 'Cloud Engineer', 'Machine Learning Engineer',
  'Applied AI Engineer', 'Applied ML Engineer', 'Software Engineer',
  'Staff Machine Learning Engineer', 'Generative AI',
  'AI/ML Specialist Solutions Architect', 'Staff Applied AI/ ML Engineer',
  'Fullstack Engineer', 'Senior Software Engineer',
  'Forward Deployed Engineer (AI Agent)'
];

const CITY_FILTERS = [
  'Waterloo', 'Toronto', 'Vancouver', 'Calgary', 'Ottawa',
  'Montreal', 'London', 'Oakville', 'Mississauga'
];

const JOB_TYPE_FILTERS = [
  'Full Time', 'Contract', 'Fulltime-Remote', 'Contract-Remote', 'Part-time'
];

export default function Home() {
  const [selectedAts, setSelectedAts] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
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

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const toggleJobType = (jobType: string) => {
    setSelectedJobTypes(prev =>
      prev.includes(jobType) ? prev.filter(t => t !== jobType) : [...prev, jobType]
    );
  };

  const handleRunScan = async () => {
    if (selectedAts.length === 0 || selectedRoles.length === 0) return;
    
    setIsScanning(true);
    setScanComplete(false);
    setProgress(10);
    
    try {
      const result = await startScan(selectedAts, selectedRoles, selectedCities, selectedJobTypes);
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
      const timestamp = new Date();
      const datePart = timestamp.toISOString().split('T')[0];
      const timePart = timestamp
        .toLocaleTimeString('en-CA', { hour12: false })
        .replace(/:/g, '');
      a.download = `canada-jobs-${datePart}-${timePart}.xlsx`;
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%),radial-gradient(circle_at_20%_30%,_rgba(16,185,129,0.16),_transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(251,146,60,0.12),_transparent_40%)]"></div>
      <header className="relative bg-slate-950/80 border-b border-slate-800 py-6 px-8 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg ring-1 ring-blue-500/40">
              <Search className="text-blue-300 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Canada ATS Job Aggregator</h1>
              <p className="text-slate-400 text-sm">Discover AI/ML opportunities across top ATS platforms</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-slate-800/70 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></span>
            Canada Only
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Configuration */}
          <div className="md:col-span-1 space-y-6">
            <section className="bg-slate-900/70 p-6 rounded-xl border border-slate-800 shadow-lg shadow-slate-950/50">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-cyan-300" />
                <h2 className="font-semibold">ATS Sources</h2>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {ATS_SYSTEMS.map(ats => (
                  <label key={ats} className="flex items-center gap-3 p-2 hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-600 text-cyan-400 focus:ring-cyan-500"
                      checked={selectedAts.includes(ats)}
                      onChange={() => toggleAts(ats)}
                    />
                    <span className="text-sm text-slate-200">{ats}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                <button 
                  onClick={() => setSelectedAts(ATS_SYSTEMS)}
                  className="text-xs text-cyan-300 hover:underline"
                >
                  Select All
                </button>
                <button 
                  onClick={() => setSelectedAts([])}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </section>

            <section className="bg-slate-900/70 p-6 rounded-xl border border-slate-800 shadow-lg shadow-slate-950/50">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-fuchsia-300" />
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
                        ? "bg-fuchsia-500/20 border-fuchsia-400/60 text-fuchsia-200"
                        : "bg-slate-950/60 border-slate-700 text-slate-300 hover:border-slate-500"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => setSelectedRoles(JOB_ROLES)}
                  className="text-xs text-fuchsia-300 hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedRoles([])}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Action & Results */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/70 p-8 rounded-xl border border-slate-800 shadow-lg shadow-slate-950/50 flex flex-col items-center justify-center text-center min-h-[400px]">
              {!isScanning && !scanComplete && (
                <div className="max-w-sm">
                  <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-blue-400/40">
                    <Play className="w-8 h-8 text-blue-300 ml-1" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Ready to Scan</h3>
                  <p className="text-slate-400 mb-8">
                    Select your target ATS systems and job roles to begin aggregating postings from across Canada.
                  </p>
                  <button
                    onClick={handleRunScan}
                    disabled={selectedAts.length === 0 || selectedRoles.length === 0}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    Run Scan
                  </button>
                </div>
              )}

              {isScanning && (
                <div className="w-full max-w-md">
                  <Loader2 className="w-12 h-12 text-blue-300 animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-2">Scanning ATS Systems...</h3>
                  <p className="text-slate-400 mb-8">This may take a few minutes depending on the number of sources.</p>
                  
                  <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
                    <div 
                      className="bg-blue-400 h-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-blue-300">{progress}% Complete</span>
                    <span className="text-slate-500">Processing {selectedAts[Math.floor((progress/100) * selectedAts.length)] || 'Finalizing'}...</span>
                  </div>
                </div>
              )}

              {scanComplete && (
                <div className="max-w-sm">
                  <div className="bg-emerald-500/15 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-400/50">
                    <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Scan Complete!</h3>
                  <p className="text-slate-400 mb-8">
                    Found <span className="font-bold text-slate-100">{resultsCount}</span> relevant job postings across {selectedAts.length} ATS systems.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDownload}
                      disabled={isExporting}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
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
                      className="text-sm text-slate-400 hover:text-slate-200 font-medium"
                    >
                      Start New Scan
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-slate-900/70 p-6 rounded-xl border border-slate-800 shadow-lg shadow-slate-950/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <h2 className="font-semibold">Cities</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CITY_FILTERS.map(city => (
                    <button
                      key={city}
                      onClick={() => toggleCity(city)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                        selectedCities.includes(city)
                          ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-200"
                          : "bg-slate-950/60 border-slate-700 text-slate-300 hover:border-slate-500"
                      )}
                    >
                      {city}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">Leave empty to include all cities.</p>
              </section>

              <section className="bg-slate-900/70 p-6 rounded-xl border border-slate-800 shadow-lg shadow-slate-950/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <h2 className="font-semibold">Job Type</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPE_FILTERS.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleJobType(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                        selectedJobTypes.includes(type)
                          ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                          : "bg-slate-950/60 border-slate-700 text-slate-300 hover:border-slate-500"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">Leave empty to include all job types.</p>
              </section>
            </div>

            {/* Info Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
              <p className="text-sm text-amber-100">
                <strong>Note:</strong> This tool performs real-time scraping. Some ATS systems may have rate limits or temporary blocks. If a source fails, it will be skipped gracefully.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
