const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let wynikiDlaPaginacji = [];
let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];
let edytowaneZdjecia = [];
let ostatnieWyniki = [];
let ostatniTytul = "";
let wynikiBazowe = [];

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

    // Sprawdzamy warunki:
    const hasUpperCase = /[A-Z]/.test(password); // Czy jest duża litera
    const hasNumber = /\d/.test(password);        // Czy jest cyfra (liczba)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password); // Czy jest znak specjalny
    const hasMinLength = password.length >= 8;    // Czy ma min. 8 znaków

    // Jeśli którykolwiek warunek NIE jest spełniony:
    if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
        let msg = "Hasło nie spełnia wymagań:\n";
        msg += "- minimum 8 znaków\n";
        msg += "- duża litera\n";
        msg += "- liczba\n";
        msg += "- znak specjalny";
        
        return alert(msg);
    }

    // Jeśli wszystko ok, wysyłamy do bazy:
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
        // 1. Ukrywamy formularz logowania/rejestracji
        if (document.getElementById('auth-box')) {
            document.getElementById('auth-box').style.display = 'none';
        }

        // 2. Przygotowujemy nazwę użytkownika
        const nazwaZMaila = user.email.split('@')[0];
        const witajImie = nazwaZMaila.charAt(0).toUpperCase() + nazwaZMaila.slice(1);

        // 3. Pobieramy liczbę nieprzeczytanych wiadomości i ulubione
        const { count: msgCount } = await baza
            .from('wiadomosci')
            .select('*', { count: 'exact', head: true })
            .eq('odbiorca', user.email)
            .eq('przeczytane', false);

        const { data: uData } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = uData ? uData.map(x => x.ogloszenie_id) : [];

        // 4. Wstawiamy przyciski do paska nawigacji
        nav.innerHTML = `
            <div id="menu-container" style="position:relative; display:flex; gap:15px; align-items:center;">
                <span style="font-weight:800; color:var(--text); font-size:14px;">Witaj ${witajImie}</span>
                
                <button onclick="window.otworzFormularzDodawania()" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj ogłoszenie</button>
                
                <button id="menu-btn" onclick="window.toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800; position:relative;">
                    Moje Konto ▼
                    ${msgCount > 0 ? `<span id="msg-badge" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; width:20px; height:20px; font-size:11px; display:flex; align-items:center; justify-content:center; border:2px solid white;">${msgCount}</span>` : ''}
                </button>

                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:220px;">
                    <div style="padding-bottom:10px; border-bottom:1px solid #eee; margin-bottom:10px;">
                        <small style="color:gray;">Zalogowany jako:</small><br>
                        <b style="font-size:13px; word-break:break-all;">${user.email}</b>
                    </div>
                    <div onclick="window.pokazMojeOgloszenia()" style="padding:10px; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div onclick="window.pokazSkrzynke()" style="padding:10px; cursor:pointer;">✉️ Wiadomości ${msgCount > 0 ? `<b>(${msgCount})</b>` : ''}</div>
                    <div onclick="window.pokazUlubione()" style="padding:10px; cursor:pointer;">❤️ Ulubione (${mojeUlubione.length})</div>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <div onclick="window.wyloguj()" style="padding:10px; cursor:pointer; color:red; font-weight:bold;">🚪 Wyloguj</div>
                </div>
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

    const { data: { user } } = await baza.auth.getUser();
    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    
    const telefonWidok = user ? `<b>${o.telefon}</b>` : `<span style="color:red;">[Zaloguj się]</span>`;
    
    // Przycisk wstecz pojawia się tylko, jeśli mamy do czego wrócić
    const btnWstecz = ostatnieWyniki.length > 0 
        ? `<button onclick="window.pokazWynikiModal(ostatniTytul, ostatnieWyniki)" style="margin-bottom:15px; background:#eee; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">← Powrót do listy</button>` 
        : "";

    document.getElementById('view-content').innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        ${btnWstecz}
        <div style="display:flex; flex-wrap:wrap; gap:20px;">
            <div style="flex:1.5; min-width:300px;">
                <div style="background:#000; border-radius:15px; height:350px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="max-width:100%; max-height:100%; cursor:zoom-in;" onclick="otworzFullFoto()">
                </div>
                <div style="display:flex; gap:8px; margin-top:10px; overflow-x:auto;">
                    ${aktualneFotki.map((img, i) => `<img src="${img}" onclick="zmienGlowneZdjecie(${i})" class="mini-foto" style="width:65px; height:65px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid ${i===0?'var(--primary)':'transparent'};">`).join('')}
                </div>
            </div>
            <div style="flex:1;">
                <div style="font-size:12px; color:gray;">Dodano: ${formatujDate(o.created_at)}</div>
                <h2>${o.tytul}</h2>
                <h1 style="color:var(--primary);">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja} | 📞 ${telefonWidok}</p>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button onclick="wyslijWiadomosc('${o.user_email}')" style="flex:1; padding:12px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Wyślij wiadomość</button>
                    <button onclick="toggleUlubione(event, ${o.id})" class="fav-btn-${o.id}" style="padding:12px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer;">
                        ${mojeUlubione.includes(o.id) ? '❤️' : '🤍'}
                    </button>
                </div>
                <h3 style="margin-top:20px;">Opis</h3>
                <p style="white-space:pre-line;">${o.opis}</p>
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
    if (kat !== 'Motoryzacja') {
        filtrujPoPodkat(kat, podkat);
        return;
    }
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h3>Szukaj w: ${podkat}</h3>
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:15px;">
            <input type="text" id="sf-marka" placeholder="Marka (np. Opel)" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            <input type="text" id="sf-model" placeholder="Model" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="number" id="sf-rok-min" placeholder="Rok od" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="number" id="sf-rok-max" placeholder="Rok do" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="number" id="sf-cena-min" placeholder="Cena od (zł)" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <input type="number" id="sf-cena-max" placeholder="Cena do (zł)" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
            </div>

            <select id="sf-paliwo" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <option value="">Wszystkie paliwa</option>
                <option value="Benzyna">Benzyna</option>
                <option value="LPG">LPG</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybryda">Hybryda</option>
                <option value="Elektryczny">Elektryczny</option>
            </select>

            <select id="sf-skrzynia" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                <option value="">Wszystkie skrzynie</option>
                <option value="Manualna">Manualna</option>
                <option value="Automatyczna">Automatyczna</option>
            </select>

            <button onclick="zastosujFiltryMoto('${kat}', '${podkat}')" 
                    style="background:var(--primary); color:white; padding:15px; border:none; border-radius:10px; cursor:pointer; font-weight:bold; margin-top:10px;">
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
    
    if (event && event.target && event.target.id === `${p}kat`) {
        podkatSelect.innerHTML = '<option value="">Podkategoria</option>' + (SUB_DATA[kat] || []).map(x => `<option value="${x}">${x}</option>`).join('');
    }
    
    if (!extraFields) return;
    extraFields.innerHTML = ''; 

    const wybranaPodkat = podkatSelect.value;
    const typyPojazdow = ['Samochody osobowe', 'Dostawcze', 'Motocykle', 'Skutery'];

  if (kat === 'Motoryzacja' && typyPojazdow.includes(wybranaPodkat)) {
    extraFields.innerHTML = `
        <div style="display:grid; gap:10px; margin-bottom:10px;">
            <input type="text" id="extra-marka" placeholder="Marka" required>
            <input type="text" id="extra-model" placeholder="Model" required>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <input type="number" id="extra-rok" placeholder="Rok produkcji" required>
                <input type="number" id="extra-przebieg" placeholder="Przebieg (km)" required>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <input type="text" id="extra-pojemnosc" placeholder="Pojemność (np. 1.9)" required>
                <input type="number" id="extra-moc" placeholder="Moc (KM)" required>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <select id="extra-paliwo" required>
                    <option value="">Paliwo</option>
                    <option value="Benzyna">Benzyna</option>
                    <option value="LPG">LPG</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybryda">Hybryda</option>
                    <option value="Elektryczny">Elektryczny</option>
                </select>
                <select id="extra-skrzynia" required>
                    <option value="">Skrzynia biegów</option>
                    <option value="Automatyczna">Automatyczna</option>
                    <option value="Manualna">Manualna</option>
                </select>
            </div>
        </div>`;
}
};
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    if (btn.disabled) return;

    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Musisz być zalogowany!");

    const inputPlik = document.getElementById('f-plik');
    const files = Array.from(inputPlik.files);
    if (files.length > 5) return alert("Maksymalnie 5 zdjęć!");

    btn.disabled = true;
    btn.innerText = "Kompresja zdjęć...";

    // Zbieranie danych technicznych
    let dodatkoweDane = "";
    const marka = document.getElementById('extra-marka')?.value;
   if (marka) {
    dodatkoweDane = "\n\n--- DANE ---" + 
                    `\nMarka: ${marka}` + 
                    `\nModel: ${model}` + 
                    `\nRok: ${rok}` + // Zmieniono z 'Rok produkcji' na 'Rok'
                    `\nPrzebieg: ${przebieg} km` + 
                    `\nPojemność: ${poj}` + 
                    `\nMoc: ${moc} KM` + 
                    `\nPaliwo: ${paliwo}`;
}

    const zdjeciaUrls = [];
    const compressionOptions = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };

    for (const file of files) {
        try {
            const compressedFile = await imageCompression(file, compressionOptions);
            const nazwa = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            await baza.storage.from('zdjecia').upload(nazwa, compressedFile);
            const { data: { publicUrl } } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            zdjeciaUrls.push(publicUrl);
        } catch (err) { console.error(err); }
    }

    btn.innerText = "Zapisywanie...";
    const { error } = await baza.from('ogloszenia').insert([{
        user_email: user.email,
        tytul: document.getElementById('f-tytul').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        cena: parseFloat(document.getElementById('f-cena').value),
        lokalizacja: document.getElementById('f-lok').value,
        opis: document.getElementById('f-opis').value + dodatkoweDane,
        zdjecia: zdjeciaUrls,
        telefon: document.getElementById('f-tel').value
    }]);

    if (error) {
        alert("Błąd: " + error.message);
        btn.disabled = false;
        btn.innerText = "Opublikuj ogłoszenie";
    } else {
        alert("Ogłoszenie dodane!");
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
window.pokazWynikiModal = (tytul, wyniki, strona = 1) => {
    // Jeśli wchodzimy do kategorii pierwszy raz (tytuł nie zawiera "(wyniki)")
    // zapisujemy wyniki jako bazę, której nie będziemy uczyć przy filtrowaniu
    if (!tytul.includes("(wyniki)")) {
        wynikiBazowe = [...wyniki]; 
        ostatniTytul = tytul;
    }
    
    ostatnieWyniki = wyniki; // To co aktualnie pokazujemy
    
    const content = document.getElementById('view-content');
    const start = (strona - 1) * OGLOSZENIA_NA_STRONE;
    const porcja = wyniki.slice(start, start + OGLOSZENIA_NA_STRONE);

    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; gap:20px; margin-top:20px;">
            <div style="width:220px; flex-shrink:0; background:#f8f9fa; padding:15px; border-radius:15px; height:fit-content; position:sticky; top:0;">
                <h4 style="margin-top:0;">Filtruj wyniki</h4>
                
                <label style="font-size:11px; font-weight:bold; color:gray;">SZUKAJ WYNIKÓW</label>
                <input type="text" id="side-szukaj" placeholder="Np. Opel, iPhone..." style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">

                <label style="font-size:11px; font-weight:bold; color:gray;">CENA (ZŁ)</label>
                <div style="display:flex; gap:5px; margin-bottom:12px;">
                    <input type="number" id="side-cena-min" placeholder="Od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    <input type="number" id="side-cena-max" placeholder="Do" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                </div>

                <label style="font-size:11px; font-weight:bold; color:gray;">LOKALIZACJA</label>
                <input type="text" id="side-lok" placeholder="Miasto..." style="width:100%; margin-bottom:15px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">

                <button onclick="zastosujFiltryBoczne()" style="width:100%; background:var(--primary); color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; font-weight:800;">Zastosuj filtry</button>
            </div>

            <div style="flex:1;">
                <h2 style="margin-top:0;">${tytul}</h2>
                <div id="modal-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:15px; max-height:75vh; overflow-y:auto; padding-right:10px;">
    ${porcja.length ? porcja.map(o => renderCardHTML(o)).join('') : '<p style="padding:20px; color:gray;">Nie znaleźliśmy ogłoszeń o tych parametrach.</p>'}
</div>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zastosujFiltryBoczne = () => {
    const fraza = document.getElementById('side-szukaj').value.toLowerCase().trim();
    const min = parseFloat(document.getElementById('side-cena-min').value) || 0;
    const max = parseFloat(document.getElementById('side-cena-max').value) || 99999999;
    const lok = document.getElementById('side-lok').value.toLowerCase().trim();

    // Filtrujemy ZAWSZE bazowe wyniki (wynikiBazowe), żeby nie tracić ogłoszeń przy zmianie filtrów
    const przefiltrowane = wynikiBazowe.filter(o => {
        // Inteligentne szukanie: sprawdź tytuł, opis i kategorię
        const tekstDoPrzeszukania = `${o.tytul} ${o.opis} ${o.podkategoria}`.toLowerCase();
        
        const tekstOk = fraza === "" || tekstDoPrzeszukania.includes(fraza);
        const cenaOk = o.cena >= min && o.cena <= max;
        const lokOk = lok === "" || o.lokalizacja.toLowerCase().includes(lok);
        
        return tekstOk && cenaOk && lokOk;
    });

    // Odświeżamy widok, przekazując przefiltrowaną listę
    window.pokazWynikiModal(ostatniTytul + " (wyniki)", przefiltrowane);
    
    // Przywracamy wartości do pól, żeby użytkownik widział co wpisał
    document.getElementById('side-szukaj').value = fraza;
    if(min > 0) document.getElementById('side-cena-min').value = min;
    if(max < 99999999) document.getElementById('side-cena-max').value = max;
    document.getElementById('side-lok').value = lok;
};


function renderCardHTML(o) {
    const isFav = mojeUlubione.includes(o.id);
    // Pobieramy sformatowaną datę i godzinę
    const pelnaData = formatujDate(o.created_at); // Przykład: "24.05.2024, 14:30"
    
    return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer; position:relative;">
            <div onclick="toggleUlubione(event, ${o.id})" class="fav-btn-${o.id}" style="position:absolute; top:10px; right:10px; z-index:10; background:rgba(255,255,255,0.8); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                ${isFav ? '❤️' : '🤍'}
            </div>
            <img src="${o.zdjecia[0]}" style="width:100%; height:150px; object-fit:cover;">
            <div style="padding:12px;">
                <b style="font-size:16px; color:var(--primary);">${o.cena} zł</b>
                <div style="font-size:13px; margin-top:4px; height:34px; overflow:hidden; color:#333; font-weight:600;">${o.tytul}</div>
                <div style="font-size:11px; color:gray; margin-top:8px; display:flex; justify-content:space-between; align-items: center;">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50%;">📍 ${o.lokalizacja}</span>
                    <span style="font-size:10px; opacity:0.8; text-align: right;">${pelnaData}</span>
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

    const wszystkieSerca = document.querySelectorAll(`.fav-btn-${id}`);
    wszystkieSerca.forEach(serce => {
        serce.innerText = mojeUlubione.includes(id) ? '❤️' : '🤍';
    });
};

window.pokazUlubione = () => {
    const ulubioneLista = daneOgloszen.filter(o => mojeUlubione.includes(o.id));
    pokazWynikiModal("Twoje Ulubione", ulubioneLista);
};

window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

async function init() {
    await sprawdzUzytkownika();
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    renderTop12(daneOgloszen);
}

init();

window.edytujOgloszenie = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    
    // TA LINIA JEST KLUCZOWA - zamyka okno "Moje ogłoszenia" przed otwarciem edycji
    document.getElementById('modal-view').style.display = 'none'; 
    
    edytowaneZdjecia = Array.isArray(o.zdjecia) ? [...o.zdjecia] : [o.zdjecia];
    renderujFormularzEdycji(o);
    updateFormSubcats('f-');
    };

window.usunZdjecieZEdycji = (index, ogloszenieId) => {
    edytowaneZdjecia.splice(index, 1);
    const o = daneOgloszen.find(x => x.id === ogloszenieId);
    renderujFormularzEdycji(o);
};

window.sprawdzLimitZdjec = (input) => {
    if (input.files.length + edytowaneZdjecia.length > 5) {
        alert("Max 5 zdjęć!");
        input.value = "";
    }
};

window.zastosujFiltryMoto = (kat, podkat) => {
    const marka = document.getElementById('sf-marka').value.toLowerCase().trim();
    const model = document.getElementById('sf-model').value.toLowerCase().trim();
    const rMin = parseInt(document.getElementById('sf-rok-min').value) || 0;
    const rMax = parseInt(document.getElementById('sf-rok-max').value) || 9999;
    const cMin = parseFloat(document.getElementById('sf-cena-min').value) || 0;
    const cMax = parseFloat(document.getElementById('sf-cena-max').value) || 99999999;
    const paliwo = document.getElementById('sf-paliwo').value;
    const skrzynia = document.getElementById('sf-skrzynia').value;

    const wyniki = daneOgloszen.filter(o => {
        if (o.kategoria !== kat || o.podkategoria !== podkat) return false;
        if (o.cena < cMin || o.cena > cMax) return false;
        const d = o.opis.toLowerCase();
        if (marka && !d.includes(`marka: ${marka}`)) return false;
        if (model && !d.includes(`model: ${model}`)) return false;
        const rokMatch = o.opis.match(/Rok: (\d{4})/);
        const autoRok = rokMatch ? parseInt(rokMatch[1]) : 0;
        if (autoRok < rMin || autoRok > rMax) return false;
        if (paliwo && !d.includes(`paliwo: ${paliwo.toLowerCase()}`)) return false;
        if (skrzynia && !d.includes(`skrzynia: ${skrzynia.toLowerCase()}`)) return false;
        return true;
    });

    pokazWynikiModal(`${podkat} (Filtrowane)`, wyniki);
};
window.renderujFormularzEdycji = (o) => {
    const modal = document.getElementById('modal-form');
    modal.style.display = 'flex';
    const naglowek = document.querySelector('#modal-form h2');
    if(naglowek) naglowek.innerText = "Edytuj ogłoszenie";
    
    // Wypełniamy pola tekstowe
    document.getElementById('f-tytul').value = o.tytul;
    document.getElementById('f-kat').value = o.kategoria;
    window.updateFormSubcats('f-');
    document.getElementById('f-podkat').value = o.podkategoria;
    document.getElementById('f-cena').value = o.cena;
    document.getElementById('f-lok').value = o.lokalizacja;
    document.getElementById('f-tel').value = o.telefon;
    document.getElementById('f-opis').value = o.opis.split('--- DANE ---')[0].trim();

    // --- LOGIKA ZDJĘĆ W EDYCJI ---
    const inputPlik = document.getElementById('f-plik');
    inputPlik.required = false; // Przy edycji nie musimy dodawać nowych plików
    inputPlik.onchange = () => window.sprawdzLimitZdjec(inputPlik);

    // Szukamy kontenera na podgląd (jeśli nie ma, tworzymy go nad przyciskiem wyboru plików)
    let previewBox = document.getElementById('edit-photo-preview');
    if(!previewBox) {
        previewBox = document.createElement('div');
        previewBox.id = 'edit-photo-preview';
        previewBox.style = "display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px; background:#eee; padding:10px; border-radius:10px;";
        inputPlik.parentNode.insertBefore(previewBox, inputPlik);
    }

    // Funkcja odświeżająca widok małych zdjęć w edycji
    const odswiezMiniatury = () => {
        previewBox.innerHTML = edytowaneZdjecia.map((url, i) => `
            <div style="position:relative; width:70px; height:70px; border-radius:8px; overflow:hidden; border:2px solid #ddd;">
                <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
                <div onclick="window.usunZdjecieZEdycji(${i}, ${o.id})" 
                     style="position:absolute; top:0; right:0; background:red; color:white; width:20px; height:20px; cursor:pointer; text-align:center; font-weight:bold; line-height:18px;">&times;</div>
            </div>
        `).join('') + (edytowaneZdjecia.length === 0 ? '<span style="font-size:12px; color:gray;">Brak zdjęć. Dodaj nowe poniżej.</span>' : '');
    };

    // Nadpisujemy funkcję usuwania, żeby od razu odświeżała widok
    window.usunZdjecieZEdycji = (index) => {
        edytowaneZdjecia.splice(index, 1);
        odswiezMiniatury();
    };

    odswiezMiniatury();

    // --- ZAPISYWANIE ZMIAN ---
    const btn = document.getElementById('btn-save');
    btn.innerText = "Zapisz zmiany";
    
    document.getElementById('form-dodaj').onsubmit = async (e) => {
        e.preventDefault();
        if(btn.disabled) return;

        const nowePliki = Array.from(inputPlik.files);
        if(edytowaneZdjecia.length + nowePliki.length > 5) return alert("Maksymalnie 5 zdjęć łącznie!");

        btn.disabled = true;
        btn.innerText = "Przetwarzanie...";

        let finalneZdjecia = [...edytowaneZdjecia];

        // Jeśli użytkownik dodał nowe pliki - kompresujemy i wysyłamy
        if(nowePliki.length > 0) {
            btn.innerText = "Wysyłanie zdjęć...";
            const compressionOptions = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
            for (const file of nowePliki) {
                try {
                    const compressedFile = await imageCompression(file, compressionOptions);
                    const nazwa = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                    await baza.storage.from('zdjecia').upload(nazwa, compressedFile);
                    const { data: { publicUrl } } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
                    finalneZdjecia.push(publicUrl);
                } catch (err) { console.error("Błąd zdjęcia:", err); }
            }
        }

        const { error } = await baza.from('ogloszenia').update({
            tytul: document.getElementById('f-tytul').value,
            cena: parseFloat(document.getElementById('f-cena').value),
            lokalizacja: document.getElementById('f-lok').value,
            opis: document.getElementById('f-opis').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: finalneZdjecia // Zapisujemy połączoną listę (stare + nowe)
        }).eq('id', o.id);

        if (error) {
            alert("Błąd: " + error.message);
            btn.disabled = false;
        } else {
            alert("Ogłoszenie zaktualizowane!");
            location.reload();
        }
    };
};
