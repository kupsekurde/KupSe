const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let aktualnaGaleria = [];
let odbiorcaMsg = null;

// --- LOGOWANIE ---
window.loguj = async () => {
    const email = emailEl.value;
    const password = passEl.value;

    const { error } = await baza.auth.signInWithPassword({ email, password });

    if (error) {
        await baza.auth.signUp({ email, password });
        alert("Zarejestrowano!");
    } else location.reload();
};

window.wyloguj = async () => {
    await baza.auth.signOut();
    location.reload();
};

// --- MENU ---
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');

    if (user && nav) {
        nav.innerHTML = `
        <div style="margin-left:auto; position:relative;">
            <button onclick="toggleUserMenu(event)" 
                style="background:#ff4f00;color:white;padding:10px;border:none;border-radius:8px;">
                ${user.email} ▼
            </button>

            <div id="drop-menu" style="display:none; position:absolute; right:0; background:white; padding:15px;">
                <div>📝 Moje ogłoszenia</div>
                <div>✉️ Wiadomości</div>
                <div>❤️ Ulubione</div>
                <div onclick="wyloguj()" style="color:red;">🚪 Wyloguj</div>
            </div>
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

        return `
        <div onclick="pokazSzczegoly(${o.id})" style="position:relative; border:1px solid #eee; border-radius:10px;">
            
            <button onclick="event.stopPropagation(); toggleUlubione(${o.id})"
            style="position:absolute; top:5px; right:5px;">❤️</button>

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

    const { data } = await baza
        .from('ulubione')
        .select('*')
        .eq('user_email', user.email)
        .eq('ogloszenie_id', id);

    if (data.length) {
        await baza.from('ulubione').delete().eq('id', data[0].id);
        alert("Usunięto");
    } else {
        await baza.from('ulubione').insert([{ user_email: user.email, ogloszenie_id: id }]);
        alert("Dodano ❤️");
    }
};

// 🔎 FILTR
window.filtruj = () => {
    const t = search.value.toLowerCase();
    const minV = Number(min.value) || 0;
    const maxV = Number(max.value) || Infinity;

    const wynik = daneOgloszen.filter(o =>
        o.tytul.toLowerCase().includes(t) &&
        o.cena >= minV &&
        o.cena <= maxV
    );

    render(wynik, false);
};

// 💬 WIADOMOŚCI
window.otworzWiadomosc = (email) => {
    odbiorcaMsg = email;
    document.getElementById('msg-modal').style.display = 'flex';
};

window.wyslijMsg = async () => {
    const txt = document.getElementById('msg-text').value;
    const { data: { user } } = await baza.auth.getUser();

    await baza.from('wiadomosci').insert([{
        nadawca: user.email,
        odbiorca: odbiorcaMsg,
        tresc: txt
    }]);

    alert("Wysłano!");
    msgModal.style.display = 'none';
};

// 📄 SZCZEGÓŁY
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    const box = document.getElementById('view-content');

    aktualnaGaleria = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];

    const mini = aktualnaGaleria.map((img,i)=>`
        <img src="${img}" onclick="zmienFoto(${i})" style="width:50px;">
    `).join('');

    box.innerHTML = `
    <img id="mainFoto" src="${aktualnaGaleria[0]}" onclick="powiekszFoto()" style="width:100%;">
    <div>${mini}</div>
    <h2>${o.tytul}</h2>
    <h1>${o.cena} zł</h1>
    <button onclick="otworzWiadomosc('${o.email_autora}')">Napisz</button>
    `;

    modalView.style.display = 'flex';
};

// 🖼 GALERIA
window.zmienFoto = (i) => {
    mainFoto.src = aktualnaGaleria[i];
};

window.powiekszFoto = () => {
    window.open(mainFoto.src);
};

// --- START ---
sprawdzUzytkownika();
pobierz();
