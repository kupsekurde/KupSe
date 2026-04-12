const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];

const SUB_DATA = {
    'Motoryzacja': ['Samochody', 'Motocykle', 'Części'],
    'Dom': ['Meble', 'Ogrzewanie', 'Dekoracje'],
    'Elektronika': ['Telefony', 'Laptopy', 'Konsole'],
    'Ogród': ['Narzędzia', 'Rośliny', 'Meble ogrodowe'],
    'Moda': ['Ubrania', 'Buty', 'Dodatki'],
    'Rolnictwo': ['Traktory', 'Maszyny', 'Zwierzęta hodowlane'],
    'Zwierzęta': ['Psy', 'Koty', 'Akcesoria'],
    'Dzieci': ['Zabawki', 'Wózki', 'Ubranka'],
    'Sport': ['Rowery', 'Siłownia', 'Turystyka'],
    'Nauka': ['Książki', 'Korepetycje', 'Instrumenty'],
    'Usługi': ['Budowlane', 'Transport', 'Naprawa'],
    'Inne': ['Różne']
};

// --- START ---
async function init() {
    await sprawdzUzytkownika();
    await pobierz();
}

// --- LOGOWANIE ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert("Błąd: " + error.message); else location.reload();
};

window.wyloguj = async () => {
    await baza.auth.signOut();
    location.reload();
};

async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user) {
        if (document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'none';
        const { data } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = data ? data.map(x => x.ogloszenie_id) : [];
        nav.innerHTML = `
            <div style="position:relative; display:flex; gap:10px;">
                <button onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800;">Moje Konto ▼</button>
                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:200px;">
                    <small>Zalogowany:</small><br><b>${user.email}</b><hr>
                    <div onclick="alert('Wiadomości')" style="padding:10px 0; cursor:pointer;">✉️ Wiadomości</div>
                    <div onclick="alert('Ulubione')" style="padding:10px 0; cursor:pointer;">❤️ Ulubione</div>
                    <div onclick="wyloguj()" style="padding:10px 0; cursor:pointer; color:red;">🚪 Wyloguj</div>
                </div>
                <button onclick="document.getElementById('modal-form').style.display='flex'" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer;">+ Dodaj</button>
            </div>`;
    }
}

window.toggleUserMenu = (e) => { e.stopPropagation(); const m = document.getElementById('drop-menu'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; };

// --- POBIERANIE I KATEGORIE (PUNKT 1) ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen, true); // Zawsze 12 najnowszych na start
}

function render(lista, naStart = false) {
    const kontener = document.getElementById('lista');
    const tytulSekcji = document.getElementById('grid-title');
    
    // Punkt 1: Jeśli to start, bierzemy 12. Jeśli filtr, bierzemy wszystko co pasuje.
    const dane = naStart ? daneOgloszen.slice(0, 12) : lista;
    if (naStart) tytulSekcji.innerText = "12 Najnowszych ogłoszeń";

    kontener.innerHTML = dane.map(o => {
        const foto = Array.isArray(o.zdjecia) ? o.zdjecia[0] : (o.zdjecia || 'https://via.placeholder.com/300');
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img src="${foto}" style="width:100%; height:180px; object-fit:cover;">
            <div style="padding:15px;">
                <b style="font-size:18px;">${o.cena} zł</b>
                <div style="color:#555; margin-top:5px;">${o.tytul}</div>
                <div style="font-size:12px; color:gray; margin-top:8px;">📍 ${o.lokalizacja}</div>
            </div>
        </div>`;
    }).join('');
}

window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    panel.style.display = 'flex';
    panel.innerHTML = (SUB_DATA[kat] || []).map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
    document.getElementById('grid-title').innerText = "Kategoria: " + kat;
    render(daneOgloszen.filter(o => o.kategoria === kat), false); // Pokaż wszystkie z tej kategorii
};

window.filtrujPoPodkat = (kat, podkat) => {
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat), false);
};

// --- SZCZEGÓŁY I GALERIA (PUNKT 2) ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    const liked = mojeUlubione.includes(o.id);
    const data = new Date(o.created_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    document.getElementById('view-content').innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2>${o.tytul}</h2>
            <button onclick="toggleUlubione(${o.id})" style="background:none; border:none; font-size:30px; cursor:pointer;">${liked ? '❤️' : '🤍'}</button>
        </div>
        <p style="color:gray; font-size:12px;">Dodano: ${data}</p>

        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div style="flex:1.5; position:relative; min-width:300px;">
                <img id="mainFoto" src="${aktualneFotki[0]}" style="width:100%; height:400px; object-fit:contain; background:#000; border-radius:15px; cursor:pointer;" onclick="powiekszZdjecie()">
                ${aktualneFotki.length > 1 ? `
                    <button onclick="zmienFoto(-1)" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); color:white; border:none; padding:10px; cursor:pointer; border-radius:50%;">◀</button>
                    <button onclick="zmienFoto(1)" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); color:white; border:none; padding:10px; cursor:pointer; border-radius:50%;">▶</button>
                ` : ''}
            </div>
            <div style="flex:1; background:#f9f9f9; padding:20px; border-radius:15px;">
                <h1 style="color:var(--primary);">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja}</p>
                <p>📞 <b>${o.telefon || 'Brak'}</b></p>
                <button onclick="otworzOknoWiadomosci('${o.tytul}', '${o.user_email}')" style="width:100%; padding:15px; background:#111; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:800;">Wyślij wiadomość</button>
            </div>
        </div>
        <div style="margin-top:20px;"><h3>Opis</h3><p style="white-space:pre-line;">${o.opis}</p></div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zmienFoto = (kierunek) => {
    aktualneZdjecieIndex = (aktualneZdjecieIndex + kierunek + aktualneFotki.length) % aktualneFotki.length;
    document.getElementById('mainFoto').src = aktualneFotki[aktualneZdjecieIndex];
};

window.powiekszZdjecie = () => {
    window.open(aktualneFotki[aktualneZdjecieIndex], '_blank');
};

// --- OKNO WIADOMOŚCI (PUNKT 3) ---
window.otworzOknoWiadomosci = (tytul, odbiorca) => {
    const msg = prompt(`Napisz wiadomość do sprzedawcy w sprawie: "${tytul}"`, "");
    if (msg) {
        // Tutaj można dodać zapis do bazy, na razie symulujemy wysyłkę
        alert("Wiadomość została wysłana do: " + odbiorca);
    }
};

window.zamknijModal = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
};

window.onclick = (e) => { if (e.target.className === 'modal') zamknijModal(); };

init();
