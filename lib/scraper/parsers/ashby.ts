import axios from 'axios';
import * as cheerio from 'cheerio';
import companiesConfig from '@/data/ats-companies.json';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const ashbyParser: ATSParser = {
  name: 'Ashby',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const results: JobResult[] = [];
    const companies = companiesConfig.ashby ?? [];

    for (const company of companies) {
      try {
        const baseUrl = `https://jobs.ashbyhq.com/${company}`;
        const { data } = await axios.get(baseUrl, { timeout: 10000 });
        const $ = cheerio.load(data);

        $('a[href]').each((_, el) => {
          const href = $(el).attr('href') || '';
          if (!href.includes(`/${company}/`)) return;
          if (!href.includes('/application') && !href.includes('/jobs/')) return;

          const position = $(el).text().trim();
          if (!position) return;

          const link = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
          const location = $(el).closest('div').text().replace(position, '').trim();

          const inferredJobType = inferJobType(position, location);
          if (matchesAshbyFilters(position, location, inferredJobType, options)) {
            results.push({
              ats_system: 'Ashby',
              company,
              position,
              link,
              location: location || 'Unknown',
              job_type: inferredJobType
            });
          }
        });

        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.error(`Error scraping Ashby for ${company}:`, error);
      }
    }

    return results;
  }
};

function matchesAshbyFilters(
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

function inferJobType(position: string, location: string): string {
  const text = `${position} ${location}`.toLowerCase();
  if (text.includes('contract')) return 'Contract';
  if (text.includes('part-time') || text.includes('part time')) return 'Part-time';
  if (text.includes('full-time') || text.includes('full time')) return 'Full Time';
  if (text.includes('remote')) return 'Remote';
  return 'Full Time';
}
