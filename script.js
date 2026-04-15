const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];
let edytowaneZdjecia = [];

const OGLOSZENIA_NA_STRONE = 40;

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

function formatujDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { data, error } = await baza.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Błąd logowania: " + error.message);
    } else {
        location.reload();
    }
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength || !hasUpperCase || !hasDigit || !hasSpecialChar) {
        let msg = "Hasło musi mieć:\n";
        if (!hasMinLength) msg += "- minimum 8 znaków\n";
        if (!hasUpperCase) msg += "- jedną dużą literę\n";
        if (!hasDigit) msg += "- jedną cyfrę\n";
        if (!hasSpecialChar) msg += "- jeden znak specjalny (!@#$%^&*)\n";
        return alert(msg);
    }

    const { data, error } = await baza.auth.signUp({ email, password });
    if (error) {
        alert("Błąd rejestracji: " + error.message); 
    } else {
        alert("Rejestracja pomyślna! Sprawdź e-mail.");
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-pass').value = '';
    }
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user && nav) {
        if (document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'none';
        
        // Nazwa użytkownika przed @
        const username = user.email.split('@')[0];

        const { count: msgCount } = await baza.from('wiadomosci').select('*', { count: 'exact', head: true }).eq('odbiorca', user.email).eq('przeczytane', false);
        const { data: uData } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = uData ? uData.map(x => x.ogloszenie_id) : [];

        nav.innerHTML = `
            <div id="menu-container" style="position:relative; display:flex; gap:10px; align-items:center;">
                <button id="menu-btn" onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800; position:relative;">
                    ${username} ▼
                    ${msgCount > 0 ? `<span id="msg-badge" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; width:20px; height:20px; font-size:11px; display:flex; align-items:center; justify-content:center; border:2px solid white;">${msgCount}</span>` : ''}
                </button>
                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:220px;">
                    <div style="padding-bottom:10px; border-bottom:1px solid #eee; margin-bottom:10px;">
                        <small style="color:gray;">Zalogowany jako:</small><br>
                        <b style="font-size:13px; word-break:break-all;">${user.email}</b>
                    </div>
                    <div onclick="pokazMojeOgloszenia()" style="padding:10px; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div onclick="pokazSkrzynke()" style="padding:10px; cursor:pointer;">✉️ Wiadomości</div>
                    <div onclick="pokazUlubione()" style="padding:10px; cursor:pointer;">❤️ Ulubione</div>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <div onclick="wyloguj()" style="padding:10px; cursor:pointer; color:red; font-weight:bold;">🚪 Wyloguj</div>
                </div>
                <button onclick="otworzFormularzDodawania()" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj ogłoszenie</button>
            </div>`;
    }
}

window.toggleUserMenu = (e) => { e.stopPropagation(); const m = document.getElementById('drop-menu'); if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; };
window.addEventListener('click', (e) => { const menu = document.getElementById('drop-menu'); if (menu && menu.style.display === 'block' && !menu.contains(e.target)) menu.style.display = 'none'; });

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

window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    const { data: { user } } = await baza.auth.getUser();
    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    const telefonWidok = user ? `<b>${o.telefon || 'Brak numeru'}</b>` : `<span style="color:red; font-weight:bold;">[Zaloguj się, aby zobaczyć numer]</span>`;

    document.getElementById('view-content').innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; flex-wrap:wrap; gap:20px;">
            <div style="flex:1.5; min-width:300px;">
                <div style="background:#000; border-radius:15px; height:350px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="max-width:100%; max-height:100%; cursor:zoom-in;" onclick="otworzFullFoto()">
                </div>
                <div id="miniaturki-container" style="display:flex; gap:8px; margin-top:10px; overflow-x:auto; padding-bottom:5px;">
                    ${aktualneFotki.map((img, i) => `<img src="${img}" onclick="zmienGlowneZdjecie(${i})" style="width:65px; height:65px; object-fit:cover; border-radius:8px; cursor:pointer; border:${i===0 ? '2px solid var(--primary)' : '2px solid transparent'}; transition:0.2s;" class="mini-foto">`).join('')}
                </div>
            </div>
            <div style="flex:1;">
                <div style="font-size:12px; color:gray; margin-bottom:5px;">Dodano: ${formatujDate(o.created_at)}</div>
                <h2>${o.tytul}</h2>
                <h1 style="color:var(--primary);">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja} | 📞 ${telefonWidok}</p>
                <div style="display:flex; gap:10px; margin-top:10px;">
                     <button onclick="wyslijWiadomosc('${o.user_email}', '${o.tytul}')" style="flex:1; padding:12px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Wyślij wiadomość</button>
                     <button onclick="toggleUlubione(event, ${o.id})" id="fav-btn-${o.id}" style="padding:12px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer;">${mojeUlubione.includes(o.id) ? '❤️' : '🤍'}</button>
                </div>
                <h3 style="margin-top:20px;">Dane techniczne</h3>
                <div style="background:#f9f9f9; padding:15px; border-radius:10px; font-size:14px; border:1px solid #eee;">
                    ${o.opis.includes('--- DANE ---') ? o.opis.split('--- DANE ---')[1].trim().replace(/\n/g, '<br>') : 'Brak dodatkowych danych'}
                </div>
                <h3 style="margin-top:20px;">Opis</h3>
                <p style="white-space:pre-line; color:#444; line-height:1.5;">${o.opis.split('--- DANE ---')[0]}</p>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.otworzFiltry = (kat, podkat) => {
    if (kat !== 'Motoryzacja') {
        const wyniki = daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat);
        pokazWynikiModal(`${kat} > ${podkat}`, wyniki);
        return;
    }
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h3>Szukaj w: ${podkat}</h3>
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:15px;">
            <input type="text" id="sf-marka" placeholder="Marka" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <input type="text" id="sf-model" placeholder="Model" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="number" id="sf-rok-min" placeholder="Rok od" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="number" id="sf-rok-max" placeholder="Rok do" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="number" id="sf-cena-min" placeholder="Cena od" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="number" id="sf-cena-max" placeholder="Cena do" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            </div>
            <select id="sf-paliwo" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <option value="">Wszystkie paliwa</option>
                <option value="Benzyna">Benzyna</option><option value="LPG">LPG</option><option value="Diesel">Diesel</option><option value="Hybryda">Hybryda</option>
            </select>
            <select id="sf-skrzynia" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <option value="">Skrzynia biegów</option>
                <option value="Manualna">Manualna</option><option value="Automatyczna">Automatyczna</option>
            </select>
            <button onclick="zastosujFiltryMoto('${kat}', '${podkat}')" style="background:var(--primary); color:white; padding:15px; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">POKAŻ OGŁOSZENIA</button>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zastosujFiltryMoto = (kat, podkat) => {
    const marka = document.getElementById('sf-marka').value.toLowerCase().trim();
    const model = document.getElementById('sf-model').value.toLowerCase().trim();
    const rMin = parseInt(document.getElementById('sf-rok-min').value) || 0;
    const rMax = parseInt(document.getElementById('sf-rok-max').value) || 9999;
    const cMin = parseFloat(document.getElementById('sf-cena-min').value) || 0;
    const cMax = parseFloat(document.getElementById('sf-cena-max').value) || 99999999;
    const paliwo = document.getElementById('sf-paliwo').value.toLowerCase();
    const skrzynia = document.getElementById('sf-skrzynia').value.toLowerCase();

    const wyniki = daneOgloszen.filter(o => {
        if (o.kategoria !== kat || o.podkategoria !== podkat) return false;
        if (o.cena < cMin || o.cena > cMax) return false;
        const d = o.opis.toLowerCase();
        if (marka && !d.includes(`marka: ${marka}`)) return false;
        if (model && !d.includes(`model: ${model}`)) return false;
        const rokMatch = o.opis.match(/rok: (\d{4})/i);
        const autoRok = rokMatch ? parseInt(rokMatch[1]) : 0;
        if ((rMin > 0 && autoRok < rMin) || (rMax < 9999 && autoRok > rMax)) return false;
        if (paliwo && !d.includes(`paliwo: ${paliwo}`)) return false;
        if (skrzynia && !d.includes(`skrzynia: ${skrzynia}`)) return false;
        return true;
    });
    pokazWynikiModal(`${podkat} (Filtrowane)`, wyniki);
};

window.updateFormSubcats = (p = 'f-') => {
    const kat = document.getElementById(`${p}kat`).value;
    const podkatSelect = document.getElementById(`${p}podkat`);
    const extraFields = document.getElementById('extra-fields');
    if (event && event.target && event.target.id === `${p}kat`) {
        podkatSelect.innerHTML = '<option value="">Podkategoria</option>' + (SUB_DATA[kat] || []).map(x => `<option value="${x}">${x}</option>`).join('');
    }
    if (!extraFields) return;
    extraFields.innerHTML = ''; 
    const typyPojazdow = ['Samochody osobowe', 'Dostawcze', 'Motocykle', 'Skutery'];
    if (kat === 'Motoryzacja' && typyPojazdow.includes(podkatSelect.value)) {
        extraFields.innerHTML = `
            <input type="text" id="extra-marka" placeholder="Marka" required style="margin-bottom:12px">
            <input type="text" id="extra-model" placeholder="Model" required style="margin-bottom:12px">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                <input type="number" id="extra-rok" placeholder="Rok produkcji" required>
                <input type="number" id="extra-przebieg" placeholder="Przebieg" required>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                <select id="extra-paliwo" required>
                    <option value="">Paliwo</option><option value="Benzyna">Benzyna</option><option value="LPG">LPG</option><option value="Diesel">Diesel</option><option value="Hybryda">Hybryda</option><option value="Elektryczny">Elektryczny</option>
                </select>
                <select id="extra-skrzynia" required>
                    <option value="">Skrzynia biegów</option><option value="Automatyczna">Automatyczna</option><option value="Manualna">Manualna</option>
                </select>
            </div>`;
    }
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btnAkcja = document.getElementById('btn-save');
    if (btnAkcja.disabled) return;
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Musisz być zalogowany!");
    const files = Array.from(document.getElementById('f-plik').files);
    if (files.length > 5) return alert("Maksymalnie 5 zdjęć!");

    btnAkcja.disabled = true;
    btnAkcja.innerText = "Kompresja...";

    let dodatkoweDane = "";
    if (document.getElementById('extra-marka')) {
        dodatkoweDane = "\n\n--- DANE ---" + `\nMarka: ${document.getElementById('extra-marka').value}\nModel: ${document.getElementById('extra-model').value}\nRok: ${document.getElementById('extra-rok').value}\nPaliwo: ${document.getElementById('extra-paliwo').value}\nSkrzynia: ${document.getElementById('extra-skrzynia').value}`;
    }

    const zdjeciaUrls = [];
    for (const file of files) {
        try {
            const comp = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1200 });
            const nazwa = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            await baza.storage.from('zdjecia').upload(nazwa, comp);
            zdjeciaUrls.push(baza.storage.from('zdjecia').getPublicUrl(nazwa).data.publicUrl);
        } catch (err) { console.error(err); }
    }

    const { error } = await baza.from('ogloszenia').insert([{
        user_email: user.email, tytul: document.getElementById('f-tytul').value, kategoria: document.getElementById('f-kat').value, podkategoria: document.getElementById('f-podkat').value, cena: parseFloat(document.getElementById('f-cena').value), lokalizacja: document.getElementById('f-lok').value, opis: document.getElementById('f-opis').value + dodatkoweDane, zdjecia: zdjeciaUrls, telefon: document.getElementById('f-tel').value
    }]);

    if (error) { alert(error.message); btnAkcja.disabled = false; btnAkcja.innerText = "Opublikuj"; } else location.reload();
};

window.otworzFormularzDodawania = () => { document.getElementById('modal-form').style.display = 'flex'; updateFormSubcats('f-'); };
window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

function renderCardHTML(o) {
    const isFav = mojeUlubione.includes(o.id);
    return `<div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer; position:relative;">
        <div onclick="toggleUlubione(event, ${o.id})" style="position:absolute; top:10px; right:10px; z-index:10; background:rgba(255,255,255,0.8); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${isFav ? '❤️' : '🤍'}</div>
        <img src="${o.zdjecia[0]}" style="width:100%; height:150px; object-fit:cover;">
        <div style="padding:12px;"><b style="font-size:16px; color:var(--primary);">${o.cena} zł</b><div style="font-size:13px; margin-top:4px; height:34px; overflow:hidden; color:#333; font-weight:600;">${o.tytul}</div><div style="font-size:11px; color:gray; margin-top:8px;">📍 ${o.lokalizacja}</div></div>
    </div>`;
}

function pokazWynikiModal(tytul, wyniki) {
    const content = document.getElementById('view-content');
    content.innerHTML = `<button class="close-btn" onclick="zamknijModal()">&times;</button><h2>${tytul}</h2><div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px; margin-top:20px; max-height:65vh; overflow-y:auto;">${wyniki.length ? wyniki.map(o => renderCardHTML(o)).join('') : '<p>Brak ogłoszeń.</p>'}</div>`;
    document.getElementById('modal-view').style.display = 'flex';
}

window.toggleSubcats = (kat) => {
    const p = document.getElementById('subcat-panel');
    p.style.display = 'flex';
    p.innerHTML = (SUB_DATA[kat] || []).map(s => `<div class="sub-pill" onclick="otworzFiltry('${kat}', '${s}')">${s}</div>`).join('');
};

async function init() {
    await sprawdzUzytkownika();
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    document.getElementById('lista').innerHTML = daneOgloszen.slice(0, 12).map(o => renderCardHTML(o)).join('');
}
init();
