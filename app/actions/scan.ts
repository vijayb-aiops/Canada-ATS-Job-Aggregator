'use server';

import { createClient } from '@/lib/supabase/server';
import { runScraper } from '@/lib/scraper';

export async function startScan(
  selectedAts: string[],
  selectedRoles: string[],
  selectedCities: string[],
  selectedJobTypes: string[],
  selectedCountries: string[]
) {
  const supabase = await createClient();

  // 1. Create scan record
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

  try {
    // 2. Run scraper
    const results = await runScraper(
      selectedAts,
      selectedRoles,
      selectedCities,
      selectedJobTypes,
      selectedCountries
    );

    // 3. Save jobs
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

    // 4. Update scan status
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

    return { success: true, scanId: scan.id, count: results.length };
  } catch (error: any) {
    await supabase
      .from('scans')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', scan.id);

    throw new Error(error?.message || 'Scan failed unexpectedly.');
  }
}
