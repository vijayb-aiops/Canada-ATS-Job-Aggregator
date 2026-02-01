export interface JobResult {
  ats_system: string;
  company: string;
  position: string;
  link: string;
  location: string;
  job_type: string;
}

export interface ScraperOptions {
  roles: string[];
  countries: string[];
  cities?: string[];
  jobTypes?: string[];
}

export interface ATSParser {
  name: string;
  search: (options: ScraperOptions) => Promise<JobResult[]>;
}
