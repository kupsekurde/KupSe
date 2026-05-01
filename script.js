window.renderujOgloszenia = (lista) => {
    const k = document.getElementById('lista');
    if (!k) return;
    k.style.display = 'grid';
    k.innerHTML = lista.map(o => renderCardHTML(o)).join('');
};

window.toggleSubcats = (kat) => {
    const p = document.getElementById('subcat-panel');
    if (!p) return;
    if (p.dataset.activeKat === kat && p.style.display === 'flex') {
        p.style.display = 'none'; p.dataset.activeKat = ''; return;
    }
    p.style.display = 'flex';
    p.dataset.activeKat = kat;
    p.innerHTML = (SUB_DATA[kat] || []).map(s => `
        <div class="sub-pill" onclick="window.otworzFiltry('${kat}', '${s}')">${s}</div>
    `).join('');
};
const dajNazwe = (e) => { 
    if(!e) return "Użytkownik";
    let n = e.split('@')[0]; 
    return n.charAt(0).toUpperCase() + n.slice(1); 
};

const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

// --- DANE KATEGORII (TEGO BRAKOWAŁO) ---
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

const formatujDate = (d) => new Date(d).toLocaleDateString('pl-PL');

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];
let wynikiBazowe = [];
let ostatnieWyniki = [];
let ostatniTytul = "";
const OGLOSZENIA_NA_STRONE = 12;

window.szukaj = async () => {
    console.log("Start szukania..."); // Log w konsoli

    const p1 = document.getElementById('szukajka-glowna');
    const p2 = document.getElementById('miasto-input');
    
    if (!p1 || !p2) {
        console.error("BŁĄD: Nie znaleziono pól w HTML! Szukałem 'szukajka-glowna' i 'miasto-input'");
        alert("Błąd techniczny: Nie znaleziono pól wyszukiwarki.");
        return;
    }

    const tekst = p1.value.toLowerCase().trim();
    const loc = p2.value.toLowerCase().trim();
    
    console.log("Szukam frazy:", tekst, "w lokalizacji:", loc);

    try {
        let query = baza.from('ogloszenia').select('*');

        // UWAGA: Sprawdź czy w Supabase kolumny nazywają się 'tytul' i 'lokalizacja'
        if (tekst) query = query.ilike('tytul', `%${tekst}%`);
        if (loc) query = query.ilike('lokalizacja', `%${loc}%`);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error("Błąd z bazy Supabase:", error);
            alert("Błąd bazy: " + error.message);
            return;
        }

        console.log("Znaleziono ogłoszeń:", data.length);

        if (data.length === 0) {
            document.getElementById('lista').innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>Brak wyników dla podanych kryteriów.</p>";
        } else {
            // Ważne: nazwa musi być taka sama jak ta, którą poprawiliśmy wcześniej!
            window.renderujOgloszenia(data);
        }

        // Zmiana tytułu nad ogłoszeniami
        const title = document.getElementById('grid-title');
        if (title) title.innerText = (tekst || loc) ? "Wyniki wyszukiwania" : "Najnowsze ogłoszenia";

    } catch (err) {
        console.error("Nieoczekiwany błąd skryptu:", err);
    }
};
// --- LOGOWANIE I INTERFEJS ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { data, error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert("Błąd: " + error.message);
    else location.reload();
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const zgoda = document.getElementById('reg-zgoda-regulamin').checked;

    if (!email || !password) return alert("Wypełnij email i hasło!");
    
    // --- TUTAJ JEST TWOJA NOWA WALIDACJA HASŁA ---
    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passRegex.test(password)) {
        return alert("Hasło nie spełnia wymogów:\n• min. 8 znaków\n• duża litera\n• liczba\n• znak specjalny");
    }

    if (!zgoda) return alert("Musisz zaakceptować regulamin!");

    const { data, error } = await baza.auth.signUp({ email, password });
    if (error) alert("Błąd: " + error.message);
    else {
        alert("Konto utworzone! Wysłaliśmy link aktywacyjny na Twój e-mail. Musisz go kliknąć, aby móc się zalogować.");
        location.reload();
    }
};

