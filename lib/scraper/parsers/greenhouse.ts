import axios from 'axios';
import * as cheerio from 'cheerio';
import companiesConfig from '@/data/ats-companies.json';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const greenhouseParser: ATSParser = {
  name: 'Greenhouse',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const results: JobResult[] = [];
    const companies = companiesConfig.greenhouse;
    
    for (const company of companies) {
      try {
        // Greenhouse often has a public board API or HTML page
        // Example: https://boards.greenhouse.io/wealthsimple
        const url = `https://boards.greenhouse.io/${company.toLowerCase().replace(/\s+/g, '')}`;
        const { data } = await axios.get(url, { timeout: 10000 });
        const $ = cheerio.load(data);
        
        $('.opening').each((_, el) => {
          const position = $(el).find('a').text().trim();
          const link = 'https://boards.greenhouse.io' + $(el).find('a').attr('href');
          const location = $(el).find('.location').text().trim();
          
          const isCanada = location.toLowerCase().includes('canada') || 
                           location.toLowerCase().includes('toronto') || 
                           location.toLowerCase().includes('vancouver') ||
                           location.toLowerCase().includes('remote');
          
          const matchesRole = options.roles.some(role => 
            position.toLowerCase().includes(role.toLowerCase())
          );

          if (isCanada && matchesRole) {
            results.push({
              ats_system: 'Greenhouse',
              company,
              position,
              link,
              location,
              job_type: 'Full-time' // Defaulting for demo
            });
          }
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping Greenhouse for ${company}:`, error);
      }
    }
    
    return results;
  }
};
