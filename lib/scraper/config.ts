import companiesConfig from '@/data/ats-companies.json';

type AtsCompaniesConfig = Record<string, unknown[]>;

export function getAtsCompanies<T>(key: string): T[] {
  const config = companiesConfig as AtsCompaniesConfig;
  return (config[key] ?? []) as T[];
}
