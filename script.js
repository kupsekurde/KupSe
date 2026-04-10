const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);

const PODKAT_DANE = {
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura i lokale", "Garaże i parkingi"],
    "Motoryzacja": ["Samochody osobowe", "Motocykle i skutery", "Dostawcze", "Części", "Opony i felgi", "Maszyny budowlane"],
    "Dom i Ogród": ["Meble", "Ogród", "Narzędzia", "Oświetlenie", "Ogrzewanie", "Wyposażenie wnętrz"],
    "Elektronika": ["Telefony", "Komputery", "TV / Audio", "Konsole i gry", "AGD"],
    "Moda": ["Ubrania damskie", "Ubrania męskie", "Obuwie", "Dodatki", "Biżuteria"],
    "Rolnictwo": ["Maszyny rolnicze", "Ciągniki", "Nawozy", "Części", "Produkty rolne", "Giełda zwierząt"],
    "Muzyka i Edukacja": ["Instrumenty", "Książki", "Kursy", "Korepetycje"],
    "Sport i Hobby": ["Siłownia i fitness", "Rowery", "Turystyka", "Wędkarstwo", "Kolekcje"],
    "Dla Dzieci": ["Zabawki", "Wózki", "Ubranka", "Artykuły szkolne"],
    "Zdrowie i Uroda": ["Kosmetyki", "Sprzęt medyczny", "Suplementy", "Perfumy"],
    "Noclegi": ["Hotele", "Apartamenty", "Kwatery prywatne"],
    "Antyki i Kolekcje": ["Monety", "Znaczki", "Sztuka", "Vintage"],
    "Oddam za darmo": ["Rzeczy gratis"]
};

// Zmienia listę podkategorii w locie
window.zmienPodkat = () => {
    const glowna = document.getElementById('t-kat').value;
    const selectPod = document.getElementById('t-podkat');
    if (PODKAT_DANE[glowna]) {
        selectPod.innerHTML = PODKAT_DANE[glowna].map(p => `<option value="${p}">${p}</option>`).join('');
    }
};

window.otworzAuth = () => document.getElementById('sekcja-auth').style.display = 'block';
window.otworzDodawanie = () => document.getElementById('okno-dodawania').style.display = 'block';

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await baza.auth.signUp({ email, password });
    if (error) alert("Błąd: " + error.message);
    else alert("Sukces! Zalogowano.");
};

window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const dane = {
        tytul: document.getElementById('t-tytul').value,
        kategoria: document.getElementById('t-kat').value,
        podkategoria: document.getElementById('t-podkat').value, // Tu leci podkategoria
        cena: parseInt(document.getElementById('t-cena').value),
        opis: document.getElementById('t-opis').value,
        lokalizacja: document.getElementById('t-lok').value
    };

    const { error } = await baza.from('ogloszenia').insert([dane]);
    if (error) alert("Błąd zapisu: " + error.message);
    else {
        alert("Dodano!");
        document.getElementById('okno-dodawania').style.display = 'none';
        laduj();
    }
};

async function laduj(filtr = null) {
    let q = baza.from('ogloszenia').select('*').order('id', { ascending: false });
    if (filtr) q = q.eq('kategoria', filtr);
    
    const { data } = await q;
    const kontener = document.getElementById('lista-ogloszen');
    if (!kontener) return;

    kontener.innerHTML = data.map(o => `
        <div style="background:white; padding:15px; margin:10px 0; border-radius:8px; border:1px solid #ddd; text-align:left;">
            <h3 style="margin:0;">${o.tytul}</h3>
            <p style="color:#23e5db; font-weight:bold;">${o.cena} zł</p>
            <small>📍 ${o.lokalizacja} | 📂 ${o.kategoria} > ${o.podkategoria}</small>
        </div>
    `).join('');
}

window.filtruj = (kat) => laduj(kat);
laduj();
