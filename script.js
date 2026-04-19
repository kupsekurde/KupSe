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

window.szukaj = () => {
    const text = document.getElementById('find-text').value.toLowerCase();
    const loc = document.getElementById('find-loc').value.toLowerCase();
    const wyniki = daneOgloszen.filter(o => {
        const mText = o.tytul.toLowerCase().includes(text) || o.opis.toLowerCase().includes(text);
        const mLoc = o.lokalizacja.toLowerCase().includes(loc);
        return mText && mLoc;
    });
    window.pokazWynikiModal("Wyniki wyszukiwania", wyniki);
};
// --- LOGOWANIE I INTERFEJS ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { data, error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert("Błąd: " + error.message);
    else location.reload();
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
                <button onclick="window.toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800;">
                    Moje Konto ${msgCount > 0 ? `(${msgCount})` : ''} ▼
                </button>
                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:220px;">
                    <div onclick="window.pokazMojeOgloszenia()" style="padding:12px; cursor:pointer; border-radius:8px; transition:0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">📝 Moje ogłoszenia</div>
                    <div onclick="window.pokazSkrzynke()" style="padding:12px; cursor:pointer; border-radius:8px; transition:0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
                        ✉️ Wiadomości ${msgCount > 0 ? `<b>(${msgCount})</b>` : ''}
                    </div>
                    <div onclick="window.pokazUlubione()" style="padding:12px; cursor:pointer; border-radius:8px; transition:0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">❤️ Ulubione (${mojeUlubione.length})</div>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <div onclick="window.wyloguj()" style="padding:12px; cursor:pointer; color:red; font-weight:bold; border-radius:8px;" onmouseover="this.style.background='#fff0f0'" onmouseout="this.style.background='transparent'">🚪 Wyloguj</div>
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
    const { data: msg } = await baza.from('wiadomosci').select('*').or(`and(nadawca.eq.${user.email},odbiorca.eq.${zKim}),and(nadawca.eq.${zKim},odbiorca.eq.${user.email})`).order('created_at', { ascending: true });
    
    const mb = document.querySelector('.modal-box');
    if(mb) mb.style.maxWidth = "400px";

    document.getElementById('view-content').innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
            <button onclick="window.pokazSkrzynke()" style="background:none; border:none; font-size:20px; cursor:pointer;">←</button>
            <h4 style="margin:0;">${dajNazwe(zKim)}</h4>
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
    if(mb) mb.style.maxWidth = "1250px"; // Powrót do dużej szerokości dla detali ogłoszeń
    document.getElementById('modal-view').style.display = 'none';
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
init();

// Dodaj funkcję Moje Ogłoszenia z Twojego poprzedniego kodu
window.pokazMojeOgloszenia = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const moje = daneOgloszen.filter(o => o.user_email === user.email);
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        <h2>Moje ogłoszenia (${moje.length})</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:12px;">
            ${moje.map(o => `
                <div style="border:1px solid #ddd; border-radius:10px; overflow:hidden;">
                    <img src="${o.zdjecia[0]}" style="width:100%; height:100px; object-fit:cover;">
                    <div style="padding:8px;">
                        <b>${o.cena} zł</b>
                        <button onclick="window.usunOgloszenie(${o.id})" style="width:100%; margin-top:5px; color:red;">Usuń</button>
                    </div>
                </div>`).join('')}
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- FUNKCJA USUWANIA ---
window.usunRozmowe = async (zKim) => {
    if(!confirm("Usunąć całą historię rozmowy?")) return;
    const { data: { user } } = await baza.auth.getUser();
    await baza.from('wiadomosci').delete().or(`and(nadawca.eq.${user.email},odbiorca.eq.${zKim}),and(nadawca.eq.${zKim},odbiorca.eq.${user.email})`);
    window.pokazSkrzynke();
};

