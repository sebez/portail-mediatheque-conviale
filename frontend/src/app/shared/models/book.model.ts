// Book entity model — matches FR34 fields and camelCase JSON from backend
// Source: architecture.md — Format Patterns (camelCase JSON fields)
export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  publicationYear: number;
  coverImageUrl: string | null;
  curatorNote: string | null;
  dateAdded: string; // ISO 8601
  isSelectionDuMois: boolean;
  status: string; // 'available' default; forward-compat for FR26
}

export interface FilterCriteria {
  keyword: string;        // empty string when no keyword
  genre: string | null;   // null when no genre selected
  year: number | null;    // null when no year selected
}
