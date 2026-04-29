import { getAtsCompanies } from '../config';
import { scrapeHtmlBoards, type HtmlBoardCompany } from './html-board';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const adpParser: ATSParser = {
  name: 'ADP Workforce Now',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const companies = getAtsCompanies<HtmlBoardCompany>('adp');
    return scrapeHtmlBoards('ADP Workforce Now', companies, options);
  }
};
