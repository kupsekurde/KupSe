const SUPABASE_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tTUBju7up_8DW05IAK4qHQ_bqknsG9VvR7CId3u_D_M-Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

let zalogowanyUser = null;
let trybAuth = 'login';

// --- LOGOWANIE ---
async function sprawdzSesje() {
    try {
        const { data } = await supabase.auth.getSession();
        zalogowanyUser = data.session?.user || null;
        odswiezWidokAuth();
    } catch (e) { console.error("Błąd sesji:", e); }
}

function odswiezWidokAuth() {
    const statusDiv = document.getElementById('auth-status');
    if (zalogowanyUser) {
        statusDiv.innerHTML = `<span style="color:white; margin-right:10px;">${zalogowanyUser.email}</span><button onclick="wyloguj()">Wyloguj</button>`;
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
    if(!email || !password) { alert("Wpisz dane!"); return; }

    if (trybAuth === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert("Błąd: " + error.message); else location.reload();
    } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) alert("Błąd: " + error.message); else alert("Konto stworzone! Teraz się zaloguj.");
    }
}

async function wyloguj() { await supabase.auth.signOut(); location.reload(); }

// --- KATEGORIE ---
function wyswietlKategorie() {
    const kontener = document.getElementById('kategorie');
    if(!kontener) return;
    kontener.innerHTML = '<div class="kategorie-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:10px; margin-top:20px;"></div>';
    const grid = kontener.querySelector('.kategorie-grid');
    Object.keys(daneKategorii).forEach(kat => {
        const div = document.createElement('div');
        div.style.cssText = "background:white; padding:15px; text-align:center; border-radius:8px; cursor:pointer; border:1px solid #ddd;";
        div.innerHTML = `<div style="font-size:24px;">${kat.split(' ')[0]}</div><div style="font-size:12px; font-weight:bold;">${kat.split(' ').slice(1).join(' ')}</div>`;
        div.onclick = () => pokazPodkategorie(kat);
        grid.appendChild(div);
    });
}

function pokazPodkategorie(kat) {
    const kontener = document.getElementById('kategorie');
    let html = `<h2 style="text-align:center;">${kat}</h2><div style="text-align:center;"><button onclick="wyswietlKategorie()" style="margin-bottom:20px;">Powrót</button></div><div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px;">`;
    daneKategorii[kat].forEach(pod => {
        html += `<button onclick="alert('Tu będą ogłoszenia: ${pod}')" style="padding:10px; border-radius:20px; border:1px solid #002f34; background:white; cursor:pointer;">${pod}</button>`;
    });
    html += `</div>`;
    kontener.innerHTML = html;
}

// --- DODAWANIE ---
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
    selectPod.innerHTML = '<option value="">Wybierz podkategorię</option>';
    if(daneKategorii[kat]) {
        daneKategorii[kat].forEach(pod => {
            let opt = document.createElement('option');
            opt.value = pod; opt.innerText = pod;
            selectPod.appendChild(opt);
        });
    }
}

function sprawdzDostepDoDodawania() {
    if (!zalogowanyUser) { alert("Zaloguj się, aby dodać ogłoszenie!"); otworzAuth(); }
    else { document.getElementById('sekcja-dodawania').style.display = 'block'; }
}

function zamknijDodawanie() { document.getElementById('sekcja-dodawania').style.display = 'none'; }

// START
window.onload = () => {
    sprawdzSesje();
    wyswietlKategorie();
    przygotujFormularz();
};
