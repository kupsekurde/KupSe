// TEST POŁĄCZENIA
console.log("Skrypt załadowany!");

const SUPABASE_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tTUBju7up_8DW05IAK4qHQ_bqknsG9VvR7CId3u_D_M-Y';

let supabase;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase zainicjowany!");
} catch (err) {
    document.getElementById('debug-info').innerText = "Błąd Supabase: " + err.message;
}

const daneKategorii = {
    "🏠 Nieruchomości": ["Mieszkania", "Domy", "Działki"],
    "🚗 Motoryzacja": ["Samochody", "Motocykle"],
    "🛋️ Dom i Ogród": ["Meble", "Narzędzia"],
    "📱 Elektronika": ["Telefony", "Laptopy"],
    "👕 Moda": ["Ubrania", "Buty"]
};

let zalogowanyUser = null;
let trybAuth = 'login';

// --- OBSŁUGA PRZYCISKÓW ---

window.otworzAuth = function() {
    console.log("Otwieram auth...");
    document.getElementById('sekcja-auth').style.display = 'block';
}

window.przepnijAuth = function() {
    trybAuth = (trybAuth === 'login') ? 'signup' : 'login';
    document.getElementById('auth-tytul').innerText = (trybAuth === 'login') ? 'Logowanie' : 'Rejestracja';
}

window.obslugaAuth = async function() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    
    if(trybAuth === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if(error) alert("Błąd: " + error.message); else location.reload();
    } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if(error) alert("Błąd: " + error.message); else alert("Konto stworzone! Możesz się zalogować.");
    }
}

window.sprawdzDostepDoDodawania = function() {
    if(!zalogowanyUser) {
        alert("Musisz się zalogować!");
        otworzAuth();
    } else {
        alert("Jesteś zalogowany, możesz dodawać!");
    }
}

// --- START ---
async function init() {
    const { data } = await supabase.auth.getSession();
    zalogowanyUser = data.session?.user || null;
    
    if(zalogowanyUser) {
        document.getElementById('auth-status').innerHTML = `<span>${zalogowanyUser.email}</span>`;
    }

    // Renderowanie kategorii na start
    const katDiv = document.getElementById('kategorie');
    let html = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
    Object.keys(daneKategorii).forEach(k => {
        html += `<div onclick="alert('${k}')" style="background:white; padding:20px; border:1px solid #ccc; border-radius:5px; text-align:center; cursor:pointer;">${k}</div>`;
    });
    html += '</div>';
    katDiv.innerHTML = html;
}

init();
