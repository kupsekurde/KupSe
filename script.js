const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let aktualnaGaleria = [];

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

// --- LOGOWANIE I REJESTRACJA ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    if (!email || !password) return alert("Wpisz email i hasło!");
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) {
        const { error: sErr } = await baza.auth.signUp({ email, password });
        if (sErr) alert(sErr.message); else alert("Zarejestrowano! Zaloguj się.");
    } else location.reload();
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- OBSŁUGA MENU "MOJE KONTO" ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user && nav) {
        nav.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-left: auto;">
                <div style="position:relative">
                    <button class="btn-account" onclick="toggleUserMenu(event)">Moje Konto ▼</button>
                    <div id="drop-menu" style="display:none; position:absolute; right:0; top:50px; background:white; min-width:200px; z-index:9999; border-radius:10px; box-shadow:0 8px 30px rgba(0,0,0,0.15); padding:10px; border:1px solid #eee;">
                        <div style="font-size:10px; color:gray; padding:5px; border-bottom:1px solid #f0f0f0; margin-bottom:5px;">${user.email}</div>
                        <button class="d-btn" onclick="alert('Moje ogłoszenia')">📝 Moje ogłoszenia</button>
                        <button class="d-btn" onclick="alert('Wiadomości')">✉️ Wiadomości</button>
                        <button class="d-btn" onclick="alert('Ulubione')">❤️ Ulubione</button>
                        <button class="d-btn" onclick="wyloguj()" style="color:red; border-top:1px solid #f0f0f0; margin-top:5px;">🚪 Wyloguj</button>
                    </div>
                </div>
                <img src="SprzedajSe.png" onclick="otworzModal()" style="height: 40px; width: auto; cursor:pointer;" alt="Sprzedaj">
            </div>
        `;
        if(document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'none';
    }
}

window.toggleUserMenu = (e) => {
    e.stopPropagation();
    const m = document.getElementById('drop-menu');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
};

// --- POBIERANIE I RENDERING (4 W RZĘDZIE) ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen.slice(0, 12)); // Startowo 12 najnowszych
}

function render(lista) {
    const kontener = document.getElementById('lista');
    if(!kontener) return;
    
    // WYMUSZAMY GRID W KODZIE
    kontener.style.display = "grid";
    kontener.style.gridTemplateColumns = "repeat(auto-fill, minmax(240px, 1fr))";
    kontener.style.gap = "20px";

    kontener.innerHTML = lista.map(o => {
        let foto = o.zdjecia ? (Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia) : 'https://via.placeholder.com/300';
        return `
            <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="background:white; border-radius:10px; border:1px solid #eee; overflow:hidden; cursor:pointer;">
                <div style="width:100%; height:180px; overflow:hidden">
                    <img src="${foto}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="padding:12px;">
                    <div style="font-weight:bold; color:#ff4f00; font-size:16px;">${o.cena.toLocaleString()} zł</div>
                    <div style="font-size:14px; margin:5px 0; color:#333; height:38px; overflow:hidden;">${o.tytul}</div>
                    <div style="font-size:10px; color:#999; margin-top:8px;">
                        📍 ${o.lokalizacja} | ${new Date(o.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- PODKATEGORIE (OBSŁUGA SELECTA) ---
window.updateFormSubcats = () => {
    const kat = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    if(!p) return;
    p.innerHTML = '<option value="">Wybierz podkategorię</option>';
    if(MAPA_KATEGORII[kat]) {
        MAPA_KATEGORII[kat].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
    }
};

// --- SZCZEGÓŁY I KONTAKT ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(item => item.id === id);
    const { data: { user } } = await baza.auth.getUser();
    const box = document.getElementById('view-content');
    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];

    const kontaktHtml = user ? `
        <button onclick="otworzWiadomosc('${o.email_autora}', '${o.tytul}', ${o.id})" style="width:100%; padding:15px; background:#ff4f00; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">WYŚLIJ WIADOMOŚĆ</button>
        <p style="text-align:center; margin-top:10px; font-weight:bold;">📞 ${o.telefon}</p>
    ` : `<div style="background:#eee; padding:10px; border-radius:8px; text-align:center; font-size:12px;">Zaloguj się, aby zobaczyć kontakt</div>`;

    box.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <img src="${aktualnaGaleria[0]}" style="width:100%; border-radius:10px; max-height:300px; object-fit:contain; background:#f9f9f9;">
            <div>
                <h2 style="margin:0">${o.tytul}</h2>
                <h1 style="color:#ff4f00; margin:10px 0">${o.cena.toLocaleString()} zł</h1>
                <p style="font-size:11px; color:gray;">Kategoria: ${o.kategoria} / ${o.podkategoria}</p>
                <div style="margin:15px 0; font-size:14px; color:#444; line-height:1.4">${o.opis}</div>
                ${kontaktHtml}
            </div>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

window.otworzWiadomosc = (odb, tytul, oId) => {
    const msg = prompt("Napisz do sprzedającego ws. " + tytul);
    if(msg) {
        baza.auth.getUser().then(({data}) => {
            baza.from('wiadomosci').insert([{ 
                nadawca: data.user.email, 
                odbiorca: odb, 
                tresc: msg, 
                ogloszenie_id: oId 
            }]).then(() => alert("Wysłano wiadomość!"));
        });
    }
};

// --- FILTRY KATEGORII (Zdejmują limit 12) ---
window.toggleSubcats = (kat) => {
    const filtr = daneOgloszen.filter(o => o.kategoria === kat);
    render(filtr); // Pokazuje wszystko z tej kategorii
    const panel = document.getElementById('subcat-panel');
    panel.innerHTML = MAPA_KATEGORII[kat].map(p => `<div class="sub-pill" onclick="filtrujPod('${kat}', '${p}')">${p}</div>`).join('') + 
                      `<div class="sub-pill" style="background:#ddd" onclick="location.reload()">Reset X</div>`;
    panel.style.display = 'flex';
};

window.filtrujPod = (kat, pod) => {
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === pod));
};

window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';

// Zamykanie wszystkiego
window.onclick = (e) => {
    if (!e.target.closest('.btn-account')) {
        const m = document.getElementById('drop-menu');
        if(m) m.style.display = 'none';
    }
    if (e.target.className === 'modal') zamknijModal();
};

sprawdzUzytkownika();
pobierz();
