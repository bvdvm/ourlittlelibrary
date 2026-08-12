const BASE = 'https://openlibrary.org/search.json';
const COVERS_BASE = 'https://covers.openlibrary.org/b/id';

// Zwraca uproszczoną listę wyników wyszukiwania z Open Library.
export async function searchBooks(query) {
  if (!query || query.trim().length < 2) return [];
  const params = new URLSearchParams({
    q: query,
    limit: '12',
    fields: 'key,title,author_name,cover_i,first_publish_year,isbn',
  });
  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open Library API: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.docs || []).map(doc => ({
    sourceId: doc.key || '',
    title: doc.title || 'Bez tytułu',
    author: (doc.author_name || []).join(', ') || 'Autor nieznany',
    coverUrl: doc.cover_i ? `${COVERS_BASE}/${doc.cover_i}-M.jpg` : '',
    isbn: (doc.isbn && doc.isbn[0]) || '',
    publishedYear: doc.first_publish_year ? String(doc.first_publish_year) : '',
  }));
}
