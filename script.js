// TWOJE DANE KONFIGURACYJNE
const S_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const S_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const mojeSupabase = window.supabase.createClient(S_URL, S_KEY);

// 1. REJESTRACJA
window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    if(!email || !password) return alert("Wpisz dane!");

    const { error } = await mojeSupabase.auth.signUp({ email, password });
    if (error) alert("Błąd: " + error.message);
    else alert("Konto założone! Teraz możesz dodawać ogłoszenia.");
};

// 2. DODAWANIE OGŁOSZENIA
window.dodajOgloszenieDB = async (event) => {
    if (event) event.preventDefault();

    const tytul = document.getElementById('t-tytul').value;
    const cena = document.getElementById('t-cena').value;
    const opis = document.getElementById('t-opis').value;
    const lok = document.getElementById('t-lok').value;

    const { error } = await mojeSupabase
        .from('ogloszenia')
        .insert([{ tytul, cena: parseInt(cena), opis, lokalizacja: lok }]);

    if (error) {
        alert("Błąd zapisu: " + error.message);
    } else {
        alert("Dodano ogłoszenie!");
        document.getElementById('okno-dodawania').style.display = 'none';
        ladujOgloszenia(); // Odśwież listę po dodaniu
    }
};

// 3. WYŚWIETLANIE OGŁOSZEŃ
async function ladujOgloszenia() {
    const { data, error } = await mojeSupabase
        .from('ogloszenia')
        .select('*')
        .order('id', { ascending: false });

    const lista = document.getElementById('lista-ogloszen');
    if (error || !lista) return;

    lista.innerHTML = data.map(o => `
        <div style="background:white; padding:15px; margin:10px auto; border-radius:8px; border:1px solid #ddd; max-width:400px; text-align:left;">
            <h3 style="margin:0;">${o.tytul}</h3>
            <p style="color:#23e5db; font-weight:bold;">${o.cena} zł</p>
            <p style="font-size:14px;">${o.opis || ''}</p>
            <small>📍 ${o.lokalizacja || 'Brak lokalizacji'}</small>
        </div>
    `).join('');
}

// POMOCNICZE
window.pokazAuth = () => document.getElementById('sekcja-auth').style.display = 'block';
window.otworzDodawanie = () => document.getElementById('okno-dodawania').style.display = 'block';

// Start ładowania ogłoszeń przy wejściu
ladujOgloszenia();
