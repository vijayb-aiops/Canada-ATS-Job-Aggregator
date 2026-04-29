import axios from 'axios';
import { getAtsCompanies } from '../config';
import { matchesJobFilters } from '../filters';
import { ATSParser, JobResult, ScraperOptions } from '../types';

type WorkdayCompany = {
  name: string;
  host: string;
  tenant: string;
  site: string;
};

export const workdayParser: ATSParser = {
  name: 'Workday',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const results: JobResult[] = [];
    const companies = getAtsCompanies<WorkdayCompany>('workday');

    for (const company of companies) {
      try {
        let offset = 0;
        const limit = 20;

        while (offset < 200) {
          const url = `https://${company.host}/wday/cxs/${company.tenant}/${company.site}/jobs`;
          const { data } = await axios.post(
            url,
            {
              appliedFacets: {},
              limit,
              offset,
              searchText: options.roles.join(' OR ')
            },
            { timeout: 12000 }
          );

          const postings = Array.isArray(data?.jobPostings) ? data.jobPostings : [];
          if (postings.length === 0) break;

          for (const post of postings) {
            const position = post?.title?.trim() ?? '';
            const location = [post?.locationsText, post?.location].filter(Boolean).join(', ');
            const jobType = post?.timeType ?? post?.workerSubType ?? 'Full Time';
            const externalPath = post?.externalPath ?? post?.bulletFields?.[0];
            const link = externalPath
              ? `https://${company.host}/en-US/${company.site}${externalPath}`
              : `https://${company.host}/en-US/${company.site}`;

            if (position && matchesJobFilters(position, location, jobType, options)) {
              results.push({
                ats_system: 'Workday',
                company: company.name,
                position,
                link,
                location,
                job_type: jobType
              });
            }
          }

          if (postings.length < limit) break;
          offset += limit;
        }
      } catch (error) {
        console.error(`Error scraping Workday for ${company.name}:`, error);
      }
    }

    return results;
  }
};
