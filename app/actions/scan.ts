'use server';

import { createClient } from '@/lib/supabase/server';
import { runScraper } from '@/lib/scraper';
import { type JobResult } from '@/lib/scraper/types';

type ScanResponse = {
  success: true;
  scanId: string | null;
  count: number;
  jobs: JobResult[];
  persistenceWarning?: string;
};

export async function startScan(
  selectedAts: string[],
  selectedRoles: string[],
  selectedCities: string[],
  selectedJobTypes: string[],
  selectedCountries: string[]
): Promise<ScanResponse> {
  const results = await runScraper(
    selectedAts,
    selectedRoles,
    selectedCities,
    selectedJobTypes,
    selectedCountries
  );

  try {
    const supabase = await createClient();

    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        ats_filters: selectedAts,
        role_filters: selectedRoles,
        status: 'processing'
      })
      .select()
      .single();

    if (scanError) {
      throw new Error(`Failed to create scan record: ${scanError.message}`);
    }

    if (results.length > 0) {
      const jobsToInsert = results.map(job => ({
        ...job,
        scan_id: scan.id
      }));

      const { error: jobsError } = await supabase
        .from('jobs')
        .insert(jobsToInsert);

      if (jobsError) {
        throw new Error(`Failed to save jobs: ${jobsError.message}`);
      }
    }

    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        total_found: results.length
      })
      .eq('id', scan.id);

    if (updateError) {
      throw new Error(`Failed to mark scan as completed: ${updateError.message}`);
    }

    return { success: true, scanId: scan.id, count: results.length, jobs: results };
  } catch (error: any) {
    const message = error?.message || 'Unable to save scan results.';
    console.error('Scan persistence failed:', error);

    return {
      success: true,
      scanId: null,
      count: results.length,
      jobs: results,
      persistenceWarning: message
    };
  }
}
