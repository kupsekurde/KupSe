const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];
let edytowaneZdjecia = [];

// Parametry paginacji
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

// --- POMOCNICZE ---
function formatujDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('pl-PL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// --- LOGOWANIE I REJESTRACJA ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { data, error } = await baza.auth.signInWithPassword({ email, password });
    
    if (error) {
        if (error.message.includes("Email not confirmed")) {
            alert("Błąd: Twój e-mail nie został jeszcze potwierdzony. Sprawdź skrzynkę odbiorczą.");
        } else {
            alert("Błąd logowania: " + error.message);
        }
    } else {
        location.reload();
    }
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength || !hasUpperCase || !hasSpecialChar) {
        let msg = "Hasło nie spełnia wymagań:\n";
        if (!hasMinLength) msg += "- minimum 8 znaków\n";
        if (!hasUpperCase) msg += "- minimum jedna wielka litera\n";
        if (!hasSpecialChar) msg += "- minimum jeden znak specjalny";
        return alert(msg);
    }

    const { data, error } = await baza.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: window.location.origin 
        }
    });

    if (error) {
        alert("Błąd rejestracji: " + error.message); 
    } else {
        alert("Rejestracja pomyślna! Sprawdź e-mail, aby aktywować konto.");
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-pass').value = '';
    }
};

window.wyloguj = async () => { 
    await baza.auth.signOut(); 
    location.reload(); 
};

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
                <button onclick="otworzFormularzDodawania()" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj ogłoszenie</button>
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

// --- SZUKANIE GŁÓWNE ---
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
            <button onclick="wyslijWiadomosc('${m.nadawca}', 'Re: wiadomość')" 
                    style="background:none; border:none; color:var(--primary); cursor:pointer; font-weight:bold; padding:0; margin-top:5px;">
                Odpowiedz
            </button>
        </div>`).join('') : '<p>Brak wiadomości.</p>';

    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h2>Wiadomości</h2>
        <div style="max-height:60vh; overflow-y:auto;">
            ${htmlMsg}
        </div>`;
    
    document.getElementById('modal-view').style.display = 'flex';
};

window.wyslijWiadomosc = async (odbiorca, tytul) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const tresc = prompt(`Wiadomość do: ${odbiorca}`);
    if (tresc) {
        await baza.from('wiadomosci').insert([{ 
            nadawca: user.email, 
            odbiorca, 
            tresc, 
            przeczytane: false 
        }]);
        alert("Wysłano!");
    }
};

