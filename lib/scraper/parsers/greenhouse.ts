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
            if (matchesGreenhouseFilters(position, location, 'Full-time', options)) {
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

function matchesGreenhouseFilters(
  position: string,
  location: string,
  jobType: string,
  options: ScraperOptions
): boolean {
  const locationLower = location.toLowerCase();
  const matchesCountry = matchesCountryFilter(locationLower, options.countries);

  const matchesRole = matchesRoleFilter(position, options.roles);

  const matchesCity = matchesCityFilter(locationLower, options.cities ?? []);
  const matchesJobType = matchesJobTypeFilter(jobType, locationLower, options.jobTypes ?? []);

  return matchesCountry && matchesRole && matchesCity && matchesJobType;
}

function filterGreenhouseJobs(jobs: any[], company: string, options: ScraperOptions): JobResult[] {
  return jobs.reduce<JobResult[]>((acc, job) => {
    const position = job?.title?.trim() ?? '';
    const link = job?.absolute_url ?? '';
    const location = job?.location?.name ?? '';
    const jobType = job?.metadata?.find((m: any) => m?.name === 'Employment Type')?.value ?? 'Full-time';

    if (position && link && matchesGreenhouseFilters(position, location, jobType, options)) {
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

function matchesRoleFilter(position: string, roles: string[]): boolean {
  const title = position.toLowerCase();
  return roles.some(role => {
    const tokens = role
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(token => token.length >= 2);
    if (tokens.length === 0) return false;
    const matchCount = tokens.filter(token => title.includes(token)).length;
    return matchCount >= Math.min(2, tokens.length);
  });
}

function matchesCityFilter(locationLower: string, cities: string[]): boolean {
  if (cities.length === 0) return true;
  return cities.some(city => locationLower.includes(city.toLowerCase()));
}

function matchesCountryFilter(locationLower: string, countries: string[]): boolean {
  if (countries.length === 0) return true;
  const countryHints: Record<string, string[]> = {
    Canada: [
      'canada',
      'toronto',
      'vancouver',
      'waterloo',
      'calgary',
      'ottawa',
      'montreal',
      'london',
      'oakville',
      'mississauga',
      'cambridge',
      'winnipeg',
      'kitchener',
      'brampton',
      'edmonton',
      'markham',
      'hamilton',
      'halifax',
      'saskatoon'
    ],
    USA: [
      'united states',
      'usa',
      'us ',
      'new york',
      'san francisco',
      'seattle',
      'austin',
      'boston',
      'chicago',
      'los angeles',
      'remote - us',
      'remote, us'
    ]
  };

  return countries.some(country => {
    const hints = countryHints[country] ?? [];
    return hints.some(hint => locationLower.includes(hint));
  });
}

function matchesJobTypeFilter(jobType: string, locationLower: string, selectedJobTypes: string[]): boolean {
  if (selectedJobTypes.length === 0) return true;

  const jobTypeLower = jobType.toLowerCase();
  const isRemote = jobTypeLower.includes('remote') || locationLower.includes('remote');
  const isFullTime = jobTypeLower.includes('full') || jobTypeLower.includes('permanent');
  const isContract = jobTypeLower.includes('contract');
  const isPartTime = jobTypeLower.includes('part');

  return selectedJobTypes.some(type => {
    switch (type) {
      case 'Full Time':
        return isFullTime;
      case 'Contract':
        return isContract;
      case 'Fulltime-Remote':
        return isFullTime && isRemote;
      case 'Contract-Remote':
        return isContract && isRemote;
      case 'Part-time':
        return isPartTime;
      case 'Remote':
        return isRemote;
      default:
        return false;
    }
  });
}
