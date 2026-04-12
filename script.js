const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];

const SUB_DATA = {
    'Motoryzacja': ['Samochody', 'Motocykle', 'Części'],
    'Dom': ['Meble', 'Ogrzewanie', 'Dekoracje'],
    'Elektronika': ['Telefony', 'Laptopy', 'Konsole'],
    'Ogród': ['Narzędzia', 'Rośliny', 'Meble ogrodowe'],
    'Moda': ['Ubrania', 'Buty', 'Dodatki'],
    'Rolnictwo': ['Traktory', 'Maszyny', 'Zwierzęta hodowlane'],
    'Zwierzęta': ['Psy', 'Koty', 'Akcesoria'],
    'Dzieci': ['Zabawki', 'Wózki', 'Ubranka'],
    'Sport': ['Rowery', 'Siłownia', 'Turystyka'],
    'Nauka': ['Książki', 'Korepetycje', 'Instrumenty'],
    'Usługi': ['Budowlane', 'Transport', 'Naprawa'],
    'Inne': ['Różne']
};

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

// --- INTERFEJS UŻYTKOWNIKA I POWIADOMIENIA ---
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
                    <div onclick="pokazSkrzynke()" style="padding:10px; cursor:pointer; display:flex; justify-content:space-between;">
                        <span>✉️ Wiadomości</span>
                        <span id="menu-msg-count">${msgCount > 0 ? `<b style="color:red;">(${msgCount})</b>` : ''}</span>
                    </div>
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
    const btn = document.getElementById('menu-btn');
    const adMenus = document.querySelectorAll('.ad-options-menu');
    
    // Zamykanie menu użytkownika
    if (menu && menu.style.display === 'block' && !menu.contains(e.target) && e.target !== btn) {
        menu.style.display = 'none';
    }

    // Zamykanie menu "trzech kropek" w ogłoszeniach
    adMenus.forEach(m => {
        if (m.style.display === 'block' && !e.target.closest('.ad-options-container')) {
            m.style.display = 'none';
        }
    });
});

// --- SZUKANIE ---
window.szukaj = () => {
    const fraza = document.getElementById('find-text').value.toLowerCase().trim();
    const lok = document.getElementById('find-loc').value.toLowerCase().trim();
    const teraz = new Date();
    const limit = 1000 * 60 * 60 * 24 * 28;

    const wyniki = daneOgloszen.filter(o => {
        const tytulOk = o.tytul.toLowerCase().includes(fraza) || o.opis.toLowerCase().includes(fraza);
        const lokOk = o.lokalizacja.toLowerCase().includes(lok);
        const aktywny = (teraz - new Date(o.created_at)) < limit;
        return tytulOk && lokOk && aktywny;
    });
    
    document.getElementById('subcat-panel').style.display = 'none';
    const naglowek = document.getElementById('grid-title');
    naglowek.innerText = (fraza || lok) ? `Wyniki wyszukiwania (${wyniki.length})` : "Najnowsze ogłoszenia";

    render(wyniki, false);
};