// --- SZCZEGÓŁY OGŁOSZENIA ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;

    // Sprawdzamy czy użytkownik jest zalogowany
    const { data: { user } } = await baza.auth.getUser();

    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    
    // Logika blokady danych
    const telefonWidok = user 
        ? `<b>${o.telefon || 'Brak numeru'}</b>` 
        : `<span style="color:red; font-weight:bold;">[Zaloguj się, aby zobaczyć numer]</span>`;
    
    const przyciskWiadomosci = user 
        ? `<button onclick="wyslijWiadomosc('${o.user_email}', '${o.tytul}')" style="flex:1; padding:12px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Wyślij wiadomość</button>`
        : `<button onclick="alert('Musisz się zalogować, aby wysłać wiadomość!')" style="flex:1; padding:12px; background:#ccc; color:white; border:none; border-radius:10px; font-weight:bold; cursor:not-allowed;">Wyślij wiadomość (wymaga logowania)</button>`;

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
                <p>📍 ${o.lokalizacja} | 📞 ${telefonWidok}</p>
                <div style="display:flex; gap:10px; margin-top:10px;">
                     ${przyciskWiadomosci}
                     <button onclick="toggleUlubione(event, ${o.id})" id="fav-btn-${o.id}" style="padding:12px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer;">
                        ${mojeUlubione.includes(o.id) ? '❤️' : '🤍'}
                     </button>
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
        <button onclick="document.getElementById('lightbox-box').style.display='none'" 
                style="position:absolute; top:25px; right:25px; background:white; border:none; width:45px; height:45px; border-radius:50%; font-size:28px; cursor:pointer; z-index:9001; display:flex; align-items:center; justify-content:center;">
            &times;
        </button>
        <button onclick="navFullFoto(-1)" 
                style="position:absolute; left:20px; background:rgba(255,255,255,0.15); color:white; border:none; padding:20px 15px; cursor:pointer; font-size:40px; border-radius:10px;">
            ❮
        </button>
        <img id="lb-img" src="${aktualneFotki[aktualneZdjecieIndex]}" style="max-width:90%; max-height:90%; object-fit:contain;">
        <button onclick="navFullFoto(1)" 
                style="position:absolute; right:20px; background:rgba(255,255,255,0.15); color:white; border:none; padding:20px 15px; cursor:pointer; font-size:40px; border-radius:10px;">
            ❯
        </button>
    `;
    lb.style.display = 'flex';
};

window.navFullFoto = (dir) => {
    aktualneZdjecieIndex = (aktualneZdjecieIndex + dir + aktualneFotki.length) % aktualneFotki.length;
    const img = document.getElementById('lb-img');
    if(img) img.src = aktualneFotki[aktualneZdjecieIndex];
};

// --- FILTROWANIE SPECJALISTYCZNE ---
window.otworzFiltry = (kat, podkat) => {
    if (kat !== 'Motoryzacja' && kat !== 'Elektronika') {
        filtrujPoPodkat(kat, podkat);
        return;
    }
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h3>Szukaj: ${podkat}</h3>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
            <input type="text" id="f-marka" placeholder="Marka" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <input type="text" id="f-model" placeholder="Model" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <div style="display:flex; gap:10px;">
                <input type="number" id="f-cena-min" placeholder="Cena od" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="number" id="f-cena-max" placeholder="Cena do" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
            </div>
            ${kat === 'Motoryzacja' ? `
                <div style="display:flex; gap:10px;">
                    <input type="number" id="f-rok-min" placeholder="Rok od" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
                    <input type="number" id="f-rok-max" placeholder="Rok do" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
                </div>
                <select id="f-paliwo" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                    <option value="">Wszystkie paliwa</option>
                    <option value="Benzyna">Benzyna</option>
                    <option value="Diesel">Diesel</option>
                    <option value="LPG">LPG</option>
                    <option value="Hybryda">Hybryda</option>
                    <option value="Elektryczny">Elektryczny</option>
                </select>
            ` : ''}
            <button onclick="zastosujFiltrySpec('${kat}', '${podkat}')" 
                    style="background:var(--primary); color:white; padding:12px; border:none; border-radius:10px; cursor:pointer; font-weight:bold; margin-top:10px;">
                POKAŻ OGŁOSZENIA
            </button>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zastosujFiltrySpec = (kat, podkat) => {
    const marka = document.getElementById('f-marka').value.toLowerCase().trim();
    const model = document.getElementById('f-model').value.toLowerCase().trim();
    const cMin = parseFloat(document.getElementById('f-cena-min').value) || 0;
    const cMax = parseFloat(document.getElementById('f-cena-max').value) || 99999999;
    
    let rMin = 0, rMax = 9999, paliwo = "";
    if(kat === 'Motoryzacja') {
        rMin = parseInt(document.getElementById('f-rok-min').value) || 0;
        rMax = parseInt(document.getElementById('f-rok-max').value) || 9999;
        paliwo = document.getElementById('f-paliwo').value.toLowerCase();
    }

    const wyniki = daneOgloszen.filter(o => {
        if (o.kategoria !== kat || o.podkategoria !== podkat) return false;
        const tresc = (o.tytul + " " + o.opis).toLowerCase();
        
        const mOk = marka === "" || tresc.includes(marka);
        const modOk = model === "" || tresc.includes(model);
        const cOk = o.cena >= cMin && o.cena <= cMax;
        
        if(kat === 'Motoryzacja') {
            const rokMatch = o.opis.match(/Rok: (\d{4})/);
            const autoRok = rokMatch ? parseInt(rokMatch[1]) : 0;
            const rOk = (rMin === 0 && rMax === 9999) || (autoRok >= rMin && autoRok <= rMax);
            const pOk = paliwo === "" || tresc.includes(paliwo);
            return mOk && modOk && cOk && rOk && pOk;
        }
        return mOk && modOk && cOk;
    });

    pokazWynikiModal(`${podkat} (Filtrowane)`, wyniki);
};

// --- DODAWANIE OGŁOSZEŃ ---
window.otworzFormularzDodawania = () => {
    document.getElementById('modal-form').style.display = 'flex';
    const formContent = document.getElementById('form-dynamic-content');
    formContent.innerHTML = `
        <input type="text" id="f-tytul" placeholder="Tytuł ogłoszenia" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
        <div style="display:flex; gap:10px;">
            <select id="f-kat" onchange="updateFormSubcats('f-')" required style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
                <option value="">Kategoria</option>
                ${Object.keys(SUB_DATA).map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>
            <select id="f-podkat" onchange="updateFormSubcats('f-')" required style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
                <option value="">Podkategoria</option>
            </select>
        </div>
        <div id="extra-fields"></div>
        <input type="number" id="f-cena" placeholder="Cena (zł)" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
        <input type="text" id="f-lok" placeholder="Lokalizacja" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
        <input type="tel" id="f-tel" placeholder="Numer telefonu" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
        <textarea id="f-opis" placeholder="Opis ogłoszenia..." rows="5" required style="padding:10px; border-radius:8px; border:1px solid #ccc; font-family:inherit;"></textarea>
        <div style="background:#f9f9f9; padding:15px; border-radius:10px; border:2px dashed #ccc;">
            <label style="display:block; margin-bottom:10px; font-weight:bold;">Dodaj zdjęcia (max 10):</label>
            <input type="file" id="f-plik" multiple accept="image/*" style="width:100%;">
        </div>
        <button type="submit" id="btn-save" style="background:var(--primary); color:white; padding:15px; border:none; border-radius:10px; font-size:16px; font-weight:bold; cursor:pointer; transition:0.3s;">
            Opublikuj ogłoszenie
        </button>
    `;
    updateFormSubcats('f-');
};

window.updateFormSubcats = (p = 'f-') => {
    const kat = document.getElementById(`${p}kat`).value;
    const podkatSelect = document.getElementById(`${p}podkat`);
    const extraFields = document.getElementById(p === 'e-' ? 'extra-fields-edit' : 'extra-fields');
    
    // Zapamiętujemy wybraną podkategorię przed odświeżeniem listy
    const poprzedniaPodkat = podkatSelect.value;
    
    // Jeśli zmieniono kategorię główną (target id zawiera 'kat'), odświeżamy listę podkategorii
    if (event && event.target && event.target.id.includes('kat')) {
        podkatSelect.innerHTML = '<option value="">Podkategoria</option>' + (SUB_DATA[kat] || []).map(x => `<option value="${x}">${x}</option>`).join('');
    }
    
    if (!extraFields) return;
    extraFields.innerHTML = ''; 

    const wybranaPodkat = podkatSelect.value;
    const typyPojazdow = ['Samochody osobowe', 'Dostawcze', 'Motocykle', 'Skutery'];

    if (kat === 'Motoryzacja' && typyPojazdow.includes(wybranaPodkat)) {
        extraFields.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#f0f7ff; padding:15px; border-radius:10px; margin-bottom:15px; border:1px solid #cce4ff;">
                <input type="text" id="extra-marka" placeholder="Marka" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="text" id="extra-model" placeholder="Model" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="number" id="extra-rok" placeholder="Rok produkcji" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="number" id="extra-przebieg" placeholder="Przebieg (km)" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="text" id="extra-pojemnosc" placeholder="Pojemność silnika" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="number" id="extra-moc" placeholder="Moc (KM)" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <select id="extra-paliwo" required style="padding:10px; border-radius:8px; border:1px solid #ccc; grid-column: span 2;">
                    <option value="">Rodzaj paliwa</option>
                    <option value="Benzyna">Benzyna</option>
                    <option value="Diesel">Diesel</option>
                    <option value="LPG">LPG</option>
                    <option value="Hybryda">Hybryda</option>
                    <option value="Elektryczny">Elektryczny</option>
                </select>
            </div>`;
    }
};
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btn-save');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerText = "Wysyłanie...";
    
    const { data: { user } } = await baza.auth.getUser();
    
    if (!user) {
        alert("Musisz być zalogowany!");
        btn.disabled = false;
        btn.innerText = "Opublikuj ogłoszenie";
        return;
    }

    // Usunięto powtórną deklarację const btn
    btn.innerText = "Kompresja zdjęć...";

    // 1. Pobieramy pliki (f-plik to ID z Twojego HTML)
    const inputPlik = document.getElementById('f-plik');
    const files = Array.from(inputPlik.files);
    
    if (files.length === 0) {
        alert("Dodaj chociaż jedno zdjęcie!");
        btn.disabled = false;
        btn.innerText = "Opublikuj ogłoszenie";
        return;
    }

    const zdjeciaUrls = [];
    const compressionOptions = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true
    };

    // 2. Magia kompresji i wysyłania
    for (const file of files) {
        try {
            // Używamy biblioteki, którą dodałeś przed chwilą do HTML
            const compressedFile = await imageCompression(file, compressionOptions);
            const nazwa = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            
            const { data, error } = await baza.storage.from('zdjecia').upload(nazwa, compressedFile);
            if (error) throw error;

            const { data: { publicUrl } } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            zdjeciaUrls.push(publicUrl);
        } catch (err) {
            console.error("Błąd zdjęcia:", err);
        }
    }

    btn.innerText = "Zapisywanie ogłoszenia...";

    // 3. Zapis danych do tabeli
    const { error } = await baza.from('ogloszenia').insert([{
        user_email: user.email,
        tytul: document.getElementById('f-tytul').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        cena: parseFloat(document.getElementById('f-cena').value),
        lokalizacja: document.getElementById('f-lok').value,
        opis: document.getElementById('f-opis').value,
        zdjecia: zdjeciaUrls,
        telefon: document.getElementById('f-tel').value
    }]);

    if (error) {
        alert("Błąd: " + error.message);
        btn.disabled = false;
        btn.innerText = "Opublikuj ogłoszenie";
    } else {
        alert("Ogłoszenie dodane pomyślnie!");
        location.reload();
    }
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
            <div onclick="pokazMojeOgloszenia('aktywne')" 
                 style="padding:10px; cursor:pointer; font-weight:bold; border-bottom:3px solid ${tab === 'aktywne' ? 'var(--primary)' : 'transparent'}">
                 Aktywne (${aktywne.length})
            </div>
            <div onclick="pokazMojeOgloszenia('zakonczone')" 
                 style="padding:10px; cursor:pointer; font-weight:bold; border-bottom:3px solid ${tab === 'zakonczone' ? 'var(--primary)' : 'transparent'}">
                 Zakończone (${zakonczone.length})
            </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:12px;">
            ${wyswietlane.map(o => `
                <div style="border:1px solid #ddd; border-radius:10px; overflow:hidden;">
                    <img src="${o.zdjecia[0]}" style="width:100%; height:100px; object-fit:cover;">
                    <div style="padding:8px;">
                        <b style="font-size:13px;">${o.cena} zł</b>
                        <div style="display:flex; gap:5px; margin-top:8px;">
                            <button onclick="edytujOgloszenie(${o.id})" style="flex:1; padding:5px; font-size:11px;">Edytuj</button>
                            <button onclick="usunOgloszenie(${o.id})" style="padding:5px; color:red; border:none; background:none; cursor:pointer;">🗑️</button>
                        </div>
                    </div>
                </div>`).join('')}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.usunOgloszenie = async (id) => {
    if (!confirm("Czy na pewno chcesz usunąć to ogłoszenie i zdjęcia z serwera?")) return;

    try {
        const o = daneOgloszen.find(x => x.id === id);
        if (o && o.zdjecia && o.zdjecia.length > 0) {
            const plikiDoUsuniecia = o.zdjecia.map(url => url.split('/').pop());
            await baza.storage.from('zdjecia').remove(plikiDoUsuniecia);
        }

        const { error } = await baza.from('ogloszenia').delete().eq('id', id);
        if (error) throw error;

        alert("Usunięto pomyślnie.");
        location.reload();
    } catch (err) {
        alert("Błąd: " + err.message);
    }
};

