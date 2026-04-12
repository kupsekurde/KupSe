const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];
let edytowaneZdjecia = [];

const SUB_DATA = {
    'Motoryzacja': ['Samochody osobowe', 'Dostawcze', 'Motocykle', 'Skutery', 'Części samochodowe', 'Pozostałe'],
    'Dom': ['Meble', 'Oświetlenie', 'Dekoracje', 'AGD', 'RTV', 'Pozostałe'],
    'Elektronika': ['Telefony', 'Laptopy i komputery', 'Konsole i gry', 'Telewizory', 'Audio', 'Pozostałe'],
    'Ogród': ['Narzędzia', 'Rośliny', 'Meble ogrodowe', 'Grille', 'Nawadnianie', 'Pozostałe'],
    'Moda': ['Ubrania damskie', 'Ubrania męskie', 'Buty', 'Dodatki', 'Biżuteria', 'Pozostałe'],
    'Rolnictwo': ['Ciągniki', 'Maszyny rolnicze', 'Zwierzęta hodowlane', 'Pasze i ziarno', 'Opony rolnicze', 'Pozostałe'],
    'Zwierzęta': ['Psy', 'Koty', 'Ptaki', 'Akwarystyka', 'Akcesoria', 'Pozostałe'],
    'Dzieci': ['Zabawki', 'Wózki i foteliki', 'Ubranka', 'Akcesoria dla niemowląt', 'Meble dziecięce', 'Pozostałe'],
    'Sport': ['Rowery', 'Siłownia i fitness', 'Turystyka', 'Sporty wodne', 'Sporty zimowe', 'Pozostałe'],
    'Nauka': ['Książki i podręczniki', 'Instrumenty muzyczne', 'Korepetycje', 'Artykuły biurowe', 'Kursy i szkolenia', 'Pozostałe'],
    'Usługi': ['Budowlane', 'Transport i przeprowadzki', 'Naprawa elektroniki', 'Uroda i zdrowie', 'Finanse i prawo', 'Pozostałe'],
    'Praca': ['Budowa / Remonty', 'Kierowca / Logistyka', 'Gastronomia', 'Praca biurowa', 'Sprzedaż / Handel', 'Pozostałe'],
    'Inne': ['Kolekcje', 'Antyki', 'Bilety', 'Oddam za darmo', 'Zamienię', 'Pozostałe']
};

