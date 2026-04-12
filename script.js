const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'TU_WKLEJ_SWÓJ_KLUCZ';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let aktualnaGaleria = [];
let mojeUlubione = [];

// --- LOGOWANIE ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    const { error } = await baza.auth.signInWithPassword({ email, password });

    if (error) {
        const { error: e2 } = await baza.auth.signUp({ email, password });
        if (e2) alert(e2.message);
        else alert("Zarejestrowano!");
    } else {
        location.reload();
    }
};

window.wyloguj = async () => {
    await baza.auth.signOut();
    location.reload();
};

// --- USER ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();

    const auth = document.getElementById('auth-box');
    if (user && auth) auth.style.display = 'none';

    if (user) {
        const { data } = await baza
            .from('ulubione')
            .select('*')
            .eq('user_email', user.email);

        mojeUlubione = data.map(x => x.ogloszenie_id);
    }

    const nav = document.getElementById('user-nav');

    if (user && nav) {
        nav.innerHTML = `
        <div style="margin-left:auto; display:flex; gap:10px; align-items:center;">
            
            <div style="position:relative">
                <button onclick="toggleUserMenu(event)" 
                    style="background:#ff4f00;color:white;padding:10px;border:none;border-radius:8px;">
                    Moje konto ▼
                </button>

                <div id="drop-menu" style="
                    display:none;
                    position:absolute;
                    right:0;
                    top:45px;
                    background:white;
                    padding:10px;
                    border-radius:10px;
                    box-shadow:0 8px 20px rgba(0,0,0,0.2);
                ">
                    <div onclick="alert('Moje ogłoszenia')" style="padding:8px; cursor:pointer;">📝 Moje ogłoszenia</div>
                    <div onclick="alert('Wiadomości')" style="padding:8px; cursor:pointer;">✉️ Wiadomości</div>
                    <div onclick="pokazUlubione()" style="padding:8px; cursor:pointer;">❤️ Ulubione</div>
                    <div onclick="wyloguj()" style="padding:8px; cursor:pointer; color:red;">🚪 Wyloguj</div>
                </div>
            </div>

            <img src="SprzedajSe.png" onclick="otworzModal()" style="height:40px; cursor:pointer;">
        </div>
        `;
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
    render(daneOgloszen, true);
}

// --- RENDER ---
function render(lista, limit = false) {
    const kontener = document.getElementById('lista');
    const dane = limit ? lista.slice(0, 12) : lista;

    kontener.innerHTML = dane.map(o => {
        let foto = Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia;
        const liked = mojeUlubione.includes(o.id);

        return `
        <div onclick="pokazSzczegoly(${o.id})" style="position:relative; border:1px solid #eee; border-radius:10px;">
            
            <div onclick="event.stopPropagation(); toggleUlubione(${o.id})"
                style="position:absolute; top:5px; right:5px; font-size:20px; cursor:pointer;">
                ${liked ? '❤️' : '🤍'}
            </div>

            <img src="${foto}" style="width:100%; height:180px; object-fit:cover;">
            <div style="padding:10px;">
                <b>${o.cena} zł</b>
                <div>${o.tytul}</div>
            </div>
        </div>
        `;
    }).join('');
}

// ❤️ ULUBIONE
window.toggleUlubione = async (id) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się");

    if (mojeUlubione.includes(id)) {
        await baza.from('ulubione').delete()
            .eq('user_email', user.email)
            .eq('ogloszenie_id', id);

        mojeUlubione = mojeUlubione.filter(x => x !== id);
    } else {
        await baza.from('ulubione').insert([{
            user_email: user.email,
            ogloszenie_id: id
        }]);

        mojeUlubione.push(id);
    }

    render(daneOgloszen, true);
};

window.pokazUlubione = () => {
    render(daneOgloszen.filter(o => mojeUlubione.includes(o.id)));
};

// --- PODKATEGORIE ---
window.toggleSubcats = (kat) => {
    const filtr = daneOgloszen.filter(o => o.kategoria === kat);
    render(filtr, false);
};

// --- SZCZEGÓŁY ---
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    const box = document.getElementById('view-content');

    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];

    const mini = aktualnaGaleria.map((img,i)=>`
        <img src="${img}" onclick="zmienFoto(${i})" style="width:60px; cursor:pointer;">
    `).join('');

    box.innerHTML = `
    <img id="mainFoto" src="${aktualnaGaleria[0]}" onclick="powiekszFoto()" style="width:100%;">
    <div style="display:flex; gap:10px;">${mini}</div>
    <h2>${o.tytul}</h2>
    <h1>${o.cena} zł</h1>
    <p>${o.opis}</p>
    `;

    document.getElementById('modal-view').style.display = 'flex';
};

// --- GALERIA ---
window.zmienFoto = (i) => {
    document.getElementById('mainFoto').src = aktualnaGaleria[i];
};

window.powiekszFoto = () => {
    window.open(document.getElementById('mainFoto').src);
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
