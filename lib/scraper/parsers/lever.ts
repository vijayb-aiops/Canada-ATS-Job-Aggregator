import axios from 'axios';
import companiesConfig from '@/data/ats-companies.json';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const leverParser: ATSParser = {
  name: 'Lever',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const results: JobResult[] = [];
    const companies = companiesConfig.lever;

    for (const company of companies) {
      try {
        // Lever has a JSON API: https://api.lever.co/v0/postings/company
        const url = `https://api.lever.co/v0/postings/${company.toLowerCase()}`;
        const { data } = await axios.get(url);
        
        if (Array.isArray(data)) {
          data.forEach((post: any) => {
            const position = post.text;
            const location = post.categories?.location || '';
            const link = post.hostedUrl;
            const jobType = post.categories?.commitment || 'Full-time';

            const locationLower = location.toLowerCase();
            const canadaHints = [
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
              'remote'
            ];
            const isCanada = canadaHints.some(hint => locationLower.includes(hint));
          
            const matchesRole = matchesRoleFilter(position, options.roles);

            const matchesCity = matchesCityFilter(locationLower, options.cities ?? []);
            const matchesJobType = matchesJobTypeFilter(jobType, locationLower, options.jobTypes ?? []);

            if (isCanada && matchesRole && matchesCity && matchesJobType) {
              results.push({
                ats_system: 'Lever',
                company,
                position,
                link,
                location,
                job_type: jobType
              });
            }
          });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping Lever for ${company}:`, error);
      }
    }
    return results;
  }
};

function matchesRoleFilter(position: string, roles: string[]): boolean {
  const title = position.toLowerCase();
  return roles.some(role => {
    const tokens = role
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(token => token.length >= 2);
    return tokens.some(token => title.includes(token));
  });
}

function matchesCityFilter(locationLower: string, cities: string[]): boolean {
  if (cities.length === 0) return true;
  return cities.some(city => locationLower.includes(city.toLowerCase()));
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
      default:
        return false;
    }
  });
}
