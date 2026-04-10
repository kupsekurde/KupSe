// Konfiguracja Twojego projektu Supabase
const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'sb_publishable_tTUBju7up_8DW05IAK4qHQ_bqknsG9VvR7CId3u_D_M-Y';

// Inicjalizacja klienta pod unikalną nazwą
const klientSupabase = window.supabase.createClient(URL_S, KEY_S);

let zalogowanyUser = null;
let trybAuth = 'login';

// --- SYSTEM LOGOWANIA ---
window.otworzAuth = function() {
    document.getElementById('sekcja-auth').style.display = 'block';
}

window.przepnijAuth = function() {
    trybAuth = (trybAuth === 'login') ? 'signup' : 'login';
    document.getElementById('auth-tytul').innerText = (trybAuth === 'login') ? 'Logowanie' : 'Rejestracja';
}

window.obslugaAuth = async function() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    
    if(!email || !password) return alert("Proszę wypełnić wszystkie pola!");

    if (trybAuth === 'login') {
        const { error } = await klientSupabase.auth.signInWithPassword({ email, password });
        if (error) alert("Błąd logowania: " + error.message); else location.reload();
    } else {
        const { error } = await klientSupabase.auth.signUp({ email, password });
        if (error) alert("Błąd rejestracji: " + error.message); else alert("Konto założone! Możesz się teraz zalogować.");
    }
}

window.wyloguj = async function() {
    await klientSupabase.auth.signOut();
    location.reload();
}

// --- DODAWANIE OGŁOSZEŃ ---
window.sprawdzDostep = function() {
    if(!zalogowanyUser) {
        alert("Musisz być zalogowany, aby dodać ogłoszenie!");
        window.otworzAuth();
    } else {
        document.getElementById('sekcja-dodawania').style.display = 'block';
    }
}

window.wyslijOgloszenie = async function() {
    const tytul = document.getElementById('f-tytul').value;
    const cena = document.getElementById('f-cena').value;
    const opis = document.getElementById('f-opis').value;
    const lok = document.getElementById('f-lokalizacja').value;
    const tel = document.getElementById('f-telefon').value;

    if(!tytul || !cena) return alert("Podaj chociaż tytuł i cenę!");

    const { data, error } = await klientSupabase
        .from('ogloszenia')
        .insert([
            { 
                tytul: tytul, 
                cena: parseInt(cena), 
                opis: opis, 
                lokalizacja: lok, 
                telefon: tel 
            }
        ]);

    if (error) {
        alert("Błąd zapisu w bazie: " + error.message);
    } else {
        alert("Brawo! Ogłoszenie zostało dodane.");
        location.reload();
    }
}

// --- START STRONY ---
async function start() {
    const { data } = await klientSupabase.auth.getSession();
    zalogowanyUser = data.session?.user || null;
    
    if(zalogowanyUser) {
        document.getElementById('auth-status').innerHTML = `
            <span>Zalogowany: <b>${zalogowanyUser.email}</b></span>
            <button onclick="wyloguj()" style="cursor:pointer;">Wyloguj</button>
        `;
    }

    // Proste wyświetlanie kategorii
    const katHTML = `
        <div class="kat-item" onclick="alert('Tu będą Mieszkania')">🏠 Nieruchomości</div>
        <div class="kat-item" onclick="alert('Tu będą Auta')">🚗 Motoryzacja</div>
        <div class="kat-item" onclick="alert('Tu będą Meble')">🛋️ Dom i Ogród</div>
        <div class="kat-item" onclick="alert('Tu będą Telefony')">📱 Elektronika</div>
    `;
    const lista = document.getElementById('kategorie-lista');
    if(lista) lista.innerHTML = katHTML;
}

start();