// --- OKNO CZATU (Z DATAMI I MNIEJSZYM OKNEM) ---
window.otworzChat = async (zKim) => {
    const { data: { user } } = await baza.auth.getUser();
    await baza.from('wiadomosci').update({ przeczytane: true }).eq('odbiorca', user.email).eq('nadawca', zKim);
    await sprawdzPowiadomieniaBezReloadu();

    const { data: msg } = await baza.from('wiadomosci').select('*')
        .or(`and(nadawca.eq.${user.email},odbiorca.eq.${zKim}),and(nadawca.eq.${zKim},odbiorca.eq.${user.email})`)
        .order('created_at', { ascending: true });
    
    const modalBox = document.querySelector('.modal-box');
    if(modalBox) modalBox.style.maxWidth = "400px"; // MAŁE ZGRABNE OKNO

    const content = document.getElementById('view-content');
    content.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
            <button onclick="window.pokazSkrzynke()" style="background:none; border:none; font-size:20px; cursor:pointer;">←</button>
            <h4 style="margin:0;">${dajNazwe(zKim)}</h4>
        </div>
        <div id="chat-window" style="height:350px; overflow-y:auto; background:#ffffff; padding:10px; border:1px solid #eee; border-radius:12px; display:flex; flex-direction:column; gap:6px;">
            ${msg.map(m => {
                const moja = m.nadawca === user.email;
                const czas = new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                const data = new Date(m.created_at).toLocaleDateString([], {day:'2-digit', month:'2-digit'});
                return `
                <div style="max-width:85%; align-self: ${moja ? 'flex-end' : 'flex-start'};">
                    <div style="background:${moja ? 'var(--primary)' : '#f0f0f0'}; color:${moja ? 'white' : 'black'}; padding:7px 12px; border-radius:12px; font-size:13px;">
                        ${m.tresc}
                    </div>
                    <div style="font-size:8px; color:gray; text-align:${moja?'right':'left'}; margin-top:2px;">${data} ${czas}</div>
                </div>`;
            }).join('')}
        </div>
        <div style="display:flex; gap:5px; margin-top:10px;">
            <input type="text" id="chat-input" placeholder="Napisz..." style="flex:1; padding:10px; border-radius:20px; border:1px solid #ddd;">
            <button onclick="window.wyslijZChatu('${zKim}')" style="background:var(--primary); color:white; border:none; width:38px; height:38px; border-radius:50%; cursor:pointer;">➤</button>
        </div>`;
    
    const win = document.getElementById('chat-window');
    win.scrollTop = win.scrollHeight;
    document.getElementById('chat-input').onkeypress = (e) => { if(e.key === 'Enter') window.wyslijZChatu(zKim); };
};

window.wyslijZChatu = async (odbiorca) => {
    const { data: { user } } = await baza.auth.getUser();
    const tresc = document.getElementById('chat-input').value.trim();
    if (!tresc) return;
    await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca, tresc, przeczytane: false }]);
    window.otworzChat(odbiorca);
};

window.wyslijWiadomosc = async (odbiorca) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się, aby wysłać wiadomość!");
    if (user.email === odbiorca) return alert("Nie możesz pisać do samego siebie!");
    window.otworzChat(odbiorca);
};

// --- SZCZEGÓŁY OGŁOSZENIA ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;

    const { data: { user } } = await baza.auth.getUser();
    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    
    const telefonWidok = user ? `<b>${o.telefon}</b>` : `<span style="color:red;">[Zaloguj się]</span>`;
    const btnWstecz = ostatnieWyniki.length > 0 
        ? `<button onclick="window.pokazWynikiModal(ostatniTytul, ostatnieWyniki)" style="margin-bottom:15px; background:#eee; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">← Powrót do listy</button>` 
        : "";

    document.getElementById('view-content').innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        ${btnWstecz}
        <div style="display:flex; flex-wrap:wrap; gap:20px;">
            <div style="flex:1.5; min-width:300px;">
                <div style="background:#000; border-radius:15px; height:350px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="max-width:100%; max-height:100%; cursor:zoom-in;" onclick="window.otworzFullFoto()">
                </div>
                <div style="display:flex; gap:8px; margin-top:10px; overflow-x:auto;">
                    ${aktualneFotki.map((img, i) => `<img src="${img}" onclick="window.zmienGlowneZdjecie(${i})" class="mini-foto" style="width:65px; height:65px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid ${i===0?'var(--primary)':'transparent'};">`).join('')}
                </div>
            </div>
            <div style="flex:1;">
                <div style="font-size:12px; color:gray;">Dodano: ${formatujDate(o.created_at)}</div>
                <h2>${o.tytul}</h2>
                <h1 style="color:var(--primary);">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja} | 📞 ${telefonWidok}</p>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button onclick="window.wyslijWiadomosc('${o.user_email}')" style="flex:1; padding:12px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Wyślij wiadomość</button>
                    <button onclick="window.toggleUlubione(event, ${o.id})" class="fav-btn-${o.id}" style="padding:12px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer;">
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
    window.aktualneZdjecieIndex = idx;
    const img = document.getElementById('mainFoto');
    if(img && window.aktualneFotki) img.src = window.aktualneFotki[idx];
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
        <button onclick="window.navFullFoto(-1)" 
                style="position:absolute; left:20px; background:rgba(255,255,255,0.15); color:white; border:none; padding:20px 15px; cursor:pointer; font-size:40px; border-radius:10px;">
            ❮
        </button>
        <img id="lb-img" src="${aktualneFotki[aktualneZdjecieIndex]}" style="max-width:90%; max-height:90%; object-fit:contain;">
        <button onclick="window.navFullFoto(1)" 
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
        window.filtrujPoPodkat(kat, podkat);
        return;
    }
    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
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

            <button onclick="window.zastosujFiltryMoto('${kat}', '${podkat}')" 
                    style="background:var(--primary); color:white; padding:15px; border:none; border-radius:10px; cursor:pointer; font-weight:bold; margin-top:10px;">
                POKAŻ OGŁOSZENIA
            </button>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zastosujFiltryMoto = (kat, podkat) => {
    const marka = document.getElementById('sf-marka').value.toLowerCase().trim();
    const model = document.getElementById('sf-model').value.toLowerCase().trim();
    const cMin = parseFloat(document.getElementById('sf-cena-min').value) || 0;
    const cMax = parseFloat(document.getElementById('sf-cena-max').value) || 99999999;
    const rMin = parseInt(document.getElementById('sf-rok-min').value) || 0;
    const rMax = parseInt(document.getElementById('sf-rok-max').value) || 9999;
    const paliwo = document.getElementById('sf-paliwo').value.toLowerCase();

    const wyniki = daneOgloszen.filter(o => {
        if (o.kategoria !== kat || o.podkategoria !== podkat) return false;
        const tresc = (o.tytul + " " + o.opis).toLowerCase();
        
        const mOk = marka === "" || tresc.includes(marka);
        const modOk = model === "" || tresc.includes(model);
        const cOk = o.cena >= cMin && o.cena <= cMax;
        
        const rokMatch = o.opis.match(/Rok: (\d{4})/);
        const autoRok = rokMatch ? parseInt(rokMatch[1]) : 0;
        const rOk = (rMin === 0 && rMax === 9999) || (autoRok >= rMin && autoRok <= rMax);
        const pOk = paliwo === "" || tresc.includes(paliwo);
        
        return mOk && modOk && cOk && rOk && pOk;
    });

    window.zamknijModal();
    window.pokazWynikiModal(podkat, wyniki);
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
    const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: true };

    for (const file of inputPlik.files) {
        try {
            const compressed = typeof imageCompression !== 'undefined' ? await imageCompression(file, options) : file;
            const nazwa = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            await baza.storage.from('zdjecia').upload(nazwa, compressed);
            const { data: { publicUrl } } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            zdjeciaUrls.push(publicUrl);
        } catch (err) { console.error("Błąd zdjęcia:", err); }
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
    if (!tytul.includes("(wyniki)")) {
        wynikiBazowe = [...wyniki]; 
        ostatniTytul = tytul;
    }
    ostatnieWyniki = wyniki;
    const content = document.getElementById('view-content');
    const start = (strona - 1) * OGLOSZENIA_NA_STRONE;
    const porcja = wyniki.slice(start, start + OGLOSZENIA_NA_STRONE);

    content.innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        <div style="display:flex; gap:20px; margin-top:20px;">
            <div style="width:220px; flex-shrink:0; background:#f8f9fa; padding:15px; border-radius:15px; height:fit-content; position:sticky; top:0;">
                <h4 style="margin-top:0;">Filtruj i sortuj</h4>
                <label style="font-size:11px; font-weight:bold; color:gray;">SORTOWANIE</label>
                <select id="side-sort" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd;">
                    <option value="newest">Najnowsze</option>
                    <option value="oldest">Najstarsze</option>
                    <option value="price-asc">Cena: najtańsze</option>
                    <option value="price-desc">Cena: najdroższe</option>
                </select>
                <label style="font-size:11px; font-weight:bold; color:gray;">SZUKAJ WYNIKÓW</label>
                <input type="text" id="side-szukaj" placeholder="Np. Opel, iPhone..." style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
                <label style="font-size:11px; font-weight:bold; color:gray;">CENA (ZŁ)</label>
                <div style="display:flex; gap:5px; margin-bottom:12px;">
                    <input type="number" id="side-cena-min" placeholder="Od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    <input type="number" id="side-cena-max" placeholder="Do" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <label style="font-size:11px; font-weight:bold; color:gray;">LOKALIZACJA</label>
                <input type="text" id="side-lok" placeholder="Miasto..." style="width:100%; margin-bottom:15px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
                <button onclick="window.zastosujFiltryBoczne()" style="width:100%; background:var(--primary); color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; font-weight:800;">Zastosuj zmiany</button>
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
    const sort = document.getElementById('side-sort').value;

    let przefiltrowane = wynikiBazowe.filter(o => {
        const tekstDoPrzeszukania = `${o.tytul} ${o.opis} ${o.podkategoria}`.toLowerCase();
        const tekstOk = fraza === "" || tekstDoPrzeszukania.includes(fraza);
        const cenaOk = o.cena >= min && o.cena <= max;
        const lokOk = lok === "" || o.lokalizacja.toLowerCase().includes(lok);
        return tekstOk && cenaOk && lokOk;
    });

    if (sort === 'price-asc') {
        przefiltrowane.sort((a, b) => a.cena - b.cena);
    } else if (sort === 'price-desc') {
        przefiltrowane.sort((a, b) => b.cena - a.cena);
    } else if (sort === 'newest') {
        przefiltrowane.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'oldest') {
        przefiltrowane.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    window.pokazWynikiModal(ostatniTytul + " (wyniki)", przefiltrowane);
    
    document.getElementById('side-szukaj').value = fraza;
    document.getElementById('side-sort').value = sort;
    if(min > 0) document.getElementById('side-cena-min').value = min;
    if(max < 99999999) document.getElementById('side-cena-max').value = max;
    document.getElementById('side-lok').value = lok;
};

function renderCardHTML(o) {
    const isFav = mojeUlubione.includes(o.id);
    const pelnaData = formatujDate(o.created_at);
    
    return `
        <div class="ad-card" onclick="window.pokazSzczegoly(${o.id})" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer; position:relative;">
            <div onclick="window.toggleUlubione(event, ${o.id})" class="fav-btn-${o.id}" style="position:absolute; top:10px; right:10px; z-index:10; background:rgba(255,255,255,0.8); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
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
    const favCountEl = document.getElementById('fav-count-nav');
    if (favCountEl) favCountEl.innerText = mojeUlubione.length;
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
// Funkcja zamykająca okienka po kliknięciu w tło
window.addEventListener('mousedown', (e) => {
    const dropMenu = document.getElementById('drop-menu');
    const modalFull = document.getElementById('modal-full');
    const formModal = document.getElementById('form-modal');

    // 1. Zamykanie menu "Moje Konto"
    if (dropMenu && dropMenu.style.display === 'block') {
        // Jeśli kliknięcie NIE jest wewnątrz menu i NIE jest przyciskiem otwierającym
        if (!dropMenu.contains(e.target) && !e.target.closest('button')) {
            dropMenu.style.display = 'none';
        }
    }

    // 2. Zamykanie modali pełnoekranowych (Ulubione, Wiadomości, Wyniki)
    // Jeśli kliknięty element to dokładnie tło (modal-full), a nie jego zawartość
    if (e.target === modalFull) {
        modalFull.style.display = 'none';
        document.body.style.overflow = 'auto'; // przywraca przewijanie strony
    }

    // 3. Zamykanie formularza "Dodaj ogłoszenie"
    if (e.target === formModal) {
        formModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

window.edytujOgloszenie = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    
    document.getElementById('modal-view').style.display = 'none';
    document.getElementById('modal-form').style.display = 'flex';
    document.getElementById('form-title').innerText = "Edytuj ogłoszenie";
    
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
        const opt = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: true };

        for (const f of nowePliki) {
            try {
                const comp = await imageCompression(f, opt);
                const name = `${Date.now()}-${Math.random().toString(36).substr(7)}.jpg`;
                await baza.storage.from('zdjecia').upload(name, comp);
                noweUrls.push(baza.storage.from('zdjecia').getPublicUrl(name).data.publicUrl);
            } catch(err) { console.error(err); }
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
    document.getElementById('foto-container').innerHTML = '';
    const btn = document.getElementById('btn-save');
    btn.disabled = false;
    btn.innerText = "Dodaj ogłoszenie";
    // Podpinamy funkcję wysyłania pod formularz
    document.getElementById('form-dodaj').onsubmit = window.wyslijOgloszenie;
};