// --- WIADOMOŚCI ---
window.pokazSkrzynke = async () => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return;
    await baza.from('wiadomosci').update({ przeczytane: true }).eq('odbiorca', user.email).eq('przeczytane', false);
    const { data: msg } = await baza.from('wiadomosci').select('*').eq('odbiorca', user.email).order('created_at', { ascending: false });
    const content = document.getElementById('view-content');
    let htmlMsg = msg && msg.length > 0 ? msg.map(m => `
        <div style="background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid var(--primary);">
            <div style="font-size:11px; color:gray; margin-bottom:5px;">Od: <b>${m.nadawca}</b> • ${new Date(m.created_at).toLocaleString('pl-PL')}</div>
            <div style="font-size:14px; color:#333; line-height:1.4;">${m.tresc}</div>
            <button onclick="wyslijWiadomosc('${m.nadawca}', 'Odp: wiadomość')" style="margin-top:10px; background:none; border:none; color:var(--primary); cursor:pointer; font-weight:bold; padding:0; font-size:13px;">Odpowiedz ↩</button>
        </div>`).join('') : '<p style="text-align:center; color:gray; padding:20px;">Brak otrzymanych wiadomości.</p>';
    content.innerHTML = `<button class="close-btn" onclick="zamknijModal()">&times;</button><h2>Skrzynka odbiorcza</h2><div style="max-height:65vh; overflow-y:auto;">${htmlMsg}</div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.wyslijWiadomosc = async (odbiorca, tytul) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const tresc = prompt(`Wiadomość do: ${odbiorca}\nTemat: ${tytul}`, "Dzień dobry...");
    if (tresc) {
        const { error } = await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca: odbiorca, tresc: tresc, przeczytane: false }]);
        if (error) alert("Błąd: " + error.message); else alert("Wysłano!");
    }
};

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
    render(daneOgloszen.filter(o => (new Date() - new Date(o.created_at)) < (1000 * 60 * 60 * 24 * 28)));
    sprawdzUzytkownika();
};

window.pokazUlubione = () => {
    const ulubioneLista = daneOgloszen.filter(o => mojeUlubione.includes(o.id));
    render(ulubioneLista, false);
    document.getElementById('grid-title').innerText = "Twoje Ulubione";
};

// --- SZCZEGÓŁY I GALERIA ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    const modalContent = document.getElementById('view-content');
    modalContent.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; flex-wrap:wrap; gap:20px;">
            <div style="flex:1.5; min-width:300px;">
                <div style="position:relative; background:#000; border-radius:15px; height:400px; display:flex; align-items:center; justify-content:center;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="max-width:100%; max-height:100%; cursor:zoom-in;" onclick="otworzFullFoto()">
                </div>
            </div>
            <div style="flex:1;">
                <h2>${o.tytul}</h2>
                <h1 style="color:var(--primary);">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja} | 📞 ${o.telefon || 'Brak'}</p>
                <button onclick="wyslijWiadomosc('${o.user_email}', '${o.tytul}')" style="width:100%; padding:15px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Wyślij wiadomość</button>
                <h3 style="margin-top:20px;">Opis</h3>
                <p style="white-space:pre-line;">${o.opis}</p>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.otworzFullFoto = () => {
    let lightbox = document.getElementById('lightbox-overlay') || document.createElement('div');
    lightbox.id = 'lightbox-overlay';
    lightbox.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:5000;display:flex;align-items:center;justify-content:center;";
    lightbox.onclick = () => lightbox.style.display = 'none';
    lightbox.innerHTML = `<img src="${aktualneFotki[aktualneZdjecieIndex]}" style="max-width:90%;max-height:90%;">`;
    document.body.appendChild(lightbox);
    lightbox.style.display = 'flex';
};

// --- KATEGORIE ---
window.toggleSubcats = (kat) => {
    const p = document.getElementById('subcat-panel');
    p.style.display = 'flex';
    p.innerHTML = (SUB_DATA[kat] || []).map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
    const teraz = new Date();
    render(daneOgloszen.filter(o => o.kategoria === kat && (teraz - new Date(o.created_at)) < (1000 * 60 * 60 * 24 * 28)));
};

window.filtrujPoPodkat = (kat, podkat) => {
    const teraz = new Date();
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat && (teraz - new Date(o.created_at)) < (1000 * 60 * 60 * 24 * 28)));
};

window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    document.getElementById('f-podkat').innerHTML = '<option value="">Podkategoria</option>' + (SUB_DATA[k] || []).map(x => `<option value="${x}">${x}</option>`).join('');
};

// --- ZARZĄDZANIE ---
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    const { data: { user } } = await baza.auth.getUser();
    const pliki = document.getElementById('f-plik').files;
    let linki = [];
    for (let f of pliki) {
        const n = `${Date.now()}_${f.name}`;
        const { data } = await baza.storage.from('zdjecia').upload(n, f);
        if (data) linki.push(baza.storage.from('zdjecia').getPublicUrl(n).data.publicUrl);
    }
    const { error } = await baza.from('ogloszenia').insert([{
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
    if (error) alert(error.message); else location.reload();
};

// --- MOJE OGŁOSZENIA (AKTYWNE/ZAKOŃCZONE) ---
window.pokazMojeOgloszenia = async (tab = 'aktywne') => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return;

    const limit = 1000 * 60 * 60 * 24 * 28;
    const teraz = new Date();
    
    const moje = daneOgloszen.filter(o => o.user_email === user.email);
    const aktywne = moje.filter(o => (teraz - new Date(o.created_at)) < limit);
    const zakonczone = moje.filter(o => (teraz - new Date(o.created_at)) >= limit);

    const wyswietlane = tab === 'aktywne' ? aktywne : zakonczone;

    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h2 style="margin-bottom:15px;">Twoje ogłoszenia</h2>
        <div style="display:flex; gap:20px; border-bottom:1px solid #eee; margin-bottom:20px;">
            <div onclick="pokazMojeOgloszenia('aktywne')" style="padding:10px; cursor:pointer; font-weight:bold; border-bottom:3px solid ${tab === 'aktywne' ? 'var(--primary)' : 'transparent'}; color: ${tab === 'aktywne' ? 'var(--primary)' : '#666'}">Aktywne (${aktywne.length})</div>
            <div onclick="pokazMojeOgloszenia('zakonczone')" style="padding:10px; cursor:pointer; font-weight:bold; border-bottom:3px solid ${tab === 'zakonczone' ? 'var(--primary)' : 'transparent'}; color: ${tab === 'zakonczone' ? 'var(--primary)' : '#666'}">Zakończone (${zakonczone.length})</div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:15px;">
            ${wyswietlane.map(o => `
                <div class="ad-card" style="position:relative; cursor:default;">
                    <img src="${o.zdjecia[0]}" style="width:100%; height:110px; object-fit:cover;">
                    <div style="padding:10px;">
                        <b>${o.cena} zł</b>
                        <div style="font-size:11px; height:30px; overflow:hidden;">${o.tytul}</div>
                        ${tab === 'aktywne' ? `
                            <div class="ad-options-container" style="position:absolute; top:5px; right:5px;">
                                <button onclick="toggleAdMenu(event, ${o.id})" style="background:white; border:none; width:28px; height:28px; border-radius:50%; cursor:pointer; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2);">⋮</button>
                                <div id="ad-menu-${o.id}" class="ad-options-menu" style="display:none; position:absolute; right:0; top:32px; background:white; box-shadow:0 5px 15px rgba(0,0,0,0.2); border-radius:8px; z-index:100; min-width:100px; padding:5px 0;">
                                    <div onclick="edytujOgloszenie(${o.id})" style="padding:10px; cursor:pointer; font-size:13px; border-bottom:1px solid #eee;">Edytuj</div>
                                    <div onclick="usunOgloszenie(${o.id})" style="padding:10px; cursor:pointer; font-size:13px; color:red;">Zakończ</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>`).join('')}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.toggleAdMenu = (e, id) => {
    e.stopPropagation();
    const menu = document.getElementById(`ad-menu-${id}`);
    const isVisible = menu.style.display === 'block';
    document.querySelectorAll('.ad-options-menu').forEach(m => m.style.display = 'none');
    menu.style.display = isVisible ? 'none' : 'block';
};

