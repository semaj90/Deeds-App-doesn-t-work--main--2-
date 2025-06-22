import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  const resultParam = url.searchParams.get('r');
  
  let result = null;
  if (resultParam) {
    try {
      result = JSON.parse(decodeURIComponent(resultParam));
    } catch (error) {
      console.error('Failed to parse AI search result:', error);
    }
  }
  
  return {
    query,
    result
  };
};
