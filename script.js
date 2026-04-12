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
                const MAX_WIDTH = 1200;
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
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.7);
            };
        };
    });
}

// --- LOGOWANIE I AUTH (Zaktualizowane o nowe menu) ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user) {
        nav.style.marginLeft = "auto";
        nav.style.display = "flex";
        nav.style.alignItems = "center";
        nav.innerHTML = `
            <div style="position:relative">
                <button class="btn-account" onclick="toggleUserMenu(event)" style="background:#eee; margin-right:10px">Moje Konto ▼</button>
                <div id="drop-menu" style="display:none; position:absolute; right:10px; top:45px; background:white; min-width:220px; box-shadow:0 4px 12px rgba(0,0,0,0.15); border-radius:10px; flex-direction:column; z-index:5000; padding:10px">
                    <div style="font-size:12px; padding:8px; border-bottom:1px solid #eee">
                        <b>Login:</b> ${user.user_metadata.display_name || 'Użytkownik'}<br>
                        <b>Email:</b> ${user.email}
                    </div>
                    <button class="d-btn" onclick="alert('Moje ogłoszenia')">Moje ogłoszenia</button>
                    <button class="d-btn" onclick="alert('Ulubione')">Ulubione</button>
                    <button class="d-btn" onclick="alert('Wiadomości')">Wiadomości</button>
                    <button class="d-btn" onclick="wyloguj()" style="color:red; border-top:1px solid #eee">Wyloguj się</button>
                </div>
            </div>
            <img src="SprzedajSe.png" class="btn-add-ad" onclick="otworzModal()" style="cursor:pointer">
        `;
        const authBox = document.getElementById('auth-box');
        if(authBox) authBox.classList.add('hidden');
    }
}

// NOWA FUNKCJA DROPDOWN
window.toggleUserMenu = (e) => {
    e.stopPropagation();
    const menu = document.getElementById('drop-menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
};

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

// --- OBSŁUGA OGŁOSZEŃ (Zintegrowany grid) ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen, 'lista');
}

