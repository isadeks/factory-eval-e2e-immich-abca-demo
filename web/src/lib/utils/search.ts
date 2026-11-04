import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';

type SearchTerms = MetadataSearchDto & Pick<SmartSearchDto, 'query' | 'queryAssetId'>;

/**
 * Returns the text the search input should show for the given search terms,
 * regardless of which search type (context, filename, description, path, OCR) produced them.
 */
export const getSearchInputValue = (terms?: SearchTerms | null): string =>
  terms?.query || terms?.originalFileName || terms?.description || terms?.originalPath || terms?.ocr || '';