async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    const authBox = document.getElementById('auth-box');

    if (user) {
        if (authBox) authBox.style.display = 'none';
        const { data: nData } = await baza.from('wiadomosci').select('nadawca').eq('odbiorca', user.email).eq('przeczytane', false);
        const msgCount = nData ? [...new Set(nData.map(m => m.nadawca))].length : 0;
        const { data: uData } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = uData ? uData.map(x => Number(x.ogloszenie_id)) : [];

        nav.innerHTML = `
            <div style="position:relative; display:flex; gap:15px; align-items:center;">
                <span style="font-weight:800; font-size:14px;">Witaj ${dajNazwe(user.email)}</span>
                <button onclick="window.otworzFormularzDodawania()" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj</button>
                                <button onclick="window.toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800; position:relative;">
                    Moje Konto ▼
                    ${msgCount > 0 ? `<span style="position:absolute; top:-8px; right:-8px; background:red; color:white; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:11px; border:2px solid white;">${msgCount}</span>` : ''}
                </button>
                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:220px;">
                    <div onclick="window.pokazMojeOgloszenia()" style="padding:10px; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div onclick="window.pokazSkrzynke()" style="padding:10px; cursor:pointer;">
                        <span>✉️ Wiadomości ${msgCount > 0 ? `(${msgCount})` : ''}</span>
                    </div>
                    <div onclick="window.pokazUlubione()" style="padding:10px; cursor:pointer;">❤️ Ulubione (${mojeUlubione.length})</div>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <div onclick="window.wyloguj()" style="padding:10px; cursor:pointer; color:red; font-weight:bold;">🚪 Wyloguj</div>
                </div>
            </div>`;
    } else {
        if (authBox) authBox.style.display = 'block';
        nav.innerHTML = `<button onclick="document.getElementById('auth-box').scrollIntoView({behavior:'smooth'})" class="btn-account">Zaloguj się</button>`;
    }
}

// --- MOJE OGŁOSZENIA (ZMNIEJSZONE OKNO) ---
window.pokazMojeOgloszenia = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const moje = daneOgloszen.filter(o => o.user_email === user.email);
    const mb = document.querySelector('.modal-box');
    if(mb) mb.style.maxWidth = "550px"; 

    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        <h2 style="text-align:center; margin-bottom:20px;">Moje ogłoszenia</h2>
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${moje.map(o => `
                <div style="display:flex; gap:15px; border:1px solid #eee; padding:10px; border-radius:12px; align-items:center; background:#fafafa;">
                    <img src="${o.zdjecia[0]}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;">
                    <div style="flex:1;">
                        <div style="font-weight:bold; font-size:14px;">${o.tytul}</div>
                        <div style="color:var(--primary); font-weight:bold;">${o.cena} zł</div>
                    </div>
                    <button onclick="window.usunOgloszenie(${o.id})" style="background:none; border:none; color:red; cursor:pointer; font-size:20px;">🗑️</button>
                </div>
            `).join('')}
            ${moje.length === 0 ? '<p style="text-align:center; color:gray;">Brak ogłoszeń.</p>' : ''}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- ULUBIONE (NAPRAWIONE I MNIEJSZE) ---
