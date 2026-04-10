const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'sb_publishable_tTUBju7up_8DW05IAK4qHQ_bqknsG9VvR7CId3u_D_M-Y';

// Sprawdzamy czy biblioteka się załadowała
if (!window.supabase) {
    alert("Błąd: Nie załadowano biblioteki Supabase!");
}

const supabaseKlient = window.supabase.createClient(URL_S, KEY_S);

let tryb = 'login';

window.pokazAuth = () => {
    document.getElementById('sekcja-auth').style.display = 'block';
};

window.przepnijTryb = () => {
    tryb = (tryb === 'login') ? 'signup' : 'login';
    document.getElementById('auth-tytul').innerText = (tryb === 'login') ? 'Logowanie' : 'Rejestracja';
};

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;

    if (tryb === 'login') {
        const { error } = await supabaseKlient.auth.signInWithPassword({ email, password });
        if (error) alert("Błąd logowania: " + error.message); 
        else { alert("Zalogowano!"); location.reload(); }
    } else {
        const { error } = await supabaseKlient.auth.signUp({ email, password });
        if (error) alert("Błąd rejestracji: " + error.message); 
        else alert("Konto stworzone! Sprawdź e-mail (jeśli wymagane) i zaloguj się.");
    }
};

window.sprawdzDostep = () => {
    alert("Najpierw się zaloguj!");
    window.pokazAuth();
};

// Inicjalizacja kategorii, żeby nie było błędu innerHTML
document.addEventListener('DOMContentLoaded', () => {
    const kontener = document.getElementById('kategorie-kontener');
    if (kontener) {
        kontener.innerHTML = "<h3>Wybierz kategorię</h3>";
    }
});
