import { GOOGLE_BOOKS_API_KEY } from './config.js';

const BASE = 'https://www.googleapis.com/books/v1/volumes';

// Zwraca uproszczoną listę wyników wyszukiwania z Google Books.
export async function searchBooks(query) {
  if (!query || query.trim().length < 2) return [];
  const params = new URLSearchParams({ q: query, maxResults: '12', langRestrict: 'pl' });
  if (GOOGLE_BOOKS_API_KEY) params.set('key', GOOGLE_BOOKS_API_KEY);
  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Google Books API: ${res.status}`);
  const data = await res.json();
  return (data.items || []).map(item => {
    const v = item.volumeInfo || {};
    return {
      googleBooksId: item.id,
      title: v.title || 'Bez tytułu',
      author: (v.authors || []).join(', ') || 'Autor nieznany',
      coverUrl: v.imageLinks ? (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail || '').replace('http://', 'https://') : '',
      isbn: (v.industryIdentifiers || []).find(i => i.type === 'ISBN_13')?.identifier || '',
      publishedYear: (v.publishedDate || '').slice(0, 4),
      googleCategories: v.categories || [],
    };
  });
}