window.pokazUlubione = () => {
    const okno = document.getElementById('modal-view');
    const content = document.getElementById('view-content');
    const mb = document.querySelector('.modal-box');
    
    if(mb) mb.style.maxWidth = "600px";
    
    // Filtrujemy dane (upewniamy się, że id to liczba)
    const ulubioneLista = daneOgloszen.filter(o => mojeUlubione.includes(Number(o.id)));

    content.innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        <h2 style="text-align:center; margin-bottom:20px;">Twoje Ulubione ❤️</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            ${ulubioneLista.map(o => `
                <div onclick="window.pokazSzczegoly(${o.id})" style="cursor:pointer; border:1px solid #eee; border-radius:12px; overflow:hidden; background:white; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <img src="${o.zdjecia[0]}" style="width:100%; height:120px; object-fit:cover;">
                    <div style="padding:10px;">
                        <div style="font-weight:bold; color:var(--primary); font-size:16px;">${o.cena} zł</div>
                        <div style="font-size:12px; height:32px; overflow:hidden; margin-top:5px;">${o.tytul}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        ${ulubioneLista.length === 0 ? '<p style="text-align:center; color:gray; margin-top:30px; grid-column: 1/3;">Nie masz jeszcze ulubionych ogłoszeń.</p>' : ''}`;
    
    okno.style.display = 'flex';
};
// --- WIADOMOŚCI (POGRUBIENIE, USUWANIE, IMIONA) ---
window.pokazSkrzynke = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const { data: msgs } = await baza.from('wiadomosci').select('*').or(`nadawca.eq.${user.email},odbiorca.eq.${user.email}`).order('created_at', { ascending: false });
    const rozmowcy = [...new Set(msgs.map(m => m.nadawca === user.email ? m.odbiorca : m.nadawca))];
    
    const mb = document.querySelector('.modal-box');
    if(mb) mb.style.maxWidth = "450px"; 

    let html = `<button class="close-btn" onclick="window.zamknijModal()">&times;</button>
                <h2 style="text-align:center; margin-bottom:20px;">Wiadomości</h2>
                <div style="display:flex; flex-direction:column; gap:8px;">`;

    rozmowcy.forEach(r => {
        const nowe = msgs.some(m => m.nadawca === r && m.odbiorca === user.email && !m.przeczytane);
        const styl = nowe ? 'font-weight:900; background:#fff4e6; border-left:4px solid var(--primary);' : 'background:#f9f9f9;';
        html += `
            <div style="padding:15px; ${styl} border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; border:1px solid #eee;" onclick="window.otworzChat('${r}')">
                <span>${dajNazwe(r)}</span>
                <button onclick="event.stopPropagation(); window.usunRozmowe('${r}')" style="background:none; border:none; cursor:pointer; font-size:18px;">🗑️</button>
            </div>`;
    });
    document.getElementById('view-content').innerHTML = html + (rozmowcy.length ? '' : '<p style="text-align:center; color:gray;">Brak wiadomości</p>') + '</div>';
    document.getElementById('modal-view').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.usunRozmowe = async (zKim) => {
    if(!confirm(`Usunąć całą historię z ${dajNazwe(zKim)}?`)) return;
    const { data: { user } } = await baza.auth.getUser();
    await baza.from('wiadomosci').delete().or(`and(nadawca.eq.${user.email},odbiorca.eq.${zKim}),and(nadawca.eq.${zKim},odbiorca.eq.${user.email})`);
    window.pokazSkrzynke();
};

window.otworzChat = async (zKim) => {
    const { data: { user } } = await baza.auth.getUser();
    await baza.from('wiadomosci').update({ przeczytane: true }).eq('odbiorca', user.email).eq('nadawca', zKim);
    await sprawdzUzytkownika(); // TO ODŚWIEŻA LICZNIK NATYCHMIAST
    const { data: msg } = await baza.from('wiadomosci').select('*').or(`and(nadawca.eq.${user.email},odbiorca.eq.${zKim}),and(nadawca.eq.${zKim},odbiorca.eq.${user.email})`).order('created_at', { ascending: true });
    
    const mb = document.querySelector('.modal-box');
    if(mb) mb.style.maxWidth = "400px";

        document.getElementById('view-content').innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px;">
            <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="window.pokazSkrzynke()" style="background:none; border:none; font-size:20px; cursor:pointer;">←</button>
                <h4 style="margin:0;">${dajNazwe(zKim)}</h4>
            </div>
            <button class="close-btn" onclick="window.zamknijModal()" style="position:static; font-size:25px;">&times;</button>
        </div>
        <div id="chat-window" style="height:350px; overflow-y:auto; background:#ffffff; padding:10px; border:1px solid #eee; border-radius:12px; display:flex; flex-direction:column; gap:8px;">
            ${msg.map(m => {
                const moja = m.nadawca === user.email;
                const d = new Date(m.created_at);
                const czas = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')} | ${d.getDate()}.${d.getMonth()+1}`;
                return `
                <div style="max-width:85%; align-self: ${moja ? 'flex-end' : 'flex-start'};">
                    <div style="background:${moja ? 'var(--primary)' : '#f0f0f0'}; color:${moja ? 'white' : 'black'}; padding:7px 12px; border-radius:12px; font-size:13px; box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                        ${m.tresc}
                    </div>
                    <div style="font-size:8px; color:gray; text-align:${moja?'right':'left'}; margin-top:2px;">${czas}</div>
                </div>`;
            }).join('')}
        </div>
        <div style="display:flex; gap:5px; margin-top:10px;">
            <input type="text" id="chat-input" placeholder="Napisz..." style="flex:1; padding:10px; border-radius:20px; border:1px solid #ddd;">
            <button onclick="window.wyslijZChatu('${zKim}')" style="background:var(--primary); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;">➤</button>
        </div>`;
    const win = document.getElementById('chat-window'); win.scrollTop = win.scrollHeight;
    document.getElementById('chat-input').onkeypress = (e) => { if(e.key === 'Enter') window.wyslijZChatu(zKim); };
};

window.wyslijZChatu = async (odbiorca) => {
    const { data: { user } } = await baza.auth.getUser();
    const tresc = document.getElementById('chat-input').value.trim();
    if (!tresc) return;
    await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca, tresc, przeczytane: false }]);
    window.otworzChat(odbiorca);
};

// --- FUNKCJE SYSTEMOWE ---
window.zamknijModal = () => {
    const mb = document.querySelector('.modal-box');
    if(mb) mb.style.maxWidth = "1250px"; 
    document.getElementById('modal-view').style.display = 'none';
    // Ta linia poniżej naprawia problem ze znikającym suwakiem:
    document.body.style.overflow = 'auto'; 
};
window.toggleUserMenu = (e) => { 
    e.stopPropagation(); 
    const m = document.getElementById('drop-menu'); 
    if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; 
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

async function init() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    await sprawdzUzytkownika();
    // Renderowanie listy głównej...
}

// --- SZCZEGÓŁY OGŁOSZENIA ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;

    // Obsługa przycisku wstecz w telefonie
    history.pushState({ modalOpen: true }, ""); 
    window.onpopstate = function() {
        window.zamknijModal();
    };

    const { data: { user } } = await baza.auth.getUser();
    window.aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    window.aktualneZdjecieIndex = 0;
    
    const telefonWidok = user ? `<b>${o.telefon}</b>` : `<span style="color:red;">[Zaloguj się]</span>`;
    const btnWstecz = ostatnieWyniki.length > 0 
        ? `<button onclick="window.pokazWynikiModal(ostatniTytul, ostatnieWyniki)" style="margin-bottom:15px; background:#eee; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">← Powrót do listy</button>` 
        : "";

    document.getElementById('view-content').innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        ${btnWstecz}
        <div style="display:flex; flex-direction: column; gap:15px;">
            <div style="width:100%;">
                <div style="background:#000; border-radius:15px; height:280px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <img id="mainFoto" src="${window.aktualneFotki[0]}" style="max-width:100%; max-height:100%; object-fit: contain;" onclick="window.otworzFullFoto()">
                </div>
                <div style="display:flex; gap:8px; margin-top:10px; overflow-x:auto; padding-bottom:5px;">
                    ${window.aktualneFotki.map((img, i) => `<img src="${img}" onclick="window.zmienGlowneZdjecie(${i})" class="mini-foto" style="width:60px; height:60px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid ${i===0?'var(--primary)':'transparent'}; flex-shrink:0;">`).join('')}
                </div>
            </div>
            <div style="width:100%;">
                <div style="font-size:11px; color:gray;">Dodano: ${formatujDate(o.created_at)}</div>
                <h2 style="font-size:18px; margin:10px 0;">${o.tytul}</h2>
                <h1 style="color:var(--primary); font-size:24px; margin:5px 0;">${o.cena} zł</h1>
                <p style="font-size:14px;">📍 ${o.lokalizacja} | 📞 ${telefonWidok}</p>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button onclick="window.wyslijWiadomosc('${o.user_email}')" style="flex:1; padding:15px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Wyślij wiadomość</button>
                    <button onclick="window.toggleUlubione(event, ${o.id})" class="fav-btn-${o.id}" style="padding:15px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer;">
                        ${mojeUlubione.includes(o.id) ? '❤️' : '🤍'}
                    </button>
                </div>
                <h3 style="margin-top:20px; font-size:16px;">Opis</h3>
                <p style="white-space:pre-line; font-size:14px; line-height:1.5; color:#444;">${o.opis}</p>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.zmienGlowneZdjecie = (idx) => {
    window.aktualneZdjecieIndex = idx;
    const img = document.getElementById('mainFoto');
    if(img && window.aktualneFotki) {
        img.src = window.aktualneFotki[idx];
    }
    // To podświetla wybraną miniaturkę ramką
    document.querySelectorAll('.mini-foto').forEach((el, i) => {
        el.style.borderColor = (i === idx) ? 'var(--primary)' : 'transparent';
    });
};
window.otworzFullFoto = () => {
    let lb = document.getElementById('lightbox-box');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'lightbox-box';
        // Zwiększyłem z-index do 30000, żeby nic go nie przykryło
        lb.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:30000; display:none; align-items:center; justify-content:center; user-select:none;";
        document.body.appendChild(lb);
    }
    
    // Używamy "window." przed nazwami, żeby obrazek się wczytał
    lb.innerHTML = `
        <button onclick="document.getElementById('lightbox-box').style.display='none'" 
                style="position:absolute; top:25px; right:25px; background:white; border:none; width:45px; height:45px; border-radius:50%; font-size:28px; cursor:pointer; z-index:9001; display:flex; align-items:center; justify-content:center;">
            &times;
        </button>
        <button onclick="window.navFullFoto(-1)" 
                style="position:absolute; left:20px; background:rgba(255,255,255,0.15); color:white; border:none; padding:15px; cursor:pointer; font-size:30px; border-radius:10px; z-index:9002;">
            ❮
        </button>
        <img id="lb-img" src="${window.aktualneFotki[window.aktualneZdjecieIndex]}" style="max-width:95%; max-height:95%; object-fit:contain;">
        <button onclick="window.navFullFoto(1)" 
                style="position:absolute; right:20px; background:rgba(255,255,255,0.15); color:white; border:none; padding:15px; cursor:pointer; font-size:30px; border-radius:10px; z-index:9002;">
            ❯
        </button>
    `;
    lb.style.display = 'flex';
};

window.navFullFoto = (dir) => {
    window.aktualneZdjecieIndex = (window.aktualneZdjecieIndex + dir + window.aktualneFotki.length) % window.aktualneFotki.length;
    const img = document.getElementById('lb-img');
    if(img) img.src = window.aktualneFotki[window.aktualneZdjecieIndex];
};

// --- FILTROWANIE SPECJALISTYCZNE ---
window.otworzFiltry = (kat, podkat) => {
    const wyniki = daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat);
    window.pokazWynikiModal(`${kat} > ${podkat}`, wyniki);
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
    if (!inputPlik || inputPlik.files.length === 0) return alert("Dodaj przynajmniej jedno zdjęcie!");

    btn.disabled = true;
    btn.innerText = "Wysyłanie...";

        const zdjeciaUrls = [];
    // Ustawiamy opcje: max 0.6MB i max 1200px szerokości/wysokości
    const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: false };

    for (const file of inputPlik.files) {
        try {
            let plikDoWyslania = file;
            
            // Sprawdzamy czy biblioteka kompresji jest dostępna
            if (typeof imageCompression !== 'undefined') {
                try {
                    // Próbujemy zmniejszyć zdjęcie
                    plikDoWyslania = await imageCompression(file, options);
                } catch (e) {
                    console.error("Kompresja nie udała się, wysyłam oryginał:", e);
                }
            }

            const nazwa = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            await baza.storage.from('zdjecia').upload(nazwa, plikDoWyslania);
            const { data: { publicUrl } } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            zdjeciaUrls.push(publicUrl);
        } catch (err) { 
            console.error("Błąd przesyłania zdjęcia:", err); 
        }
    }

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
        btn.innerText = "Spróbuj ponownie";
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
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        <h2>Moje ogłoszenia</h2>
        <div style="display:flex; gap:15px; border-bottom:1px solid #eee; margin-bottom:15px;">
            <div onclick="window.pokazMojeOgloszenia('aktywne')" 
                 style="padding:10px; cursor:pointer; font-weight:bold; border-bottom:3px solid ${tab === 'aktywne' ? 'var(--primary)' : 'transparent'}">
                 Aktywne (${aktywne.length})
            </div>
            <div onclick="window.pokazMojeOgloszenia('zakonczone')" 
                 style="padding:10px; cursor:pointer; font-weight:bold; border-bottom:3px solid ${tab === 'zakonczone' ? 'var(--primary)' : 'transparent'}">
                 Zakończone (${zakonczone.length})
            </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:12px;">
            ${wyswietlane.map(o => `
                <div style="border:1px solid #ddd; border-radius:10px; overflow:hidden;">
                    <img src="${o.zdjecia[0]}" style="width:100%; height:100px; object-fit:cover;">
                    <div style="padding:8px;">
                        <b style="font-size:13px;">${o.cena} zł</b>\n                        <div style="display:flex; gap:5px; margin-top:8px;">
                            <button onclick="window.edytujOgloszenie(${o.id})" style="flex:1; padding:5px; font-size:11px;">Edytuj</button>
                            <button onclick="window.usunOgloszenie(${o.id})" style="padding:5px; color:red; border:none; background:none; cursor:pointer;">🗑️</button>
                        </div>
                    </div>
                </div>`).join('')}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
    document.body.style.overflow = 'hidden';
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
        <div class="sub-pill" onclick="window.otworzFiltry('${kat}', '${s}')">${s}</div>
    `).join('');
};

window.filtrujPoPodkat = (kat, podkat) => {
    const wyniki = daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat);
    window.pokazWynikiModal(`${kat} > ${podkat}`, wyniki);
};

