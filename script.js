// Używamy nowych nazw zmiennych, żeby laptop przestał zgłaszać błędy
const MOJ_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const MOJ_KLUCZ = 'sb_publishable_tTUBju7up_8DW05IAK4qHQ_bqknsG9VvR7CId3u_D_M-Y';

// Tworzymy klienta pod unikalną nazwą 'polaczenie'
const polaczenie = window.supabase.createClient(MOJ_URL, MOJ_KLUCZ);

let zalogowanyUzytkownik = null;
let trybLogowania = 'login';

// --- OBSŁUGA AUTH ---
window.pokazAuth = () => {
    document.getElementById('sekcja-auth').style.display = 'block';
};

window.przepnijTryb = () => {
    trybLogowania = (trybLogowania === 'login') ? 'signup' : 'login';
    document.getElementById('auth-tytul').innerText = (trybLogowania === 'login') ? 'Logowanie' : 'Rejestracja';
};

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;

    if (trybLogowania === 'login') {
        const { error } = await polaczenie.auth.signInWithPassword({ email, password });
        if (error) alert("Błąd: " + error.message); else location.reload();
    } else {
        const { error } = await polaczenie.auth.signUp({ email, password });
        if (error) alert("Błąd rejestracji: " + error.message); else alert("Konto założone! Zaloguj się.");
    }
};

// --- START ---
async function inicjalizacja() {
    const { data } = await polaczenie.auth.getSession();
    zalogowanyUzytkownik = data.session?.user || null;

    if (zalogowanyUzytkownik) {
        document.getElementById('auth-status').innerHTML = `<span>${zalogowanyUzytkownik.email}</span>`;
    }
    
    // Testowe kategorie
    document.getElementById('kategorie').innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background:white; padding:20px; border:1px solid #ccc; cursor:pointer;" onclick="alert('Działa!')">🏠 Nieruchomości</div>
            <div style="background:white; padding:20px; border:1px solid #ccc; cursor:pointer;" onclick="alert('Działa!')">🚗 Motoryzacja</div>
        </div>`;
}

inicjalizacja();
