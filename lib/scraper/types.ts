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
  countries: string[]; // Always ['Canada'] for now
}

export interface ATSParser {
  name: string;
  search: (options: ScraperOptions) => Promise<JobResult[]>;
}