// --- PAGINACJA WYNIKÓW ---
window.pokazWynikiModal = (tytul, wyniki, strona = 1) => {
    const OGLOSZENIA_NA_STRONE = 50; 
    if (!tytul.includes("(wyniki)")) { wynikiBazowe = [...wyniki]; ostatniTytul = tytul; }
    ostatnieWyniki = wyniki;
    const content = document.getElementById('view-content');
    const start = (strona - 1) * OGLOSZENIA_NA_STRONE;
    const porcja = wyniki.slice(start, start + OGLOSZENIA_NA_STRONE);
    const sumaStron = Math.ceil(wyniki.length / OGLOSZENIA_NA_STRONE);

    // Sprawdzamy czy to jedna z 5 kategorii moto
    const motoPodkaty = ['Samochody osobowe', 'Dostawcze', 'Motocykle', 'Skutery', 'Pozostałe'];
    const czyMoto = tytul.includes('Motoryzacja') && motoPodkaty.some(p => tytul.includes(p));

    let numeryStronHTML = "";
    for(let i = 1; i <= sumaStron; i++) {
        numeryStronHTML += `<button onclick="window.pokazWynikiModal(ostatniTytul, ostatnieWyniki, ${i})" style="padding:10px 15px; margin:2px; cursor:pointer; border-radius:8px; border:1px solid ${i === strona ? 'var(--primary)' : '#ddd'}; background:${i === strona ? 'var(--primary)' : 'white'}; color:${i === strona ? 'white' : 'black'}; font-weight:bold;">${i}</button>`;
    }

    content.innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        <h2 style="margin-top:10px;">${tytul}</h2>
        <button id="filter-toggle-btn" onclick="window.toggleMobileFilters()">🔍 Filtruj i Sortuj Wyniki</button>

        <div id="results-layout" style="display:flex; gap:20px;">
            <div class="side-filters" style="display:none; width:260px; background:#f8f9fa; padding:20px; border-radius:15px; border:1px solid #eee; height: fit-content; flex-shrink:0;">
                <h4 style="margin:0 0 15px 0;">Parametry</h4>
                
                <input type="text" id="side-szukaj" placeholder="Czego szukasz?" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">

                ${czyMoto ? `
                    <input type="text" id="sf-marka" placeholder="Marka" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
                    <input type="text" id="sf-model" placeholder="Model" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
                    <label style="font-size:10px; font-weight:bold; color:gray;">ROK PRODUKCJI</label>
                    <div style="display:flex; gap:5px; margin-bottom:12px;">
                        <input type="number" id="sf-rok-min" placeholder="Od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                        <input type="number" id="sf-rok-max" placeholder="Do" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    </div>
                    <label style="font-size:10px; font-weight:bold; color:gray;">PRZEBIEG (KM)</label>
                    <div style="display:flex; gap:5px; margin-bottom:12px;">
                        <input type="number" id="sf-przebieg-min" placeholder="Od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                        <input type="number" id="sf-przebieg-max" placeholder="Do" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    </div>
                    <label style="font-size:10px; font-weight:bold; color:gray;">POJEMNOŚĆ / MOC</label>
                    <div style="display:flex; gap:5px; margin-bottom:12px;">
                        <input type="number" id="sf-poj-min" placeholder="Poj. od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                        <input type="number" id="sf-moc-min" placeholder="Moc od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    </div>
                    <select id="sf-paliwo" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd;">
                        <option value="">Paliwo (Wszystkie)</option>
                        <option value="Benzyna">Benzyna</option><option value="LPG">LPG</option><option value="Diesel">Diesel</option><option value="Hybryda">Hybryda</option><option value="Elektryczny">Elektryczny</option>
                    </select>
                ` : ''}

                <div style="display:flex; gap:5px; margin-bottom:12px;">
                    <input type="number" id="side-cena-min" placeholder="Cena od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    <input type="number" id="side-cena-max" placeholder="Cena do" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                </div>

                <select id="side-stan" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd;">
                    <option value="">Stan (Wszystkie)</option><option value="Nowy">Nowy</option><option value="Używany">Używany</option><option value="Uszkodzony">Uszkodzony</option>
                </select>
                <input type="text" id="side-lok" placeholder="Lokalizacja" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
                <select id="side-sort" style="width:100%; margin-bottom:15px; padding:10px; border-radius:8px; border:1px solid #ddd;">
                    <option value="newest">Najnowsze</option><option value="oldest">Najstarsze</option><option value="price-asc">Najtańsze</option><option value="price-desc">Najdroższe</option>
                </select>

                <button onclick="window.zastosujFiltryBoczne()" style="width:100%; background:var(--primary); color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; font-weight:800;">Zastosuj</button>
            </div>
            <div style="flex:1;">
                <div id="modal-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap:15px;">
                    ${porcja.length ? porcja.map(o => renderCardHTML(o)).join('') : '<p>Brak ogłoszeń.</p>'}
                </div>
                <div style="display:flex; justify-content:center; margin-top:20px;">${numeryStronHTML}</div>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};
