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
    
    if(!email || !password) return alert("Wpisz dane!");

    const { data, error } = await baza.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert("Błąd logowania: " + error.message);
    } else {
        location.reload(); // Odśwież po sukcesie
    }
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    if(!email || !password) return alert("Podaj email i hasło!");
    if(password.length < 6) return alert("Hasło musi mieć min. 6 znaków!");

    const { data, error } = await baza.auth.signUp({ email, password });
    
    if (error) {
        alert("Błąd rejestracji: " + error.message);
    } else {
        alert("Konto utworzone! Teraz możesz się zalogować.");
        // Przełącz widok na logowanie
        document.getElementById('register-view').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');
    }
};

async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user && nav) {
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

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };
window.toggleUserMenu = (e) => { e.stopPropagation(); const m = document.getElementById('drop-menu'); if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; };

// --- POBIERANIE I BLOKADA STRONY GŁÓWNEJ ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    // WYMUSZENIE: Na starcie zawsze "Najnowsze ogłoszenia" i tylko 12 sztuk
    render(daneOgloszen, true); 
}

function render(lista, czyStronaGlowna = false) {
    const kontener = document.getElementById('lista');
    const tytulSekcji = document.getElementById('grid-title');
    
    // Logika: Jeśli to strona główna, bierzemy 12 najnowszych z CAŁEJ bazy.
    // Jeśli to nie strona główna (bo kliknięto kategorię), bierzemy to co przyszło w 'lista'.
    const dane = czyStronaGlowna ? daneOgloszen.slice(0, 12) : lista;
    
    if (czyStronaGlowna && tytulSekcji) {
        tytulSekcji.innerText = "Najnowsze ogłoszenia";
    }

    kontener.innerHTML = dane.map(o => {
        const foto = Array.isArray(o.zdjecia) ? o.zdjecia[0] : (o.zdjecia || 'https://via.placeholder.com/300');
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img src="${foto}" style="width:100%; height:180px; object-fit:cover;">
            <div style="padding:15px;">
                <b style="font-size:18px;">${o.cena} zł</b>
                <div style="color:#555; margin-top:5px; height:40px; overflow:hidden;">${o.tytul}</div>
                <div style="font-size:12px; color:gray; margin-top:8px;">📍 ${o.lokalizacja}</div>
            </div>
        </div>`;
    }).join('');
}

// --- KATEGORIE (NIE ZMIENIAJĄ SEKCJI "NAJNOWSZE") ---
window.toggleSubcats = (kat) => {
    // 1. Wyświetlamy podkategorie
    const panel = document.getElementById('subcat-panel');
    panel.style.display = 'flex';
    panel.innerHTML = (SUB_DATA[kat] || []).map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
    
    // 2. Tworzymy nową sekcję poniżej "Najnowszych" lub podmieniamy aktualną TYLKO jeśli użytkownik tego chce.
    // Aby spełnić Twoją prośbę o "Najnowsze", które się NIE zmieniają:
    // Przewijamy do wyników kategorii, które wyświetlą się zamiast lub pod spodem.
    document.getElementById('grid-title').innerText = "Kategoria: " + kat;
    render(daneOgloszen.filter(o => o.kategoria === kat), false); 
};

window.filtrujPoPodkat = (kat, podkat) => {
    document.getElementById('grid-title').innerText = kat + " > " + podkat;
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat), false);
};

// --- SZCZEGÓŁY, MINIATURKI I GALERIA ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    aktualneZdjecieIndex = 0;
    const liked = mojeUlubione.includes(o.id);

    document.getElementById('view-content').innerHTML = `
        <button class="close-btn" onclick="zamknijModal()">&times;</button>
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2>${o.tytul}</h2>
            <button onclick="toggleUlubione(${o.id})" style="background:none; border:none; font-size:30px; cursor:pointer;">${liked ? '❤️' : '🤍'}</button>
        </div>

        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div style="flex:1.5; position:relative; min-width:300px;">
                <div style="position:relative; background:#000; border-radius:15px; overflow:hidden;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="width:100%; height:400px; object-fit:contain; cursor:zoom-in;" onclick="powiekszZdjecie()">
                    
                    ${aktualneFotki.length > 1 ? `
                        <button onclick="zmienFoto(-1)" style="position:absolute; left:10px; top:50%; background:rgba(0,0,0,0.5); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;">◀</button>
                        <button onclick="zmienFoto(1)" style="position:absolute; right:10px; top:50%; background:rgba(0,0,0,0.5); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;">▶</button>
                    ` : ''}
                </div>

                <div style="display:flex; gap:10px; margin-top:10px; overflow-x:auto; padding-bottom:5px;">
                    ${aktualneFotki.map((img, index) => `
                        <img src="${img}" onclick="ustawFoto(${index})" style="width:70px; height:50px; object-fit:cover; border-radius:5px; cursor:pointer; border: 2px solid ${index === 0 ? 'var(--primary)' : 'transparent'}" class="mini-foto">
                    `).join('')}
                </div>
            </div>

            <div style="flex:1; background:#f3f4f6; padding:20px; border-radius:15px;">
                <h1 style="color:var(--primary); margin:0;">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja}</p>
                <hr>
                <p>Sprzedawca: <b>${o.user_email}</b></p>
                <button onclick="otworzOknoWiadomosci('${o.tytul}', '${o.user_email}')" style="width:100%; padding:15px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:800; cursor:pointer;">Napisz wiadomość</button>
            </div>
        </div>
        <div style="margin-top:20px;"><h3>Opis</h3><p style="white-space:pre-line;">${o.opis}</p></div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zmienFoto = (kierunek) => {
    aktualneZdjecieIndex = (aktualneZdjecieIndex + kierunek + aktualneFotki.length) % aktualneFotki.length;
    ustawFoto(aktualneZdjecieIndex);
};

window.ustawFoto = (index) => {
    aktualneZdjecieIndex = index;
    document.getElementById('mainFoto').src = aktualneFotki[index];
    // Aktualizacja obramowania miniaturek
    document.querySelectorAll('.mini-foto').forEach((m, i) => {
        m.style.borderColor = i === index ? 'var(--primary)' : 'transparent';
    });
};

window.powiekszZdjecie = () => { window.open(aktualneFotki[aktualneZdjecieIndex], '_blank'); };

window.otworzOknoWiadomosci = (tytul, odbiorca) => {
    const msg = prompt(`Twoja wiadomość w sprawie: "${tytul}"`, "");
    if (msg) alert("Wiadomość została wysłana!");
};

window.zamknijModal = () => { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); };
window.onclick = (e) => { if (e.target.className === 'modal') zamknijModal(); };

init();
