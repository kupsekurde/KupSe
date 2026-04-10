const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);
let daneOgloszen = [];

// MODALE
window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

// AUTH
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        document.getElementById('user-nav').innerHTML = `
            <img src="SprzedajSe.png" class="btn-add-ad" onclick="otworzModal()">
            <div class="account-menu">
                <button class="btn-account" onclick="document.getElementById('drop').classList.toggle('show')">Twoje konto</button>
                <div id="drop" class="dropdown-content">
                    <span style="font-size:12px; color:gray">${user.email}</span><br><br>
                    <button onclick="wyloguj()" style="color:red; border:none; background:none; cursor:pointer; font-weight:bold">Wyloguj się</button>
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
    if (error) await baza.auth.signUp({ email, password });
    location.reload();
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// WYŚWIETLANIE PEŁNEGO OGŁOSZENIA
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(item => item.id === id);
    const box = document.getElementById('view-content');
    box.innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px">
            <img src="${o.zdjecia}" style="width:100%; border-radius:15px">
            <div>
                <h1 style="margin:0">${o.tytul}</h1>
                <h2 style="color:var(--primary)">${o.cena} zł</h2>
                <p>📍 Lokalizacja: <b>${o.lokalizacja}</b></p>
                <p>📅 Data: ${new Date(o.created_at).toLocaleDateString()}</p>
                <div style="background:#f9fafb; padding:15px; border-radius:10px; margin:20px 0">${o.opis}</div>
                <a href="tel:${o.telefon}" style="display:block; text-align:center; background:#000; color:#fff; padding:15px; border-radius:10px; text-decoration:none; font-weight:bold">Zadzwoń: ${o.telefon}</a>
            </div>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

// POBIERANIE I FILTROWANIE
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen);
}

function render(lista) {
    const kontener = document.getElementById('lista');
    kontener.innerHTML = lista.map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${o.zdjecia || 'https://via.placeholder.com/300'}" alt="foto">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div style="font-weight:bold; margin:5px 0">${o.tytul}</div>
                <div class="ad-date">📍 ${o.lokalizacja} | ${new Date(o.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

window.filtrujPoKat = (kat) => {
    if(!kat) render(daneOgloszen);
    else render(daneOgloszen.filter(o => o.kategoria === kat));
};

window.filtruj = () => {
    const t = document.getElementById('find-text').value.toLowerCase();
    render(daneOgloszen.filter(o => o.tytul.toLowerCase().includes(t)));
};

// DODAWANIE
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    const plik = document.getElementById('f-plik').files[0];
    btn.innerText = "Wysyłanie..."; btn.disabled = true;

    const path = `${Date.now()}_img`;
    await baza.storage.from('ZDJECIA').upload(path, plik);
    const { data: u } = baza.storage.from('ZDJECIA').getPublicUrl(path);

    await baza.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        kategoria: document.getElementById('f-kat').value,
        cena: parseInt(document.getElementById('f-cena').value),
        opis: document.getElementById('f-opis').value,
        lokalizacja: document.getElementById('f-lok').value,
        telefon: document.getElementById('f-tel').value,
        zdjecia: u.publicUrl
    }]);
    location.reload();
};

sprawdzUzytkownika();
pobierz();
