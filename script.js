const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let aktualnaGaleria = []; 
let aktualnyIndex = 0;

const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części", "Opony", "Dostawcze", "Ciężarowe"],
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura", "Wynajem"],
    "Elektronika": ["Telefony", "Laptopy", "Gry i Konsole", "RTV", "Fotografia"],
    "Dom i Ogród": ["Meble", "Ogród", "Narzędzia", "Dekoracje", "Budowa"],
    "Moda": ["Ubrania", "Buty", "Biżuteria", "Akcesoria", "Ślubne"],
    "Rolnictwo": ["Ciągniki", "Maszyny rolnicze", "Produkty rolne", "Przyczepy"],
    "Zwierzęta": ["Psy", "Koty", "Ptaki", "Ryby", "Akcesoria dla zwierząt"],
    "Dla Dzieci": ["Zabawki", "Wózki", "Ubranka", "Fotele", "Dla niemowląt"],
    "Sport i Hobby": ["Rowery", "Siłownia", "Turystyka", "Wędkarstwo", "Kolekcje"],
    "Muzyka i Edukacja": ["Instrumenty", "Książki", "Płyty", "Korepetycje"],
    "Usługi": ["Budowlane", "Uroda", "Transport", "IT", "Naprawa"],
    "Praca": ["Pełny etat", "Dodatkowa", "Staże", "Praca za granicą"],
    "Inne": ["Za darmo", "Zamiana", "Różne"]
};

// --- KOMPRESJA ---
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
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
            };
        };
    });
}

// --- LOGOWANIE I POWIADOMIENIA ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        // Sprawdzamy czy są nieprzeczytane wiadomości
        const { count } = await baza.from('wiadomosci')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_email', user.email)
            .eq('przeczytane', false);

        const nick = user.user_metadata.display_name || user.email;
        const kropka = count > 0 ? `<span style="background:red; width:10px; height:10px; border-radius:50%; display:inline-block; margin-left:5px"></span>` : "";

        document.getElementById('user-nav').innerHTML = `
            <img src="SprzedajSe.png" class="btn-add-ad" onclick="otworzModal()">
            <div class="account-menu">
                <button class="btn-account" onclick="document.getElementById('drop').classList.toggle('show')">
                    Witaj, ${nick} ${kropka}
                </button>
                <div id="drop" class="dropdown-content">
                    <span style="font-size:12px; color:gray; font-weight:bold">${user.email}</span><hr>
                    <button onclick="alert('Twoje wiadomości: wkrótce panel odbierania!')" style="border:none; background:none; cursor:pointer; padding:10px 0; width:100%; text-align:left">Wiadomości (${count})</button>
                    <button onclick="wyloguj()" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:800; padding:10px 0; width:100%; text-align:left">Wyloguj się</button>
                </div>
            </div>
        `;
        const authBox = document.getElementById('auth-box');
        if(authBox) authBox.classList.add('hidden');
    }
}

// Dodanie pola LOGIN do logowania/rejestracji
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const nick = prompt("Podaj swój login/imię (tylko przy nowej rejestracji):");

    const { data, error } = await baza.auth.signInWithPassword({ email, password });
    
    if (error) {
        // Jeśli nie ma konta, rejestrujemy z metadanymi (loginem)
        await baza.auth.signUp({ 
            email, 
            password, 
            options: { data: { display_name: nick || "Użytkownik" } } 
        });
    }
    location.reload();
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- WIADOMOŚCI ---
window.wyslijWiadomosc = async (odbiorcaEmail) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    
    const tresc = prompt("Wpisz treść wiadomości:");
    if (!tresc) return;

    const { error } = await baza.from('wiadomosci').insert([{
        sender_email: user.email,
        receiver_email: odbiorcaEmail,
        tresc: tresc
    }]);

    if (!error) alert("Wiadomość wysłana!");
    else alert("Błąd wysyłki.");
};

// --- OGŁOSZENIA ---
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

