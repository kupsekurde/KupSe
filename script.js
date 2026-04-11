const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części"],
    "Dom": ["Mieszkania", "Domy", "Działki"],
    "Elektronika": ["Telefony", "Laptopy", "Gry"],
    "Ogród": ["Narzędzia", "Meble", "Rośliny"],
    "Moda": ["Ubrania", "Buty"],
    "Rolnictwo": ["Ciągniki", "Maszyny"],
    "Zwierzęta": ["Psy", "Koty"],
    "Dzieci": ["Zabawki", "Ubranka"],
    "Sport": ["Siłownia", "Rowery"],
    "Nauka": ["Książki", "Instrumenty"],
    "Usługi": ["Remonty", "Uroda"],
    "Praca": ["Pełny etat", "Zlecenia"],
    "Inne": ["Różne"]
};

// --- AUTH ---
async function checkUser() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        const { count } = await baza.from('wiadomosci').select('*', { count: 'exact', head: true }).eq('receiver_email', user.email).eq('przeczytane', false);
        const nick = user.user_metadata.display_name || user.email;
        document.getElementById('user-nav').innerHTML = `
            <button onclick="otworzModal()" class="btn-account" style="background:var(--primary); color:white; margin-right:10px">+ Dodaj</button>
            <button class="btn-account" onclick="document.getElementById('drop').classList.toggle('show')">Konto ${count > 0 ? '🔴' : ''} ▾</button>
            <div id="drop" class="dropdown-content">
                <div style="font-weight:800">${nick}</div>
                <hr style="border:0; border-top:1px solid #eee">
                <button onclick="otworzWiadomosci()" style="border:none; background:none; cursor:pointer; padding:10px 0; width:100%; text-align:left">Wiadomości (${count})</button>
                <button onclick="wyloguj()" style="color:red; border:none; background:none; cursor:pointer; width:100%; text-align:left">Wyloguj</button>
            </div>`;
        document.getElementById('auth-box').style.display = 'none';
    }
}

window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else location.reload();
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const nick = document.getElementById('reg-nick').value;
    const { error } = await baza.auth.signUp({ email, password, options: { data: { display_name: nick } } });
    if (error) alert(error.message); else alert("Sprawdź email!");
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- RENDERING ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen);
}

function render(lista) {
    document.getElementById('lista').innerHTML = lista.map(o => {
        let foto = 'https://via.placeholder.com/300x200';
        if (o.zdjecia) foto = Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia.replace(/[\[\]"']/g, "").split(',')[0];
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${foto}">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div style="font-weight:600">${o.tytul}</div>
                <div style="font-size:12px; color:gray">📍 ${o.lokalizacja}</div>
            </div>
        </div>`;
    }).join('');
}

window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(i => i.id === id);
    const { data: { user } } = await baza.auth.getUser();
    
    let zdjecia = [];
    if (Array.isArray(o.zdjecia)) zdjecia = o.zdjecia;
    else if (typeof o.zdjecia === 'string') zdjecia = o.zdjecia.replace(/[\[\]"']/g, "").split(',');

    const miniaturyHTML = zdjecia.map(u => `
        <img src="${u.trim()}" style="width:60px; height:60px; object-fit:cover; border-radius:10px; cursor:pointer; border:1px solid #ddd" 
        onclick="document.getElementById('main-zoom').src='${u.trim()}'">
    `).join('');

    let kontakt = user 
        ? `<a href="tel:${o.telefon}" style="display:block; text-align:center; background:var(--primary); color:white; padding:15px; border-radius:12px; text-decoration:none; font-weight:800; margin-bottom:10px">ZADZWOŃ: ${o.telefon}</a>
           <button onclick="wyslijWiadomosc('${o.email_autora}')" style="width:100%; padding:15px; border-radius:12px; border:none; background:#111; color:white; font-weight:800; cursor:pointer">NAPISZ WIADOMOŚĆ</button>`
        : `<p style="color:red; font-weight:800; text-align:center">Zaloguj się, aby zobaczyć kontakt</p>`;

    document.getElementById('view-content').innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div style="display:grid; grid-template-columns: 1fr 350px; gap:25px;">
            <div>
                <img id="main-zoom" src="${zdjecia[0]}" style="width:100%; border-radius:20px; cursor:zoom-in" onclick="window.open(this.src)">
                <div style="display:flex; gap:10px; margin-top:15px; overflow-x:auto">${miniaturyHTML}</div>
            </div>
            <div>
                <h1>${o.tytul}</h1>
                <h2 style="color:var(--primary); font-size:32px">${o.cena} zł</h2>
                <div style="background:#f3f4f7; padding:20px; border-radius:15px; margin:20px 0">${o.opis}</div>
                <p>📍 Lokalizacja: <b>${o.lokalizacja}</b></p>
                ${kontakt}
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- FUNKCJE ---
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    const btn = document.getElementById('btn-save'); btn.innerText = "Wysyłanie..."; btn.disabled = true;
    
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

window.wyslijWiadomosc = async (odbiorca) => {
    const { data: { user } } = await baza.auth.getUser();
    const msg = prompt("Twoja wiadomość:");
    if (msg) {
        await baza.from('wiadomosci').insert([{ sender_email: user.email, receiver_email: odbiorca, tresc: msg }]);
        alert("Wysłano!");
    }
};

window.otworzWiadomosci = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const { data } = await baza.from('wiadomosci').select('*').eq('receiver_email', user.email).order('created_at', {ascending: false});
    document.getElementById('msg-content').innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <h2>Wiadomości</h2>
        ${data.map(m => `<div style="padding:10px; border-bottom:1px solid #eee"><b>${m.sender_email}</b>: ${m.tresc}</div>`).join('') || 'Brak wiadomości'}
    `;
    document.getElementById('modal-messages').style.display = 'flex';
    await baza.from('wiadomosci').update({przeczytane: true}).eq('receiver_email', user.email);
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

// Kliknięcie w tło zamyka modal
window.onclick = (e) => { if (e.target.classList.contains('modal')) zamknijModal(); };

window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA_KATEGORII[k]) MAPA_KATEGORII[k].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
};

window.toggleSubcats = (k) => {
    const panel = document.getElementById('subcat-panel');
    render(daneOgloszen.filter(o => o.kategoria === k));
    panel.innerHTML = MAPA_KATEGORII[k].map(s => `<div class="sub-pill" onclick="render(daneOgloszen.filter(o=>o.podkategoria==='${s}'))">${s}</div>`).join('') + `<button onclick="location.reload()" style="background:none; border:none; cursor:pointer">X</button>`;
    panel.style.display = 'flex';
};

checkUser();
pobierz();
