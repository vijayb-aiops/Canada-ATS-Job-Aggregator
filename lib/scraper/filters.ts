import { type ScraperOptions } from './types';

export function matchesJobFilters(
  position: string,
  location: string,
  jobType: string,
  options: ScraperOptions
): boolean {
  const locationLower = location.toLowerCase();

  return (
    matchesCountryFilter(locationLower, options.countries) &&
    matchesRoleFilter(position, options.roles) &&
    matchesCityFilter(locationLower, options.cities ?? []) &&
    matchesJobTypeFilter(jobType, locationLower, options.jobTypes ?? [])
  );
}

export function inferJobType(position: string, location: string): string {
  const text = `${position} ${location}`.toLowerCase();

  if (text.includes('contract')) return 'Contract';
  if (text.includes('part-time') || text.includes('part time')) return 'Part-time';
  if (text.includes('remote')) return 'Remote';
  return 'Full Time';
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
      'saskatoon',
      'on',
      'bc',
      'ab',
      'qc'
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
