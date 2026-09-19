// ============================================================
// KONFIGURACJA
// ============================================================
//
// 1) FIREBASE — ten sam projekt co KINEAPOLIS (seans-cc-poznan).
//    Apka pisze do osobnych kolekcji (patrz COLLECTIONS niżej),
//    więc nie rusza danych filmowych KINEAPOLIS w tym projekcie.
//    Pamiętaj tylko o dodaniu reguł odczytu/zapisu dla tych dwóch
//    nowych kolekcji w Firestore -> Rules (tak jak masz dla filmowych).

export const firebaseConfig = {
  apiKey: 'AIzaSyDwG8kHpbijuZWZgrRS6GnpvnIJA1IlHOc',
  authDomain: 'seans-cc-poznan.firebaseapp.com',
  projectId: 'seans-cc-poznan',
  storageBucket: 'seans-cc-poznan.firebasestorage.app',
  messagingSenderId: '175366361691',
  appId: '1:175366361691:web:1a0a21416a491e0d1b657e',
  measurementId: 'G-DDZP477924',
};

// Nazwy kolekcji Firestore — z przedrostkiem "library_", żeby nie
// kolidowały z kolekcjami filmowymi KINEAPOLIS w tym samym projekcie.
export const COLLECTIONS = {
  books: 'library_books',
  pickLists: 'library_pickLists',
  sagas: 'library_sagas',
};

// 2) UŻYTKOWNICZKI apki — na razie proste przełączanie "kim jestem"
//    bez logowania (tak jak w KINEAPOLIS). Zmień etykiety jeśli trzeba.
export const USERS = [
  { id: 'karolina', label: 'Karolina', emoji: '🌙', color: 'var(--silver)', photo: 'karolina.jpg' },
  { id: 'ola', label: 'Ola', emoji: '☀️', color: 'var(--gold)', photo: 'ola.jpg' },
];

// 3) WYSZUKIWARKA KSIĄŻEK — Open Library i Biblioteka Narodowa działają od razu,
//    bez klucza. Google Books też jest dołączony jako trzecie źródło (najlepsze
//    okładki), ale BEZ KLUCZA jest praktycznie bezużyteczny (Google prawie od razu
//    tnie nieautoryzowane zapytania) — apka po prostu go wtedy pomija, reszta
//    działa normalnie. Żeby go włączyć:
//    1. Google Cloud Console (console.cloud.google.com) -> nowy projekt (dowolna nazwa)
//    2. APIs & Services -> Library -> wyszukaj "Books API" -> Enable
//    3. APIs & Services -> Credentials -> Create credentials -> API key
//    4. Wklej klucz poniżej. Darmowy limit: 1000 zapytań/dzień.
export const GOOGLE_BOOKS_API_KEY = 'AIzaSyBfTRzB88X4-I3BgW6UfJJgc3x1w93AxkI';

// Statusy przeczytania — osobne dla każdej osoby (jedna może skończyć, druga jeszcze nie)
export const READ_STATUSES = [
  { id: 'tbr', label: 'do przeczytania' },
  { id: 'w trakcie', label: 'w trakcie' },
  { id: 'przeczytana', label: 'przeczytana' },
];
