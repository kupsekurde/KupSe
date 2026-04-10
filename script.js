const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);

// Funkcja logowania i pokazywania emaila
async function sprawdzSesje() {
    const { data: { user } } = await baza.auth.getUser();
    const statusDiv = document.getElementById('auth-status');
    if (user && statusDiv) {
        statusDiv.innerHTML = `<span style="color:#23e5db; font-weight:bold; margin-right:15px;">${user.email}</span><button class="btn-top" onclick="baza.auth.signOut().then(()=>location.reload())">Wyloguj</button>`;
    }
}

// Obsługa kategorii i podkategorii
window.zmienPodkat = () => {
    const dane = {
        "Nieruchomości": ["Mieszkania", "Domy", "Działki"],
        "Motoryzacja": ["Samochody", "Motocykle", "Części"],
        "Dom i Ogród": ["Meble", "Narzędzia"],
        "Elektronika": ["Telefony", "Komputery", "TV"],
        "Moda": ["Ubrania", "Obuwie"],
        "Rolnictwo": ["Ciągniki", "Maszyny"],
        "Sport": ["Rowery", "Sprzęt"],
        "Za darmo": ["Różne"]
    };
    const glowna = document.getElementById('t-kat').value;
    const pod = document.getElementById('t-podkat');
    if (dane[glowna]) {
        pod.innerHTML = dane[glowna].map(p => `<option value="${p}">${p}</option>`).join('');
    }
};

// Logowanie
window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) {
        const { error: regErr } = await baza.auth.signUp({ email, password });
        if (regErr) alert("Błąd: " + regErr.message);
        else alert("Konto stworzone! Zaloguj się ponownie.");
    }
    location.reload();
};

// Dodawanie ogłoszenia ZE ZDJĘCIEM i TELEFONEM
window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-wyslij');
    const plik = document.getElementById('t-plik').files[0];
    let imgURL = "";

    btn.innerText = "Wysyłanie...";
    btn.disabled = true;

    // 1. Wgrywanie pliku do Storage
    if (plik) {
        const nazwa = `${Date.now()}_${plik.name.replace(/\s/g, '_')}`;
        const { data, error: upErr } = await baza.storage.from('zdjecia').upload(nazwa, plik);
        
        if (upErr) {
            console.error("Błąd zdjęcia:", upErr);
        } else {
            const { data: pData } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            imgURL = pData.publicUrl;
        }
    }

    // 2. Wysłanie wszystkiego do tabeli
    const o = {
        tytul: document.getElementById('t-tytul').value,
        kategoria: document.getElementById('t-kat').value,
        podkategoria: document.getElementById('t-podkat').value,
        cena: parseInt(document.getElementById('t-cena').value) || 0,
        opis: document.getElementById('t-opis').value,
        lokalizacja: document.getElementById('t-lok').value,
        telefon: document.getElementById('t-tel').value,
        zdjecia: imgURL
    };

    const { error: dbErr } = await baza.from('ogloszenia').insert([o]);
    if (dbErr) alert("Błąd bazy: " + dbErr.message);
    else location.reload();
};

// Ładowanie listy ogłoszeń
async function laduj(f = null) {
    let q = baza.from('ogloszenia').select('*').order('id', { ascending: false });
    if (f) q = q.eq('kategoria', f);
    const { data } = await q;
    const l = document.getElementById('lista-ogloszen');
    if (l && data) {
        l.innerHTML = data.map(o => `
            <div style="background:white; padding:20px; margin-bottom:15px; border-radius:10px; text-align:left; border:1px solid #ddd;">
                ${o.zdjecia ? `<img src="${o.zdjecia}" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px; margin-bottom:10px;">` : ''}
                <h3>${o.tytul}</h3>
                <p style="color:#23e5db; font-weight:bold; font-size:1.3rem;">${o.cena} zł</p>
                <p>${o.opis}</p>
                <small>📍 ${o.lokalizacja} | 📂 ${o.kategoria} | 📞 ${o.telefon || 'Brak nr'}</small>
            </div>
        `).join('');
    }
}

window.filtruj = (k) => laduj(k);
sprawdzSesje();
laduj();
