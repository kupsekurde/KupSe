const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];

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
    'Inne': ['Kolekcje', 'Antyki', 'Bilety', 'Oddam za darmo', 'Zamienię', 'Pozostałe']
};

// --- LOGOWANIE I REJESTRACJA ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert("Błąd: " + error.message); else location.reload();
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength || !hasUpperCase || !hasDigit || !hasSpecialChar) {
        let msg = "Hasło musi spełniać wymagania:\n";
        if (!hasMinLength) msg += "- minimum 8 znaków\n";
        if (!hasUpperCase) msg += "- przynajmniej jedna wielka litera\n";
        if (!hasDigit) msg += "- przynajmniej jedna cyfra\n";
        if (!hasSpecialChar) msg += "- przynajmniej jeden znak specjalny";
        return alert(msg);
    }

    const { error } = await baza.auth.signUp({ email, password });
    if (error) alert("Błąd rejestracji: " + error.message); else alert("Rejestracja pomyślna! Sprawdź e-mail, aby aktywować konto.");
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- INTERFEJS UŻYTKOWNIKA ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        if (document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'none';
        
        const nazwaUzytkownika = user.email.split('@')[0]; // Nazwa przed @
        
        const { count: msgCount } = await baza.from('wiadomosci').select('*', { count: 'exact', head: true }).eq('odbiorca', user.email).eq('przeczytane', false);
        const { data: uData } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = uData ? uData.map(x => x.ogloszenie_id) : [];

        document.getElementById('user-nav').innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <button onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800; position:relative;">
                    ${nazwaUzytkownika} ▾
                    ${msgCount > 0 ? `<span style="position:absolute; top:-5px; right:-5px; background:red; border-radius:50%; width:18px; height:18px; font-size:10px; display:flex; align-items:center; justify-content:center;">${msgCount}</span>` : ''}
                </button>
                <div id="drop-menu" style="display:none; position:absolute; top:60px; right:5%; background:white; box-shadow:0 5px 20px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:200px;">
                    <div style="font-size:11px; color:gray; margin-bottom:10px;">Zalogowany jako: <b>${user.email}</b></div>
                    <div onclick="pokazMojeOgloszenia()" style="padding:10px; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div onclick="pokazSkrzynke()" style="padding:10px; cursor:pointer;">✉️ Wiadomości</div>
                    <div onclick="pokazUlubione()" style="padding:10px; cursor:pointer;">❤️ Ulubione</div>
                    <hr style="border:0; border-top:1px solid #eee;">
                    <div onclick="wyloguj()" style="padding:10px; cursor:pointer; color:red; font-weight:bold;">🚪 Wyloguj</div>
                </div>
                <button onclick="document.getElementById('modal-form').style.display='flex'" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj ogłoszenie</button>
            </div>`;
    }
}

// --- OBSŁUGA FORMULARZA ---
window.updateFormSubcats = (p = 'f-') => {
    const kat = document.getElementById(`${p}kat`).value;
    const podkatSelect = document.getElementById(`${p}podkat`);
    const extraFields = document.getElementById('extra-fields');
    
    if (event && event.target.id === `${p}kat`) {
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
                    <option value="">Paliwo</option>
                    <option value="Benzyna">Benzyna</option><option value="LPG">LPG</option>
                    <option value="Diesel">Diesel</option><option value="Hybryda">Hybryda</option>
                    <option value="Elektryczny">Elektryczny</option>
                </select>
                <select id="extra-skrzynia" required>
                    <option value="">Skrzynia biegów</option>
                    <option value="Automatyczna">Automatyczna</option>
                    <option value="Manualna">Manualna</option>
                </select>
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

    let dodatkoweDane = "";
    if (document.getElementById('extra-marka')) {
        dodatkoweDane = "\n\n--- DANE ---" + 
            `\nMarka: ${document.getElementById('extra-marka').value}` + 
            `\nModel: ${document.getElementById('extra-model').value}` + 
            `\nRok: ${document.getElementById('extra-rok').value}` + 
            `\nPrzebieg: ${document.getElementById('extra-przebieg').value}` + 
            `\nPaliwo: ${document.getElementById('extra-paliwo').value}` + 
            `\nSkrzynia: ${document.getElementById('extra-skrzynia').value}`;
    }

    const zdjeciaUrls = [];
    for (const file of files) {
        try {
            const compressedFile = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1200 });
            const nazwa = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            await baza.storage.from('zdjecia').upload(nazwa, compressedFile);
            zdjeciaUrls.push(baza.storage.from('zdjecia').getPublicUrl(nazwa).data.publicUrl);
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

    if (error) { alert("Błąd: " + error.message); btn.disabled = false; btn.innerText = "Opublikuj ogłoszenie"; } 
    else location.reload();
};

// --- FILTROWANIE I WYSZUKIWANIE ---
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
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
            <input type="text" id="sf-marka" placeholder="Marka">
            <input type="text" id="sf-model" placeholder="Model">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="number" id="sf-rok-min" placeholder="Rok od">
                <input type="number" id="sf-rok-max" placeholder="Rok do">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="number" id="sf-cena-min" placeholder="Cena od">
                <input type="number" id="sf-cena-max" placeholder="Cena do">
            </div>
            <select id="sf-paliwo">
                <option value="">Wszystkie paliwa</option>
                <option value="Benzyna">Benzyna</option><option value="LPG">LPG</option>
                <option value="Diesel">Diesel</option><option value="Hybryda">Hybryda</option>
            </select>
            <button onclick="zastosujFiltryMoto('${kat}', '${podkat}')" style="background:var(--primary); color:white; padding:15px; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">SZUKAJ</button>
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

    const wyniki = daneOgloszen.filter(o => {
        if (o.kategoria !== kat || o.podkategoria !== podkat) return false;
        if (o.cena < cMin || o.cena > cMax) return false;
        const d = o.opis.toLowerCase();
        if (marka && !d.includes(`marka: ${marka}`)) return false;
        if (model && !d.includes(`model: ${model}`)) return false;
        const rMatch = o.opis.match(/Rok: (\d{4})/);
        const autoRok = rMatch ? parseInt(rMatch[1]) : 0;
        if (autoRok < rMin || autoRok > rMax) return false;
        if (paliwo && !d.includes(`paliwo: ${paliwo}`)) return false;
        return true;
    });
    pokazWynikiModal(`${podkat} (Filtrowane)`, wyniki);
};

// --- FUNKCJE POMOCNICZE ---
window.toggleSubcats = (kat) => {
    const p = document.getElementById('subcat-panel');
    p.style.display = 'flex';
    p.innerHTML = (SUB_DATA[kat] || []).map(s => `<div class="sub-pill" onclick="otworzFiltry('${kat}', '${s}')">${s}</div>`).join('');
};

window.toggleUserMenu = (e) => { e.stopPropagation(); const m = document.getElementById('drop-menu'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; };
window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    document.getElementById('view-content').innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; flex-wrap:wrap; gap:20px;">
            <div style="flex:1.5; min-width:300px;"><img src="${o.zdjecia[0]}" style="width:100%; border-radius:15px; box-shadow:0 10px 30px rgba(0,0,0,0.1);"></div>
            <div style="flex:1;">
                <h2>${o.tytul}</h2><h1 style="color:var(--primary)">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja} | 📞 ${o.telefon}</p>
                <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                <p style="white-space:pre-line; color:#444;">${o.opis}</p>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

function pokazWynikiModal(tytul, wyniki) {
    const content = document.getElementById('view-content');
    content.innerHTML = `<button class="close-btn" onclick="zamknijModal()">&times;</button><h2>${tytul}</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:20px; margin-top:20px;">
            ${wyniki.length ? wyniki.map(o => `
                <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="background:white; border-radius:15px; overflow:hidden; border:1px solid #eee; cursor:pointer;">
                    <img src="${o.zdjecia[0]}" style="width:100%; height:150px; object-fit:cover;">
                    <div style="padding:12px;"><b>${o.cena} zł</b><br><small style="color:#333;">${o.tytul}</small></div>
                </div>`).join('') : '<p>Brak ogłoszeń.</p>'}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
}

async function init() {
    await sprawdzUzytkownika();
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    document.getElementById('lista').innerHTML = daneOgloszen.slice(0, 12).map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="background:white; border-radius:15px; overflow:hidden; border:1px solid #eee; cursor:pointer;">
            <img src="${o.zdjecia[0]}" style="width:100%; height:160px; object-fit:cover;">
            <div style="padding:15px;"><b>${o.cena} zł</b><div style="font-size:14px; margin-top:5px;">${o.tytul}</div></div>
        </div>`).join('');
}
init();
