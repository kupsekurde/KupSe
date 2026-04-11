const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części"],
    "Nieruchomości": ["Mieszkania", "Domy", "Działki"],
    "Elektronika": ["Telefony", "Laptopy", "Konsole"],
    "Dom i Ogród": ["Meble", "Narzędzia"],
    "Moda": ["Ubrania", "Buty"],
    "Inne": ["Różne"]
};

// --- AUTH & NAV ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        const { count } = await baza.from('wiadomosci').select('*', { count: 'exact', head: true }).eq('receiver_email', user.email).eq('przeczytane', false);
        const nick = user.user_metadata.display_name || "Użytkownik";
        const kropka = count > 0 ? `<span style="background:red; width:8px; height:8px; border-radius:50%; display:inline-block; margin-left:5px"></span>` : "";

        document.getElementById('user-nav').innerHTML = `
            <img src="KupSe.png" class="btn-add-ad" onclick="otworzModal()" style="margin-right:10px">
            <div class="account-menu">
                <button class="btn-account" onclick="document.getElementById('drop').classList.toggle('show')">
                    Twoje Konto ${kropka} ▾
                </button>
                <div id="drop" class="dropdown-content">
                    <div style="font-weight:800; font-size:16px">${nick}</div>
                    <div style="color:gray; font-size:11px; margin-bottom:10px">${user.email}</div>
                    <hr style="border:0; border-top:1px solid #eee">
                    <button onclick="otworzWiadomosci()" style="border:none; background:none; cursor:pointer; padding:10px 0; width:100%; text-align:left; font-weight:600">Wiadomości (${count})</button>
                    <button onclick="wyloguj()" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:800; padding:10px 0; width:100%; text-align:left">Wyloguj się</button>
                </div>
            </div>
        `;
        document.getElementById('auth-box').classList.add('hidden');
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
    if (error) alert(error.message); else { alert("Zarejestrowano! Zaloguj się."); location.reload(); }
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- WIADOMOŚCI ---
window.otworzWiadomosci = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const { data: listy } = await baza.from('wiadomosci').select('*').eq('receiver_email', user.email).order('created_at', { ascending: false });
    const kontener = document.getElementById('messages-list');
    kontener.innerHTML = listy.length ? listy.map(m => `
        <div style="padding:10px; border-bottom:1px solid #eee; background:${m.przeczytane ? '#fff' : '#f0f9ff'}">
            <small>${m.sender_email}</small><div>${m.tresc}</div>
            <button onclick="wyslijWiadomosc('${m.sender_email}')" style="font-size:10px">Odpowiedz</button>
        </div>`).join('') : "Brak wiadomości";
    await baza.from('wiadomosci').update({ przeczytane: true }).eq('receiver_email', user.email);
    document.getElementById('modal-messages').style.display = 'flex';
};

window.wyslijWiadomosc = async (odbiorca) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const tresc = prompt("Treść:");
    if (tresc) await baza.from('wiadomosci').insert([{ sender_email: user.email, receiver_email: odbiorca, tresc }]);
};

// --- OGŁOSZENIA ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen);
}

function render(lista) {
    document.getElementById('lista').innerHTML = lista.map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia}">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div class="ad-title">${o.tytul}</div>
                <div class="ad-date"><span>📍 ${o.lokalizacja}</span></div>
            </div>
        </div>`).join('');
}

window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(i => i.id === id);
    const { data: { user } } = await baza.auth.getUser();
    let kontakt = user ? `<a href="tel:${o.telefon}" style="display:block; background:var(--primary); padding:15px; text-align:center; border-radius:10px; text-decoration:none; color:white; font-weight:800; margin-bottom:10px">Zadzwoń: ${o.telefon}</a>
    <button onclick="wyslijWiadomosc('${o.email_autora}')" style="width:100%; padding:15px; border-radius:10px; border:none; background:#111; color:white; font-weight:800; cursor:pointer">Wyślij wiadomość</button>` 
    : `<div style="color:red; font-weight:800; text-align:center">Zaloguj się, aby zobaczyć kontakt</div>`;

    document.getElementById('view-content').innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
            <img src="${Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia}" style="width:100%; border-radius:15px">
            <div><h1>${o.tytul}</h1><h2 style="color:var(--primary)">${o.cena} zł</h2><p>${o.opis}</p>${kontakt}</div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    const btn = document.getElementById('btn-save');
    btn.innerText = "Wysyłanie..."; btn.disabled = true;
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

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); };
window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA_KATEGORII[k]) MAPA_KATEGORII[k].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
};
window.toggleSubcats = (k) => {
    const panel = document.getElementById('subcat-panel');
    render(daneOgloszen.filter(o => o.kategoria === k));
    panel.innerHTML = MAPA_KATEGORII[k].map(s => `<div class="sub-pill" onclick="render(daneOgloszen.filter(o=>o.podkategoria==='${s}'))">${s}</div>`).join('') + `<button onclick="location.reload()">Reset</button>`;
    panel.style.display = 'flex';
};

sprawdzUzytkownika();
pobierz();