function render(lista, kontenerId = 'lista') {
    const kontener = document.getElementById(kontenerId);
    if(!lista.length) { kontener.innerHTML = "<p>Brak ogłoszeń.</p>"; return; }
    
    // Wymuszenie grida z Kodu 2
    kontener.style.display = "grid";
    kontener.style.gridTemplateColumns = "repeat(4, 1fr)";
    kontener.style.gap = "20px";

    kontener.innerHTML = lista.map(o => {
        let foto = o.zdjecia ? (Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia.replace(/[\[\]"']/g, "").split(',')[0].trim()) : 'https://via.placeholder.com/300';
        return `
            <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
                <img class="ad-img" src="${foto}" alt="foto" style="width:100%; height:180px; object-fit:cover">
                <div class="ad-body">
                    <div class="ad-price" style="color:var(--primary)">${o.cena.toLocaleString()} zł</div>
                    <div class="ad-title">${o.tytul}</div>
                    <div class="ad-date">
                        <span>📍 ${o.lokalizacja}</span>
                        <span>${formatujDate(o.created_at)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- MODAL SZCZEGÓŁÓW (Zintegrowane serce i wiadomości) ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(item => item.id === id);
    const { data: { user } } = await baza.auth.getUser();
    const box = document.getElementById('view-content');
    
    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualnyIndex = 0;

    let serce = "gray";
    if(user) {
        const { data: favs } = await baza.from('ulubione').select('*').eq('user_id', user.id).eq('ogloszenie_id', id);
        if(favs?.length > 0) serce = "red";
    }

    const miniaturkiHtml = aktualnaGaleria.map((imgUrl, index) => `
        <img src="${imgUrl}"
             style="width:60px; height:60px; object-fit:cover; border-radius:10px; cursor:pointer; border:2px solid #eee"
             onclick="document.getElementById('main-img').src='${imgUrl}'; aktualnyIndex = ${index}; event.stopPropagation();">
    `).join('');

    box.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center">
            <div onclick="toggleUlubione(${o.id})" style="font-size:25px; cursor:pointer; color:${serce}">❤</div>
            <span class="close-btn" onclick="zamknijModal()" style="font-size:30px; cursor:pointer; background:#f0f0f0; padding:0 10px; border-radius:6px; color:#888">&times;</span>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; margin-top:10px">
            <div>
                <img id="main-img" src="${aktualnaGaleria[0]}"
                     style="width:100%; border-radius:20px; cursor:zoom-in; box-shadow:0 10px 20px rgba(0,0,0,0.1); max-height:400px; object-fit:contain"
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
                
                <div style="margin-top:15px">
                    <textarea id="m-txt" placeholder="Napisz wiadomość do sprzedawcy..." style="width:100%; height:60px; border-radius:8px; border:1px solid #ddd; padding:8px; resize:none"></textarea>
                    <button onclick="wyslijWiadomosc('${o.email_autora}', ${o.id})" style="width:100%; margin-top:5px; padding:10px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold">Wyślij wiadomość</button>
                </div>
            </div>
        </div>
    `;
    const modalView = document.getElementById('modal-view');
    modalView.style.display = 'flex';
    modalView.style.zIndex = "3000";
};

// NOWA FUNKCJA WIADOMOŚCI
window.wyslijWiadomosc = async (odb, oId) => {
    const { data: { user } } = await baza.auth.getUser();
    if(!user) return alert("Zaloguj się, aby wysłać wiadomość!");
    const t = document.getElementById('m-txt').value;
    if(!t) return alert("Wpisz treść wiadomości!");
    const { error } = await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca: odb, tresc: t, ogloszenie_id: oId }]);
    if(!error) { alert("Wysłano!"); document.getElementById('m-txt').value = ""; }
};

// NOWA FUNKCJA ULUBIONE
window.toggleUlubione = async (id) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const { data: favs } = await baza.from('ulubione').select('*').eq('user_id', user.id).eq('ogloszenie_id', id);
    if (favs.length > 0) {
        await baza.from('ulubione').delete().eq('user_id', user.id).eq('ogloszenie_id', id);
    } else {
        await baza.from('ulubione').insert([{ user_id: user.id, ogloszenie_id: id }]);
    }
    pokazSzczegoly(id);
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
    if (pliki.length > 5) { alert("Max 5 zdjęć."); return; }
    btn.innerText = "Kompresja i wysyłka...";
    btn.disabled = true;

    try {
        const urlList = [];
        for (let i = 0; i < pliki.length; i++) {
            const skompresowanyPlik = await kompresujZdjecie(pliki[i]);
            const path = `${Date.now()}_${i}_img.jpg`;
            const { error: uploadError } = await baza.storage.from('zdjecia').upload(path, skompresowanyPlik);
            if (uploadError) throw uploadError;
            const { data: u } = baza.storage.from('zdjecia').getPublicUrl(path);
            urlList.push(u.publicUrl);
        }

        const { data: { user } } = await baza.auth.getUser();

        const { error: insertError } = await baza.from('ogloszenia').insert([{
            tytul: document.getElementById('f-tytul').value,
            kategoria: document.getElementById('f-kat').value,
            podkategoria: document.getElementById('f-podkat').value,
            cena: parseInt(document.getElementById('f-cena').value),
            opis: document.getElementById('f-opis').value,
            lokalizacja: document.getElementById('f-lok').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: urlList,
            email_autora: user.email
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
    const msgModal = document.getElementById('modal-messages');
    if(msgModal) msgModal.style.display = 'none';
};

// NOWA FUNKCJA ZAMYKANIA PRZEZ TŁO
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) zamknijModal();
    const dropMenu = document.getElementById('drop-menu');
    if (dropMenu && !e.target.matches('.btn-account')) {
        dropMenu.style.display = 'none';
    }
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

// NOWA FUNKCJA DATY
function formatujDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL') + ' ' + d.toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'});
}

sprawdzUzytkownika();
pobierz();
