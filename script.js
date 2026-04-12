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
    if (menu && menu.style.display === 'block') {
        if (!menu.contains(e.target) && e.target !== btn) {
            menu.style.display = 'none';
        }
    }
});

// --- SZUKANIE (NAZWA + LOKALIZACJA) ---
window.szukaj = () => {
    const fraza = document.getElementById('find-text').value.toLowerCase().trim();
    const lok = document.getElementById('find-loc').value.toLowerCase().trim();
    
    const wyniki = daneOgloszen.filter(o => {
        const tytulOk = o.tytul.toLowerCase().includes(fraza) || o.opis.toLowerCase().includes(fraza);
        const lokOk = o.lokalizacja.toLowerCase().includes(lok);
        return tytulOk && lokOk;
    });
    
    // Ukrywamy panel podkategorii przy szukaniu
    document.getElementById('subcat-panel').style.display = 'none';
    
    // Zmieniamy nagłówek
    const naglowek = document.getElementById('grid-title');
    if (fraza || lok) {
        naglowek.innerText = `Wyniki wyszukiwania (${wyniki.length})`;
    } else {
        naglowek.innerText = "Najnowsze ogłoszenia";
    }

    render(wyniki, false);
};

// --- SYSTEM WIADOMOŚCI ---
window.pokazSkrzynke = async () => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return;

    await baza.from('wiadomosci').update({ przeczytane: true }).eq('odbiorca', user.email).eq('przeczytane', false);

    const badge = document.getElementById('msg-badge');
    const menuCount = document.getElementById('menu-msg-count');
    if (badge) badge.remove();
    if (menuCount) menuCount.innerHTML = '';

    const { data: msg } = await baza.from('wiadomosci').select('*').eq('odbiorca', user.email).order('created_at', { ascending: false });

    const content = document.getElementById('view-content');
    let htmlMsg = msg && msg.length > 0 
        ? msg.map(m => `
            <div style="background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid var(--primary);">
                <div style="font-size:11px; color:gray; margin-bottom:5px;">Od: <b>${m.nadawca}</b> • ${new Date(m.created_at).toLocaleString('pl-PL')}</div>
                <div style="font-size:14px; color:#333; line-height:1.4;">${m.tresc}</div>
                <button onclick="wyslijWiadomosc('${m.nadawca}', 'Odp: wiadomość')" style="margin-top:10px; background:none; border:none; color:var(--primary); cursor:pointer; font-weight:bold; padding:0; font-size:13px;">Odpowiedz ↩</button>
            </div>
        `).join('')
        : '<p style="text-align:center; color:gray; padding:20px;">Brak otrzymanych wiadomości.</p>';

    content.innerHTML = `<button class="close-btn" onclick="zamknijModal()">&times;</button><h2 style="margin-bottom:20px;">Skrzynka odbiorcza</h2><div style="max-height:65vh; overflow-y:auto; padding-right:5px;">${htmlMsg}</div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.wyslijWiadomosc = async (odbiorca, tytul) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się, aby wysłać wiadomość!");
    if (user.email === odbiorca) return alert("Nie możesz pisać do samego siebie!");

    const tresc = prompt(`Wiadomość do: ${odbiorca}\nTemat: ${tytul}`, "Dzień dobry, czy oferta jest aktualna?");
    if (tresc) {
        const { error } = await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca: odbiorca, tresc: tresc, przeczytane: false }]);
        if (error) alert("Błąd wysyłania: " + error.message); 
        else alert("Wiadomość została wysłana!");
    }
};

// --- SYSTEM ULUBIONYCH ---
window.toggleUlubione = async (e, id) => {
    e.stopPropagation();
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się, aby dodawać do ulubionych!");

    const index = mojeUlubione.indexOf(id);
    if (index > -1) {
        const { error } = await baza.from('ulubione').delete().eq('user_email', user.email).eq('ogloszenie_id', id);
        if (!error) mojeUlubione.splice(index, 1);
    } else {
        const { error } = await baza.from('ulubione').insert([{ user_email: user.email, ogloszenie_id: id }]);
        if (!error) mojeUlubione.push(id);
    }
    
    render(daneOgloszen, document.getElementById('subcat-panel').style.display === 'none');
    sprawdzUzytkownika(); 
    
    const heartBtn = document.getElementById('modal-heart');
    if (heartBtn) {
        const isFav = mojeUlubione.includes(id);
        heartBtn.innerHTML = isFav ? '❤️' : '🤍';
    }
};

window.pokazUlubione = () => {
    const ulubioneLista = daneOgloszen.filter(o => mojeUlubione.includes(o.id));
    render(ulubioneLista, false);
    document.getElementById('subcat-panel').style.display = 'none';
    document.getElementById('grid-title').innerText = "Twoje Ulubione";
};

// --- SZCZEGÓŁY OGŁOSZENIA I GALERIA ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    
    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    const isFav = mojeUlubione.includes(o.id);

    const modalContent = document.getElementById('view-content');
    modalContent.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; flex-wrap:wrap; gap:20px;">
            <div style="flex:1.5; min-width:300px;">
                <div style="position:relative; background:#000; border-radius:15px; overflow:hidden; height:400px; display:flex; align-items:center; justify-content:center;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="max-width:100%; max-height:100%; object-fit:contain; cursor:zoom-in;" onclick="otworzFullFoto()">
                    <button id="modal-heart" onclick="toggleUlubione(event, ${o.id})" style="position:absolute; top:15px; right:15px; background:white; border:none; width:45px; height:45px; border-radius:50%; cursor:pointer; font-size:24px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 10px rgba(0,0,0,0.2);">${isFav ? '❤️' : '🤍'}</button>
                    ${aktualneFotki.length > 1 ? `
                        <button onclick="zmienFoto(-1)" style="position:absolute; left:10px; background:rgba(0,0,0,0.5); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:20px;">◀</button>
                        <button onclick="zmienFoto(1)" style="position:absolute; right:10px; background:rgba(0,0,0,0.5); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:20px;">▶</button>
                    ` : ''}
                </div>
                <div style="display:flex; gap:10px; margin-top:10px; overflow-x:auto; padding-bottom:5px;">
                    ${aktualneFotki.map((img, i) => `
                        <img src="${img}" onclick="ustawFoto(${i})" class="mini-foto" style="width:60px; height:45px; object-fit:cover; border-radius:5px; cursor:pointer; border:2px solid ${i === 0 ? 'var(--primary)' : '#ddd'}">
                    `).join('')}
                </div>
            </div>
            <div style="flex:1; min-width:250px;">
                <h2 style="margin:0 0 10px 0;">${o.tytul}</h2>
                <h1 style="color:var(--primary); margin-bottom:15px;">${o.cena} zł</h1>
                <div style="background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:15px;">
                    <p>📍 Lokalizacja: <b>${o.lokalizacja}</b></p>
                    <p>🕒 Dodano: <b>${new Date(o.created_at).toLocaleString('pl-PL', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}</b></p>
                    <p>📞 Telefon: <b>${o.telefon || 'Nie podano'}</b></p>
                </div>
                <button onclick="wyslijWiadomosc('${o.user_email}', '${o.tytul.replace(/'/g, "\\'")}')" style="width:100%; padding:15px; background:var(--primary); color:white; border:none; border-radius:10px; font-size:16px; font-weight:bold; cursor:pointer; margin-bottom:20px;">Wyślij wiadomość</button>
                <h3 style="border-bottom:1px solid #eee; padding-bottom:10px;">Opis</h3>
                <p style="white-space:pre-line; color:#444; line-height:1.5;">${o.opis}</p>
            </div>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zmienFoto = (dir) => {
    aktualneZdjecieIndex = (aktualneZdjecieIndex + dir + aktualneFotki.length) % aktualneFotki.length;
    ustawFoto(aktualneZdjecieIndex);
    const fullImg = document.getElementById('full-img-view');
    if (fullImg) fullImg.src = aktualneFotki[aktualneZdjecieIndex];
};

window.ustawFoto = (idx) => {
    aktualneZdjecieIndex = idx;
    const img = document.getElementById('mainFoto');
    if (img) img.src = aktualneFotki[idx];
    document.querySelectorAll('.mini-foto').forEach((m, i) => m.style.borderColor = i === idx ? 'var(--primary)' : '#ddd');
};

window.otworzFullFoto = () => {
    let lightbox = document.getElementById('lightbox-overlay');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox-overlay';
        lightbox.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 5000; display: flex; align-items: center; justify-content: center;`;
        lightbox.onclick = (e) => { if (e.target === lightbox) window.zamknijFullFoto(); };
        document.body.appendChild(lightbox);
    }
    lightbox.innerHTML = `
        <button onclick="window.zamknijFullFoto()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:white; font-size:40px; cursor:pointer; z-index:5001;">&times;</button>
        ${aktualneFotki.length > 1 ? `
            <button onclick="zmienFoto(-1)" style="position:absolute; left:20px; background:rgba(255,255,255,0.1); color:white; border:none; width:60px; height:60px; border-radius:50%; cursor:pointer; font-size:30px;">◀</button>
            <button onclick="zmienFoto(1)" style="position:absolute; right:20px; background:rgba(255,255,255,0.1); color:white; border:none; width:60px; height:60px; border-radius:50%; cursor:pointer; font-size:30px;">▶</button>
        ` : ''}
        <img id="full-img-view" src="${aktualneFotki[aktualneZdjecieIndex]}" style="max-width:90%; max-height:90%; object-fit:contain; border-radius:5px; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
    `;
    lightbox.style.display = 'flex';
};

