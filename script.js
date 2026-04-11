const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części"],
    "Dom": ["Mieszkania", "Domy", "Działki"],
    "Elektronika": ["Telefony", "Laptopy", "RTV"],
    "Ogród": ["Narzędzia", "Rośliny", "Meble"],
    "Moda": ["Ubrania", "Buty", "Dodatki"],
    "Rolnictwo": ["Ciągniki", "Maszyny"],
    "Zwierzęta": ["Karma", "Akcesoria"],
    "Dzieci": ["Zabawki", "Wózki"],
    "Sport": ["Rowery", "Siłownia"],
    "Nauka": ["Książki", "Kursy"],
    "Usługi": ["Budowlane", "Uroda"],
    "Praca": ["Pełny etat", "Zlecenia"],
    "Inne": ["Różne"]
};

// Walidacja hasła
function validatePass(p) {
    return p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p) && /[@$!%*?&]/.test(p);
}

// Nawigacja / Auth
async function checkUser() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        const { count } = await baza.from('wiadomosci').select('*', { count: 'exact', head: true }).eq('receiver_email', user.email).eq('przeczytane', false);
        const nick = user.user_metadata.display_name || user.email;
        document.getElementById('user-nav').innerHTML = `
            <button onclick="otworzModal()" class="btn-main" style="margin-right:10px">+ Dodaj</button>
            <div style="position:relative; display:inline-block">
                <button class="btn-main" style="background:#f3f4f6; color:#111" onclick="document.getElementById('drop').classList.toggle('show')">Konto ${count > 0 ? '🔴' : ''} ▾</button>
                <div id="drop" class="dropdown-content">
                    <div style="font-weight:bold; margin-bottom:5px">${nick}</div>
                    <button onclick="otworzWiadomosci()" style="width:100%; text-align:left; background:none; border:none; padding:8px 0; cursor:pointer">Wiadomości (${count})</button>
                    <button onclick="wyloguj()" style="width:100%; text-align:left; background:none; border:none; padding:8px 0; cursor:pointer; color:red">Wyloguj</button>
                </div>
            </div>`;
        document.getElementById('auth-box').style.display = 'none';
    }
}

window.switchAuth = (v) => {
    document.getElementById('login-view').classList.toggle('hidden', v !== 'login');
    document.getElementById('register-view').classList.toggle('hidden', v !== 'register');
};

window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert("Błąd: " + error.message); else location.reload();
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const nick = document.getElementById('reg-nick').value;
    if (!validatePass(password)) return alert("Hasło za słabe!");
    const { error } = await baza.auth.signUp({ email, password, options: { data: { display_name: nick } } });
    if (error) alert(error.message); else alert("Sprawdź email i potwierdź konto!");
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// WIADOMOŚCI
window.otworzWiadomosci = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const { data } = await baza.from('wiadomosci').select('*').eq('receiver_email', user.email).order('created_at', {ascending: false});
    document.getElementById('messages-list').innerHTML = data.map(m => `
        <div style="padding:10px; border-bottom:1px solid #eee; background:${m.przeczytane ? '#fff' : '#f0f9ff'}">
            <small>${m.sender_email}</small><br><b>${m.tresc}</b><br>
            <button onclick="wyslijWiadomosc('${m.sender_email}')" style="font-size:11px">Odpowiedz</button>
        </div>`).join('') || "Brak wiadomości";
    await baza.from('wiadomosci').update({przeczytane: true}).eq('receiver_email', user.email);
    document.getElementById('modal-messages').style.display = 'flex';
};

window.wyslijWiadomosc = async (odbiorca) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const msg = prompt("Twoja wiadomość:");
    if (msg) {
        await baza.from('wiadomosci').insert([{ sender_email: user.email, receiver_email: odbiorca, tresc: msg }]);
        alert("Wysłano!");
    }
};

// OGŁOSZENIA
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
                <div style="font-size:12px; color:gray">📍 ${o.lokalizacja}</div>
            </div>
        </div>`).join('');
}

window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(i => i.id === id);
    const { data: { user } } = await baza.auth.getUser();
    const imgUrl = Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia;
    
    let kontaktHTML = user 
        ? `<button onclick="window.open('tel:${o.telefon}')" class="btn-main" style="width:100%; margin-bottom:10px">Zadzwoń: ${o.telefon}</button>
           <button onclick="wyslijWiadomosc('${o.email_autora}')" class="btn-main" style="width:100%; background:#111">Napisz wiadomość</button>`
        : `<p style="color:red; font-weight:bold">Zaloguj się, aby zobaczyć kontakt!</p>`;

    document.getElementById('view-content').innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px">
            <div style="cursor:zoom-in" onclick="window.open('${imgUrl}', '_blank')">
                <img src="${imgUrl}" style="width:100%; border-radius:15px; box-shadow:0 5px 15px rgba(0,0,0,0.1)">
                <p style="text-align:center; font-size:12px; color:gray; margin-top:5px">Kliknij zdjęcie, aby powiększyć</p>
            </div>
            <div>
                <h1 style="margin:0">${o.tytul}</h1>
                <h2 style="color:var(--primary); font-size:32px">${o.cena} zł</h2>
                <p style="background:#f9fafb; padding:15px; border-radius:10px">${o.opis}</p>
                <p>📍 <b>${o.lokalizacja}</b></p>
                <hr style="border:0; border-top:1px solid #eee; margin:20px 0">
                ${kontaktHTML}
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Musisz być zalogowany!");
    
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
        zdjecia: urls, 
        email_autora: user.email,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value
    }]);
    location.reload();
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');

window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA_KATEGORII[k]) MAPA_KATEGORII[k].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
};

window.toggleSubcats = (k) => {
    const panel = document.getElementById('subcat-panel');
    render(daneOgloszen.filter(o => o.kategoria === k));
    panel.innerHTML = MAPA_KATEGORII[k].map(s => `<div class="sub-pill" onclick="render(daneOgloszen.filter(o=>o.podkategoria==='${s}'))">${s}</div>`).join('') + `<button onclick="location.reload()" style="border:none; background:none; cursor:pointer">✖</button>`;
    panel.style.display = 'flex';
};

checkUser();
pobierz();
