const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części"],
    "Dom": ["Mieszkania", "Domy", "Działki"],
    "Elektronika": ["Telefony", "Laptopy", "RTV"],
    "Ogród": ["Narzędzia", "Meble", "Rośliny"],
    "Moda": ["Odzież", "Obuwie", "Dodatki"],
    "Rolnictwo": ["Maszyny", "Ciągniki"],
    "Zwierzęta": ["Psy", "Koty", "Akcesoria"],
    "Dzieci": ["Zabawki", "Ubranka"],
    "Sport": ["Rowery", "Siłownia"],
    "Nauka": ["Książki", "Instrumenty"],
    "Usługi": ["Remonty", "Transport"],
    "Inne": ["Różne"]
};

async function init() { await checkUser(); await pobierz(); }

// Pobieranie 12 najnowszych na główną
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false }).limit(12);
    daneOgloszen = data || [];
    render(daneOgloszen, 'lista');
}

// Funkcja renderująca ogłoszenia (Siatka)
function render(lista, kontenerId) {
    const div = document.getElementById(kontenerId);
    div.innerHTML = lista.map(o => {
        let foto = o.zdjecia ? (Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia.replace(/[\[\]"']/g, "").split(',')[0].trim()) : 'https://via.placeholder.com/300';
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${foto}" style="height:200px; width:100%; object-fit:cover;">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div style="font-weight:600; font-size:14px; margin:5px 0">${o.tytul}</div>
                <div style="font-size:11px; color:gray">📍 ${o.lokalizacja} | ${formatujDate(o.created_at)}</div>
            </div>
        </div>`;
    }).join('');
}

// Obsługa podkategorii w formularzu
window.updateFormSubcats = () => {
    const kat = document.getElementById('f-kat').value;
    const podkatSelect = document.getElementById('f-podkat');
    podkatSelect.innerHTML = '<option value="">Wybierz podkategorię</option>';
    if (MAPA_KATEGORII[kat]) {
        MAPA_KATEGORII[kat].forEach(sub => {
            podkatSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
    }
};

// Pokazywanie wszystkich z kategorii
window.toggleSubcats = async (kat) => {
    const { data } = await baza.from('ogloszenia').select('*').eq('kategoria', kat).order('created_at', { ascending: false });
    const modal = document.getElementById('modal-messages');
    modal.style.display = 'flex';
    modal.style.zIndex = "3000";
    document.getElementById('msg-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
            <h2 style="margin:0">${kat}</h2>
            <button onclick="zamknijModal()" style="padding:10px 20px; cursor:pointer; border:none; background:#eee; border-radius:10px; font-weight:bold">ZAMKNIJ</button>
        </div>
        <div id="kat-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px"></div>`;
    render(data || [], 'kat-grid');
};

// Szczegóły ogłoszenia
window.pokazSzczegoly = async (id) => {
    const { data: o } = await baza.from('ogloszenia').select('*').eq('id', id).single();
    const { data: { user } } = await baza.auth.getUser();
    let zdjecia = Array.isArray(o.zdjecia) ? o.zdjecia : o.zdjecia.replace(/[\[\]"']/g, "").split(',');
    let serceColor = user ? await checkFav(user.id, o.id) : "gray";

    const modalView = document.getElementById('modal-view');
    modalView.style.display = 'flex';
    modalView.style.zIndex = "4000"; // Wyżej niż lista kategorii
    
    document.getElementById('view-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px">
            <div onclick="toggleUlubione(${o.id})" style="font-size:30px; cursor:pointer; color:${serceColor}">❤</div>
            <button onclick="zamknijModal()" style="border:none; background:none; color:#ff4d4d; font-weight:bold; cursor:pointer; font-size:16px">ZAMKNIJ</button>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 350px; gap:25px">
            <div>
                <img id="main-zoom" src="${zdjecia[0].trim()}" style="width:100%; border-radius:15px; max-height:450px; object-fit:contain; background:#f0f0f0">
                <div style="display:flex; gap:10px; margin-top:10px; overflow-x:auto">${zdjecia.map(z => `<img src="${z.trim()}" onclick="document.getElementById('main-zoom').src='${z.trim()}'" style="width:60px; height:60px; object-fit:cover; cursor:pointer; border-radius:8px; border:1px solid #ddd">`).join('')}</div>
            </div>
            <div>
                <h1 style="margin:0; font-size:24px">${o.tytul}</h1>
                <h2 style="color:var(--primary); font-size:32px; margin:10px 0">${o.cena} zł</h2>
                <div style="background:#f9f9f9; padding:15px; border-radius:12px; margin-bottom:15px; font-size:14px">${o.opis}</div>
                <p style="color:gray; font-size:13px">📍 ${o.lokalizacja} | 🕒 ${formatujDate(o.created_at)}</p>
                <button onclick="alert('Kontakt: ${o.telefon}')" style="width:100%; padding:15px; background:black; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer">ZADZWOŃ: ${o.telefon}</button>
                <div style="margin-top:20px; border-top:1px solid #eee; padding-top:15px">
                    <h4 style="margin-bottom:10px">Napisz wiadomość</h4>
                    <textarea id="msg-text" placeholder="Treść wiadomości..." style="width:100%; height:80px; border-radius:10px; border:1px solid #ddd; padding:10px; resize:none"></textarea>
                    <button onclick="wyslijWiadomosc('${o.email_autora}', ${o.id})" style="width:100%; margin-top:10px; padding:10px; background:var(--primary); color:white; border:none; border-radius:10px; cursor:pointer">Wyślij wiadomość</button>
                </div>
            </div>
        </div>`;
};

// Wysyłanie wiadomości
window.wyslijWiadomosc = async (odbiorca, oId) => {
    const { data: { user } } = await baza.auth.getUser();
    if(!user) return alert("Zaloguj się!");
    const tresc = document.getElementById('msg-text').value;
    if(!tresc) return alert("Wpisz wiadomość!");
    const { error } = await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca: odbiorca, tresc: tresc, ogloszenie_id: oId }]);
    if(!error) { alert("Wysłano!"); document.getElementById('msg-text').value = ""; }
};

// Sprawdzanie i przełączanie ulubionych
async function checkFav(uId, oId) {
    const { data } = await baza.from('ulubione').select('*').eq('user_id', uId).eq('ogloszenie_id', oId);
    return data.length > 0 ? "red" : "gray";
}

window.toggleUlubione = async (id) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const { data } = await baza.from('ulubione').select('*').eq('user_id', user.id).eq('ogloszenie_id', id);
    if (data.length > 0) {
        await baza.from('ulubione').delete().eq('user_id', user.id).eq('ogloszenie_id', id);
    } else {
        await baza.from('ulubione').insert([{ user_id: user.id, ogloszenie_id: id }]);
    }
    pokazSzczegoly(id);
};

// Menu Moje Konto
async function checkUser() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user) {
        nav.innerHTML = `
            <div class="dropdown" style="display:inline-block; position:relative;">
                <button class="btn-account" onclick="document.getElementById('drop-menu').classList.toggle('show')">Moje Konto ▼</button>
                <div id="drop-menu" class="dropdown-content" style="display:none; position:absolute; right:0; background:white; min-width:200px; box-shadow:0 8px 16px rgba(0,0,0,0.1); border-radius:10px; z-index:5000; padding:10px">
                    <div style="font-size:11px; color:gray; padding:5px; border-bottom:1px solid #eee">Zalogowany: ${user.email}</div>
                    <button class="drop-item" onclick="alert('Moje ogłoszenia')">Moje ogłoszenia</button>
                    <button class="drop-item" onclick="alert('Ulubione')">Ulubione</button>
                    <button class="drop-item" onclick="alert('Wiadomości')">Wiadomości</button>
                    <button class="drop-item" onclick="wyloguj()" style="color:red">Wyloguj się</button>
                </div>
            </div>
            <button onclick="otworzModal()" class="btn-account" style="background:var(--primary); color:white; margin-left:10px">+ Dodaj</button>`;
        document.getElementById('auth-box').style.display = 'none';
    }
}

// Zamykanie poza oknem
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) { zamknijModal(); }
};

function formatujDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL') + ' ' + d.toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'});
}

window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

window.loguj = async () => {
    const { error } = await baza.auth.signInWithPassword({ email: document.getElementById('email').value, password: document.getElementById('pass').value });
    if (error) alert(error.message); else location.reload();
};

init();
