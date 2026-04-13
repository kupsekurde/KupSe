const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];

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
    return d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
    const { error } = await baza.auth.signUp({ email, password });
    if (error) alert("Błąd: " + error.message); else alert("Sprawdź e-mail!");
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- INTERFEJS ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user && nav) {
        if (document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'none';
        const { count: msgCount } = await baza.from('wiadomosci').select('*', { count: 'exact', head: true }).eq('odbiorca', user.email).eq('przeczytane', false);
        const { data: uData } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = uData ? uData.map(x => x.ogloszenie_id) : [];

        nav.innerHTML = `
            <div id="menu-container" style="display:flex; gap:10px; align-items:center; position:relative;">
                <button id="menu-btn" onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800;">
                    Moje Konto ▼ ${msgCount > 0 ? `<span style="background:red; padding:2px 6px; border-radius:50%; font-size:10px;">${msgCount}</span>` : ''}
                </button>
                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:220px;">
                    <div onclick="pokazMojeOgloszenia()" style="padding:10px; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div onclick="pokazSkrzynke()" style="padding:10px; cursor:pointer;">✉️ Wiadomości</div>
                    <div onclick="pokazUlubione()" style="padding:10px; cursor:pointer;">❤️ Ulubione</div>
                    <div onclick="wyloguj()" style="padding:10px; cursor:pointer; color:red;">🚪 Wyloguj</div>
                </div>
                <button onclick="otworzFormularzDodawania()" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer;">+ Dodaj</button>
            </div>`;
    }
}

window.toggleUserMenu = (e) => { 
    e.stopPropagation(); 
    const m = document.getElementById('drop-menu'); 
    if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; 
};

// --- FORMULARZE (DODAWANIE / EDYCJA) ---
window.updateFormSubcats = (prefix = 'f-') => {
    const kat = document.getElementById(`${prefix}kat`).value;
    const podkatSelect = document.getElementById(`${prefix}podkat`);
    const extraFields = document.getElementById(prefix === 'e-' ? 'extra-fields-edit' : 'extra-fields');
    
    if (podkatSelect) {
        const opcje = (SUB_DATA[kat] || []).map(x => `<option value="${x}">${x}</option>`).join('');
        podkatSelect.innerHTML = '<option value="">Podkategoria</option>' + opcje;
    }
    
    if (extraFields) {
        extraFields.innerHTML = (kat === 'Motoryzacja') ? `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#f0f7ff; padding:10px; border-radius:8px; margin:10px 0;">
                <input type="text" id="${prefix}extra-marka" placeholder="Marka" required style="padding:8px;">
                <input type="text" id="${prefix}extra-model" placeholder="Model" required style="padding:8px;">
                <input type="number" id="${prefix}extra-rok" placeholder="Rok" required style="padding:8px;">
                <select id="${prefix}extra-paliwo" required style="padding:8px; grid-column: span 2;">
                    <option value="Benzyna">Benzyna</option><option value="Diesel">Diesel</option><option value="LPG">LPG</option>
                </select>
            </div>` : '';
    }
};

window.otworzFormularzDodawania = () => {
    document.getElementById('modal-form').style.display = 'flex';
    document.getElementById('form-dynamic-content').innerHTML = `
        <form id="form-dodaj" onsubmit="wyslijOgloszenie(event)">
            <input type="text" id="f-tytul" placeholder="Tytuł" required style="width:100%; margin-bottom:10px; padding:10px;">
            <select id="f-kat" onchange="updateFormSubcats('f-')" required style="width:100%; margin-bottom:10px; padding:10px;">
                <option value="">Wybierz kategorię</option>
                ${Object.keys(SUB_DATA).map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>
            <select id="f-podkat" required style="width:100%; margin-bottom:10px; padding:10px;"><option value="">Podkategoria</option></select>
            <div id="extra-fields"></div>
            <input type="number" id="f-cena" placeholder="Cena" required style="width:100%; margin-bottom:10px; padding:10px;">
            <input type="text" id="f-lok" placeholder="Lokalizacja" required style="width:100%; margin-bottom:10px; padding:10px;">
            <textarea id="f-opis" placeholder="Opis" required style="width:100%; margin-bottom:10px; padding:10px;"></textarea>
            <input type="file" id="f-plik" multiple accept="image/*" style="margin-bottom:10px;">
            <button type="submit" id="btn-save" style="width:100%; padding:15px; background:var(--primary); color:white; border:none; cursor:pointer;">Opublikuj</button>
        </form>`;
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;

    try {
        const { data: { user } } = await baza.auth.getUser();
        const pliki = document.getElementById('f-plik').files;
        let linki = [];
        for (let f of pliki) {
            const n = `${Date.now()}_${f.name}`;
            await baza.storage.from('zdjecia').upload(n, f);
            linki.push(baza.storage.from('zdjecia').getPublicUrl(n).data.publicUrl);
        }

        let dane = "";
        if(document.getElementById('f-extra-marka')) {
            dane = `\n\n--- DANE ---\nMarka: ${document.getElementById('f-extra-marka').value}\nModel: ${document.getElementById('f-extra-model').value}\nRok: ${document.getElementById('f-extra-rok').value}\nPaliwo: ${document.getElementById('f-extra-paliwo').value}`;
        }

        await baza.from('ogloszenia').insert([{
            tytul: document.getElementById('f-tytul').value,
            kategoria: document.getElementById('f-kat').value,
            podkategoria: document.getElementById('f-podkat').value,
            cena: parseFloat(document.getElementById('f-cena').value),
            lokalizacja: document.getElementById('f-lok').value,
            opis: document.getElementById('f-opis').value + dane,
            zdjecia: linki,
            user_email: user.email
        }]);
        location.reload();
    } catch (err) { alert(err.message); btn.disabled = false; }
};

