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
      try {
        let html = '';
        for (const baseUrl of baseUrls) {
          const url = `${baseUrl}/${company.toLowerCase().replace(/\s+/g, '')}`;
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
