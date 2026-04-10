const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);
let daneOgloszen = [];

const MAPA = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części"],
    "Elektronika": ["Telefony", "Laptopy", "Konsole"],
    "Moda": ["Ubrania", "Buty"],
    "Dom i Ogród": ["Meble", "Ogród"],
    "Inne": ["Oddam", "Zamiana"]
};

// MODAL
window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => document.getElementById('modal-form').style.display = 'none';

// DROPDOWN
window.toggleAccountMenu = () => {
    document.getElementById('myDropdown').classList.toggle('show');
};

// Zamknij dropdown jeśli klikniesz poza nim
window.onclick = function(event) {
    if (!event.target.matches('.btn-account')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
    if (event.target == document.getElementById('modal-form')) zamknijModal();
}

window.updatePodkat = () => {
    const k = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria...</option>';
    if(MAPA[k]) MAPA[k].forEach(item => p.innerHTML += `<option value="${item}">${item}</option>`);
};

// AUTH
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        document.getElementById('user-nav').innerHTML = `
            <img src="SprzedajSe.png" class="btn-add-ad" onclick="otworzModal()">
            <div class="account-menu">
                <button class="btn-account" onclick="toggleAccountMenu()">Twoje konto</button>
                <div id="myDropdown" class="dropdown-content">
                    <span class="user-info-mail">${user.email}</span>
                    <button onclick="wyloguj()" class="btn-logout-red">Wyloguj się</button>
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

// LOGIKA
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    const plik = document.getElementById('f-plik').files[0];
    btn.innerText = "Wysyłanie..."; btn.disabled = true;

    try {
        const path = `${Date.now()}_img`;
        await baza.storage.from('ZDJECIA').upload(path, plik);
        const { data: u } = baza.storage.from('ZDJECIA').getPublicUrl(path);

        await baza.from('ogloszenia').insert([{
            tytul: document.getElementById('f-tytul').value,
            kategoria: document.getElementById('f-kat').value,
            podkategoria: document.getElementById('f-podkat').value,
            cena: parseInt(document.getElementById('f-cena').value),
            opis: document.getElementById('f-opis').value,
            lokalizacja: document.getElementById('f-lok').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: u.publicUrl
        }]);
        location.reload();
    } catch (err) { alert("Błąd!"); btn.disabled = false; }
};

async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('id', { ascending: false });
    daneOgloszen = data || [];
    pokaz(daneOgloszen);
}

function pokaz(lista) {
    const kontener = document.getElementById('lista');
    kontener.innerHTML = lista.map(o => `
        <div class="ad-card">
            <img class="ad-img" src="${o.zdjecia || 'https://via.placeholder.com/300'}" alt="foto">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div class="ad-title">${o.tytul}</div>
                <div style="font-size:12px; color:#888">📍 ${o.lokalizacja}</div>
            </div>
        </div>
    `).join('');
}

window.filtruj = () => {
    const t = document.getElementById('find-text').value.toLowerCase();
    const c = document.getElementById('find-city').value.toLowerCase();
    const f = daneOgloszen.filter(o => 
        (o.tytul.toLowerCase().includes(t)) && o.lokalizacja.toLowerCase().includes(c)
    );
    pokaz(f);
};

sprawdzUzytkownika();
pobierz();
