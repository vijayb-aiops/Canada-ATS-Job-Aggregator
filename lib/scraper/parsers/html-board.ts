import axios from 'axios';
import * as cheerio from 'cheerio';
import { inferJobType, matchesJobFilters } from '../filters';
import { JobResult, ScraperOptions } from '../types';

export type HtmlBoardCompany = string | {
  name: string;
  url: string;
};

export async function scrapeHtmlBoards(
  atsSystem: string,
  companies: HtmlBoardCompany[],
  options: ScraperOptions
): Promise<JobResult[]> {
  const results: JobResult[] = [];

  for (const companyConfig of companies) {
    const company = typeof companyConfig === 'string'
      ? { name: companyConfig, url: companyConfig }
      : companyConfig;

    try {
      const { data } = await axios.get(company.url, { timeout: 12000 });
      const $ = cheerio.load(data);

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const position = $(el).text().replace(/\s+/g, ' ').trim();

        if (!position || !looksLikeJobLink(href, position)) return;

        const link = new URL(href, company.url).toString();
        const containerText = $(el).closest('li, tr, article, section, div').text().replace(/\s+/g, ' ').trim();
        const location = extractLocation(containerText, position);
        const jobType = inferJobType(position, location);

        if (matchesJobFilters(position, location, jobType, options)) {
          results.push({
            ats_system: atsSystem,
            company: company.name,
            position,
            link,
            location: location || 'Unknown',
            job_type: jobType
          });
        }
      });
    } catch (error) {
      console.error(`Error scraping ${atsSystem} for ${company.name}:`, error);
    }
  }

  return dedupeJobs(results);
}

function looksLikeJobLink(href: string, position: string): boolean {
  const hrefLower = href.toLowerCase();
  const positionLower = position.toLowerCase();

  return (
    hrefLower.includes('job') ||
    hrefLower.includes('career') ||
    hrefLower.includes('requisition') ||
    hrefLower.includes('apply') ||
    positionLower.includes('engineer') ||
    positionLower.includes('developer') ||
    positionLower.includes('scientist') ||
    positionLower.includes('devops') ||
    positionLower.includes('cloud') ||
    positionLower.includes('machine learning')
  );
}

function extractLocation(containerText: string, position: string): string {
  return containerText
    .replace(position, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function dedupeJobs(jobs: JobResult[]): JobResult[] {
  const seen = new Set<string>();

  return jobs.filter(job => {
    const key = `${job.ats_system}:${job.company}:${job.position}:${job.link}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
