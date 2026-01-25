import axios from 'axios';
import * as cheerio from 'cheerio';
import companiesConfig from '@/data/ats-companies.json';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const greenhouseParser: ATSParser = {
  name: 'Greenhouse',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const results: JobResult[] = [];
    const companies = companiesConfig.greenhouse;
    const baseUrls = [
      'https://job-boards.greenhouse.io',
      'https://boards.greenhouse.io'
    ];
    
    for (const company of companies) {
      const companySlug = company.toLowerCase().replace(/\s+/g, '');
      try {
        const apiUrl = `https://api.greenhouse.io/v1/boards/${companySlug}/jobs`;
        const { data } = await axios.get(apiUrl, { timeout: 10000 });
        const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
        results.push(...filterGreenhouseJobs(jobs, company, options));
      } catch (apiError) {
        try {
          let html = '';
          for (const baseUrl of baseUrls) {
            const url = `${baseUrl}/${companySlug}`;
            try {
              const { data } = await axios.get(url, { timeout: 10000 });
              html = data;
              break;
            } catch (error) {
              continue;
            }
          }
          if (!html) {
            throw new Error(`No Greenhouse board found for ${company}`);
          }
          const $ = cheerio.load(html);
          $('.opening').each((_, el) => {
            const position = $(el).find('a').text().trim();
            const link = 'https://boards.greenhouse.io' + $(el).find('a').attr('href');
            const location = $(el).find('.location').text().trim();
            if (matchesGreenhouseFilters(position, location, options)) {
              results.push({
                ats_system: 'Greenhouse',
                company,
                position,
                link,
                location,
                job_type: 'Full-time'
              });
            }
          });
        } catch (error) {
          console.error(`Error scraping Greenhouse for ${company}:`, error);
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }
};

function matchesGreenhouseFilters(position: string, location: string, options: ScraperOptions): boolean {
  const locationLower = location.toLowerCase();
  const isCanada = locationLower.includes('canada') ||
    locationLower.includes('toronto') ||
    locationLower.includes('vancouver') ||
    locationLower.includes('remote');

  const matchesRole = options.roles.some(role =>
    position.toLowerCase().includes(role.toLowerCase())
  );

  return isCanada && matchesRole;
}

function filterGreenhouseJobs(jobs: any[], company: string, options: ScraperOptions): JobResult[] {
  return jobs.reduce<JobResult[]>((acc, job) => {
    const position = job?.title?.trim() ?? '';
    const link = job?.absolute_url ?? '';
    const location = job?.location?.name ?? '';
    const jobType = job?.metadata?.find((m: any) => m?.name === 'Employment Type')?.value ?? 'Full-time';

    if (position && link && matchesGreenhouseFilters(position, location, options)) {
      acc.push({
        ats_system: 'Greenhouse',
        company,
        position,
        link,
        location,
        job_type: jobType
      });
    }
    return acc;
  }, []);
}