window.zastosujFiltryBoczne = () => {
    const fraza = document.getElementById('side-szukaj')?.value.toLowerCase().trim() || "";
    const cMin = parseFloat(document.getElementById('side-cena-min')?.value) || 0;
    const cMax = parseFloat(document.getElementById('side-cena-max')?.value) || 99999999;
    const stan = document.getElementById('side-stan')?.value || "";
    const lok = document.getElementById('side-lok')?.value.toLowerCase().trim() || "";
    const sort = document.getElementById('side-sort').value;

    // Funkcja pomocnicza do "inteligentnego" porównywania tekstu
    const uproscTekst = (t) => t.replace(/[\s-]/g, '').toLowerCase();
    const szukanaFrazaUproszczona = uproscTekst(fraza);

    // Pola Moto
    const marka = document.getElementById('sf-marka')?.value.toLowerCase() || "";
    const model = document.getElementById('sf-model')?.value.toLowerCase() || "";
    const rMin = parseInt(document.getElementById('sf-rok-min')?.value) || 0;
    const rMax = parseInt(document.getElementById('sf-rok-max')?.value) || 9999;
    const pMax = parseInt(document.getElementById('sf-przebieg-max')?.value) || 9999999;
    const paliwo = document.getElementById('sf-paliwo')?.value || "";

    let przefiltrowane = wynikiBazowe.filter(o => {
        const tytulOpisUproszczony = uproscTekst(o.tytul + " " + o.opis);
        
        const tekstOk = fraza === "" || tytulOpisUproszczony.includes(szukanaFrazaUproszczona);
        const cenaOk = o.cena >= cMin && o.cena <= cMax;
        const lokOk = lok === "" || o.lokalizacja.toLowerCase().includes(lok);
        const stanOk = stan === "" || o.opis.includes(stan);
        
        let motoOk = true;
        if(marka && !tytulOpisUproszczony.includes(uproscTekst(marka))) motoOk = false;
        if(model && !tytulOpisUproszczony.includes(uproscTekst(model))) motoOk = false;
        if(paliwo && !o.opis.includes(paliwo)) motoOk = false;
        
        if(rMin > 0 || rMax < 9999) {
            const rokMatch = o.opis.match(/Rok: (\d{4})/);
            const rok = rokMatch ? parseInt(rokMatch[1]) : 0;
            if(rok > 0 && (rok < rMin || rok > rMax)) motoOk = false;
        }

        return tekstOk && cenaOk && lokOk && stanOk && motoOk;
    });

    if (sort === 'price-asc') przefiltrowane.sort((a, b) => a.cena - b.cena);
    else if (sort === 'price-desc') przefiltrowane.sort((a, b) => b.cena - a.cena);
    else if (sort === 'oldest') przefiltrowane.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else przefiltrowane.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    window.pokazWynikiModal(ostatniTytul + " (wyniki)", przefiltrowane);
    const sf = document.querySelector('.side-filters');
    if(sf) sf.style.display = 'none';
    const btn = document.getElementById('filter-toggle-btn');
    if(btn) btn.innerHTML = '🔍 Filtruj i Sortuj Wyniki';
};

