const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);

const PODKAT_DANE = {
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura", "Garaże"],
    "Motoryzacja": ["Samochody", "Motocykle", "Dostawcze", "Części", "Opony"],
    "Dom i Ogród": ["Meble", "Ogród", "Narzędzia", "Oświetlenie", "Dekoracje"],
    "Elektronika": ["Telefony", "Komputery", "TV", "Konsole", "AGD"],
    "Moda": ["Ubrania", "Obuwie", "Biżuteria", "Dodatki"],
    "Rolnictwo": ["Ciągniki", "Maszyny rolnicze", "Zwierzęta", "Pasze"],
    "Muzyka i Edukacja": ["Instrumenty", "Książki", "Kursy"],
    "Sport i Hobby": ["Rowery", "Siłownia", "Wędkarstwo", "Turystyka"],
    "Dla Dzieci": ["Zabawki", "Wózki", "Ubranka"],
    "Zdrowie i Uroda": ["Kosmetyki", "Perfumy", "Sprzęt medyczny"],
    "Noclegi": ["Hotele", "Apartamenty", "Domki"],
    "Antyki i Kolekcje": ["Monety", "Sztuka", "Modele"],
    "Oddam za darmo": ["Meble", "Ubrania", "Inne"]
};

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
    if (PODKAT_DANE[glowna]) {
        pod.innerHTML = PODKAT_DANE[glowna].map(p => `<option value="${p}">${p}</option>`).join('');
    }
};

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await baza.auth.signUp({ email, password });
    if (error) {
        const { error: logErr } = await baza.auth.signInWithPassword({ email, password });
        if (logErr) alert("Błąd: " + logErr.message);
        else location.reload();
    } else {
        alert("Zalogowano/Zarejestrowano!");
        location.reload();
    }
};

window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Musisz być zalogowany!");

    const btn = document.getElementById('btn-wyslij');
    const plik = document.getElementById('t-plik').files[0];
    let imgURL = "";

    btn.innerText = "Wysyłanie...";
    btn.disabled = true;

    if (plik) {
        const ext = plik.name.split('.').pop();
        const path = `${Date.now()}.${ext}`;
        const { error: upErr } = await baza.storage.from('zdjecia').upload(path, plik);
        if (upErr) alert("Błąd zdjęcia: " + upErr.message);
        else imgURL = `${URL_S}/storage/v1/object/public/zdjecia/${path}`;
    }

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

async function laduj(f = null) {
    let q = baza.from('ogloszenia').select('*').order('id', { ascending: false });
    if (f) q = q.eq('kategoria', f);
    const { data } = await q;
    const l = document.getElementById('lista-ogloszen');
    if (l && data) {
        l.innerHTML = data.map(o => `
            <div class="karta">
                ${o.zdjecia ? `<img src="${o.zdjecia}" class="karta-zdjecie">` : ''}
                <h2 style="margin:0;">${o.tytul}</h2>
                <p style="color:#002f34; font-size:1.4rem; font-weight:bold; margin:10px 0;">${o.cena} zł</p>
                <p style="white-space: pre-wrap;">${o.opis}</p>
                <hr style="border:0; border-top:1px solid #eee;">
                <small>📍 ${o.lokalizacja} | 📂 ${o.kategoria} > ${o.podkategoria}</small>
                ${o.telefon ? `<br><b>📞 Telefon: ${o.telefon}</b>` : ''}
            </div>
        `).join('');
    }
}

window.filtruj = (k) => laduj(k);
sprawdzSesje();
laduj();
