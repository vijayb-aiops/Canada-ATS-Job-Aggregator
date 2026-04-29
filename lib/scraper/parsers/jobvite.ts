import { getAtsCompanies } from '../config';
import { scrapeHtmlBoards, type HtmlBoardCompany } from './html-board';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const jobviteParser: ATSParser = {
  name: 'Jobvite',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const companies = getAtsCompanies<HtmlBoardCompany>('jobvite');
    return scrapeHtmlBoards('Jobvite', companies, options);
  }
};