function renderCardHTML(o) {
    const isFav = mojeUlubione.includes(o.id);
    const pelnaData = formatujDate(o.created_at);
    
    return `
        <div class="ad-card" onclick="window.pokazSzczegoly(${o.id})" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer; position:relative;">
            <div onclick="event.stopPropagation(); window.toggleUlubione(event, ${o.id})" class="fav-btn-${o.id}" style="position:absolute; top:10px; right:10px; z-index:100; background:rgba(255,255,255,0.9); width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 20px;">
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

// Ta funkcja naprawia Twoją szukajkę - odpowiada za wyświetlanie wyników wyszukiwania
window.renderujOgloszenia = (lista) => {
    const k = document.getElementById('lista');
    if (!k) return;
    k.style.display = 'grid';
    k.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    k.style.gap = '20px';
    k.innerHTML = lista.map(o => renderCardHTML(o)).join('');
};
function renderTop12(lista) {
    const k = document.getElementById('lista');
    if (!k) return;
    
    // Bierzemy po prostu 12 najnowszych bez względu na datę
    const top12 = lista.slice(0, 12);
    
    k.style.display = 'grid';
    k.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    k.style.gap = '20px';
    
    k.innerHTML = top12.map(o => renderCardHTML(o)).join('');
}

window.toggleUlubione = async (e, id) => {
    if(e) e.stopPropagation();
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
    document.querySelectorAll(`.fav-btn-${id}`).forEach(btn => btn.innerText = mojeUlubione.includes(id) ? '❤️' : '🤍');
    await sprawdzUzytkownika(); // TO ODŚWIEŻA MENU "MOJE KONTO" NATYCHMIAST
};
};

window.pokazUlubione = () => {
    const ulubioneLista = daneOgloszen.filter(o => mojeUlubione.includes(o.id));
    window.pokazWynikiModal("Twoje Ulubione", ulubioneLista);
};

window.zamknijModal = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
};

window.zamknijIResetujModal = () => {
    const modalBox = document.querySelector('.modal-box');
    if(modalBox) modalBox.style.maxWidth = "1250px"; 
    window.zamknijModal();
};

async function sprawdzPowiadomieniaBezReloadu() {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return;
    const { data: nData } = await baza.from('wiadomosci').select('nadawca').eq('odbiorca', user.email).eq('przeczytane', false);
    const unikalniNadawcy = nData ? [...new Set(nData.map(m => m.nadawca))] : [];
    const count = unikalniNadawcy.length;
    
    const badge = document.getElementById('msg-badge');
    if (badge) {
        badge.style.display = count > 0 ? 'flex' : 'none';
        badge.innerText = count;
    }
}
async function init() {
    // 1. NAJPIERW ładujemy ogłoszenia (to musi działać dla każdego)
    try {
        const { data, error } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        daneOgloszen = data || [];
        renderTop12(daneOgloszen);
    } catch (e) {
        console.error("Błąd pobierania ogłoszeń:", e);
    }

    // 2. POTEM sprawdzamy logowanie (jeśli nie wyjdzie, to trudno, ogłoszenia już są)
    try {
        await sprawdzUzytkownika();
    } catch (e) {
        console.log("Użytkownik nie jest zalogowany");
    }
}

// Uruchomienie wszystkiego
init();
// --- POPRAWIONE ZAMYKANIE OKIEN KLIKNIĘCIEM POZA NIMI ---
window.addEventListener('mousedown', (e) => {
    const dropMenu = document.getElementById('drop-menu');
    const modalView = document.getElementById('modal-view'); // Twoje ID dla podglądu
    const modalForm = document.getElementById('modal-form'); // Twoje ID dla dodawania

    // 1. Zamykanie menu "Moje Konto"
    if (dropMenu && dropMenu.style.display === 'block') {
        if (!dropMenu.contains(e.target) && !e.target.closest('button')) {
            dropMenu.style.display = 'none';
        }
    }

    // 2. Zamykanie okna podglądu (ogłoszenia, wiadomości, ulubione)
    if (e.target === modalView) {
        window.zamknijIResetujModal(); // Używamy Twojej istniejącej funkcji
    }

    // 3. Zamykanie okna dodawania ogłoszenia
    if (e.target === modalForm) {
        modalForm.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});
window.edytujOgloszenie = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    
    document.getElementById('modal-view').style.display = 'none';
    document.getElementById('modal-form').style.display = 'flex';
    document.getElementById('form-title').innerText = "Edytuj ogłoszenie";
    document.body.style.overflow = 'hidden';
    
    window.tempZdjeciaEdycja = Array.isArray(o.zdjecia) ? [...o.zdjecia] : [o.zdjecia];
    
    document.getElementById('f-tytul').value = o.tytul;
    document.getElementById('f-kat').value = o.kategoria;
    window.updateFormSubcats(); 
    document.getElementById('f-podkat').value = o.podkategoria;
    document.getElementById('f-cena').value = o.cena;
    document.getElementById('f-lok').value = o.lokalizacja;
    document.getElementById('f-tel').value = o.telefon || "";
    document.getElementById('f-opis').value = o.opis;
    
    const fotoBox = document.getElementById('foto-container');
    const odswiezZdjecia = () => {
        let h = `<label style="display:block; margin-bottom:10px; font-weight:bold;">Zarządzaj zdjęciami (max 5):</label>`;
        h += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">`;
        window.tempZdjeciaEdycja.forEach((url, i) => {
            h += `<div style="position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
                    <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
                    <button type="button" onclick="window.usunFotoZEdycji(${i})" style="position:absolute; top:0; right:0; background:red; color:white; border:none; cursor:pointer; padding:0 5px; font-weight:bold;">X</button>
                  </div>`;
        });
        h += `</div>`;
        h += `<input type="file" id="f-plik-nowe" accept="image/*" multiple onchange="window.limitZdjec(this)" style="font-size:12px;">`;
        h += `<small style="display:block; margin-top:5px; color:gray;">Możesz dodać jeszcze ${5 - window.tempZdjeciaEdycja.length} zdjęć.</small>`;
        fotoBox.innerHTML = h;
    };
    window.usunFotoZEdycji = (i) => { window.tempZdjeciaEdycja.splice(i, 1); odswiezZdjecia(); };
    window.limitZdjec = (inp) => { if(inp.files.length + window.tempZdjeciaEdycja.length > 5) { alert("Łącznie max 5 zdjęć!"); inp.value = ""; } };

    odswiezZdjecia();

    const form = document.getElementById('form-dodaj');
    const btn = document.getElementById('btn-save');
    btn.innerText = "Zapisz zmiany";
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.innerText = "Kompresja i zapis...";

        const nowePliki = Array.from(document.getElementById('f-plik-nowe')?.files || []);
                const noweUrls = [];
        const opt = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: false };

        for (const f of nowePliki) {
            try {
                let plikDoWyslania = f;

                if (typeof imageCompression !== 'undefined') {
                    try {
                        plikDoWyslania = await imageCompression(f, opt);
                    } catch (e) {
                        console.error("Kompresja w edycji nie udała się:", e);
                    }
                }

                const name = `${Date.now()}-${Math.random().toString(36).substr(7)}.jpg`;
                await baza.storage.from('zdjecia').upload(name, plikDoWyslania);
                const { data: { publicUrl } } = baza.storage.from('zdjecia').getPublicUrl(name);
                noweUrls.push(publicUrl);
            } catch(err) { 
                console.error("Błąd zdjęcia w edycji:", err); 
            }
        }

        const { error } = await baza.from('ogloszenia').update({
            tytul: document.getElementById('f-tytul').value,
            cena: parseFloat(document.getElementById('f-cena').value),
            lokalizacja: document.getElementById('f-lok').value,
            opis: document.getElementById('f-opis').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: [...window.tempZdjeciaEdycja, ...noweUrls]
        }).eq('id', o.id);

        if (error) { alert("Błąd: " + error.message); btn.disabled = false; }
        else { alert("Zaktualizowano ogłoszenie!"); location.reload(); }
    };
};
window.otworzFormularzDodawania = () => {
    document.getElementById('modal-form').style.display = 'flex';
    document.getElementById('form-title').innerText = "Dodaj nowe ogłoszenie";
    document.getElementById('form-dodaj').reset();
    
    // Przywracamy standardowy wygląd pola zdjęć
    document.getElementById('foto-container').innerHTML = `
        <label style="display:block; margin-bottom:5px; font-weight:bold;">Zdjęcia:</label>
        <input type="file" id="f-plik" accept="image/*" multiple required 
               onchange="if(this.files.length > 5) { alert('Maksymalnie 5 zdjęć!'); this.value = ''; }">
        <small style="color:red; position:absolute; top:15px; right:15px;">Max 5 zdjec</small>
    `;

    const btn = document.getElementById('btn-save');
    btn.disabled = false;
    btn.innerText = "Dodaj ogłoszenie";
    document.getElementById('form-dodaj').onsubmit = window.wyslijOgloszenie;
};
// Funkcja do rozwijania filtrów na telefonie
window.toggleMobileFilters = () => {
    const filters = document.querySelector('.side-filters');
    const btn = document.getElementById('filter-toggle-btn');
    if (!filters) return;

    const obecnieUkryte = (filters.style.display === 'none' || filters.style.display === '');
    filters.style.display = obecnieUkryte ? 'block' : 'none';
    
    if (btn) {
        btn.innerHTML = obecnieUkryte ? '✖ Zamknij filtry' : '🔍 Filtruj i Sortuj Wyniki';
    }
};
