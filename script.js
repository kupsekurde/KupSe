const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);

const PODKAT_DANE = {
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura", "Garaże"],
    "Motoryzacja": ["Samochody", "Motocykle", "Dostawcze", "Części"],
    "Dom i Ogród": ["Meble", "Ogród", "Narzędzia", "Wyposażenie"],
    "Elektronika": ["Telefony", "Komputery", "RTV", "AGD"],
    "Moda": ["Ubrania", "Obuwie", "Dodatki"],
    "Rolnictwo": ["Maszyny", "Ciągniki", "Zwierzęta"],
    "Sport i Hobby": ["Rowery", "Siłownia", "Wędkarstwo"],
    "Oddam za darmo": ["Rzeczy gratis"]
};

// Funkcja sprawdzająca czy użytkownik jest zalogowany
async function sprawdzSesje() {
    const { data: { user } } = await baza.auth.getUser();
    const statusDiv = document.getElementById('auth-status');
    if (user) {
        statusDiv.innerHTML = `<span id="user-email">${user.email}</span> <button class="btn-top" style="margin-left:10px; padding:5px 10px;" onclick="baza.auth.signOut().then(()=>location.reload())">Wyloguj</button>`;
    }
}

window.zmienPodkat = () => {
    const glowna = document.getElementById('t-kat').value;
    const pod = document.getElementById('t-podkat');
    if (PODKAT_DANE[glowna]) {
        pod.innerHTML = PODKAT_DANE[glowna].map(p => `<option value="${p}">${p}</option>`).join('');
    }
};

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await baza.auth.signUp({ email, password });
    if (error) {
        const { error: loginError } = await baza.auth.signInWithPassword({ email, password });
        if (loginError) alert("Błąd: " + loginError.message);
        else location.reload();
    } else {
        alert("Zarejestrowano! Sprawdź e-mail (jeśli wymagane) lub zaloguj się.");
        location.reload();
    }
};

window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Musisz być zalogowany, aby dodać ogłoszenie!");

    const d = {
        tytul: document.getElementById('t-tytul').value,
        kategoria: document.getElementById('t-kat').value,
        podkategoria: document.getElementById('t-podkat').value,
        cena: parseInt(document.getElementById('t-cena').value) || 0,
        opis: document.getElementById('t-opis').value,
        lokalizacja: document.getElementById('t-lok').value,
        telefon: document.getElementById('t-tel').value, // NOWE
        zdjecia: document.getElementById('t-foto').value // NOWE (link)
    };

    const { error } = await baza.from('ogloszenia').insert([d]);
    if (error) alert("Błąd: " + error.message);
    else { alert("Dodano!"); location.reload(); }
};

async function laduj(f = null) {
    let q = baza.from('ogloszenia').select('*').order('id', { ascending: false });
    if (f) q = q.eq('kategoria', f);
    const { data } = await q;
    const list = document.getElementById('lista-ogloszen');
    if (list && data) {
        list.innerHTML = data.map(o => `
            <div style="background:white; padding:20px; margin-bottom:15px; border-radius:10px; text-align:left; border:1px solid #ddd;">
                ${o.zdjecia ? `<img src="${o.zdjecia}" class="karta-zdjecie" onerror="this.style.display='none'">` : ''}
                <h3 style="margin:0;">${o.tytul}</h3>
                <p style="color:#23e5db; font-weight:bold; font-size:1.2rem; margin:5px 0;">${o.cena} zł</p>
                <p style="font-size:0.9rem; color:#555;">${o.opis}</p>
                <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px; font-size:0.8rem; color:#888;">
                    📍 ${o.lokalizacja} | 📂 ${o.kategoria} > ${o.podkategoria || 'Inne'} <br>
                    ${o.telefon ? `📞 <b>Tel: ${o.telefon}</b>` : ''}
                </div>
            </div>
        `).join('');
    }
}

window.filtruj = (k) => laduj(k);
sprawdzSesje();
laduj();
