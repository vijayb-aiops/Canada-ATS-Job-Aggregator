'use server';

import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function exportScanToExcel(scanId: string) {
  const supabase = await createClient();

  // Fetch jobs for this scan
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('ats_system, company, position, link, location, job_type')
    .eq('scan_id', scanId);

  if (error) throw new Error(error.message);
  if (!jobs || jobs.length === 0) throw new Error('No jobs found for this scan.');

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(jobs.map(job => ({
    'ATS System': job.ats_system,
    'Company': job.company,
    'Position': job.position,
    'Link': job.link,
    'Location': job.location,
    'Job Type': job.job_type
  })));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Return as base64 to the client
  return buffer.toString('base64');
}
