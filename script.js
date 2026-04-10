const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);

// --- Funkcje pomocnicze ---

async function sprawdzSesje() {
    const { data: { user } } = await baza.auth.getUser();
    const statusDiv = document.getElementById('auth-status');
    if (user && statusDiv) {
        statusDiv.innerHTML = `<span id="user-info">${user.email}</span><button class="btn-top" onclick="baza.auth.signOut().then(()=>location.reload())">Wyloguj</button>`;
    }
}

window.zmienPodkat = () => {
    const glowna = document.getElementById('t-kat').value;
    const pod = document.getElementById('t-podkat');
    const dane = {
        "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura"],
        "Motoryzacja": ["Samochody", "Motocykle", "Części"],
        "Dom i Ogród": ["Meble", "Ogród", "Narzędzia"],
        "Elektronika": ["Telefony", "Komputery", "TV"],
        "Moda": ["Ubrania", "Obuwie"],
        "Rolnictwo": ["Ciągniki", "Maszyny"],
        "Sport i Hobby": ["Rowery", "Wędkarstwo"],
        "Oddam za darmo": ["Wszystko"]
    };
    if (dane[glowna]) {
        pod.innerHTML = dane[glowna].map(p => `<option value="${p}">${p}</option>`).join('');
    }
};

// --- Główne akcje ---

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) {
        const { error: regErr } = await baza.auth.signUp({ email, password });
        if (regErr) alert("Błąd: " + regErr.message);
        else alert("Założono konto! Zaloguj się.");
    }
    location.reload();
};

window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-wyslij');
    const plik = document.getElementById('t-plik').files[0];
    let finalImgURL = "";

    btn.innerText = "Wysyłanie pliku...";
    btn.disabled = true;

    // 1. Wgrywanie zdjęcia
    if (plik) {
        const nazwa = `${Date.now()}_${plik.name.replace(/\s/g, '_')}`;
        const { data, error: storageErr } = await baza.storage
            .from('zdjecia')
            .upload(nazwa, plik);

        if (storageErr) {
            alert("Błąd wgrywania zdjęcia: " + storageErr.message);
        } else {
            // Pobieranie publicznego linku
            const { data: publicData } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            finalImgURL = publicData.publicUrl;
        }
    }

    // 2. Dodawanie ogłoszenia
    btn.innerText = "Zapisywanie ogłoszenia...";
    const daneOgloszenia = {
        tytul: document.getElementById('t-tytul').value,
        kategoria: document.getElementById('t-kat').value,
        podkategoria: document.getElementById('t-podkat').value,
        cena: parseInt(document.getElementById('t-cena').value) || 0,
        opis: document.getElementById('t-opis').value,
        lokalizacja: document.getElementById('t-lok').value,
        telefon: document.getElementById('t-tel').value,
        zdjecia: finalImgURL
    };

    const { error: dbErr } = await baza.from('ogloszenia').insert([daneOgloszenia]);

    if (dbErr) alert("Błąd bazy: " + dbErr.message);
    else {
        alert("Sukces!");
        location.reload();
    }
};

async function laduj(f = null) {
    let q = baza.from('ogloszenia').select('*').order('id', { ascending: false });
    if (f) q = q.eq('kategoria', f);
    const { data } = await q;
    const list = document.getElementById('lista-ogloszen');
    if (list && data) {
        list.innerHTML = data.map(o => `
            <div class="karta">
                ${o.zdjecia ? `<img src="${o.zdjecia}" class="karta-zdjecie">` : ''}
                <h2>${o.tytul}</h2>
                <p style="color:#23e5db; font-size:1.5rem; font-weight:bold;">${o.cena} zł</p>
                <p>${o.opis}</p>
                <div style="font-size:0.8rem; color:gray; border-top:1px solid #eee; padding-top:10px;">
                    📍 ${o.lokalizacja} | 📞 ${o.telefon || 'Brak numeru'}
                </div>
            </div>
        `).join('');
    }
}

window.filtruj = (k) => laduj(k);
sprawdzSesje();
laduj();
