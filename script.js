const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let aktualnaGaleria = []; 
let aktualnyIndex = 0;

const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części", "Opony"],
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura"],
    "Elektronika": ["Telefony", "Laptopy", "Gry i Konsole", "RTV"],
    "Dom i Ogród": ["Meble", "Ogród", "Narzędzia", "Dekoracje"],
    "Moda": ["Ubrania", "Buty", "Biżuteria", "Akcesoria"],
    "Rolnictwo": ["Ciągniki", "Maszyny rolnicze", "Produkty rolne"],
    "Zwierzęta": ["Psy", "Koty", "Ptaki", "Akcesoria"],
    "Dla Dzieci": ["Zabawki", "Wózki", "Ubranka"],
    "Sport i Hobby": ["Rowery", "Siłownia", "Turystyka", "Wędkarstwo"],
    "Muzyka i Edukacja": ["Instrumenty", "Książki", "Płyty"],
    "Usługi": ["Budowlane", "Uroda", "Transport", "IT"],
    "Praca": ["Pełny etat", "Dodatkowa", "Staże"],
    "Inne": ["Za darmo", "Zamiana", "Kolekcje"]
};

// --- FUNKCJA KOMPRESJI ZDJĘĆ ---
async function kompresujZdjecie(plik) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(plik);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200; // Maksymalna szerokość zdjęcia
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Zamiana na format JPEG z jakością 70% (bardzo mała waga, dobra jakość)
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.7);
            };
        };
    });
}

// --- LOGOWANIE I AUTH ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        document.getElementById('user-nav').innerHTML = `
            <img src="SprzedajSe.png" class="btn-add-ad" onclick="otworzModal()">
            <div class="account-menu">
                <button class="btn-account" onclick="document.getElementById('drop').classList.toggle('show')">Twoje konto</button>
                <div id="drop" class="dropdown-content">
                    <span style="font-size:12px; color:gray; font-weight:bold">${user.email}</span><hr>
                    <button onclick="wyloguj()" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:800; padding:10px 0; width:100%; text-align:left">Wyloguj się</button>
                </div>
            </div>
        `;
        const authBox = document.getElementById('auth-box');
        if(authBox) authBox.classList.add('hidden');
    }
}

window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) await baza.auth.signUp({ email, password });
    location.reload();
};

window.wyloguj = async () => { 
    await baza.auth.signOut(); 
    location.reload(); 
};

// --- OBSŁUGA OGŁOSZEŃ ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen);
}

function render(lista) {
    const kontener = document.getElementById('lista');
    if(!lista.length) { kontener.innerHTML = "<p>Brak ogłoszeń.</p>"; return; }
    kontener.innerHTML = lista.map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia}" alt="foto">
            <div class="ad-body">
                <div class="ad-price">${o.cena.toLocaleString()} zł</div>
                <div class="ad-title">${o.tytul}</div>
                <div class="ad-date">
                    <span>📍 ${o.lokalizacja}</span>
                    <span>${new Date(o.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// --- MODAL SZCZEGÓŁÓW I LIGHTBOX ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(item => item.id === id);
    const box = document.getElementById('view-content');
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

// --- DODAWANIE OGŁOSZEŃ (Z KOMPRESJĄ) ---
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    const pliki = document.getElementById('f-plik').files;

    if (pliki.length > 5) { alert("Max 5 zdjęć."); return; }

    btn.innerText = "Kompresja i wysyłka...";
    btn.disabled = true;

    try {
        const urlList = [];
        for (let i = 0; i < pliki.length; i++) {
            // WYWOŁANIE KOMPRESJI
            const skompresowanyPlik = await kompresujZdjecie(pliki[i]);
            
            const path = `${Date.now()}_${i}_img.jpg`;
            const { error: uploadError } = await baza.storage.from('zdjecia').upload(path, skompresowanyPlik);
            
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
window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

window.updateFormSubcats = () => {
    const kat = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA_KATEGORII[kat]) {
        MAPA_KATEGORII[kat].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
    }
};

window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    if (panel.dataset.active === kat && panel.style.display === 'flex') {
        panel.style.display = 'none';
        render(daneOgloszen);
        return;
    }
    render(daneOgloszen.filter(o => o.kategoria === kat));
    panel.innerHTML = MAPA_KATEGORII[kat].map(p => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${p}')">${p}</div>`).join('') + `<div class="sub-pill" style="background:#ddd" onclick="location.reload()">Reset X</div>`;
    panel.style.display = 'flex';
    panel.dataset.active = kat;
};

window.filtrujPoPodkat = (kat, pod) => {
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === pod));
};

window.filtruj = () => {
    const t = document.getElementById('find-text').value.toLowerCase();
    render(daneOgloszen.filter(o => o.tytul.toLowerCase().includes(t) || o.opis.toLowerCase().includes(t)));
};

sprawdzUzytkownika();
pobierz();
