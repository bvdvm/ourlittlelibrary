// Trzy źródła równolegle:
//  - Open Library: szeroka baza międzynarodowa, ma okładki, ale słabiej pokrywa
//    polskich autorów i polskie wydania.
//  - Biblioteka Narodowa (data.bn.org.pl): oficjalny, darmowy, bez klucza katalog
//    polskiej bibliografii narodowej — dużo lepsze pokrycie polskich tytułów,
//    ale surowe dane biblioteczne (MARC) i bez okładek.
//  - Google Books: najlepsze okładki, szeroka baza — ale BEZ KLUCZA jest w praktyce
//    bezużyteczne (Google przycina nieautoryzowane zapytania do prawie zera, stąd
//    wcześniejszy błąd połączenia). Z darmowym kluczem (GOOGLE_BOOKS_API_KEY w
//    config.js) działa normalnie — 1000 zapytań/dzień, łatwo zwiększyć. Bez klucza
//    ten fragment po prostu zwykle nic nie doda do wyników, ale się nie wywali.
// Jeśli któreś źródło zawiedzie, pozostałe i tak zwracają wyniki — są niezależne.

import { GOOGLE_BOOKS_API_KEY } from './config.js';

const OL_BASE = 'https://openlibrary.org/search.json';
const OL_COVERS_BASE = 'https://covers.openlibrary.org/b/id';
const BN_BASE = 'https://data.bn.org.pl/api/institutions/bibs.json';
const GB_BASE = 'https://www.googleapis.com/books/v1/volumes';

async function searchOpenLibrary(query) {
  const params = new URLSearchParams({
    q: query,
    limit: '10',
    fields: 'key,title,author_name,cover_i,first_publish_year,isbn',
  });
  const res = await fetch(`${OL_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open Library: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.docs || []).map(doc => ({
    sourceId: doc.key ? `ol-${doc.key}` : '',
    title: doc.title || 'Bez tytułu',
    author: (doc.author_name || []).join(', ') || 'Autor nieznany',
    coverUrl: doc.cover_i ? `${OL_COVERS_BASE}/${doc.cover_i}-M.jpg` : '',
    isbn: (doc.isbn && doc.isbn[0]) || '',
    publishedYear: doc.first_publish_year ? String(doc.first_publish_year) : '',
  }));
}

function getSubfield(fields, tag, code) {
  for (const f of fields) {
    if (f && f[tag] && Array.isArray(f[tag].subfields)) {
      const sub = f[tag].subfields.find(s => s && s[code] !== undefined);
      if (sub) return sub[code];
    }
  }
  return '';
}

function parseBnRecord(record) {
  try {
    const fields = (record.marc && record.marc.fields) || record.fields || [];
    if (!Array.isArray(fields) || fields.length === 0) return null;
    let title = getSubfield(fields, '245', 'a');
    if (!title) return null;
    title = title.replace(/\s*[/:]\s*$/, '').trim();
    const subtitle = getSubfield(fields, '245', 'b');
    if (subtitle) title += ': ' + subtitle.replace(/\s*[/:]\s*$/, '').trim();

    let author = getSubfield(fields, '100', 'a') || getSubfield(fields, '700', 'a') || '';
    author = author.replace(/[.,]\s*$/, '').trim();
    const m = author.match(/^([^,]+),\s*(.+)$/);
    if (m) author = `${m[2]} ${m[1]}`;

    const isbnRaw = getSubfield(fields, '020', 'a') || '';
    const isbn = isbnRaw.replace(/[^0-9Xx-]/g, '');
    const yearRaw = getSubfield(fields, '264', 'c') || getSubfield(fields, '260', 'c') || '';
    const yearMatch = yearRaw.match(/\d{4}/);

    return {
      sourceId: record.id ? `bn-${record.id}` : '',
      title,
      author: author || 'Autor nieznany',
      coverUrl: '',
      isbn,
      publishedYear: yearMatch ? yearMatch[0] : '',
    };
  } catch {
    return null;
  }
}

async function searchBibliotekaNarodowa(query) {
  const params = new URLSearchParams({ title: query, limit: '10' });
  const res = await fetch(`${BN_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Biblioteka Narodowa: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const records = Array.isArray(data) ? data : (data.bibs || data.records || data.docs || []);
  return records.map(parseBnRecord).filter(Boolean);
}

async function searchGoogleBooks(query) {
  if (!GOOGLE_BOOKS_API_KEY) return []; // bez klucza pomijamy — patrz komentarz u góry pliku
  const params = new URLSearchParams({ q: query, maxResults: '10', key: GOOGLE_BOOKS_API_KEY });
  const res = await fetch(`${GB_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Google Books: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.items || []).map(item => {
    const v = item.volumeInfo || {};
    return {
      sourceId: item.id ? `gb-${item.id}` : '',
      title: v.title || 'Bez tytułu',
      author: (v.authors || []).join(', ') || 'Autor nieznany',
      coverUrl: v.imageLinks ? (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail || '').replace('http://', 'https://') : '',
      isbn: (v.industryIdentifiers || []).find(i => i.type === 'ISBN_13')?.identifier || '',
      publishedYear: (v.publishedDate || '').slice(0, 4),
    };
  });
}

export async function searchBooks(query) {
  if (!query || query.trim().length < 2) return [];

  const [olResult, bnResult, gbResult] = await Promise.allSettled([
    searchOpenLibrary(query),
    searchBibliotekaNarodowa(query),
    searchGoogleBooks(query),
  ]);

  if (olResult.status === 'rejected') console.warn('Open Library nie odpowiedziało:', olResult.reason);
  if (bnResult.status === 'rejected') console.warn('Biblioteka Narodowa nie odpowiedziała:', bnResult.reason);
  if (gbResult.status === 'rejected') console.warn('Google Books nie odpowiedziało:', gbResult.reason);

  if (olResult.status === 'rejected' && bnResult.status === 'rejected' && gbResult.status === 'rejected') {
    throw olResult.reason;
  }

  const ol = olResult.status === 'fulfilled' ? olResult.value : [];
  const bn = bnResult.status === 'fulfilled' ? bnResult.value : [];
  const gb = gbResult.status === 'fulfilled' ? gbResult.value : [];

  // Google Books ma najlepsze okładki — stawiamy je pierwsze, żeby wygrywały przy odsiewaniu duplikatów
  const seen = new Set();
  const merged = [...gb, ...ol, ...bn].filter(b => {
    const key = `${b.title.toLowerCase().trim()}::${b.author.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return merged.slice(0, 16);
}
