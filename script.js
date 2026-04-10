// TWOJA KONFIGURACJA (JUŻ WPISANA)
const SUPABASE_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tTUBju7up_8DW05IAK4qHQ_bqknsG9VvR7CId3u_D_M-Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// TWOJE KATEGORIE
const daneKategorii = {
    "🏠 Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura i lokale", "Garaże i parkingi"],
    "🚗 Motoryzacja": ["Samochody osobowe", "Motocykle i skutery", "Dostawcze", "Części samochodowe", "Opony i felgi", "Maszyny budowlane"],
    "🛋️ Dom i Ogród": ["Meble", "Ogród", "Narzędzia", "Oświetlenie", "Ogrzewanie", "Wyposażenie wnętrz"],
    "📱 Elektronika": ["Telefony", "Komputery", "TV / Audio", "Konsole i gry", "AGD"],
    "👕 Moda": ["Ubrania damskie", "Ubrania męskie", "Obuwie", "Dodatki", "Biżuteria"],
    "🚜 Rolnictwo": ["Maszyny rolnicze", "Ciągniki", "Nawozy", "Części", "Produkty rolne", "Giełda zwierząt"],
    "🎸 Muzyka i Edukacja": ["Instrumenty", "Książki", "Kursy", "Korepetycje"],
    "🏀 Sport i Hobby": ["Siłownia i fitness", "Rowery", "Turystyka", "Wędkarstwo", "Kolekcje"],
    "👶 Dla Dzieci": ["Zabawki", "Wózki", "Ubranka", "Artykuły szkolne"],
    "💄 Zdrowie i Uroda": ["Kosmetyki", "Sprzęt medyczny", "Suplementy", "Perfumy"],
    "🏨 Noclegi": ["Hotele", "Apartamenty", "Kwatery prywatne"],
    "🎁 Antyki i Kolekcje": ["Monety", "Znaczki", "Sztuka", "Vintage"],
    "♻️ Oddam za darmo": ["Rzeczy gratis"]
};

let trybAuth = 'login';
let zalogowanyUser = null;

// --- FUNKCJE LOGOWANIA ---
async function sprawdzSesje() {
    const { data } = await supabase.auth.getSession();
    zalogowanyUser = data.session?.user || null;
    odswiezWidokAuth();
}

function odswiezWidokAuth() {
    const statusDiv = document.getElementById('auth-status');
    if (zalogowanyUser) {
        statusDiv.innerHTML = `<span>Witaj, ${zalogowanyUser.email}</span> <button onclick="wyloguj()">Wyloguj</button>`;
    } else {
        statusDiv.innerHTML = `<button onclick="otworzAuth()">Zaloguj / Zarejestruj</button>`;
    }
}

function otworzAuth() { document.getElementById('sekcja-auth').style.display = 'block'; }
function zamknijAuth() { document.getElementById('sekcja-auth').style.display = 'none'; }
function przepnijAuth() {
    trybAuth = (trybAuth === 'login') ? 'signup' : 'login';
    document.getElementById('auth-tytul').innerText = (trybAuth === 'login') ? 'Logowanie' : 'Rejestracja';
}

async function obslugaAuth() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    if (trybAuth === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert("Błąd: " + error.message); else location.reload();
    } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) alert("Błąd: " + error.message); else alert("Zarejestrowano! Zaloguj się.");
    }
}

async function wyloguj() { await supabase.auth.signOut(); location.reload(); }

// --- FUNKCJE KATEGORII I WIDOKU ---
function wyswietlKategorie() {
    const kontener = document.getElementById('kategorie');
    kontener.innerHTML = '<div class="kategorie-grid"></div>';
    const grid = kontener.querySelector('.kategorie-grid');
    Object.keys(daneKategorii).forEach(kat => {
        const div = document.createElement('div');
        div.className = 'kat-item';
        div.innerHTML = `<h3>${kat}</h3>`;
        div.onclick = () => pokazPodkategorie(kat);
        grid.appendChild(div);
    });
}

function pokazPodkategorie(kat) {
    const kontener = document.getElementById('kategorie');
    let html = `<h2>${kat}</h2><button onclick="wyswietlKategorie()">Powrót</button><br><br>`;
    daneKategorii[kat].forEach(pod => {
        html += `<button class="btn-pod" onclick="filtruj('${kat}', '${pod}')">${pod}</button>`;
    });
    kontener.innerHTML = html;
}

function filtruj(kat, pod) { alert("Tu będą ogłoszenia dla: " + pod); }

function przygotujFormularz() {
    const selectKat = document.getElementById('f-kategoria');
    if(!selectKat) return;
    Object.keys(daneKategorii).forEach(kat => {
        let opt = document.createElement('option');
        opt.value = kat; opt.innerText = kat;
        selectKat.appendChild(opt);
    });
}

function zaladujPodkategorieFormularza() {
    const kat = document.getElementById('f-kategoria').value;
    const selectPod = document.getElementById('f-podkategoria');
    selectPod.innerHTML = '';
    if(daneKategorii[kat]) {
        daneKategorii[kat].forEach(pod => {
            let opt = document.createElement('option');
            opt.value = pod; opt.innerText = pod;
            selectPod.appendChild(opt);
        });
    }
}

function sprawdzDostepDoDodawania() {
    if (!zalogowanyUser) { alert("Zaloguj się najpierw!"); otworzAuth(); }
    else { document.getElementById('sekcja-dodawania').style.display = 'block'; }
}

function zamknijDodawanie() { document.getElementById('sekcja-dodawania').style.display = 'none'; }

// Start
sprawdzSesje();
wyswietlKategorie();
przygotujFormularz();