// --- POMOCNICZE ---
function formatujDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- LOGOWANIE I REJESTRACJA ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert("Błąd logowania: " + error.message); else location.reload();
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    if (password.length < 6) return alert("Hasło min. 6 znaków!");
    const { error } = await baza.auth.signUp({ email, password });
    if (error) alert("Błąd rejestracji: " + error.message); 
    else alert("Zarejestrowano! Sprawdź e-mail lub zaloguj się.");
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- INTERFEJS UŻYTKOWNIKA ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    
    if (user && nav) {
        if (document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'none';
        
        const { count: msgCount } = await baza
            .from('wiadomosci')
            .select('*', { count: 'exact', head: true })
            .eq('odbiorca', user.email)
            .eq('przeczytane', false);

        const { data: uData } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = uData ? uData.map(x => x.ogloszenie_id) : [];

        nav.innerHTML = `
            <div id="menu-container" style="position:relative; display:flex; gap:10px; align-items:center;">
                <button id="menu-btn" onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800; position:relative;">
                    Moje Konto ▼
                    ${msgCount > 0 ? `<span id="msg-badge" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; width:20px; height:20px; font-size:11px; display:flex; align-items:center; justify-content:center; border:2px solid white;">${msgCount}</span>` : ''}
                </button>
                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:220px;">
                    <div style="padding-bottom:10px; border-bottom:1px solid #eee; margin-bottom:10px;">
                        <small style="color:gray;">Zalogowany jako:</small><br>
                        <b style="font-size:13px; word-break:break-all;">${user.email}</b>
                    </div>
                    <div onclick="pokazMojeOgloszenia()" style="padding:10px; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div onclick="pokazSkrzynke()" style="padding:10px; cursor:pointer;">✉️ Wiadomości ${msgCount > 0 ? `<b>(${msgCount})</b>` : ''}</div>
                    <div onclick="pokazUlubione()" style="padding:10px; cursor:pointer;">❤️ Ulubione (${mojeUlubione.length})</div>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <div onclick="wyloguj()" style="padding:10px; cursor:pointer; color:red; font-weight:bold;">🚪 Wyloguj</div>
                </div>
                <button onclick="document.getElementById('modal-form').style.display='flex'" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj ogłoszenie</button>
            </div>`;
    }
}

window.toggleUserMenu = (e) => { 
    e.stopPropagation(); 
    const m = document.getElementById('drop-menu'); 
    if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; 
};

window.addEventListener('click', (e) => {
    const menu = document.getElementById('drop-menu');
    if (menu && menu.style.display === 'block' && !menu.contains(e.target)) menu.style.display = 'none';
});

// --- SZUKANIE ---
window.szukaj = () => {
    const fraza = document.getElementById('find-text').value.toLowerCase().trim();
    const lok = document.getElementById('find-loc').value.toLowerCase().trim();

    const wyniki = daneOgloszen.filter(o => {
        const tytulOk = o.tytul.toLowerCase().includes(fraza) || o.opis.toLowerCase().includes(fraza);
        const lokOk = o.lokalizacja.toLowerCase().includes(lok);
        return tytulOk && lokOk;
    });

    pokazWynikiModal(`Wyniki wyszukiwania (${wyniki.length})`, wyniki);
};

// --- WIADOMOŚCI ---
window.pokazSkrzynke = async () => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return;
    await baza.from('wiadomosci').update({ przeczytane: true }).eq('odbiorca', user.email);
    const { data: msg } = await baza.from('wiadomosci').select('*').eq('odbiorca', user.email).order('created_at', { ascending: false });
    const content = document.getElementById('view-content');
    let htmlMsg = msg && msg.length > 0 ? msg.map(m => `
        <div style="background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid var(--primary);">
            <div style="font-size:11px; color:gray;">Od: ${m.nadawca}</div>
            <div style="font-size:14px; margin-top:5px;">${m.tresc}</div>
            <button onclick="wyslijWiadomosc('${m.nadawca}', 'Re: wiadomość')" style="background:none; border:none; color:var(--primary); cursor:pointer; font-weight:bold; padding:0; margin-top:5px;">Odpowiedz</button>
        </div>`).join('') : '<p>Brak wiadomości.</p>';
    content.innerHTML = `<button class="close-btn" onclick="zamknijModal()">&times;</button><h2>Wiadomości</h2><div style="max-height:60vh; overflow-y:auto;">${htmlMsg}</div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.wyslijWiadomosc = async (odbiorca, tytul) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const tresc = prompt(`Wiadomość do: ${odbiorca}`);
    if (tresc) {
        await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca, tresc, przeczytane: false }]);
        alert("Wysłano!");
    }
};

// --- GALERIA I SZCZEGÓŁY ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    
    document.getElementById('view-content').innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; flex-wrap:wrap; gap:20px;">
            <div style="flex:1.5; min-width:300px;">
                <div style="background:#000; border-radius:15px; height:350px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="max-width:100%; max-height:100%; cursor:zoom-in;" onclick="otworzFullFoto()">
                </div>
                <div id="miniaturki-container" style="display:flex; gap:8px; margin-top:10px; overflow-x:auto; padding-bottom:5px;">
                    ${aktualneFotki.map((img, i) => `
                        <img src="${img}" onclick="zmienGlowneZdjecie(${i})" 
                             style="width:65px; height:65px; object-fit:cover; border-radius:8px; cursor:pointer; border:${i===0 ? '2px solid var(--primary)' : '2px solid transparent'}; transition:0.2s;" 
                             class="mini-foto">
                    `).join('')}
                </div>
            </div>
            <div style="flex:1;">
                <div style="font-size:12px; color:gray; margin-bottom:5px;">Dodano: ${formatujDate(o.created_at)}</div>
                <h2>${o.tytul}</h2>
                <h1 style="color:var(--primary);">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja} | 📞 ${o.telefon || 'Brak'}</p>
                <div style="display:flex; gap:10px; margin-top:10px;">
                     <button onclick="wyslijWiadomosc('${o.user_email}', '${o.tytul}')" style="flex:1; padding:12px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Wyślij wiadomość</button>
                     <button onclick="toggleUlubione(event, ${o.id})" id="fav-btn-${o.id}" style="padding:12px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer;">
                        ${mojeUlubione.includes(o.id) ? '❤️' : '🤍'}
                     </button>
                </div>
                <h3 style="margin-top:20px;">Opis</h3>
                <p style="white-space:pre-line; color:#444; line-height:1.5;">${o.opis}</p>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zmienGlowneZdjecie = (idx) => {
    aktualneZdjecieIndex = idx;
    const img = document.getElementById('mainFoto');
    if(img) img.src = aktualneFotki[idx];
    document.querySelectorAll('.mini-foto').forEach((el, i) => {
        el.style.borderColor = (i === idx) ? 'var(--primary)' : 'transparent';
    });
};

