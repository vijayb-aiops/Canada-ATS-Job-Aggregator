import { getAtsCompanies } from '../config';
import { scrapeHtmlBoards, type HtmlBoardCompany } from './html-board';
import { ATSParser, JobResult, ScraperOptions } from '../types';

export const successFactorsParser: ATSParser = {
  name: 'SAP SuccessFactors',
  search: async (options: ScraperOptions): Promise<JobResult[]> => {
    const companies = getAtsCompanies<HtmlBoardCompany>('successfactors');
    return scrapeHtmlBoards('SAP SuccessFactors', companies, options);
  }
};
