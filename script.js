const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let aktualnaGaleria = []; // Pamięć zdjęć dla lightboxa
let aktualnyIndex = 0;    // Numer obecnie wyświetlanego zdjęcia

const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części", "Opony"],
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura"],
    "Elektronika": ["Telefony", "Laptopy", "Gry i Konsole", "RTV"],
    "Dom i Ogród": ["Meble", "Ogród", "Narzędzia", "Dekoracje"],
    "Moda": ["Ubrania", "Buty", "Biżuteria", "Akcesoria"],
    "Rolnictwo": ["Ciągniki", "Maszyny rolnicze", "Produkty rolne"],
    "Zwierzęta": ["Psy", "Koty", "Ptaki", "Ryby"],
    "Dla Dzieci": ["Zabawki", "Wózki", "Ubranka"],
    "Sport i Hobby": ["Rowery", "Siłownia", "Wędkarstwo"],
    "Muzyka i Edukacja": ["Instrumenty", "Książki", "Korepetycje"],
    "Usługi": ["Budowlane", "Sprzątanie", "Uroda"],
    "Praca": ["Pełny etat", "Dodatkowa", "Praktyki"],
    "Inne": ["Różne"]
};

// --- LOGOWANIE I AUTH ---
async function loguj() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    const { data, error } = await baza.auth.signUp({ email, password: pass });
    if (error) {
        const { data: d2, error: e2 } = await baza.auth.signInWithPassword({ email, password: pass });
        if (e2) alert("Błąd: " + e2.message);
        else location.reload();
    } else {
        alert("Zarejestrowano! Sprawdź email lub zaloguj się.");
        location.reload();
    }
}

async function sprawdzSesje() {
    const { data: { session } } = await baza.auth.getSession();
    const nav = document.getElementById('user-nav');
    if (session) {
        nav.innerHTML = `
            <img src="SprzedajSe.png" class="btn-add-ad" onclick="otworzDodawanie()">
            <button onclick="baza.auth.signOut().then(()=>location.reload())" class="btn-account">Wyloguj</button>
        `;
    }
}

// --- OBSŁUGA OGŁOSZEŃ ---
async function pobierzOgloszenia() {
    const { data, error } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    if (!error) {
        daneOgloszen = data;
        render(data);
    }
}

function render(lista) {
    const kontener = document.getElementById('lista');
    if (!lista.length) { kontener.innerHTML = "<p>Brak ogłoszeń.</p>"; return; }
    kontener.innerHTML = lista.map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia}" alt="foto">
            <div class="ad-body">
                <div class="ad-price">${o.cena.toLocaleString()} zł</div>
                <div class="ad-title">${o.tytul}</div>
                <div class="ad-date"><span>${o.lokalizacja}</span></div>
            </div>
        </div>
    `).join('');
}

// --- MODAL SZCZEGÓŁÓW I LIGHTBOX ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(item => item.id === id);
    const box = document.getElementById('view-content');
    
    // Obsługa tablicy zdjęć (nowe) lub stringa (stare ogłoszenia)
    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualnyIndex = 0;

    const miniaturkiHtml = aktualnaGaleria.map((imgUrl, index) => `
        <img src="${imgUrl}" 
             style="width:60px; height:60px; object-fit:cover; border-radius:10px; cursor:pointer; border:2px solid #eee" 
             onclick="document.getElementById('main-img').src='${imgUrl}'; aktualnyIndex = ${index}; event.stopPropagation();">
    `).join('');

    box.innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; margin-top:10px">
            <div>
                <img id="main-img" src="${aktualnaGaleria[0]}" 
                     style="width:100%; border-radius:20px; cursor:zoom-in; box-shadow:0 10px 20px rgba(0,0,0,0.1)"
                     onclick="openLightbox()">
                <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap">
                    ${miniaturkiHtml}
                </div>
            </div>
            <div>
                <h1 style="margin:0; font-size:32px">${o.tytul}</h1>
                <h2 style="color:var(--primary); font-size:28px; margin:10px 0">${o.cena.toLocaleString()} zł</h2>
                <p style="color:gray">📍 Lokalizacja: ${o.lokalizacja}</p>
                <p style="color:gray">📂 Kategoria: ${o.kategoria} (${o.podkategoria})</p>
                <div style="background:#f1f5f9; padding:20px; border-radius:15px; margin:20px 0; line-height:1.6">${o.opis}</div>
                <a href="tel:${o.telefon}" style="display:block; text-align:center; background:#111; color:#fff; padding:18px; border-radius:15px; text-decoration:none; font-weight:800; font-size:18px">📞 Zadzwoń: ${o.telefon}</a>
            </div>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

window.openLightbox = () => {
    document.getElementById('lightbox-img').src = aktualnaGaleria[aktualnyIndex];
    document.getElementById('lightbox').style.display = 'flex';
};

window.changeLightbox = (dir) => {
    aktualnyIndex += dir;
    if (aktualnyIndex >= aktualnaGaleria.length) aktualnyIndex = 0;
    if (aktualnyIndex < 0) aktualnyIndex = aktualnaGaleria.length - 1;
    document.getElementById('lightbox-img').src = aktualnaGaleria[aktualnyIndex];
};

// --- DODAWANIE OGŁOSZEŃ ---
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    const pliki = document.getElementById('f-plik').files;

    if (pliki.length > 5) { alert("Możesz dodać maksymalnie 5 zdjęć."); return; }

    btn.innerText = "Publikowanie...";
    btn.disabled = true;

    try {
        const urlList = [];
        for (let i = 0; i < pliki.length; i++) {
            const path = `${Date.now()}_${i}`;
            const { error: uploadError } = await baza.storage.from('zdjecia').upload(path, pliki[i]);
            if (uploadError) throw uploadError;
            const { data: u } = baza.storage.from('zdjecia').getPublicUrl(path);
            urlList.push(u.publicUrl);
        }

        const { error: insertError } = await baza.from('ogloszenia').insert([{
            tytul: document.getElementById('f-tytul').value,
            kategoria: document.getElementById('f-kat').value,
            podkategoria: document.getElementById('f-podkat').value,
            cena: parseInt(document.getElementById('f-cena').value),
            opis: document.getElementById('f-opis').value,
            lokalizacja: document.getElementById('f-lok').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: urlList
        }]);

        if (insertError) throw insertError;
        location.reload();
    } catch (err) {
        alert("Błąd: " + err.message);
        btn.innerText = "Opublikuj na KupSe";
        btn.disabled = false;
    }
};

// --- POMOCNICZE ---
window.otworzDodawanie = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    if (panel.dataset.current === kat && panel.style.display === 'flex') {
        panel.style.display = 'none';
        render(daneOgloszen);
    } else {
        panel.innerHTML = MAPA_KATEGORII[kat].map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
        panel.style.display = 'flex';
        panel.dataset.current = kat;
        render(daneOgloszen.filter(o => o.kategoria === kat));
    }
};

window.filtrujPoPodkat = (kat, pod) => {
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === pod));
};

window.updateFormSubcats = () => {
    const kat = document.getElementById('f-kat').value;
    const s = document.getElementById('f-podkat');
    s.innerHTML = '<option value="">Podkategoria</option>';
    if (kat) MAPA_KATEGORII[kat].forEach(p => s.innerHTML += `<option value="${p}">${p}</option>`);
};

window.filtruj = () => {
    const txt = document.getElementById('find-text').value.toLowerCase();
    render(daneOgloszen.filter(o => o.tytul.toLowerCase().includes(txt) || o.opis.toLowerCase().includes(txt)));
};

// Start aplikacji
sprawdzSesje();
pobierzOgloszenia();
