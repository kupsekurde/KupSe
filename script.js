const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);
let wszystkieOgloszenia = [];

const KAT_MAPA = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części", "Opony"],
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Wynajem"],
    "Elektronika": ["Telefony", "Komputery", "Konsole", "RTV"],
    "Dom i Ogród": ["Meble", "Narzędzia", "Ogród", "Materiały budowlane"],
    "Moda": ["Ubrania damskie", "Ubrania męskie", "Buty", "Biżuteria"],
    "Rolnictwo": ["Ciągniki", "Maszyny rolnicze", "Zwierzęta hodowlane"],
    "Zwierzęta": ["Psy", "Koty", "Ptaki", "Akcesoria"],
    "Dla Dzieci": ["Zabawki", "Wózki", "Ubranka dziecięce"],
    "Sport i Hobby": ["Rowery", "Wędkarstwo", "Siłownia", "Gry"],
    "Muzyka i Edukacja": ["Instrumenty", "Książki", "Płyty"],
    "Usługi": ["Remonty", "Transport", "Zdrowie i Uroda"],
    "Praca": ["Pełny etat", "Praca dodatkowa", "Staży"],
    "Inne": ["Oddam za darmo", "Zamiana", "Kolekcje"]
};

window.zmienPodkat = () => {
    const glowna = document.getElementById('t-kat').value;
    const pod = document.getElementById('t-podkat');
    pod.innerHTML = '<option value="">-- Wybierz --</option>';
    if (KAT_MAPA[glowna]) KAT_MAPA[glowna].forEach(p => pod.innerHTML += `<option value="${p}">${p}</option>`);
};

async function sprawdzSesje() {
    const { data: { user } } = await baza.auth.getUser();
    const navPanel = document.getElementById('nav-user-panel');
    if (user) {
        navPanel.innerHTML = `
            <span class="user-email">${user.email}</span>
            <button class="btn-logout" onclick="wyloguj()">Wyloguj</button>
        `;
        document.getElementById('auth-section').style.display = "none";
        document.getElementById('form-dodawania').style.display = "block";
    }
}

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) {
        const { error: regErr } = await baza.auth.signUp({ email, password });
        if (regErr) alert("Błąd: " + regErr.message);
        else alert("Konto utworzone! Zaloguj się.");
    }
    location.reload();
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-wyslij');
    const plik = document.getElementById('t-plik').files[0];
    btn.innerText = "Trwa publikacja..."; btn.disabled = true;

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
    } catch (err) { alert("Wystąpił błąd: " + err.message); btn.disabled = false; }
};

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
    renderuj(wynik);
};

function renderuj(tablica) {
    const lista = document.getElementById('lista-ogloszen');
    document.getElementById('stats').innerText = `Ogłoszenia: ${tablica.length}`;
    if (tablica.length === 0) { lista.innerHTML = "<h3 style='grid-column: 1/-1; text-align: center;'>Nie znaleźliśmy nic w tej okolicy...</h3>"; return; }
    
    lista.innerHTML = tablica.map(o => `
        <div class="ad-card">
            <img class="ad-img" src="${o.zdjecia || 'https://via.placeholder.com/300'}" alt="foto">
            <div class="ad-info">
                <div class="ad-title">${o.tytul}</div>
                <div class="ad-price">${o.cena.toLocaleString()} zł</div>
                <div class="ad-meta">
                    <span>📍 ${o.lokalizacja}</span>
                    <span>📞 ${o.telefon}</span>
                </div>
            </div>
        </div>
    `).join('');
}

sprawdzSesje();
ladujOgloszenia();
