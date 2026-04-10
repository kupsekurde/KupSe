// Dane z Twoich screenów
const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'sb_publishable_tTUBju7up_8DW05IAK4qHQ_bqknsG9VvR7CId3u_D_M-Y';

// Tworzymy klienta (zmieniona nazwa zmiennej)
const klientSupabase = window.supabase.createClient(URL_S, KEY_S);

let zalogowanyUser = null;
let trybAuth = 'login';

// Funkcje Auth
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
    if(!email || !password) return alert("Uzupełnij pola!");

    if (trybAuth === 'login') {
        const { error } = await klientSupabase.auth.signInWithPassword({ email, password });
        if (error) alert("Błąd: " + error.message); else location.reload();
    } else {
        const { error } = await klientSupabase.auth.signUp({ email, password });
        if (error) alert("Błąd: " + error.message); else alert("Konto założone! Zaloguj się.");
    }
}

window.sprawdzDostep = function() {
    if(!zalogowanyUser) {
        alert("Musisz się zalogować!");
        otworzAuth();
    } else {
        alert("Jesteś zalogowany jako " + zalogowanyUser.email);
    }
}

// Inicjalizacja strony
async function start() {
    const { data } = await klientSupabase.auth.getSession();
    zalogowanyUser = data.session?.user || null;
    
    if(zalogowanyUser) {
        document.getElementById('auth-status').innerHTML = `<span style="color:white; margin-right:10px;">${zalogowanyUser.email}</span>`;
    }

    const katHTML = `
        <div class="kat-item" onclick="alert('Kategoria: Nieruchomości')">🏠 Nieruchomości</div>
        <div class="kat-item" onclick="alert('Kategoria: Motoryzacja')">🚗 Motoryzacja</div>
    `;
    document.getElementById('kategorie-lista').innerHTML = katHTML;
}

start();