window.otworzFullFoto = () => {
    let lb = document.getElementById('lightbox-box');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'lightbox-box';
        lb.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9000; display:none; align-items:center; justify-content:center; user-select:none;";
        document.body.appendChild(lb);
    }
    lb.innerHTML = `
        <button onclick="document.getElementById('lightbox-box').style.display='none'" style="position:absolute; top:25px; right:25px; background:white; border:none; width:45px; height:45px; border-radius:50%; font-size:28px; cursor:pointer; z-index:9001; display:flex; align-items:center; justify-content:center;">&times;</button>
        <button onclick="navFullFoto(-1)" style="position:absolute; left:20px; background:rgba(255,255,255,0.15); color:white; border:none; padding:20px 15px; cursor:pointer; font-size:40px; border-radius:10px;">❮</button>
        <img id="lb-img" src="${aktualneFotki[aktualneZdjecieIndex]}" style="max-width:90%; max-height:90%; object-fit:contain;">
        <button onclick="navFullFoto(1)" style="position:absolute; right:20px; background:rgba(255,255,255,0.15); color:white; border:none; padding:20px 15px; cursor:pointer; font-size:40px; border-radius:10px;">❯</button>
    `;
    lb.style.display = 'flex';
};

window.navFullFoto = (dir) => {
    aktualneZdjecieIndex = (aktualneZdjecieIndex + dir + aktualneFotki.length) % aktualneFotki.length;
    const img = document.getElementById('lb-img');
    if(img) img.src = aktualneFotki[aktualneZdjecieIndex];
};

// --- MOJE OGŁOSZENIA ---
window.pokazMojeOgloszenia = async (tab = 'aktywne') => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return;
    const teraz = new Date();
    const limit = 1000 * 60 * 60 * 24 * 28;
    const moje = daneOgloszen.filter(o => o.user_email === user.email);
    const aktywne = moje.filter(o => (teraz - new Date(o.created_at)) < limit);
    const zakonczone = moje.filter(o => (teraz - new Date(o.created_at)) >= limit);
    const wyswietlane = tab === 'aktywne' ? aktywne : zakonczone;

    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h2>Moje ogłoszenia</h2>
        <div style="display:flex; gap:15px; border-bottom:1px solid #eee; margin-bottom:15px;">
            <div onclick="pokazMojeOgloszenia('aktywne')" style="padding:10px; cursor:pointer; font-weight:bold; border-bottom:3px solid ${tab === 'aktywne' ? 'var(--primary)' : 'transparent'}">Aktywne (${aktywne.length})</div>
            <div onclick="pokazMojeOgloszenia('zakonczone')" style="padding:10px; cursor:pointer; font-weight:bold; border-bottom:3px solid ${tab === 'zakonczone' ? 'var(--primary)' : 'transparent'}">Zakończone (${zakonczone.length})</div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:12px;">
            ${wyswietlane.map(o => `
                <div style="border:1px solid #ddd; border-radius:10px; overflow:hidden;">
                    <img src="${o.zdjecia[0]}" style="width:100%; height:100px; object-fit:cover;">
                    <div style="padding:8px;">
                        <b style="font-size:13px;">${o.cena} zł</b>
                        <div style="display:flex; gap:5px; margin-top:8px;">
                            <button onclick="edytujOgloszenie(${o.id})" style="flex:1; padding:5px; font-size:11px;">Edytuj</button>
                            <button onclick="usunOgloszenie(${o.id})" style="padding:5px; color:red;">🗑️</button>
                        </div>
                    </div>
                </div>`).join('')}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.usunOgloszenie = async (id) => {
    if (confirm("Usunąć ogłoszenie na stałe?")) { await baza.from('ogloszenia').delete().eq('id', id); location.reload(); }
};

// --- DODAWANIE ---
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true; btn.innerText = "Wysyłanie...";
    const { data: { user } } = await baza.auth.getUser();
    
    const pliki = document.getElementById('f-plik').files;
    let linki = [];
    for (let f of pliki) {
        const n = `${Date.now()}_${f.name}`;
        const { data } = await baza.storage.from('zdjecia').upload(n, f);
        if (data) linki.push(baza.storage.from('zdjecia').getPublicUrl(n).data.publicUrl);
    }

    await baza.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        cena: parseFloat(document.getElementById('f-cena').value),
        lokalizacja: document.getElementById('f-lok').value,
        opis: document.getElementById('f-opis').value,
        telefon: document.getElementById('f-tel').value,
        zdjecia: linki.length ? linki : ['https://via.placeholder.com/600'],
        user_email: user.email 
    }]);
    location.reload();
};