// --- KATEGORIE I RENDEROWANIE ---
window.toggleSubcats = (kat) => {
    const p = document.getElementById('subcat-panel');
    if (!p) return;
    if (p.dataset.activeKat === kat && p.style.display === 'flex') {
        p.style.display = 'none'; p.dataset.activeKat = ''; return;
    }
    p.style.display = 'flex';
    p.dataset.activeKat = kat;
    p.innerHTML = (SUB_DATA[kat] || []).map(s => `
        <div class="sub-pill" onclick="otworzFiltry('${kat}', '${s}')">${s}</div>
    `).join('');
};

window.filtrujPoPodkat = (kat, podkat) => {
    const wyniki = daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat);
    pokazWynikiModal(`${kat} > ${podkat}`, wyniki);
};

// --- PAGINACJA WYNIKÓW ---
function pokazWynikiModal(tytul, wyniki, strona = 1) {
    const content = document.getElementById('view-content');
    const start = (strona - 1) * OGLOSZENIA_NA_STRONE;
    const koniec = start + OGLOSZENIA_NA_STRONE;
    const porcja = wyniki.slice(start, koniec);
    const lacznieStron = Math.ceil(wyniki.length / OGLOSZENIA_NA_STRONE);

    let paginacjaHTML = '';
    if (lacznieStron > 1) {
        paginacjaHTML = `<div style="display:flex; justify-content:center; gap:8px; margin-top:30px; padding-bottom:20px; flex-wrap:wrap;">`;
        for (let i = 1; i <= lacznieStron; i++) {
            const active = i === strona;
            paginacjaHTML += `
                <button onclick="pokazWynikiModal('${tytul.replace(/'/g, "\\'")}', JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(wyniki))}')), ${i})" 
                    style="padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:bold; background:${active ? 'var(--primary)' : '#eee'}; color:${active ? 'white' : '#333'};">
                    ${i}
                </button>`;
        }
        paginacjaHTML += `</div>`;
    }

    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h2>${tytul}</h2>
        <div id="modal-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px; margin-top:20px; max-height:65vh; overflow-y:auto; padding-right:5px;">
            ${porcja.length ? porcja.map(o => renderCardHTML(o)).join('') : '<p>Brak ogłoszeń.</p>'}
        </div>
        ${paginacjaHTML}`;
    
    document.getElementById('modal-view').style.display = 'flex';
    const grid = document.getElementById('modal-grid');
    if(grid) grid.scrollTop = 0;
}

function renderCardHTML(o) {
    const isFav = mojeUlubione.includes(o.id);
    return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer; position:relative;">
            <div onclick="toggleUlubione(event, ${o.id})" style="position:absolute; top:10px; right:10px; z-index:10; background:rgba(255,255,255,0.8); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
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

function renderTop12(lista) {
    const k = document.getElementById('lista');
    if (!k) return;
    const teraz = new Date();
    const limit = 1000 * 60 * 60 * 24 * 28;
    const aktywne = lista.filter(o => (teraz - new Date(o.created_at)) < limit);
    const top12 = aktywne.slice(0, 12);
    k.style.display = 'grid';
    k.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))'; 
    k.style.gap = '20px';
    k.innerHTML = top12.map(o => renderCardHTML(o)).join('');
}

// --- ULUBIONE ---
window.toggleUlubione = async (e, id) => {
    e.stopPropagation();
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się, aby dodać do ulubionych!");
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
    
    if(document.getElementById('view-content').innerText.includes("Twoje Ulubione")) {
        pokazUlubione();
    }
};

window.pokazUlubione = () => {
    const ulubioneLista = daneOgloszen.filter(o => mojeUlubione.includes(o.id));
    pokazWynikiModal("Twoje Ulubione", ulubioneLista);
};

window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

// --- INICJALIZACJA ---
async function init() {
    await sprawdzUzytkownika();
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    renderTop12(daneOgloszen);
}

init();

// --- EDYTUJ OGŁOSZENIE ---
window.edytujOgloszenie = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    edytowaneZdjecia = Array.isArray(o.zdjecia) ? [...o.zdjecia] : [o.zdjecia];
    renderujFormularzEdycji(o);
    // Dodaj to, żeby pola specjalne (np. dla aut) pojawiły się od razu:
    updateFormSubcats('e-'); 
};

function renderujFormularzEdycji(o) {
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="pokazMojeOgloszenia()">&times;</button>
        <h3>Edytuj ogłoszenie</h3>
        <form onsubmit="zapiszEdycje(event, ${o.id})" style="display:flex; flex-direction:column; gap:12px;">
            <input type="text" id="e-tytul" value="${o.tytul}" required placeholder="Tytuł" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <div style="display:flex; gap:10px;">
                <select id="e-kat" onchange="updateFormSubcats('e-')" required style="flex:1; padding:10px; border-radius:8px;">
                    ${Object.keys(SUB_DATA).map(k => `<option value="${k}" ${o.kategoria === k ? 'selected' : ''}>${k}</option>`).join('')}
                </select>
                <select id="e-podkat" onchange="updateFormSubcats('e-')" required style="flex:1; padding:10px; border-radius:8px;">
                    ${(SUB_DATA[o.kategoria] || []).map(x => `<option value="${x}" ${o.podkategoria === x ? 'selected' : ''}>${x}</option>`).join('')}
                </select>
            </div>
            <div id="extra-fields-edit"></div>
            <input type="number" id="e-cena" value="${o.cena}" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <input type="text" id="e-lok" value="${o.lokalizacja}" required style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <textarea id="e-opis" rows="8" required style="padding:10px; border-radius:8px; border:1px solid #ccc; font-family:inherit;">${o.opis}</textarea>
            <button type="submit" id="btn-e-save" style="background:var(--primary); color:white; padding:12px; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">
                Zapisz zmiany
            </button>
        </form>`;
}