// --- MODAL SZCZEGÓŁÓW ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(item => item.id === id);
    const box = document.getElementById('view-content');
    const { data: { user } } = await baza.auth.getUser();

    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualnyIndex = 0;

    const miniaturkiHtml = aktualnaGaleria.map((imgUrl, index) => `
        <img src="${imgUrl}" style="width:60px; height:60px; object-fit:cover; border-radius:10px; cursor:pointer" onclick="document.getElementById('main-img').src='${imgUrl}'; aktualnyIndex = ${index};">
    `).join('');

    let kontaktHtml = "";
    if (user) {
        kontaktHtml = `
            <a href="tel:${o.telefon}" style="display:block; text-align:center; background:var(--primary); color:white; padding:18px; border-radius:15px; text-decoration:none; font-weight:800; font-size:18px; margin-bottom:10px">📞 Zadzwoń: ${o.telefon}</a>
            <button onclick="wyslijWiadomosc('${o.email_autora || 'test@test.pl'}')" style="width:100%; background:#111; color:#fff; padding:15px; border-radius:15px; border:none; font-weight:700; cursor:pointer">Napisz wiadomość</button>
        `;
    } else {
        kontaktHtml = `<div style="background:#fff4f4; border:2px dashed #ef4444; padding:20px; border-radius:15px; text-align:center">
            <p style="color:#b91c1c; font-weight:700">Zaloguj się, aby zobaczyć kontakt</p>
        </div>`;
    }

    box.innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; margin-top:10px">
            <div>
                <img id="main-img" src="${aktualnaGaleria[0]}" style="width:100%; border-radius:20px; cursor:zoom-in" onclick="openLightbox()">
                <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap">${miniaturkiHtml}</div>
            </div>
            <div>
                <h1>${o.tytul}</h1>
                <h2 style="color:var(--primary)">${o.cena.toLocaleString()} zł</h2>
                <div style="background:#f1f5f9; padding:20px; border-radius:15px; margin:20px 0">${o.opis}</div>
                ${kontaktHtml}
            </div>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- DODAWANIE ---
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    const btn = document.getElementById('btn-save');
    const pliki = document.getElementById('f-plik').files;
    btn.innerText = "Wysyłanie...";
    btn.disabled = true;

    try {
        const urlList = [];
        for (let i = 0; i < pliki.length; i++) {
            const skompresowany = await kompresujZdjecie(pliki[i]);
            const path = `${Date.now()}_${i}.jpg`;
            await baza.storage.from('zdjecia').upload(path, skompresowany);
            const { data: u } = baza.storage.from('zdjedcia').getPublicUrl(path);
            urlList.push(u.publicUrl);
        }
        await baza.from('ogloszenia').insert([{
            tytul: document.getElementById('f-tytul').value,
            kategoria: document.getElementById('f-kat').value,
            podkategoria: document.getElementById('f-podkat').value,
            cena: parseInt(document.getElementById('f-cena').value),
            opis: document.getElementById('f-opis').value,
            lokalizacja: document.getElementById('f-lok').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: urlList,
            email_autora: user.email // Ważne dla systemu wiadomości!
        }]);
        location.reload();
    } catch (err) { alert(err.message); btn.disabled = false; }
};

// --- RESZTA FUNKCJI (Lightbox, Modal itp. - bez zmian) ---
window.openLightbox = () => { document.getElementById('lightbox-img').src = aktualnaGaleria[aktualnyIndex]; document.getElementById('lightbox').style.display = 'flex'; };
window.changeLightbox = (dir) => { aktualnyIndex = (aktualnyIndex + dir + aktualnaGaleria.length) % aktualnaGaleria.length; document.getElementById('lightbox-img').src = aktualnaGaleria[aktualnyIndex]; };
window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => { document.getElementById('modal-form').style.display = 'none'; document.getElementById('modal-view').style.display = 'none'; };
window.updateFormSubcats = () => {
    const kat = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA_KATEGORII[kat]) MAPA_KATEGORII[kat].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
};
window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    if (panel.dataset.active === kat && panel.style.display === 'flex') { panel.style.display = 'none'; render(daneOgloszen); return; }
    render(daneOgloszen.filter(o => o.kategoria === kat));
    panel.innerHTML = MAPA_KATEGORII[kat].map(p => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${p}')">${p}</div>`).join('') + `<div class="sub-pill" style="background:#ddd" onclick="location.reload()">Reset X</div>`;
    panel.style.display = 'flex'; panel.dataset.active = kat;
};
window.filtrujPoPodkat = (kat, pod) => render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === pod));
window.filtruj = () => {
    const t = document.getElementById('find-text').value.toLowerCase();
    render(daneOgloszen.filter(o => o.tytul.toLowerCase().includes(t) || o.opis.toLowerCase().includes(t)));
};

sprawdzUzytkownika();
pobierz();
