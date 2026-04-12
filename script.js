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

// --- MENU I PROFIL ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    
    if (user && nav) {
        if (document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'none';
        
        const { data: ulubioneData } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = ulubioneData ? ulubioneData.map(x => x.ogloszenie_id) : [];

        nav.innerHTML = `
            <div style="position:relative; display:flex; gap:10px; align-items:center;">
                <button onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800;">Moje Konto ▼</button>
                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:220px;">
                    <div style="padding-bottom:10px; border-bottom:1px solid #eee; margin-bottom:10px;">
                        <small style="color:gray;">Zalogowany:</small><br>
                        <b style="font-size:13px; word-break:break-all;">${user.email}</b>
                    </div>
                    <div onclick="pokazMojeOgloszenia()" style="padding:10px; cursor:pointer; border-radius:8px;">📝 Moje ogłoszenia</div>
                    <div onclick="alert('Wiadomości wkrótce')" style="padding:10px; cursor:pointer; border-radius:8px;">✉️ Wiadomości</div>
                    <div onclick="alert('Ulubione: ' + mojeUlubione.length)" style="padding:10px; cursor:pointer; border-radius:8px;">❤️ Ulubione (${mojeUlubione.length})</div>
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

// --- KATEGORIE ---
window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    if (!panel) return;
    panel.style.display = 'flex';
    panel.innerHTML = (SUB_DATA[kat] || []).map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
    render(daneOgloszen.filter(o => o.kategoria === kat), false);
};

window.filtrujPoPodkat = (kat, podkat) => {
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat), false);
};

window.updateFormSubcats = () => {
    const kategoriaGlowna = document.getElementById('f-kat').value;
    const polePodkategorii = document.getElementById('f-podkat');
    if (!polePodkategorii) return;
    const listaPodkategorii = SUB_DATA[kategoriaGlowna] || [];
    polePodkategorii.innerHTML = '<option value="">Wybierz podkategorię</option>' + 
        listaPodkategorii.map(p => `<option value="${p}">${p}</option>`).join('');
};

// --- SZCZEGÓŁY OGŁOSZENIA (POWIĘKSZANIE ZDJĘCIA) ---
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
                <div style="position:relative; background:#000; border-radius:15px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="max-width:100%; height:400px; object-fit:contain; cursor:zoom-in;" onclick="window.open(this.src)">
                    ${aktualneFotki.length > 1 ? `
                        <button onclick="zmienFoto(-1)" style="position:absolute; left:10px; background:rgba(0,0,0,0.5); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;">◀</button>
                        <button onclick="zmienFoto(1)" style="position:absolute; right:10px; background:rgba(0,0,0,0.5); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;">▶</button>
                    ` : ''}
                </div>
                <div style="display:flex; gap:10px; margin-top:10px; overflow-x:auto; padding-bottom:5px;">
                    ${aktualneFotki.map((img, i) => `
                        <img src="${img}" onclick="ustawFoto(${i})" class="mini-foto" style="width:60px; height:45px; object-fit:cover; border-radius:5px; cursor:pointer; border:2px solid ${i === 0 ? 'var(--primary)' : '#ddd'}">
                    `).join('')}
                </div>
            </div>
            <div style="flex:1; min-width:250px;">
                <h2 style="margin-top:0;">${o.tytul}</h2>
                <h1 style="color:var(--primary);">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja}</p>
                <hr style="border:0; border-top:1px solid #eee; margin:15px 0;">
                <div style="font-size:14px; color:#555; white-space:pre-line;">${o.opis}</div>
                <div style="margin-top:20px; padding:15px; background:#f5f5f5; border-radius:10px;">
                    📞 <b>${o.telefon || 'Brak numeru'}</b>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zmienFoto = (dir) => {
    aktualneZdjecieIndex = (aktualneZdjecieIndex + dir + aktualneFotki.length) % aktualneFotki.length;
    ustawFoto(aktualneZdjecieIndex);
};

window.ustawFoto = (idx) => {
    aktualneZdjecieIndex = idx;
    const mainImg = document.getElementById('mainFoto');
    if (mainImg) mainImg.src = aktualneFotki[idx];
    document.querySelectorAll('.mini-foto').forEach((img, i) => {
        img.style.borderColor = i === idx ? 'var(--primary)' : '#ddd';
    });
};

// --- DODAWANIE OGŁOSZEŃ ---
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerText = "Wysyłanie...";

    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");

    const pliki = document.getElementById('f-plik').files;
    let wgraneZdjecia = [];

    for (let f of pliki) {
        const nazwa = `${Date.now()}_${f.name}`;
        const { data } = await baza.storage.from('zdjecia').upload(nazwa, f);
        if (data) {
            const { data: urlData } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            wgraneZdjecia.push(urlData.publicUrl);
        }
    }
    if (wgraneZdjecia.length === 0) wgraneZdjecia.push('https://via.placeholder.com/600');

    const { error } = await baza.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        cena: parseFloat(document.getElementById('f-cena').value),
        lokalizacja: document.getElementById('f-lok').value,
        opis: document.getElementById('f-opis').value,
        telefon: document.getElementById('f-tel').value,
        zdjecia: wgraneZdjecia,
        user_email: user.email 
    }]);

    if (error) { 
        alert("Błąd: " + error.message); 
        btn.disabled = false; 
        btn.innerText = "Opublikuj ogłoszenie";
    } else { 
        alert("Dodano ogłoszenie!"); 
        location.reload(); 
    }
};

// --- RENDEROWANIE GŁÓWNE ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen, true);
}

function render(lista, czyStronaGlowna = false) {
    const kontener = document.getElementById('lista');
    if (!kontener) return;
    const tytulSekcji = document.getElementById('grid-title');
    if (tytulSekcji) tytulSekcji.innerText = czyStronaGlowna ? "Najnowsze ogłoszenia" : "Wyniki wyszukiwania";

    const dane = czyStronaGlowna ? lista.slice(0, 12) : lista;
    kontener.innerHTML = dane.map(o => {
        const foto = Array.isArray(o.zdjecia) ? o.zdjecia[0] : 'https://via.placeholder.com/300';
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img src="${foto}" style="width:100%; height:180px; object-fit:cover;">
            <div style="padding:15px;">
                <b style="font-size:18px;">${o.cena} zł</b>
                <div style="color:#555; margin-top:5px; height:40px; overflow:hidden;">${o.tytul}</div>
                <div style="font-size:12px; color:gray; margin-top:8px;">📍 ${o.lokalizacja}</div>
            </div>
        </div>`;
    }).join('');
}

// --- MOJE OGŁOSZENIA ---
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
                <div class="ad-card" style="border:1px solid #eee;">
                    <img src="${o.zdjecia ? o.zdjecia[0] : 'https://via.placeholder.com/300'}" style="width:100%; height:110px; object-fit:cover;">
                    <div style="padding:10px;">
                        <b>${o.cena} zł</b>
                        <div style="font-size:11px;">${o.tytul}</div>
                        <button onclick="usunOgloszenie(${o.id})" style="width:100%; margin-top:10px; color:red; cursor:pointer;">Usuń</button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.usunOgloszenie = async (id) => {
    if (confirm("Na pewno usunąć?")) {
        await baza.from('ogloszenia').delete().eq('id', id);
        location.reload();
    }
};

window.zamknijModal = () => { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); };
window.onclick = (e) => { if (e.target.className === 'modal') zamknijModal(); };

// --- START ---
async function init() {
    await sprawdzUzytkownika();
    await pobierz();
}

init();
