const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];

// Dane podkategorii
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

// --- LOGOWANIE I REJESTRACJA ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert("Błąd logowania: " + error.message);
    else location.reload();
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const { error } = await baza.auth.signUp({ email, password });
    if (error) alert("Błąd: " + error.message);
    else alert("Zarejestrowano! Możesz się teraz zalogować.");
};

window.wyloguj = async () => {
    await baza.auth.signOut();
    location.reload();
};

// --- USER STATUS ---
async function sprawdzUzytkownika() {
nav.innerHTML = `
    <div style="display:flex; gap:15px; align-items:center;">
        <button onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">Moje Konto ▼</button>
        <div id="drop-menu" style="display:none; position:absolute; top:60px; right:5%; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:1001; min-width:200px;">
            <div style="padding-bottom:10px; border-bottom:1px solid #eee; margin-bottom:10px; font-size:12px; color:gray;">
                Zalogowany jako:<br><b style="color:black; font-size:14px;">${user.email}</b>
            </div>
            <div onclick="alert('Wiadomości')" style="padding:10px; cursor:pointer; display:flex; justify-content:space-between;">
                <span>✉️ Wiadomości</span>
                <span style="background:red; color:white; border-radius:50%; padding:2px 6px; font-size:10px;">2</span>
            </div>
            <div onclick="pokazUlubione()" style="padding:10px; cursor:pointer;">❤️ Ulubione</div>
            <div onclick="wyloguj()" style="padding:10px; cursor:pointer; color:red; border-top:1px solid #eee; margin-top:10px;">🚪 Wyloguj</div>
        </div>
        <button onclick="otworzModal()" style="background:#111; color:white; border:none; padding:10px; border-radius:10px; cursor:pointer;">+ Dodaj</button>
    </div>`;
    }
}

window.toggleUserMenu = (e) => {
    e.stopPropagation();
    const m = document.getElementById('drop-menu');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
};

// --- POBIERANIE I RENDEROWANIE ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen, true);
}

function render(lista, limit = false) {
    const kontener = document.getElementById('lista');
    // Jeśli limit jest true, bierzemy 12 ostatnich. Jeśli false (np. kategoria), bierzemy wszystko.
    const dane = limit ? lista.slice(0, 12) : lista;
    
    kontener.innerHTML = dane.map(o => {
        const foto = Array.isArray(o.zdjecia) ? o.zdjecia[0] : (o.zdjecia || 'https://via.placeholder.com/300');
        // Usunąłem serce stąd (Punkt 3)
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img src="${foto}" style="width:100%; height:180px; object-fit:cover;">
            <div style="padding:15px;">
                <b style="font-size:18px;">${o.cena} zł</b>
                <div style="color:#555; margin-top:5px;">${o.tytul}</div>
                <div style="font-size:12px; color:gray; margin-top:8px;">📍 ${o.lokalizacja || 'Polska'}</div>
            </div>
        </div>`;
    }).join('');
}

// --- FILTROWANIE I PODKATEGORIE ---
window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    const subs = SUB_DATA[kat] || [];
    panel.style.display = 'flex';
    panel.innerHTML = subs.map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
    
    const filtr = daneOgloszen.filter(o => o.kategoria === kat);
    document.getElementById('grid-title').innerText = "Kategoria: " + kat;
    render(filtr);
};

window.filtrujPoPodkat = (kat, podkat) => {
    const filtr = daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat);
    render(filtr);
};

window.filtruj = () => {
    const txt = document.getElementById('find-text').value.toLowerCase();
    const wyniki = daneOgloszen.filter(o => o.tytul.toLowerCase().includes(txt) || (o.opis && o.opis.toLowerCase().includes(txt)));
    render(wyniki);
};

// --- SZCZEGÓŁY OGŁOSZENIA ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    const box = document.getElementById('view-content');
    const fotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];

    box.innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <h2 style="margin-top:0;">${o.tytul}</h2>
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div style="flex:1.5; min-width:300px;">
                <img id="mainFoto" src="${fotki[0]}" style="width:100%; border-radius:15px; height:400px; object-fit:cover;">
                <div style="display:flex; gap:10px; margin-top:10px; overflow-x:auto;">
                    ${fotki.map((f, i) => `<img src="${f}" onclick="document.getElementById('mainFoto').src='${f}'" style="width:70px; height:70px; object-fit:cover; border-radius:8px; cursor:pointer; border:1px solid #ddd;">`).join('')}
                </div>
            </div>
            <div style="flex:1; min-width:250px; background:#f9f9f9; padding:20px; border-radius:15px;">
                <h1 style="color:var(--primary); margin:0;">${o.cena} zł</h1>
                <p style="color:gray;">📍 ${o.lokalizacja || 'Nie podano'}</p>
                <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                <div style="font-weight:bold; margin-bottom:10px;">Dane kontaktowe:</div>
                <div style="font-size:18px; color:#111; margin-bottom:15px;">📞 ${o.telefon || 'Brak numeru'}</div>
                <button onclick="alert('Funkcja wiadomości wkrótce!')" style="width:100%; padding:12px; background:#111; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">Wyślij wiadomość</button>
            </div>
        </div>
        <div style="margin-top:30px;">
            <h3>Opis</h3>
            <p style="white-space:pre-line; line-height:1.6; color:#333;">${o.opis || 'Brak opisu.'}</p>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- FUNKCJE POMOCNICZE ---
window.toggleUlubione = async (id) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się, aby dodać do ulubionych!");

    if (mojeUlubione.includes(id)) {
        await baza.from('ulubione').delete().eq('user_email', user.email).eq('ogloszenie_id', id);
        mojeUlubione = mojeUlubione.filter(x => x !== id);
    } else {
        await baza.from('ulubione').insert([{ user_email: user.email, ogloszenie_id: id }]);
        mojeUlubione.push(id);
    }
    render(daneOgloszen);
};

window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

window.onclick = (e) => {
    if (e.target.className === 'modal') zamknijModal();
    const m = document.getElementById('drop-menu');
    if (m && !e.target.closest('button')) m.style.display = 'none';
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';

// START
sprawdzUzytkownika();
pobierz();
