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

// --- AUTH ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user && nav) {
        nav.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
                <div style="position:relative">
                    <button class="btn-account" onclick="toggleUserMenu(event)">Moje Konto ▼</button>
                    <div id="drop-menu" class="dropdown-content" style="display:none; position:absolute; right:0; top:55px; background:white; min-width:200px; z-index:5000; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px; padding: 10px;">
                        <span style="font-size:11px; color:gray; padding:5px; display:block; border-bottom:1px solid #eee">Zalogowany: <b>${user.email}</b></span>
                        <button class="d-btn" onclick="alert('Moje ogłoszenia')">Moje ogłoszenia</button>
                        <button class="d-btn" onclick="wyloguj()" style="color:#ef4444; font-weight:bold; border-top:1px solid #eee; margin-top:5px">Wyloguj się</button>
                    </div>
                </div>
                <img src="SprzedajSe.png" onclick="otworzModal()" style="height: 40px; width: auto; cursor:pointer; object-fit: contain;" alt="Dodaj">
            </div>
        `;
    }
}

window.toggleUserMenu = (e) => {
    e.stopPropagation();
    const menu = document.getElementById('drop-menu');
    if(menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- POBIERANIE (Główna = Top 12) ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    // Na start pokaż tylko 12 najnowszych
    render(daneOgloszen.slice(0, 12));
}

function render(lista) {
    const kontener = document.getElementById('lista');
    if(!kontener) return;
    kontener.innerHTML = lista.map(o => {
        let foto = o.zdjecia ? (Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia) : 'https://via.placeholder.com/300';
        return `
            <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
                <img class="ad-img" src="${foto}">
                <div class="ad-body">
                    <div class="ad-price">${o.cena.toLocaleString()} zł</div>
                    <div class="ad-title">${o.tytul}</div>
                    <div style="font-size: 11px; color: #777; margin-top: 8px;">
                        📍 ${o.lokalizacja} | ${new Date(o.created_at).toLocaleDateString()} ${new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- SZCZEGÓŁY ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(item => item.id === id);
    const { data: { user } } = await baza.auth.getUser();
    const box = document.getElementById('view-content');
    
    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    
    const kontaktHtml = user ? `
        <a href="tel:${o.telefon}" class="btn-account" style="display:block; text-align:center; background:#111; color:white; text-decoration:none; padding:15px; margin-bottom:10px; border-radius:10px;">📞 ZADZWOŃ: ${o.telefon}</a>
        <button onclick="otworzOknoWiadomosci('${o.email_autora}', ${o.id}, '${o.tytul}')" style="width:100%; padding:15px; background:#ff4f00; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:800;">✉ WYŚLIJ WIADOMOŚĆ</button>
    ` : `
        <div style="background:#fff3cd; padding:15px; border-radius:10px; text-align:center; font-size:13px; border:1px solid #ffeeba; color: #856404;">
            Zaloguj się, aby zobaczyć numer i wysłać wiadomość.
        </div>
    `;

    box.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
            <div style="font-size:25px; cursor:pointer; color:#ccc;">❤</div>
            <span onclick="zamknijModal()" style="font-size:30px; cursor:pointer;">&times;</span>
        </div>
        <div class="details-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div>
                <img id="main-img" src="${aktualnaGaleria[0]}" style="width:100%; border-radius:10px; height:300px; object-fit:cover;">
                <div style="display:flex; gap:5px; margin-top:10px; overflow-x:auto">
                    ${aktualnaGaleria.map(img => `<img src="${img}" style="width:50px; height:50px; object-fit:cover; border-radius:5px; cursor:pointer;" onclick="document.getElementById('main-img').src='${img}'">`).join('')}
                </div>
            </div>
            <div>
                <h2 style="margin:0">${o.tytul}</h2>
                <h1 style="color:#ff4f00; margin:10px 0">${o.cena.toLocaleString()} zł</h1>
                <p style="font-size:11px; color:gray;">📍 ${o.lokalizacja} | ${o.kategoria}</p>
                <div style="margin:20px 0; font-size:14px; color:#444; line-height:1.4">${o.opis}</div>
                ${kontaktHtml}
            </div>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- OKNO WIADOMOŚCI ---
window.otworzOknoWiadomosci = (odbiorca, oglId, tytul) => {
    const div = document.createElement('div');
    div.id = "msg-overlay";
    div.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; align-items:center; justify-content:center;";
    div.innerHTML = `
        <div style="background:white; padding:25px; border-radius:15px; width:350px;">
            <h4 style="margin-top:0">Wyślij wiadomość ws.:</h4>
            <p style="font-size:12px; color:gray">${tytul}</p>
            <textarea id="msg-text" placeholder="Twoja wiadomość..." style="width:100%; height:100px; margin:10px 0; padding:10px; border-radius:8px; border:1px solid #ddd; resize:none;"></textarea>
            <div style="display:flex; gap:10px;">
                <button onclick="document.getElementById('msg-overlay').remove()" style="flex:1; padding:10px; border:none; border-radius:8px; cursor:pointer;">Anuluj</button>
                <button onclick="wyslijWiadomoscDoBazy('${odbiorca}', ${oglId})" style="flex:1; padding:10px; background:#ff4f00; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Wyślij</button>
            </div>
        </div>
    `;
    document.body.appendChild(div);
};

window.wyslijWiadomoscDoBazy = async (odb, oId) => {
    const txt = document.getElementById('msg-text').value;
    if(!txt) return alert("Wpisz treść!");
    const { data: { user } } = await baza.auth.getUser();
    const { error } = await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca: odb, tresc: txt, ogloszenie_id: oId }]);
    if(!error) { alert("Wysłano wiadomość!"); document.getElementById('msg-overlay').remove(); }
};

// --- FILTROWANIE ---
window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    // Pokaż WSZYSTKIE ogłoszenia z tej kategorii (zdejmujemy limit 12)
    const przefiltrowane = daneOgloszen.filter(o => o.kategoria === kat);
    render(przefiltrowane);

    panel.innerHTML = MAPA_KATEGORII[kat].map(p => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${p}')">${p}</div>`).join('') + 
                      `<div class="sub-pill" style="background:#eee" onclick="location.reload()">Reset X</div>`;
    panel.style.display = 'flex';
};

window.filtrujPoPodkat = (kat, pod) => {
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === pod));
};

window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';

sprawdzUzytkownika();
pobierz();