window.usunOgloszenie = async (id) => {
    if (confirm("Czy na pewno chcesz zakończyć/usunąć to ogłoszenie?")) {
        await baza.from('ogloszenia').delete().eq('id', id);
        location.reload();
    }
};

window.edytujOgloszenie = (id) => {
    alert("Funkcja edycji dla ogłoszenia ID: " + id + " (Tu można otworzyć formularz)");
};

// --- RENDER I INIT ---
function render(lista) {
    const k = document.getElementById('lista');
    if (!k) return;
    k.innerHTML = lista.map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="position:relative;">
            <div onclick="toggleUlubione(event, ${o.id})" style="position:absolute; top:10px; right:10px; z-index:10; background:rgba(255,255,255,0.8); width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                ${mojeUlubione.includes(o.id) ? '❤️' : '🤍'}
            </div>
            <img src="${o.zdjecia[0]}" style="width:100%; height:180px; object-fit:cover;">
            <div style="padding:15px;">
                <b>${o.cena} zł</b>
                <div style="font-size:14px; margin-top:5px;">${o.tytul}</div>
                <div style="font-size:11px; color:gray; margin-top:8px;">📍 ${o.lokalizacja}</div>
            </div>
        </div>`).join('');
}

window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

async function init() {
    await sprawdzUzytkownika();
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    const teraz = new Date();
    const aktywne = daneOgloszen.filter(o => (teraz - new Date(o.created_at)) < (1000 * 60 * 60 * 24 * 28));
    render(aktywne);
}

init();
