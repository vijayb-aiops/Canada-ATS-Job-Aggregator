import { getAtsCompanies } from '../config';
import { scrapeHtmlBoards, type HtmlBoardCompany } from './html-board';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const icimsParser: ATSParser = {
  name: 'iCIMS',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const companies = getAtsCompanies<HtmlBoardCompany>('icims');
    return scrapeHtmlBoards('iCIMS', companies, options);
  }
};
