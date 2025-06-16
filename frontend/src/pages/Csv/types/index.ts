export interface LineItem {
    date: string;
    description: string;
    debit: boolean;
    amount: number
}

export interface CategorizedLineItem extends LineItem {
    category: string;
}

export interface Glossary {
    [description: string]: string
}

export type ClassifiedItem = Record<string, string>;

export const BB_CATEGORIES = ["Mortgage", "Strata Fees", "Storage Rental", "Electric Bill", "Internet Bill", "Property Tax", "Home Insurance", "Misc. Home improvement", "Food", "debit", "Gimbap Insurance", "Pet food", "Vet", "EV charging+ parking", "Car insurance", "Car maintenance", "Other", "Entertainment", "Vacation planning", "shopping"]
export const DEFAULT_DESIRED_CATEGORIES = [
  "food",
  "entertainment",
  "transportation",
  "shopping",
  "health",
  "utilities",
  "travel",
  "subscriptions",
  "education",
  "debit transfer"
]
export const UNCATEGORIZED = 'uncategorized';

export const LOCAL_STORAGE_KEY = 'smartbud';
export const FILE_DELIMITER = '|||'