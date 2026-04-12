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

async function pobierz() {
    const dataMiesiacTemu = new Date();
    dataMiesiacTemu.setDate(dataMiesiacTemu.getDate() - 30);
    const { data, error } = await baza.from('ogloszenia').select('*')
        .gt('created_at', dataMiesiacTemu.toISOString())
        .order('created_at', { ascending: false }).limit(12);
    daneOgloszen = data || [];
    render(daneOgloszen, 'lista');
}

// --- RENDER (SZTYWNA SIATKA POZIOMA) ---
function render(lista, kontenerId) {
    const div = document.getElementById(kontenerId);
    div.style.display = "grid";
    div.style.gridTemplateColumns = "repeat(4, 1fr)"; // 4 kolumny poziomo
    div.style.gap = "20px";
    
    div.innerHTML = lista.map(o => {
        let foto = o.zdjecia ? (Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia.replace(/[\[\]"']/g, "").split(',')[0].trim()) : 'https://via.placeholder.com/300';
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${foto}" style="height:180px; object-fit:cover; width:100%">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div style="font-weight:600; font-size:14px; margin:5px 0">${o.tytul}</div>
                <div style="font-size:11px; color:gray">📍 ${o.lokalizacja} | ${formatujDate(o.created_at)}</div>
            </div>
        </div>`;
    }).join('');
}

// --- KATEGORIE ---
window.toggleSubcats = async (kat) => {
    const { data } = await baza.from('ogloszenia').select('*').eq('kategoria', kat).order('created_at', { ascending: false });
    const modal = document.getElementById('modal-messages');
    const content = document.getElementById('msg-content');
    modal.style.display = 'flex';
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px">
            <h2>${kat}</h2>
            <button onclick="zamknijModal()" style="cursor:pointer; border:none; background:#ddd; padding:5px 15px; border-radius:5px">ZAMKNIJ</button>
        </div>
        <div id="kat-grid"></div>`;
    render(data || [], 'kat-grid');
};

// --- SZCZEGÓŁY ---
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
        <div style="text-align:right; margin-bottom:10px"><button onclick="zamknijModal()" style="font-weight:bold; cursor:pointer; border:none; background:none; color:red">ZAMKNIJ</button></div>
        <div style="display:grid; grid-template-columns: 1fr 300px; gap:20px">
            <div>
                <img id="main-zoom" src="${zdjecia[0].trim()}" style="width:100%; border-radius:10px; cursor:zoom-in" onclick="window.open(this.src)">
                <div style="display:flex; gap:5px; margin-top:10px; overflow-x:auto">${zdjecia.map(z => `<img src="${z.trim()}" onclick="document.getElementById('main-zoom').src='${z.trim()}'" style="width:50px; height:50px; object-fit:cover; cursor:pointer; border-radius:5px; border:1px solid #eee">`).join('')}</div>
            </div>
            <div style="position:relative">
                <span onclick="toggleUlubione(${o.id})" style="position:absolute; right:0; top:0; font-size:30px; cursor:pointer; color:${serce}">❤</span>
                <h2 style="margin:0">${o.tytul}</h2>
                <h1 style="color:var(--primary)">${o.cena} zł</h1>
                <p style="background:#f5f5f5; padding:10px; border-radius:10px">${o.opis}</p>
                <p>📍 ${o.lokalizacja}<br>🕒 ${formatujDate(o.created_at)}</p>
                <button onclick="alert('Tel: ${o.telefon}')" style="width:100%; padding:12px; background:black; color:white; border:none; border-radius:8px; font-weight:800; cursor:pointer">ZADZWOŃ: ${o.telefon}</button>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- LOGOWANIE I REJESTRACJA ---
window.loguj = async () => {
    const { error } = await baza.auth.signInWithPassword({ email: document.getElementById('email').value, password: document.getElementById('pass').value });
    if (error) alert(error.message); else location.reload();
};

window.zarejestruj = async () => {
    const { error } = await baza.auth.signUp({ 
        email: document.getElementById('reg-email').value, 
        password: document.getElementById('reg-pass').value, 
        options: { data: { display_name: document.getElementById('reg-nick').value } } 
    });
    if (error) alert(error.message); else alert("Sprawdź email!");
};

// --- FORMULARZ ---
window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA_KATEGORII[k]) MAPA_KATEGORII[k].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    if(!user) return alert("Zaloguj się!");
    const btn = document.getElementById('btn-save'); btn.innerText = "Wysyłanie...";
    
    const pliki = document.getElementById('f-plik').files;
    const urls = [];
    for (let i = 0; i < pliki.length; i++) {
        const path = `img_${Date.now()}_${i}.jpg`;
        await baza.storage.from('zdjecia').upload(path, pliki[i]);
        urls.push(baza.storage.from('zdjecia').getPublicUrl(path).data.publicUrl);
    }

    await baza.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        cena: parseInt(document.getElementById('f-cena').value),
        opis: document.getElementById('f-opis').value,
        lokalizacja: document.getElementById('f-lok').value,
        telefon: document.getElementById('f-tel').value,
        zdjecia: urls, email_autora: user.email,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value
    }]);
    location.reload();
};

// --- RESZTA ---
function formatujDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL') + ' ' + d.toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'});
}

window.toggleUlubione = async (id) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const { data } = await baza.from('ulubione').select('*').eq('user_id', user.id).eq('ogloszenie_id', id);
    if (data?.length > 0) await baza.from('ulubione').delete().eq('user_id', user.id).eq('ogloszenie_id', id);
    else await baza.from('ulubione').insert([{ user_id: user.id, ogloszenie_id: id }]);
    pokazSzczegoly(id);
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

async function checkUser() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        document.getElementById('user-nav').innerHTML = `
            <button onclick="otworzModal()" class="btn-account" style="background:var(--primary); color:white">+ Dodaj</button>
            <button class="btn-account" onclick="wyloguj()">Wyloguj</button>`;
        document.getElementById('auth-box').style.display = 'none';
    }
}

init();
