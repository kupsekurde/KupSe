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
    const { data, error } = await baza.auth.signInWithPassword({ email, password });
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

// --- USER STATUS (NAPRAWIONE) ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    
    if (user) {
        // Ukrywamy formularze logowania jeśli użytkownik jest zalogowany
        const authBox = document.getElementById('auth-box');
        if (authBox) authBox.style.display = 'none';

        // Pobieramy ulubione dla tego użytkownika
        const { data } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = data ? data.map(x => x.ogloszenie_id) : [];

        nav.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center; position:relative;">
            <button onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">Moje Konto ▼</button>
            <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:1001; min-width:220px;">
                <div style="padding-bottom:10px; border-bottom:1px solid #eee; margin-bottom:10px; font-size:12px; color:gray;">
                    Zalogowany jako:<br><b style="color:black; font-size:14px;">${user.email}</b>
                </div>
                <div onclick="alert('Wiadomości wkrótce')" style="padding:10px 0; cursor:pointer; display:flex; justify-content:space-between;">
                    <span>✉️ Wiadomości</span>
                    <span style="background:red; color:white; border-radius:50%; padding:2px 6px; font-size:10px;">0</span>
                </div>
                <div onclick="alert('Twoje ulubione id: ' + mojeUlubione.join(', '))" style="padding:10px 0; cursor:pointer;">❤️ Ulubione</div>
                <div onclick="wyloguj()" style="padding:10px 0; cursor:pointer; color:red; border-top:1px solid #eee; margin-top:10px;">🚪 Wyloguj</div>
            </div>
            <button onclick="otworzModal()" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj</button>
        </div>`;
    }
}

window.toggleUserMenu = (e) => {
    e.stopPropagation();
    const m = document.getElementById('drop-menu');
    if (m) m.style.display = m.style.display === 'block' ? 'none' : 'block';
};

// --- POBIERANIE I RENDEROWANIE ---
async function pobierz() {
    const { data, error } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Błąd pobierania:", error);
        return;
    }
    daneOgloszen = data || [];
    render(daneOgloszen, true);
}

function render(lista, limit = false) {
    const kontener = document.getElementById('lista');
    if (!kontener) return;
    
    const dane = limit ? lista.slice(0, 12) : lista;
    
    if (dane.length === 0) {
        kontener.innerHTML = "<p>Brak ogłoszeń do wyświetlenia.</p>";
        return;
    }

    kontener.innerHTML = dane.map(o => {
        const foto = Array.isArray(o.zdjecia) && o.zdjecia.length > 0 ? o.zdjecia[0] : (o.zdjecia || 'https://via.placeholder.com/300');
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

// --- FILTROWANIE ---
window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    if (!panel) return;
    
    const subs = SUB_DATA[kat] || [];
    panel.style.display = 'flex';
    panel.innerHTML = subs.map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
    
    const filtr = daneOgloszen.filter(o => o.kategoria === kat);
    const title = document.getElementById('grid-title');
    if (title) title.innerText = "Kategoria: " + kat;
    render(filtr, false);
};

window.filtrujPoPodkat = (kat, podkat) => {
    const filtr = daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat);
    render(filtr, false);
};

window.filtruj = () => {
    const txt = document.getElementById('find-text').value.toLowerCase();
    const wyniki = daneOgloszen.filter(o => 
        o.tytul.toLowerCase().includes(txt) || 
        (o.opis && o.opis.toLowerCase().includes(txt))
    );
    render(wyniki, false);
};

// --- SZCZEGÓŁY OGŁOSZENIA ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    
    const box = document.getElementById('view-content');
    const fotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    const liked = mojeUlubione.includes(o.id);
    
    const data = o.created_at ? new Date(o.created_at).toLocaleString('pl-PL', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : "Nieznana data";

    box.innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
            <div>
                <h2 style="margin:0;">${o.tytul}</h2>
                <span style="font-size:12px; color:gray;">Dodano: ${data}</span>
            </div>
            <button onclick="toggleUlubione(${o.id})" style="background:none; border:none; font-size:30px; cursor:pointer;">
                ${liked ? '❤️' : '🤍'}
            </button>
        </div>
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div style="flex:1.5; min-width:300px;">
                <img id="mainFoto" src="${fotki[0] || 'https://via.placeholder.com/300'}" 
                     onclick="window.open(this.src)" 
                     style="width:100%; height:400px; object-fit:cover; border-radius:15px; cursor:zoom-in;">
                <div style="display:flex; gap:10px; margin-top:10px; overflow-x:auto;">
                    ${fotki.map((f) => `<img src="${f}" onclick="document.getElementById('mainFoto').src='${f}'" style="width:70px; height:70px; object-fit:cover; border-radius:8px; cursor:pointer; border:1px solid #ddd;">`).join('')}
                </div>
            </div>
            <div style="flex:1; min-width:250px; background:#f9f9f9; padding:20px; border-radius:15px;">
                <h1 style="color:var(--primary); margin:0;">${o.cena} zł</h1>
                <p style="color:gray;">📍 ${o.lokalizacja || 'Polska'}</p>
                <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                <div style="font-size:18px; color:#111; margin-bottom:15px;">📞 ${o.telefon || 'Brak numeru'}</div>
                <button onclick="alert('Wiadomość do: ' + '${o.user_email || 'sprzedawcy'}')" style="width:100%; padding:12px; background:#111; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">Wyślij wiadomość</button>
            </div>
        </div>
        <div style="margin-top:30px;">
            <h3>Opis</h3>
            <p style="white-space:pre-line; color:#333;">${o.opis || 'Brak opisu'}</p>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- DODATKI ---
window.toggleUlubione = async (id) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) {
        alert("Zaloguj się!");
        return;
    }

    if (mojeUlubione.includes(id)) {
        await baza.from('ulubione').delete().eq('user_email', user.email).eq('ogloszenie_id', id);
        mojeUlubione = mojeUlubione.filter(x => x !== id);
    } else {
        await baza.from('ulubione').insert([{ user_email: user.email, ogloszenie_id: id }]);
        mojeUlubione.push(id);
    }
    pokazSzczegoly(id); 
    render(daneOgloszen, true); 
};

window.zamknijModal = () => {
    document.getElementById('modal-view').style.display = 'none';
    document.getElementById('modal-form').style.display = 'none';
};

window.otworzModal = () => {
    document.getElementById('modal-form').style.display = 'flex';
};

// Zamykanie menu po kliknięciu poza nie
window.onclick = (e) => {
    if (e.target.className === 'modal') zamknijModal();
    const m = document.getElementById('drop-menu');
    if (m && !e.target.closest('button')) m.style.display = 'none';
};

// --- START ---
sprawdzUzytkownika();
pobierz();
