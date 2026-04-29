import { getAtsCompanies } from '../config';
import { scrapeHtmlBoards, type HtmlBoardCompany } from './html-board';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const bambooHrParser: ATSParser = {
  name: 'BambooHR',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const companies = getAtsCompanies<HtmlBoardCompany>('bamboohr');
    return scrapeHtmlBoards('BambooHR', companies, options);
  }
};
