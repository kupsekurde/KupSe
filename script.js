const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let aktualnaGaleria = [];

const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części", "Opony"],
    "Nieruchomości": ["Mieszkania", "Domy", "Działki", "Biura"],
    "Elektronika": ["Telefony", "Laptopy", "Gry i Konsole", "RTV"],
    "Dom i Ogród": ["Meble", "Ogród", "Narzędzia", "Dekoracje"],
    "Moda": ["Ubrania", "Buty", "Biżuteria", "Akcesoria"],
    "Rolnictwo": ["Ciągniki", "Maszyny rolnicze", "Produkty rolne"],
    "Zwierzęta": ["Psy", "Koty", "Ptaki", "Akcesoria"],
    "Dla Dzieci": ["Zabawki", "Wózki", "Ubranka"],
    "Sport i Hobby": ["Rowery", "Siłownia", "Turystyka", "Wędkarstwo"],
    "Muzyka i Edukacja": ["Instrumenty", "Książki", "Płyty"],
    "Usługi": ["Budowlane", "Uroda", "Transport", "IT"],
    "Praca": ["Pełny etat", "Dodatkowa", "Staże"],
    "Inne": ["Za darmo", "Zamiana", "Kolekcje"]
};

// --- LOGOWANIE (NAPRAWIONE) ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    if (!email || !password) {
        alert("Wpisz email i hasło!");
        return;
    }

    // Próba logowania
    const { data, error } = await baza.auth.signInWithPassword({ email, password });

    if (error) {
        // Jeśli nie ma konta, próba rejestracji
        const { error: signUpError } = await baza.auth.signUp({ email, password });
        if (signUpError) {
            alert("Błąd: " + signUpError.message);
        } else {
            alert("Zarejestrowano! Sprawdź maila lub zaloguj się ponownie.");
        }
    } else {
        location.reload(); // Zalogowano pomyślnie
    }
};

async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    const authBox = document.getElementById('auth-box');

    if (user && nav) {
        nav.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
                <div style="position:relative">
                    <button class="btn-account" onclick="toggleUserMenu(event)">Moje Konto ▼</button>
                    <div id="drop-menu" class="dropdown-content" style="display:none; position:absolute; right:0; top:55px; background:white; min-width:200px; z-index:5000; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px; padding: 10px;">
                        <span style="font-size:11px; color:gray; padding:5px; display:block; border-bottom:1px solid #eee">Zalogowany: <b>${user.email}</b></span>
                        <button class="d-btn" onclick="alert('Moje ogłoszenia')">Moje ogłoszenia</button>
                        <button class="d-btn" onclick="wyloguj()" style="color:#ef4444; font-weight:bold; border-top:1px solid #eee; margin-top:5px">Wyloguj się</button>
                    </div>
                </div>
                <img src="SprzedajSe.png" onclick="otworzModal()" style="height: 40px; width: auto; cursor:pointer; object-fit: contain;" alt="Dodaj">
            </div>
        `;
        if (authBox) authBox.style.display = 'none'; // Ukryj formularz logowania jeśli zalogowany
    }
}

window.toggleUserMenu = (e) => {
    e.stopPropagation();
    const menu = document.getElementById('drop-menu');
    if(menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- RESZTA FUNKCJI (POBIERANIE I RENDERING) ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen.slice(0, 12));
}

function render(lista) {
    const kontener = document.getElementById('lista');
    if(!kontener) return;
    kontener.innerHTML = lista.map(o => {
        let foto = o.zdjecia ? (Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia) : 'https://via.placeholder.com/300';
        return `
            <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
                <img class="ad-img" src="${foto}">
                <div class="ad-body">
                    <div class="ad-price">${o.cena.toLocaleString()} zł</div>
                    <div class="ad-title">${o.tytul}</div>
                    <div style="font-size: 11px; color: #777; margin-top: 8px;">
                        📍 ${o.lokalizacja} | ${new Date(o.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- WIADOMOŚCI I SZCZEGÓŁY (BEZ ZMIAN) ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(item => item.id === id);
    const { data: { user } } = await baza.auth.getUser();
    const box = document.getElementById('view-content');
    
    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    
    const kontaktHtml = user ? `
        <a href="tel:${o.telefon}" class="btn-account" style="display:block; text-align:center; background:#111; color:white; text-decoration:none; padding:15px; margin-bottom:10px; border-radius:10px;">📞 ZADZWOŃ: ${o.telefon}</a>
        <button onclick="otworzOknoWiadomosci('${o.email_autora}', ${o.id}, '${o.tytul}')" style="width:100%; padding:15px; background:#ff4f00; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:800;">✉ WYŚLIJ WIADOMOŚĆ</button>
    ` : `
        <div style="background:#fff3cd; padding:15px; border-radius:10px; text-align:center; font-size:13px; border:1px solid #ffeeba; color: #856404;">
            Zaloguj się, aby zobaczyć numer i wysłać wiadomość.
        </div>
    `;

    box.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
            <div style="font-size:25px; cursor:pointer; color:#ccc;">❤</div>
            <span onclick="zamknijModal()" style="font-size:30px; cursor:pointer;">&times;</span>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div>
                <img id="main-img" src="${aktualnaGaleria[0]}" style="width:100%; border-radius:10px; height:250px; object-fit:cover;">
            </div>
            <div>
                <h2 style="margin:0">${o.tytul}</h2>
                <h1 style="color:#ff4f00; margin:10px 0">${o.cena.toLocaleString()} zł</h1>
                <p style="font-size:11px; color:gray;">📍 ${o.lokalizacja}</p>
                <div style="margin:15px 0; font-size:14px; color:#444;">${o.opis}</div>
                ${kontaktHtml}
            </div>
        </div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

window.otworzOknoWiadomosci = (odbiorca, oglId, tytul) => {
    const div = document.createElement('div');
    div.id = "msg-overlay";
    div.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; align-items:center; justify-content:center;";
    div.innerHTML = `
        <div style="background:white; padding:25px; border-radius:15px; width:320px;">
            <h4 style="margin:0">Wyślij wiadomość</h4>
            <textarea id="msg-text" style="width:100%; height:80px; margin:10px 0; padding:10px; border-radius:8px; border:1px solid #ddd;"></textarea>
            <button onclick="wyslijWiadomoscDoBazy('${odbiorca}', ${oglId})" style="width:100%; padding:10px; background:#ff4f00; color:white; border:none; border-radius:8px;">Wyślij</button>
            <button onclick="document.getElementById('msg-overlay').remove()" style="width:100%; margin-top:5px; background:none; border:none; cursor:pointer;">Anuluj</button>
        </div>
    `;
    document.body.appendChild(div);
};

window.wyslijWiadomoscDoBazy = async (odb, oId) => {
    const txt = document.getElementById('msg-text').value;
    const { data: { user } } = await baza.auth.getUser();
    await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca: odb, tresc: txt, ogloszenie_id: oId }]);
    alert("Wysłano!");
    document.getElementById('msg-overlay').remove();
};

window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';

sprawdzUzytkownika();
pobierz();