window.zamknijFullFoto = () => {
    const lightbox = document.getElementById('lightbox-overlay');
    if (lightbox) lightbox.style.display = 'none';
};

// --- FILTROWANIE I KATEGORIE ---
window.toggleSubcats = (kat) => {
    const p = document.getElementById('subcat-panel');
    if (!p) return;
    p.style.display = 'flex';
    p.innerHTML = (SUB_DATA[kat] || []).map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
    document.getElementById('grid-title').innerText = `Kategoria: ${kat}`;
    render(daneOgloszen.filter(o => o.kategoria === kat), false);
};

window.filtrujPoPodkat = (kat, podkat) => {
    document.getElementById('grid-title').innerText = `${kat} > ${podkat}`;
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat), false);
};

window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    const s = document.getElementById('f-podkat');
    if(s) s.innerHTML = '<option value="">Podkategoria</option>' + (SUB_DATA[k] || []).map(x => `<option value="${x}">${x}</option>`).join('');
};

// --- ZARZĄDZANIE OGŁOSZENIAMI ---
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerText = "Wysyłanie...";

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

    if (error) { alert("Błąd: " + error.message); btn.disabled = false; btn.innerText = "Spróbuj ponownie"; } 
    else location.reload();
};

window.pokazMojeOgloszenia = async () => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return;
    const moje = daneOgloszen.filter(o => o.user_email === user.email);
    const content = document.getElementById('view-content');
    
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h2 style="margin-bottom:20px;">Moje ogłoszenia (${moje.length})</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:15px;">
            ${moje.map(o => `
                <div class="ad-card" style="border:1px solid #eee; cursor:default;">
                    <img src="${o.zdjecia ? o.zdjecia[0] : 'https://via.placeholder.com/300'}" style="width:100%; height:110px; object-fit:cover;">
                    <div style="padding:10px;">
                        <b>${o.cena} zł</b>
                        <div style="font-size:11px; height:30px; overflow:hidden;">${o.tytul}</div>
                        <button onclick="usunOgloszenie(${o.id})" style="width:100%; margin-top:10px; color:red; cursor:pointer; background:none; border:1px solid red; border-radius:5px; padding:5px;">Usuń</button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.usunOgloszenie = async (id) => {
    if (confirm("Czy na pewno chcesz usunąć to ogłoszenie?")) {
        await baza.from('ogloszenia').delete().eq('id', id);
        location.reload();
    }
};

// --- RENDEROWANIE I INICJALIZACJA ---
function render(lista, glowna = false) {
    const k = document.getElementById('lista');
    if (!k) return;
    k.innerHTML = lista.map(o => {
        const isFav = mojeUlubione.includes(o.id);
        const dataStr = new Date(o.created_at).toLocaleString('pl-PL', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="position:relative;">
            <div onclick="toggleUlubione(event, ${o.id})" style="position:absolute; top:10px; right:10px; z-index:10; background:rgba(255,255,255,0.8); width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                ${isFav ? '❤️' : '🤍'}
            </div>
            <img src="${o.zdjecia ? o.zdjecia[0] : 'https://via.placeholder.com/300'}" style="width:100%; height:180px; object-fit:cover;">
            <div style="padding:15px;">
                <b>${o.cena} zł</b>
                <div style="font-size:14px; margin-top:5px; height:38px; overflow:hidden;">${o.tytul}</div>
                <div style="font-size:11px; color:gray; margin-top:8px; display:flex; justify-content:space-between;">
                    <span>📍 ${o.lokalizacja}</span>
                    <span>🕒 ${dataStr}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

window.onclick = (e) => { 
    if (e.target.className === 'modal') zamknijModal(); 
};

async function init() {
    await sprawdzUzytkownika();
    const { data, error } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    if (error) console.error("Błąd pobierania:", error.message);
    daneOgloszen = data || [];
    render(daneOgloszen, true);
}

init();
