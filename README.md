# Our Little Library 🌙☀️

Biblioteczka Karoliny i Oli — wspólne ocenianie książek, sagi, ranking, TBR i losowanie.
Zbudowane wg notatek Karoliny (`strona.pdf`), na tym samym pomyśle co KINEAPOLIS: statyczna
strona + Firebase Firestore jako baza, zero backendu do utrzymania.

## Firebase już podpięty

`js/config.js` ma już wpisany config projektu **seans-cc-poznan** (ten sam, którego używa
KINEAPOLIS). Apka pisze do dwóch nowych kolekcji — `library_books` i `library_pickLists` —
z przedrostkiem `library_`, więc nie ruszają danych filmowych KINEAPOLIS w tym samym projekcie.
Kolekcje utworzą się same przy pierwszym zapisie, nie trzeba nic klikać w konsoli.

**Jedyna rzecz do zrobienia ręcznie:** dodaj regułę w Firestore → Rules, żeby te dwie
kolekcje w ogóle dało się czytać/zapisywać (tak jak masz już dla kolekcji filmowych).
Najprostsza wersja, do wklejenia obok istniejących reguł:

```
match /library_books/{bookId} {
  allow read, write: if true;
}
match /library_pickLists/{listId} {
  allow read, write: if true;
}
```

To jest reguła bez logowania — tak jak KINEAPOLIS, każdy ze znajomym linkiem może
czytać i zapisywać. Jeśli KINEAPOLIS ma coś bardziej restrykcyjnego (np. sprawdzanie
tokena), skopiuj ten sam wzorzec dla obu nowych kolekcji zamiast `if true`.

Dopóki `js/config.js` nie ma poprawnego configu, apka sama przechodzi w **tryb demo**
(przykładowe książki, nic się nie zapisuje) — ale teraz to już nieaktualne, config jest
wpięty na prawdziwe dane.

## (Opcjonalnie) Klucz do Google Books API

Wyszukiwarka książek przy dodawaniu działa **od razu, bez klucza** (darmowe zapytania
publiczne), ale ma niższy dzienny limit. Jeśli zaczniecie częściej dodawać książki:

1. [Google Cloud Console](https://console.cloud.google.com/) → nowy projekt (albo dowolny istniejący).
2. APIs & Services → Library → włącz **Books API**.
3. APIs & Services → Credentials → Create credentials → API key.
4. Wklej klucz do `GOOGLE_BOOKS_API_KEY` w `js/config.js`.

Czemu Google Books, a nie coś innego? To najbliższy odpowiednik TMDB dla książek — darmowe
wyszukiwanie po tytule/autorze, okładki, rok wydania, kategorie, bez logowania. Open Library
to solidna darmowa alternatywa (więcej starszych/niszowych tytułów), ale Google Books ma
zdecydowanie lepsze i bardziej kompletne okładki, więc jest wpięty jako główne źródło.

## Wrzuć na GitHub Pages

Tak samo jak KINEAPOLIS:
```
git init
git add .
git commit -m "Our Little Library"
git remote add origin <twoje-repo>
git push -u origin main
```
Potem w ustawieniach repo → Pages → wybierz branch `main` / folder root.

## Jak jest zorganizowany kod

```
index.html            szkielet strony, zakładki-bookmarki jako nawigacja
css/style.css          cały wygląd (czarno-złoto-srebrny motyw)
js/config.js            <- TU wklejasz Firebase config i (opcjonalnie) klucz Google Books
js/criteria-data.js     19 kryteriów oceniania (uniwersalne + bonusowe wg gatunku), z notatek
js/rating.js             liczenie % / gwiazdek / poziomu zakładki
js/store.js               warstwa danych: Firestore albo tryb demo, ten sam interfejs
js/books-api.js          wyszukiwanie w Google Books
js/demo-data.js          przykładowe książki widoczne w trybie demo
js/ui-rate.js             panel „Oceń” — szukaj/dodaj/oceń
js/ui-sagas.js            panel „Sagi”
js/ui-ranking.js          panel „Ranking”
js/ui-tbr.js               panel „TBR”
js/ui-draw.js              panel „Losowanie”
js/app.js                  spina wszystko, przełącza zakładki
assets/logo.png          Wasze logo
```

Model danych jest celowo prosty — **jedna kolekcja `books`** obsługuje i TBR, i przeczytane
książki (pole `status`), a sagi to po prostu wspólna nazwa (`saga`) na kilku książkach —
bez osobnej kolekcji. Druga kolekcja, `pickLists`, to pule do losowania.

## Co dokładnie odzwierciedla apka (z notatek Karoliny)

- **Ocenianie**: 13 kryteriów uniwersalnych + kryteria bonusowe zależne od gatunku
  (kryminał/thriller/horror, sci-fi/fantastyka, dark romance, młodzieżówka, romans,
  literatura faktu). Wynik = % → gwiazdki (co pół) → poziom zakładki (papierowa → złota).
- **Format**: papier / ebook / audiobook, do zaznaczenia przy każdej książce.
- **Sagi**: automatyczna średnia (Karolina/Ola) po nazwie serii.
- **Ranking**: Wspólny (książki przeczytane przez obie), Mój, Oli — filtrowany po gatunku.
- **TBR**: dodajesz książkę, druga może zaznaczyć „chcę też” — wtedy wskakuje do wspólnej.
- **Losowanie**: dowolna liczba puli, losowanie jednej książki z wybranej puli.

Motywy/tropy (np. fake dating) — zostawione na później, tak jak w notatkach; łatwo dodać
jako kolejne pole tagów przy książce (`js/criteria-data.js` → `ALL_GENRES` to dobre miejsce
żeby dorobić osobną listę `THEMES` analogicznie, kiedy będziecie gotowe).
