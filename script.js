const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];

// ================= MODALE =================
window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => {
    document.getElementById('modal-form').style.display = 'none';
    document.getElementById('modal-view').style.display = 'none';
};

// ================= AUTH =================
async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();

    if (user) {
        document.getElementById('user-nav').innerHTML = `
            <img src="SprzedajSe.jpg" class="btn-add-ad" onclick="otworzModal()">
            <div class="account-menu">
                <button class="btn-account" onclick="document.getElementById('drop').classList.toggle('show')">Twoje konto</button>
                <div id="drop" class="dropdown-content">
                    <span style="font-size:12px; color:gray; font-weight:bold">${user.email}</span><hr>
                    <button onclick="wyloguj()" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:800; padding:10px 0; width:100%; text-align:left">Wyloguj się</button>
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

    if (error) {
        await baza.auth.signUp({ email, password });
    }

    location.reload();
};

window.wyloguj = async () => {
    await baza.auth.signOut();
    location.reload();
};

// ================= BAZA =================
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen);
}

// ================= RENDER =================
function render(lista) {
    const kontener = document.getElementById('lista');

    if (!lista.length) {
        kontener.innerHTML = "<p>Brak ogłoszeń.</p>";
        return;
    }

    kontener.innerHTML = lista.map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${o.zdjecia[0]}" alt="foto">
            <div class="ad-body">
                <div class="ad-price">${o.cena.toLocaleString()} zł</div>
                <div class="ad-title">${o.tytul}</div>
                <div class="ad-date">
                    <span>📍 ${o.lokalizacja}</span>
                    <span>${new Date(o.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ================= SZCZEGÓŁY =================
window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(item => item.id === id);

    const box = document.getElementById('view-content');

    box.innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px">

            <div>
                <img id="main-img" src="${o.zdjecia[0]}" style="width:100%; border-radius:20px">

                <div style="display:flex; gap:10px; margin-top:10px; overflow-x:auto">
                    ${o.zdjecia.map(img => `
                        <img src="${img}" 
                             onclick="document.getElementById('main-img').src='${img}'"
                             style="width:80px; height:80px; object-fit:cover; border-radius:10px; cursor:pointer">
                    `).join('')}
                </div>
            </div>

            <div>
                <h1>${o.tytul}</h1>
                <h2 style="color:#23e5db">${o.cena.toLocaleString()} zł</h2>
                <p>📍 ${o.lokalizacja}</p>
                <p>📂 ${o.kategoria} (${o.podkategoria})</p>
                <div style="background:#f1f5f9; padding:15px; border-radius:10px">${o.opis}</div>
                <a href="tel:${o.telefon}" style="display:block; margin-top:20px; background:black; color:white; padding:15px; text-align:center; border-radius:10px; text-decoration:none;">
                    📞 ${o.telefon}
                </a>
            </div>

        </div>
    `;

    document.getElementById('modal-view').style.display = 'flex';
};

// ================= WYSYŁANIE OGŁOSZENIA =================
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btn-save');
    const files = document.getElementById('f-plik').files;

    if (files.length === 0) {
        alert("Dodaj zdjęcia");
        return;
    }

    if (files.length > 5) {
        alert("Max 5 zdjęć!");
        return;
    }

    btn.innerText = "Publikowanie...";
    btn.disabled = true;

    let urls = [];

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const path = `${Date.now()}_${Math.random()}_${file.name}`;

            const { error } = await baza.storage
                .from('zdjecia')
                .upload(path, file, { upsert: true });

            if (error) {
                alert("Błąd uploadu: " + error.message);
                btn.disabled = false;
                btn.innerText = "Opublikuj";
                return;
            }

            const { data } = baza.storage
                .from('zdjecia')
                .getPublicUrl(path);

            urls.push(data.publicUrl);
        }

        const { error } = await baza.from('ogloszenia').insert([{
            tytul: document.getElementById('f-tytul').value,
            kategoria: document.getElementById('f-kat').value,
            podkategoria: document.getElementById('f-podkat').value,
            cena: parseInt(document.getElementById('f-cena').value),
            opis: document.getElementById('f-opis').value,
            lokalizacja: document.getElementById('f-lok').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: urls
        }]);

        if (error) {
            alert("Błąd zapisu: " + error.message);
            return;
        }

        location.reload();

    } catch (err) {
        alert("Błąd: " + err.message);
        btn.disabled = false;
        btn.innerText = "Opublikuj";
    }
};

// ================= START =================
sprawdzUzytkownika();
pobierz();