window.zapiszEdycje = async (e, id) => {
    e.preventDefault();
    const btn = document.getElementById('btn-e-save');
    btn.disabled = true; 
    btn.innerText = "Zapisywanie...";
    
    // 1. Zbieramy dane techniczne (jeśli istnieją)
    let dodatkoweDane = "";
    const marka = document.getElementById('extra-marka')?.value;
    const model = document.getElementById('extra-model')?.value;
    const rok = document.getElementById('extra-rok')?.value;
    const przebieg = document.getElementById('extra-przebieg')?.value;
    const poj = document.getElementById('extra-pojemnosc')?.value;
    const moc = document.getElementById('extra-moc')?.value;
    const paliwo = document.getElementById('extra-paliwo')?.value;

    if (marka) {
        dodatkoweDane = "\n\n--- DANE ---" + 
                        `\nMarka: ${marka}` + 
                        `\nModel: ${model}` + 
                        `\nRok produkcji: ${rok}` + 
                        `\nPrzebieg: ${przebieg} km` + 
                        `\nPojemność: ${poj}` + 
                        `\nMoc: ${moc} KM` + 
                        `\nPaliwo: ${paliwo}`;
    }

    // 2. Czyścimy stary opis z poprzednich danych technicznych i łączymy z nowymi
    const obecnyOpis = document.getElementById('e-opis').value;
    const czystyOpis = obecnyOpis.split('--- DANE ---')[0].trim();
    const opisFinalny = czystyOpis + dodatkoweDane;

    try {
        const { error } = await baza.from('ogloszenia').update({
            tytul: document.getElementById('e-tytul').value,
            kategoria: document.getElementById('e-kat').value,
            podkategoria: document.getElementById('e-podkat').value,
            cena: parseFloat(document.getElementById('e-cena').value),
            lokalizacja: document.getElementById('e-lok').value,
            opis: opisFinalny
        }).eq('id', id);

        if (error) throw error;
        location.reload();
    } catch (err) {
        alert("Błąd: " + err.message);
        btn.disabled = false;
        btn.innerText = "Zapisz zmiany";
    }
};