// --- LOGIKA KATEGORII ---
window.toggleSubcats = (kat) => {
    const p = document.getElementById('subcat-panel');
    if (!p) return;
    
    if (p.dataset.activeKat === kat && p.style.display === 'flex') {
        p.style.display = 'none';
        p.dataset.activeKat = '';
        return;
    }

    p.style.display = 'flex';
    p.dataset.activeKat = kat;
    p.innerHTML = (SUB_DATA[kat] || []).map(s => 
        `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`
    ).join('');
};

window.filtrujPoPodkat = (kat, podkat) => {
    const wyniki = daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat);
    pokazWynikiModal(`${kat} > ${podkat}`, wyniki);
};

function pokazWynikiModal(tytul, wyniki) {
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h2>${tytul}</h2>
        <div id="modal-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px; margin-top:20px; max-height:70vh; overflow-y:auto;">
            ${wyniki.length ? wyniki.map(o => renderCardHTML(o)).join('') : '<p>Brak ogłoszeń.</p>'}
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
}

function renderCardHTML(o) {
    const isFav = mojeUlubione.includes(o.id);
    return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer; position:relative;">
            <div onclick="toggleUlubione(event, ${o.id})" style="position:absolute; top:10px; right:10px; z-index:10; background:rgba(255,255,255,0.8); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                ${isFav ? '❤️' : '🤍'}
            </div>
            <img src="${o.zdjecia[0]}" style="width:100%; height:150px; object-fit:cover;">
            <div style="padding:12px;">
                <b style="font-size:16px; color:var(--primary);">${o.cena} zł</b>
                <div style="font-size:13px; margin-top:4px; height:34px; overflow:hidden; color:#333; font-weight:600;">${o.tytul}</div>
                <div style="font-size:11px; color:gray; margin-top:8px; display:flex; justify-content:space-between;">
                    <span>📍 ${o.lokalizacja}</span>
                    <span style="font-size:10px; opacity:0.7;">${formatujDate(o.created_at).split(',')[0]}</span>
                </div>
            </div>
        </div>`;
}

// --- RENDER GŁÓWNY (12 NAJNOWSZYCH) ---
function renderTop12(lista) {
    const k = document.getElementById('lista');
    if (!k) return;
    const teraz = new Date();
    const limit = 1000 * 60 * 60 * 24 * 28;
    const aktywne = lista.filter(o => (teraz - new Date(o.created_at)) < limit);
    const top12 = aktywne.slice(0, 12);
    
    k.style.display = 'grid';
    k.style.gridTemplateColumns = 'repeat(4, 1fr)'; 
    k.style.gap = '20px';
    k.innerHTML = top12.map(o => renderCardHTML(o)).join('');
}

// --- ULUBIONE ---
window.toggleUlubione = async (e, id) => {
    e.stopPropagation();
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const index = mojeUlubione.indexOf(id);
    if (index > -1) {
        await baza.from('ulubione').delete().eq('user_email', user.email).eq('ogloszenie_id', id);
        mojeUlubione.splice(index, 1);
    } else {
        await baza.from('ulubione').insert([{ user_email: user.email, ogloszenie_id: id }]);
        mojeUlubione.push(id);
    }
    const favBtn = document.getElementById(`fav-btn-${id}`);
    if(favBtn) favBtn.innerText = mojeUlubione.includes(id) ? '❤️' : '🤍';
    renderTop12(daneOgloszen);
};

window.pokazUlubione = () => {
    const ulubioneLista = daneOgloszen.filter(o => mojeUlubione.includes(o.id));
    pokazWynikiModal("Twoje Ulubione", ulubioneLista);
};

window.updateFormSubcats = (prefix) => {
    const k = document.getElementById(`${prefix}kat`).value;
    const s = document.getElementById(`${prefix}podkat`);
    if(s) s.innerHTML = '<option value="">Podkategoria</option>' + (SUB_DATA[k] || []).map(x => `<option value="${x}">${x}</option>`).join('');
};

window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

async function init() {
    await sprawdzUzytkownika();
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    renderTop12(daneOgloszen);
}

init();

// --- EDYCJA OGŁOSZENIA ---
window.edytujOgloszenie = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    edytowaneZdjecia = Array.isArray(o.zdjecia) ? [...o.zdjecia] : [o.zdjecia];
    renderujFormularzEdycji(o);
};

function renderujFormularzEdycji(o) {
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="pokazMojeOgloszenia()">&times;</button>
        <h3 style="margin-bottom:15px;">Edytuj ogłoszenie</h3>
        <form onsubmit="zapiszEdycje(event, ${o.id})" style="display:flex; flex-direction:column; gap:12px;">
            <input type="text" id="e-tytul" value="${o.tytul}" required placeholder="Tytuł" style="padding:10px; border:1px solid #ccc; border-radius:8px;">
            <div style="display:flex; gap:10px;">
                <select id="e-kat" onchange="updateFormSubcats('e-')" required style="flex:1; padding:10px; border-radius:8px;">
                    ${Object.keys(SUB_DATA).map(k => `<option value="${k}" ${o.kategoria === k ? 'selected' : ''}>${k}</option>`).join('')}
                </select>
                <select id="e-podkat" required style="flex:1; padding:10px; border-radius:8px;">
                    ${(SUB_DATA[o.kategoria] || []).map(x => `<option value="${x}" ${o.podkategoria === x ? 'selected' : ''}>${x}</option>`).join('')}
                </select>
            </div>
            
            <label style="font-size:12px; font-weight:bold;">Zarządzaj zdjęciami (max 5):</label>
            <div id="edit-preview" style="display:flex; gap:8px; flex-wrap:wrap; background:#f0f0f0; padding:10px; border-radius:10px; min-height:50px;">
                ${edytowaneZdjecia.map((src, i) => `
                    <div style="position:relative; width:60px; height:60px;">
                        <img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:5px;">
                        <div onclick="usunFotoZEdycji(${i}, ${o.id})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:10px; font-weight:bold;">&times;</div>
                    </div>
                `).join('')}
            </div>
            <input type="file" id="e-pliki" multiple accept="image/*" style="font-size:12px;">
            <p style="font-size:10px; color:gray; margin-top:-10px;">Pozostało miejsca: ${5 - edytowaneZdjecia.length} zdjęć</p>

            <div style="display:flex; gap:10px;">
                <input type="number" id="e-cena" value="${o.cena}" required placeholder="Cena" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="text" id="e-lok" value="${o.lokalizacja}" required placeholder="Lokalizacja" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
            </div>
            <input type="text" id="e-tel" value="${o.telefon || ''}" placeholder="Telefon" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <textarea id="e-opis" rows="5" required placeholder="Opis" style="padding:10px; border-radius:8px; border:1px solid #ccc; font-family:inherit;">${o.opis}</textarea>
            <button type="submit" id="btn-e-save" style="background:var(--primary); color:white; padding:12px; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Zapisz zmiany</button>
        </form>`;
}

