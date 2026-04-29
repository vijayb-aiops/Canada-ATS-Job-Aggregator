import { ATSParser, JobResult, ScraperOptions } from './types';
import { greenhouseParser } from './parsers/greenhouse';
import { leverParser } from './parsers/lever';
import { ashbyParser } from './parsers/ashby';
import { workdayParser } from './parsers/workday';
import { smartRecruitersParser } from './parsers/smartrecruiters';
import { bambooHrParser } from './parsers/bamboohr';
import { icimsParser } from './parsers/icims';
import { jobviteParser } from './parsers/jobvite';
import { adpParser } from './parsers/adp';
import { successFactorsParser } from './parsers/successfactors';

const PARSERS: Record<string, ATSParser> = {
  'Greenhouse': greenhouseParser,
  'Lever': leverParser,
  'Ashby': ashbyParser,
  'Workday': workdayParser,
  'SmartRecruiters': smartRecruitersParser,
  'BambooHR': bambooHrParser,
  'iCIMS': icimsParser,
  'Jobvite': jobviteParser,
  'ADP Workforce Now': adpParser,
  'SAP SuccessFactors': successFactorsParser
};

export async function runScraper(
  selectedAts: string[],
  roles: string[],
  cities: string[],
  jobTypes: string[],
  countries: string[]
): Promise<JobResult[]> {
  const allResults: JobResult[] = [];
  const options: ScraperOptions = {
    roles,
    countries,
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
      console.warn(`Parser for ${atsName} is not implemented. Skipping.`);
    }
  }

  return allResults;
}
