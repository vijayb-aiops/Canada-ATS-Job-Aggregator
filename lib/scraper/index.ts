import { ATSParser, JobResult, ScraperOptions } from './types';
import { greenhouseParser } from './parsers/greenhouse';
import { leverParser } from './parsers/lever';

const PARSERS: Record<string, ATSParser> = {
  'Greenhouse': greenhouseParser,
  'Lever': leverParser,
  // Other parsers would be added here
};

export async function runScraper(
  selectedAts: string[],
  roles: string[],
  cities: string[],
  jobTypes: string[]
): Promise<JobResult[]> {
  const allResults: JobResult[] = [];
  const options: ScraperOptions = {
    roles,
    countries: ['Canada'],
    cities,
    jobTypes
  };

  for (const atsName of selectedAts) {
    const parser = PARSERS[atsName];
    if (parser) {
      try {
        const results = await parser.search(options);
        allResults.push(...results);
      } catch (error) {
        console.error(`Scraper failed for ${atsName}:`, error);
      }
    } else {
      // Fallback/Mock for ATS systems not yet fully implemented
      console.warn(`Parser for ${atsName} not implemented, using mock data.`);
      allResults.push(...generateMockResults(atsName, roles));
    }
  }

  return allResults;
}

function generateMockResults(ats: string, roles: string[]): JobResult[] {
  // This ensures the UI shows results even for unimplemented parsers during development
  return roles.slice(0, 2).map(role => ({
    ats_system: ats,
    company: `${ats} Partner Co`,
    position: `${role}`,
    link: 'https://example.com/job',
    location: 'Toronto, ON (Remote)',
    job_type: 'Full-time'
  }));
}