// --- MOJE OGŁOSZENIA & EDYCJA ---
window.pokazMojeOgloszenia = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const moje = daneOgloszen.filter(o => o.user_email === user.email);
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h2>Moje ogłoszenia</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap:10px;">
            ${moje.map(o => `
                <div style="border:1px solid #ddd; padding:10px; border-radius:10px;">
                    <img src="${o.zdjecia[0]}" style="width:100%; height:80px; object-fit:cover;">
                    <button onclick="edytujOgloszenie(${o.id})" style="width:100%; margin-top:5px;">Edytuj</button>
                    <button onclick="usunOgloszenie(${o.id})" style="width:100%; color:red; margin-top:5px;">Usuń</button>
                </div>`).join('')}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.edytujOgloszenie = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <h3>Edytuj: ${o.tytul}</h3>
        <form onsubmit="zapiszEdycje(event, ${o.id})">
            <input type="text" id="e-tytul" value="${o.tytul}" required style="width:100%; margin-bottom:10px; padding:8px;">
            <select id="e-kat" onchange="updateFormSubcats('e-')" required style="width:100%; margin-bottom:10px; padding:8px;">
                ${Object.keys(SUB_DATA).map(k => `<option value="${k}" ${o.kategoria===k?'selected':''}>${k}</option>`).join('')}
            </select>
            <select id="e-podkat" required style="width:100%; margin-bottom:10px; padding:8px;">
                <option value="${o.podkategoria}">${o.podkategoria}</option>
            </select>
            <div id="extra-fields-edit"></div>
            <input type="number" id="e-cena" value="${o.cena}" required style="width:100%; margin-bottom:10px; padding:8px;">
            <textarea id="e-opis" rows="5" style="width:100%; margin-bottom:10px; padding:8px;">${o.opis}</textarea>
            <button type="submit" id="btn-e-save" style="width:100%; padding:10px; background:green; color:white; border:none; cursor:pointer;">Zapisz zmiany</button>
        </form>`;
    updateFormSubcats('e-');
};

window.zapiszEdycje = async (e, id) => {
    e.preventDefault();
    await baza.from('ogloszenia').update({
        tytul: document.getElementById('e-tytul').value,
        cena: parseFloat(document.getElementById('e-cena').value),
        opis: document.getElementById('e-opis').value
    }).eq('id', id);
    location.reload();
};

window.usunOgloszenie = async (id) => { if(confirm("Usunąć?")) { await baza.from('ogloszenia').delete().eq('id', id); location.reload(); }};

window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

// --- START ---
async function init() {
    await sprawdzUzytkownika();
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    const k = document.getElementById('lista');
    if(k) k.innerHTML = daneOgloszen.slice(0, 12).map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})" style="border:1px solid #eee; border-radius:12px; overflow:hidden; cursor:pointer;">
            <img src="${o.zdjecia[0]}" style="width:100%; height:150px; object-fit:cover;">
            <div style="padding:10px;"><b>${o.cena} zł</b><p>${o.tytul}</p></div>
        </div>`).join('');
}
init();
