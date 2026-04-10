const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

// Zmieniona nazwa, żeby nie gryzła się z biblioteką
const baza = window.supabase.createClient(URL_S, KEY_S);

window.otworzAuth = () => document.getElementById('sekcja-auth').style.display = 'block';
window.otworzDodawanie = () => document.getElementById('okno-dodawania').style.display = 'block';

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await baza.auth.signUp({ email, password });
    if (error) alert("Błąd: " + error.message);
    else { alert("Sukces! Zalogowano/Zarejestrowano."); document.getElementById('sekcja-auth').style.display = 'none'; }
};

window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const d = {
        tytul: document.getElementById('t-tytul').value,
        kategoria: document.getElementById('t-kat').value,
        cena: parseInt(document.getElementById('t-cena').value),
        opis: document.getElementById('t-opis').value,
        lokalizacja: document.getElementById('t-lok').value
    };

    const { error } = await baza.from('ogloszenia').insert([d]);
    if (error) alert("Błąd: " + error.message);
    else { alert("Dodano!"); document.getElementById('okno-dodawania').style.display = 'none'; laduj(); }
};

async function laduj(kat = null) {
    let q = baza.from('ogloszenia').select('*').order('id', { ascending: false });
    if (kat) q = q.eq('kategoria', kat);
    
    const { data } = await q;
    const l = document.getElementById('lista-ogloszen');
    if (!l) return;

    l.innerHTML = data.map(o => `
        <div style="background:white; padding:15px; margin:10px 0; border-radius:8px; border:1px solid #ddd; text-align:left;">
            <h3 style="margin:0;">${o.tytul}</h3>
            <p style="color:#23e5db; font-weight:bold;">${o.cena} zł</p>
            <small>📍 ${o.lokalizacja} | 📂 ${o.kategoria}</small>
        </div>
    `).join('');
}

window.filtruj = (kat) => laduj(kat);

laduj();
