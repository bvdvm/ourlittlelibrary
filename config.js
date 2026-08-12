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
};

// 2) UŻYTKOWNICZKI apki — na razie proste przełączanie "kim jestem"
//    bez logowania (tak jak w KINEAPOLIS). Zmień etykiety jeśli trzeba.
export const USERS = [
  { id: 'karolina', label: 'Karolina', emoji: '🌙', color: 'var(--silver)' },
  { id: 'ola', label: 'Ola', emoji: '☀️', color: 'var(--gold)' },
];

// 3) GOOGLE BOOKS API — odpowiednik TMDB dla książek.
//    Działa BEZ klucza (darmowe zapytania publiczne, ograniczony limit),
//    ale z własnym kluczem masz wyższy limit zapytań dziennie.
//    Klucz zrobisz w Google Cloud Console -> APIs & Services -> Credentials
//    -> Create credentials -> API key, i włącz "Books API" w bibliotece API.
//    Zostaw puste, jeśli chcesz na razie działać bez klucza.
export const GOOGLE_BOOKS_API_KEY = '';
