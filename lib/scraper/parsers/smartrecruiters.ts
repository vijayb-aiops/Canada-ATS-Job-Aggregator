import axios from 'axios';
import { getAtsCompanies } from '../config';
import { matchesJobFilters } from '../filters';
import { ATSParser, JobResult, ScraperOptions } from '../types';

type SmartRecruitersCompany = string | { id: string; name?: string };

export const smartRecruitersParser: ATSParser = {
  name: 'SmartRecruiters',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const results: JobResult[] = [];
    const companies = getAtsCompanies<SmartRecruitersCompany>('smartrecruiters');

    for (const companyConfig of companies) {
      const companyId = typeof companyConfig === 'string' ? companyConfig : companyConfig.id;
      const companyName = typeof companyConfig === 'string' ? companyConfig : companyConfig.name ?? companyConfig.id;

      try {
        let offset = 0;
        const limit = 100;

        while (offset < 500) {
          const url = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings`;
          const { data } = await axios.get(url, {
            params: { limit, offset },
            timeout: 10000
          });

          const postings = Array.isArray(data?.content) ? data.content : [];
          if (postings.length === 0) break;

          for (const post of postings) {
            const position = post?.name?.trim() ?? '';
            const locationParts = [
              post?.location?.city,
              post?.location?.region,
              post?.location?.country
            ].filter(Boolean);
            const location = locationParts.join(', ');
            const jobType = post?.typeOfEmployment?.label ?? post?.typeOfEmployment?.id ?? 'Full Time';
            const link = post?.ref ?? post?.postingUrl ?? '';

            if (position && link && matchesJobFilters(position, location, jobType, options)) {
              results.push({
                ats_system: 'SmartRecruiters',
                company: companyName,
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
        console.error(`Error scraping SmartRecruiters for ${companyName}:`, error);
      }
    }

    return results;
  }
};
