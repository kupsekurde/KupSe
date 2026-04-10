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
    if (error) alert("Błąd: " + error.message);
    else { alert("Sukces! Sprawdź pocztę."); document.getElementById('okno-auth').style.display = 'none'; }
};

window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const d = {
        tytul: document.getElementById('t-tytul').value,
        kategoria: document.getElementById('t-kat').value,
        podkategoria: document.getElementById('t-podkat').value,
        cena: parseInt(document.getElementById('t-cena').value) || 0,
        opis: document.getElementById('t-opis').value,
        lokalizacja: document.getElementById('t-lok').value
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
                <h3 style="margin:0;">${o.tytul}</h3>
                <p style="color:#23e5db; font-weight:bold; font-size:1.2rem;">${o.cena} zł</p>
                <small>📂 ${o.kategoria} > ${o.podkategoria || 'Inne'} | 📍 ${o.lokalizacja}</small>
            </div>
        `).join('');
    }
}

window.filtruj = (k) => laduj(k);
laduj();
