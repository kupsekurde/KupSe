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

// --- LOGOWANIE I REJESTRACJA ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await baza.auth.signInWithPassword({ email, password });
    if (error) alert("Błąd: " + error.message); else location.reload();
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    if (password.length < 6) return alert("Hasło min. 6 znaków!");
    const { error } = await baza.auth.signUp({ email, password });
    if (error) alert("Błąd: " + error.message); 
    else alert("Zarejestrowano! Możesz się zalogować.");
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- FUNKCJE POMOCNICZE ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    
    if (user && nav) {
        if (document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'none';

        const { data } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = data ? data.map(x => x.ogloszenie_id) : [];

        nav.innerHTML = `
            <div style="position:relative; display:flex; gap:10px; align-items:center;">
                <button onclick="toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800;">Moje Konto ▼</button>
                <div id="drop-menu" style="display:none; position:absolute; top:50px; right:0; background:white; box-shadow:0 5px 25px rgba(0,0,0,0.2); border-radius:15px; padding:15px; z-index:2001; min-width:220px;">
                    <div style="padding-bottom:10px; border-bottom:1px solid #eee; margin-bottom:10px;">
                        <small style="color:gray;">Zalogowany jako:</small><br>
                        <b style="font-size:13px; word-break:break-all;">${user.email}</b>
                    </div>
                    <div onclick="pokazMojeOgloszenia()" style="padding:10px; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div onclick="wyloguj()" style="padding:10px; cursor:pointer; color:red; font-weight:bold;">🚪 Wyloguj</div>
                </div>
                <button onclick="document.getElementById('modal-form').style.display='flex'" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj</button>
            </div>`;
    }
}

// --- POBIERANIE I RENDEROWANIE ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen, true);
}

function render(lista, czyStronaGlowna = false) {
    const kontener = document.getElementById('lista');
    if (!kontener) return;
    const dane = czyStronaGlowna ? lista.slice(0, 12) : lista;

    kontener.innerHTML = dane.map(o => {
        const foto = Array.isArray(o.zdjecia) ? o.zdjecia[0] : (o.zdjumia || 'https://via.placeholder.com/300');
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

// --- DODAWANIE OGŁOSZEŃ ---
window.updateFormSubcats = () => {
    const kategoriaGlowna = document.getElementById('f-kat').value;
    const polePodkategorii = document.getElementById('f-podkat');
    if (!polePodkategorii) return;
    const listaPodkategorii = SUB_DATA[kategoriaGlowna] || [];
    polePodkategorii.innerHTML = '<option value="">Wybierz podkategorię</option>' + 
        listaPodkategorii.map(p => `<option value="${p}">${p}</option>`).join('');
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerText = "Wysyłanie...";

    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");

    const pliki = document.getElementById('f-plik').files;
    let wgraneZdjecia = [];

    for (let f of pliki) {
        const nazwa = `${Date.now()}_${f.name}`;
        const { data } = await baza.storage.from('zdjecia').upload(nazwa, f);
        if (data) {
            const { data: urlData } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            wgraneZdjecia.push(urlData.publicUrl);
        }
    }
    if (wgraneZdjecia.length === 0) wgraneZdjecia.push('https://via.placeholder.com/600');

    const { error } = await baza.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        cena: parseFloat(document.getElementById('f-cena').value),
        lokalizacja: document.getElementById('f-lok').value,
        opis: document.getElementById('f-opis').value,
        telefon: document.getElementById('f-tel').value,
        zdjecia: wgraneZdjecia,
        user_email: user.email
    }]);

    if (error) { alert("Błąd: " + error.message); btn.disabled = false; } 
    else { alert("Dodano!"); location.reload(); }
};

// --- MOJE OGŁOSZENIA ---
window.pokazMojeOgloszenia = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const moje = daneOgloszen.filter(o => o.user_email === user.email);
    const content = document.getElementById('view-content');
    
    content.innerHTML = `<h2>Moje ogłoszenia (${moje.length})</h2>` + moje.map(o => `
        <div style="border:1px solid #ddd; padding:10px; margin-bottom:5px; border-radius:8px; display:flex; justify-content:space-between;">
            <span>${o.tytul} - ${o.cena} zł</span>
            <button onclick="usunOgloszenie(${o.id})" style="color:red; cursor:pointer;">Usuń</button>
        </div>
    `).join('');
    document.getElementById('modal-view').style.display = 'flex';
};

window.usunOgloszenie = async (id) => {
    if (confirm("Usunąć?")) {
        await baza.from('ogloszenia').delete().eq('id', id);
        location.reload();
    }
};

window.toggleUserMenu = (e) => { 
    e.stopPropagation(); 
    const m = document.getElementById('drop-menu'); 
    if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; 
};

window.zamknijModal = () => { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); };

// --- START ---
async function init() {
    await sprawdzUzytkownika();
    await pobierz();
}

init();
