const S_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const S_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const mojeSupabase = window.supabase.createClient(S_URL, S_KEY);

// LOGOWANIE I REJESTRACJA
window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    if(!email || !password) return alert("Wpisz dane!");

    const { error } = await mojeSupabase.auth.signUp({ email, password });
    if (error) alert("Błąd: " + error.message);
    else alert("Sukces! Możesz teraz dodać ogłoszenie.");
};

// DODAWANIE OGŁOSZENIA (Zabezpieczone przed "wywalaniem")
window.dodajOgloszenieDB = async (event) => {
    if (event) event.preventDefault(); // To blokuje przeładowanie strony!

    const tytul = document.getElementById('t-tytul').value;
    const cena = document.getElementById('t-cena').value;
    const opis = document.getElementById('t-opis').value;
    const lok = document.getElementById('t-lok').value;

    const { data, error } = await mojeSupabase
        .from('ogloszenia')
        .insert([{ tytul, cena: parseInt(cena), opis, lokalizacja: lok }]);

    if (error) {
        alert("Błąd bazy: " + error.message);
    } else {
        alert("Ogłoszenie dodane pomyślnie!");
        document.getElementById('okno-dodawania').style.display = 'none';
    }
};

window.pokazAuth = () => document.getElementById('sekcja-auth').style.display = 'block';
window.otworzDodawanie = () => document.getElementById('okno-dodawania').style.display = 'block';
