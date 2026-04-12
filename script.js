const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let aktualnaGaleria = [];

// --- LOGOWANIE ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    const { error } = await baza.auth.signInWithPassword({ email, password });

    if (error) {
        const { error: sErr } = await baza.auth.signUp({ email, password });
        if (sErr) alert(sErr.message);
        else alert("Zarejestrowano! Zaloguj się.");
    } else location.reload();
};

window.wyloguj = async () => {
    await baza.auth.signOut();
    location.reload();
};

// --- USER MENU ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');

    if (user && nav) {
        nav.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; margin-left:auto;">
            
            <div style="position:relative">
                <button onclick="toggleUserMenu(event)" 
                    style="background:#ff4f00; color:white; border:none; padding:10px 16px; border-radius:8px; cursor:pointer;">
                    ${user.email} ▼
                </button>

                <div id="drop-menu" style="
                    display:none;
                    position:absolute;
                    right:0;
                    top:50px;
                    background:white;
                    min-width:180px;
                    border-radius:10px;
                    box-shadow:0 8px 30px rgba(0,0,0,0.15);
                    padding:15px;
                ">
                    <div style="padding:8px 0; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div style="padding:8px 0; cursor:pointer;">✉️ Wiadomości</div>
                    <div style="padding:8px 0; cursor:pointer;">❤️ Ulubione</div>
                    <div onclick="wyloguj()" style="padding:8px 0; cursor:pointer; color:red;">🚪 Wyloguj</div>
                </div>
            </div>

            <img src="SprzedajSe.png" onclick="otworzModal()" style="height:40px; cursor:pointer;">
        </div>
        `;

        const auth = document.getElementById('auth-box');
        if (auth) auth.style.display = 'none';
    }
}

window.toggleUserMenu = (e) => {
    e.stopPropagation();
    const m = document.getElementById('drop-menu');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
};

// --- POBIERANIE ---
async function pobierz() {
    const { data } = await baza
        .from('ogloszenia')
        .select('*')
        .order('created_at', { ascending: false });

    daneOgloszen = data || [];

    // TYLKO 12 NA GŁÓWNEJ
    render(daneOgloszen, true);
}

// --- RENDER ---
function render(lista, limit = false) {
    const kontener = document.getElementById('lista');
    if (!kontener) return;

    const dane = limit ? lista.slice(0, 12) : lista;

    kontener.style.display = "grid";
    kontener.style.gridTemplateColumns = "repeat(auto-fill, minmax(240px, 1fr))";
    kontener.style.gap = "20px";

    kontener.innerHTML = dane.map(o => {
        let foto = o.zdjecia
            ? (Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia)
            : 'https://via.placeholder.com/300';

        return `
        <div onclick="pokazSzczegoly(${o.id})" style="background:white; border-radius:10px; border:1px solid #eee; overflow:hidden; cursor:pointer;">
            <div style="height:180px">
                <img src="${foto}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div style="padding:12px;">
                <div style="color:#ff4f00; font-weight:bold;">
                    ${o.cena.toLocaleString()} zł
                </div>
                <div style="font-size:14px;">
                    ${o.tytul}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// --- KATEGORIE ---
window.toggleSubcats = (kat) => {
    const filtr = daneOgloszen.filter(o => o.kategoria === kat);
    render(filtr, false);
};

// --- SZCZEGÓŁY ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    const box = document.getElementById('view-content');

    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];

    const mini = aktualnaGaleria.map((img, i) => `
        <img src="${img}" onclick="zmienFoto(${i})"
        style="width:60px; height:60px; cursor:pointer;">
    `).join('');

    box.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
        
        <div>
            <img id="mainFoto" src="${aktualnaGaleria[0]}"
                style="width:100%; max-height:300px; object-fit:contain; cursor:pointer;"
                onclick="powiekszFoto()">

            <div style="display:flex; gap:10px; margin-top:10px;">
                ${mini}
            </div>
        </div>

        <div>
            <h2>${o.tytul}</h2>
            <h1 style="color:#ff4f00">${o.cena} zł</h1>
            <p>${o.opis}</p>
        </div>
    </div>
    `;

    document.getElementById('modal-view').style.display = 'flex';
};

// --- GALERIA ---
window.zmienFoto = (i) => {
    document.getElementById('mainFoto').src = aktualnaGaleria[i];
};

window.powiekszFoto = () => {
    const src = document.getElementById('mainFoto').src;
    window.open(src);
};

// --- MODALE ---
window.otworzModal = () => {
    document.getElementById('modal-form').style.display = 'flex';
};

window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

window.onclick = (e) => {
    if (!e.target.closest('button')) {
        const m = document.getElementById('drop-menu');
        if (m) m.style.display = 'none';
    }

    if (e.target.className === 'modal') zamknijModal();
};

// --- START ---
sprawdzUzytkownika();
pobierz();
