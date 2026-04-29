'use server';

import { createClient } from '@/lib/supabase/server';
import { type JobResult } from '@/lib/scraper/types';
import * as XLSX from 'xlsx';

type ExportJob = Pick<JobResult, 'ats_system' | 'company' | 'position' | 'link'> & {
  location?: string | null;
  job_type?: string | null;
};

export async function exportScanToExcel(scanId: string) {
  const supabase = await createClient();

  // Fetch jobs for this scan
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('ats_system, company, position, link, location, job_type')
    .eq('scan_id', scanId);

  if (error) throw new Error(error.message);
  if (!jobs || jobs.length === 0) throw new Error('No jobs found for this scan.');

  return exportJobsToExcel(jobs);
}

export async function exportJobsToExcel(jobs: ExportJob[]) {
  if (jobs.length === 0) throw new Error('No jobs found for this scan.');

  const worksheet = XLSX.utils.json_to_sheet(jobs.map(job => ({
    'ATS System': job.ats_system,
    'Company': job.company,
    'Position': job.position,
    'Link': job.link,
    'Location': job.location ?? '',
    'Job Type': job.job_type ?? ''
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer.toString('base64');
}
