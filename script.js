const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);
let wszystkieOgloszenia = [];

// 1. SYSTEM KATEGORII (PEŁNE 13)
const KAT_MAPA = {
    "Motoryzacja": ["Samochody osobowe", "Motocykle", "Dostawcze", "Części"],
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura"],
    "Elektronika": ["Telefony", "Laptopy", "Konsole", "TV"],
    "Dom i Ogród": ["Meble", "Ogród", "Budownictwo"],
    "Moda": ["Ubrania", "Buty", "Dodatki"],
    "Rolnictwo": ["Ciągniki", "Maszyny", "Produkty"],
    "Zwierzęta": ["Psy", "Koty", "Akcesoria"],
    "Dla Dzieci": ["Wózki", "Zabawki", "Ubranka"],
    "Sport i Hobby": ["Rowery", "Siłownia", "Kolekcje"],
    "Muzyka i Edukacja": ["Instrumenty", "Książki", "Korepetycje"],
    "Usługi": ["Budowlane", "Naprawa", "Zdrowie"],
    "Praca": ["Pełny etat", "Dodatkowa", "Za granicą"],
    "Inne": ["Oddam za darmo", "Zamiana", "Różne"]
};

window.zmienPodkat = () => {
    const glowna = document.getElementById('t-kat').value;
    const pod = document.getElementById('t-podkat');
    pod.innerHTML = '<option value="">-- Podkategoria --</option>';
    if (KAT_MAPA[glowna]) KAT_MAPA[glowna].forEach(p => pod.innerHTML += `<option value="${p}">${p}</option>`);
};

// 2. AUTH & NAVBAR
async function sprawdzSesje() {
    const { data: { user } } = await baza.auth.getUser();
    const navPanel = document.getElementById('nav-user-panel');
    const authBox = document.getElementById('auth-section');
    const formBox = document.getElementById('form-dodawania');

    if (user) {
        navPanel.innerHTML = `
            <span class="user-email">${user.email}</span>
            <button class="btn-logout" onclick="wyloguj()">Wyloguj</button>
        `;
        authBox.style.display = "none";
        formBox.style.display = "block";
    }
}

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) {
        const { error: regErr } = await baza.auth.signUp({ email, password });
        if (regErr) alert("Błąd: " + regErr.message);
        else alert("Konto założone! Zaloguj się.");
    }
    location.reload();
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// 3. DODAWANIE
window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-wyslij');
    const plik = document.getElementById('t-plik').files[0];
    btn.innerText = "Wysyłanie..."; btn.disabled = true;

    try {
        const nazwaPliku = `${Date.now()}_${plik.name.replace(/\s/g, '_')}`;
        await baza.storage.from('ZDJECIA').upload(nazwaPliku, plik);
        const { data: url } = baza.storage.from('ZDJECIA').getPublicUrl(nazwaPliku);
        
        await baza.from('ogloszenia').insert([{
            tytul: document.getElementById('t-tytul').value,
            kategoria: document.getElementById('t-kat').value,
            podkategoria: document.getElementById('t-podkat').value,
            cena: parseInt(document.getElementById('t-cena').value),
            opis: document.getElementById('t-opis').value,
            lokalizacja: document.getElementById('t-lok').value,
            telefon: document.getElementById('t-tel').value,
            zdjecia: url.publicUrl
        }]);
        location.reload();
    } catch (err) { alert(err.message); btn.disabled = false; }
};

// 4. ŁADOWANIE I WYSZUKIWANIE (MIASTO + TEKST)
async function ladujOgloszenia() {
    const { data, error } = await baza.from('ogloszenia').select('*').order('id', { ascending: false });
    if (error) return;
    wszystkieOgloszenia = data;
    renderuj(wszystkieOgloszenia);
}

window.filtrujWszystko = () => {
    const fraza = document.getElementById('wyszukiwarka').value.toLowerCase();
    const miasto = document.getElementById('wyszukiwarka-miasto').value.toLowerCase();
    
    const wynik = wszystkieOgloszenia.filter(o => {
        const pasujeTekst = o.tytul.toLowerCase().includes(fraza) || o.opis.toLowerCase().includes(fraza);
        const pasujeMiasto = o.lokalizacja.toLowerCase().includes(miasto);
        return pasujeTekst && pasujeMiasto;
    });

    document.getElementById('view-title').innerText = fraza ? `Wyniki dla: ${fraza}` : "Najnowsze ogłoszenia";
    renderuj(wynik);
};

function renderuj(tablica) {
    const lista = document.getElementById('lista-ogloszen');
    document.getElementById('stats').innerText = `Znaleziono: ${tablica.length}`;
    if (tablica.length === 0) { lista.innerHTML = "<h3>Brak ogłoszeń w tej lokalizacji.</h3>"; return; }
    
    lista.innerHTML = tablica.map(o => `
        <div class="ad-card">
            <img src="${o.zdjecia || 'https://via.placeholder.com/300'}" alt="foto">
            <div class="ad-body">
                <div class="ad-title">${o.tytul}</div>
                <div class="ad-price">${o.cena.toLocaleString()} zł</div>
                <div class="ad-footer">
                    <span>📍 ${o.lokalizacja}</span>
                    <span>📞 ${o.telefon}</span>
                </div>
            </div>
        </div>
    `).join('');
}

window.resetujWszystko = () => { location.reload(); };
window.scrollToAuth = () => { document.getElementById('auth-section').scrollIntoView({behavior: 'smooth'}); };

sprawdzSesje();
ladujOgloszenia();
