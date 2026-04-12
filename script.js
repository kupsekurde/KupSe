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

// --- START ---
async function init() { await checkUser(); await pobierz(); }

// Pobiera 12 najnowszych na stronę główną (nie starszych niż 30 dni)
async function pobierz() {
    const dataMiesiacTemu = new Date();
    dataMiesiacTemu.setDate(dataMiesiacTemu.getDate() - 30);
    
    const { data, error } = await baza.from('ogloszenia')
        .select('*')
        .gt('created_at', dataMiesiacTemu.toISOString()) // Tylko z ostatniego miesiąca
        .order('created_at', { ascending: false })
        .limit(12);

    daneOgloszen = data || [];
    render(daneOgloszen, 'lista');
}

// Formatowanie daty: 12.04 11:30
function formatujDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL', {day:'2-digit', month:'2-digit'}) + ' ' + d.toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'});
}

function render(lista, kontenerId) {
    const div = document.getElementById(kontenerId);
    div.innerHTML = lista.map(o => {
        let foto = o.zdjecia ? (Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia.replace(/[\[\]"']/g, "").split(',')[0].trim()) : 'https://via.placeholder.com/300';
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${foto}">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div style="font-weight:600; font-size:14px; margin:5px 0">${o.tytul}</div>
                <div style="font-size:11px; color:gray">📍 ${o.lokalizacja} | 🕒 ${formatujDate(o.created_at)}</div>
            </div>
        </div>`;
    }).join('');
}

// --- KLIKNIĘCIE W KATEGORIĘ (Otwiera nowe okno z WSZYSTKIMI wynikami) ---
window.toggleSubcats = async (kat) => {
    // 1. Pobierz absolutnie WSZYSTKIE ogłoszenia z tej kategorii z bazy
    const { data, error } = await baza.from('ogloszenia')
        .select('*')
        .eq('kategoria', kat)
        .order('created_at', { ascending: false });

    // 2. Otwórz modal z listą
    const panel = document.getElementById('msg-content'); // Używamy modala od wiadomości jako kontenera na wyniki
    document.getElementById('modal-messages').style.display = 'flex';
    
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
            <h2>Kategoria: ${kat}</h2>
            <button onclick="zamknijModal()" style="background:#eee; border:none; padding:10px 20px; border-radius:10px; cursor:pointer; font-weight:bold">ZAMKNIJ</button>
        </div>
        <div id="kat-wyniki" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:15px; max-height:70vh; overflow-y:auto">
            </div>
    `;
    render(data || [], 'kat-wyniki');
};

// --- SZCZEGÓŁY OGŁOSZENIA ---
window.pokazSzczegoly = async (id) => {
    const { data: o } = await baza.from('ogloszenia').select('*').eq('id', id).single();
    const { data: { user } } = await baza.auth.getUser();
    let zdjecia = Array.isArray(o.zdjecia) ? o.zdjecia : o.zdjecia.replace(/[\[\]"']/g, "").split(',');
    
    let serce = "gray";
    if(user) {
        const { data } = await baza.from('ulubione').select('*').eq('user_id', user.id).eq('ogloszenie_id', id);
        if(data?.length > 0) serce = "red";
    }

    document.getElementById('view-content').innerHTML = `
        <div style="display:flex; justify-content:flex-end; padding:10px">
            <button onclick="zamknijModal()" style="background:none; border:none; font-weight:bold; cursor:pointer; color:gray; font-size:16px">ZAMKNIJ</button>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 350px; gap:25px; padding:0 20px 20px 20px">
            <div>
                <img id="main-zoom" src="${zdjecia[0].trim()}" style="width:100%; border-radius:20px;">
                <div style="display:flex; gap:10px; margin-top:10px">${zdjecia.map(z => `<img src="${z.trim()}" onclick="document.getElementById('main-zoom').src='${z.trim()}'" style="width:60px; height:60px; object-fit:cover; cursor:pointer; border-radius:8px">`).join('')}</div>
            </div>
            <div style="position:relative">
                <div onclick="toggleUlubione(${o.id})" style="position:absolute; right:0; top:0; font-size:30px; cursor:pointer; color:${serce}; z-index:10">❤</div>
                
                <h1 style="margin:0; padding-right:40px">${o.tytul}</h1>
                <h2 style="color:var(--primary); font-size:32px">${o.cena} zł</h2>
                <div style="background:#f9f9f9; padding:15px; border-radius:12px; margin:20px 0; font-size:14px">${o.opis}</div>
                <p>📍 ${o.lokalizacja} | 🕒 ${formatujDate(o.created_at)}</p>
                <button onclick="alert('Tel: ${o.telefon}')" style="width:100%; padding:15px; background:black; color:white; border-radius:10px; border:none; font-weight:800; cursor:pointer">ZADZWOŃ: ${o.telefon}</button>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };
window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';

async function checkUser() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user) {
        nav.innerHTML = `<button onclick="otworzModal()" class="btn-account" style="background:var(--primary); color:white">+ Dodaj</button>
                         <button class="btn-account" onclick="wyloguj()">Wyloguj</button>`;
        document.getElementById('auth-box').style.display = 'none';
    }
}

init();
