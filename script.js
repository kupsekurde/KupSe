const SUPABASE_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tTUBju7up_8DW05IAK4qHQ_bqknsG9VvR7CId3u_D_M-Y';

let supabase;
let zalogowanyUser = null;
let trybAuth = 'login';

// Czekamy na załadowanie biblioteki
function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase gotowy!");
        sprawdzSesje();
    } else {
        setTimeout(initSupabase, 100); // próbuj ponownie za 0.1 sekundy
    }
}

async function sprawdzSesje() {
    const { data } = await supabase.auth.getSession();
    zalogowanyUser = data.session?.user || null;
    if(zalogowanyUser) {
        document.getElementById('auth-status').innerHTML = `<span style="color:white; font-size:12px;">${zalogowanyUser.email}</span>`;
    }
}

// Funkcje przycisków - przypisane bezpośrednio do okna (window)
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
    
    if(!email || !password) return alert("Wpisz dane!");

    if (trybAuth === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert("Błąd: " + error.message); else location.reload();
    } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) alert("Błąd: " + error.message); else alert("Konto założone! Teraz się zaloguj.");
    }
}

window.sprawdzDostepDoDodawania = function() {
    if(!zalogowanyUser) {
        alert("Najpierw się zaloguj!");
        otworzAuth();
    } else {
        alert("Brawo! Jesteś zalogowany. Możemy budować formularz!");
    }
}

// Start
initSupabase();

// Wyświetlenie kategorii dla testu
const katHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div onclick="alert('Kliknięto Nieruchomości')" style="background:white; padding:20px; border:1px solid #ddd; cursor:pointer;">🏠 Nieruchomości</div>
        <div onclick="alert('Kliknięto Motoryzację')" style="background:white; padding:20px; border:1px solid #ddd; cursor:pointer;">🚗 Motoryzacja</div>
    </div>
`;
document.getElementById('kategorie').innerHTML = katHTML;