window.usunFotoZEdycji = (idx, id) => {
    edytowaneZdjecia.splice(idx, 1);
    renderujFormularzEdycji(daneOgloszen.find(x => x.id === id));
};

window.zapiszEdycje = async (e, id) => {
    e.preventDefault();
    const nowePliki = document.getElementById('e-pliki').files;
    
    if ((edytowaneZdjecia.length + nowePliki.length) > 5) {
        return alert("Łącznie możesz mieć maksymalnie 5 zdjęć.");
    }

    const btn = document.getElementById('btn-e-save');
    btn.disabled = true; btn.innerText = "Zapisywanie...";

    let noweLinki = [];
    for (let f of nowePliki) {
        const n = `${Date.now()}_${f.name}`;
        const { data } = await baza.storage.from('zdjecia').upload(n, f);
        if (data) noweLinki.push(baza.storage.from('zdjecia').getPublicUrl(n).data.publicUrl);
    }

    const ostateczneZdjecia = [...edytowaneZdjecia, ...noweLinki];
    if (ostateczneZdjecia.length === 0) ostateczneZdjecia.push('https://via.placeholder.com/600');

    await baza.from('ogloszenia').update({
        tytul: document.getElementById('e-tytul').value,
        kategoria: document.getElementById('e-kat').value,
        podkategoria: document.getElementById('e-podkat').value,
        cena: parseFloat(document.getElementById('e-cena').value),
        lokalizacja: document.getElementById('e-lok').value,
        opis: document.getElementById('e-opis').value,
        telefon: document.getElementById('e-tel').value,
        zdjecia: ostateczneZdjecia
    }).eq('id', id);

    location.reload();
};
