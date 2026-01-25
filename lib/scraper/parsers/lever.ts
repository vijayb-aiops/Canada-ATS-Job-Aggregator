import axios from 'axios';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const leverParser: ATSParser = {
  name: 'Lever',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const results: JobResult[] = [];
    const companies = ['Lattice', 'Figma', 'Coinbase']; // Companies with Canadian presence

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

            const isCanada = location.toLowerCase().includes('canada') || 
                             location.toLowerCase().includes('toronto') || 
                             location.toLowerCase().includes('vancouver') ||
                             location.toLowerCase().includes('remote');

            const matchesRole = options.roles.some(role => 
              position.toLowerCase().includes(role.toLowerCase())
            );

            if (isCanada && matchesRole) {
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
