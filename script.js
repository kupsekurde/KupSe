const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części"],
    "Nieruchomości": ["Mieszkania", "Domy", "Działki"],
    "Elektronika": ["Telefony", "Laptopy", "Gry"],
    "Dom i Ogród": ["Meble", "Ogród", "Narzędzia"],
    "Moda": ["Ubrania", "Buty"],
    "Rolnictwo": ["Maszyny", "Ciągniki"],
    "Zwierzęta": ["Psy", "Koty"],
    "Dla Dzieci": ["Zabawki", "Ubranka"],
    "Sport i Hobby": ["Rowery", "Siłownia"],
    "Muzyka i Edukacja": ["Książki", "Instrumenty"],
    "Usługi": ["Remonty", "Uroda"],
    "Praca": ["Pełny etat", "Zlecenia"],
    "Inne": ["Różne"]
};

// WALIDACJA HASŁA
function checkPass(p) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(p);
}

// WALIDACJA NICKU
const CZARNA_LISTA = ["kurde", "cholera"]; // Tu wpisz wulgaryzmy do blokady
function czyWulgarny(nick) {
    if(!nick) return false;
    const t = nick.toLowerCase();
    return CZARNA_LISTA.some(s => t.includes(s.toLowerCase()));
}

async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        const { count } = await baza.from('wiadomosci').select('*', { count: 'exact', head: true }).eq('receiver_email', user.email).eq('przeczytane', false);
        const nick = user.user_metadata.display_name || user.email.split('@')[0];
        const kropka = count > 0 ? `<span style="background:red; width:8px; height:8px; border-radius:50%; display:inline-block; margin-left:5px"></span>` : "";

        document.getElementById('user-nav').innerHTML = `
            <button onclick="otworzModal()" class="btn-account" style="background:var(--primary); color:white; margin-right:10px">Dodaj+</button>
            <div class="account-menu">
                <button class="btn-account" onclick="document.getElementById('drop').classList.toggle('show')">
                    Twoje Konto ${kropka} ▾
                </button>
                <div id="drop" class="dropdown-content">
                    <div style="font-weight:800">${nick}</div>
                    <div style="color:gray; font-size:11px; margin-bottom:10px">${user.email}</div>
                    <hr style="border:0; border-top:1px solid #eee">
                    <button onclick="otworzWiadomosci()" style="border:none; background:none; cursor:pointer; padding:10px 0; width:100%; text-align:left; font-weight:600">Wiadomości (${count})</button>
                    <button onclick="wyloguj()" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:800; padding:10px 0; width:100%; text-align:left">Wyloguj</button>
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
        if(error.message.includes("confirm")) alert("Potwierdź e-mail! Wysłaliśmy link aktywacyjny.");
        else alert("Błąd: " + error.message);
    } else location.reload();
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const nick = document.getElementById('reg-nick').value;

    if(!nick || !email || !password) return alert("Wypełnij wszystkie pola!");
    if(czyWulgarny(nick)) return alert("Ten nick zawiera niedozwolone słowa!");
    if(!checkPass(password)) return alert("Za słabe hasło! Musi mieć 8 znaków, wielką literę, cyfrę i znak specjalny.");

    const { error } = await baza.auth.signUp({ 
        email, 
        password, 
        options: { data: { display_name: nick } } 
    });

    if (error) alert(error.message);
    else {
        alert("Wysłaliśmy link aktywacyjny. POTWIERDŹ GO na poczcie, żeby móc się zalogować!");
        location.reload();
    }
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// WIADOMOŚCI
window.otworzWiadomosci = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const { data } = await baza.from('wiadomosci').select('*').eq('receiver_email', user.email).order('created_at', {ascending: false});
    const kontener = document.getElementById('messages-list');
    if(!data || data.length === 0) {
        kontener.innerHTML = "<p style='text-align:center; color:gray'>Brak wiadomości</p>";
    } else {
        kontener.innerHTML = data.map(m => `
            <div style="padding:10px; border-bottom:1px solid #eee; background:${m.przeczytane ? '#fff' : '#f0f9ff'}">
                <small style="color:gray">${m.sender_email}</small><br><div>${m.tresc}</div>
                <button onclick="wyslijWiadomosc('${m.sender_email}')" style="font-size:10px; cursor:pointer; background:none; border:1px solid #ddd; padding:4px 8px; border-radius:5px">Odpowiedz</button>
            </div>`).join('');
    }
    await baza.from('wiadomosci').update({przeczytane: true}).eq('receiver_email', user.email);
    document.getElementById('modal-messages').style.display = 'flex';
};

window.wyslijWiadomosc = async (odbiorca) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const msg = prompt("Twoja wiadomość:");
    if (msg) {
        await baza.from('wiadomosci').insert([{ sender_email: user.email, receiver_email: odbiorca, tresc: msg }]);
        alert("Wysłano!");
    }
};

// OGŁOSZENIA
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen);
}

function render(lista) {
    const kontener = document.getElementById('lista');
    if(!lista || lista.length === 0) { kontener.innerHTML = "<p style='grid-column:1/-1; text-align:center'>Brak ogłoszeń.</p>"; return; }
    kontener.innerHTML = lista.map(o => {
        // Pancerna logika wyciągania pierwszego zdjęcia
        let fotoUrl = 'https://via.placeholder.com/300x200?text=Brak+zdjęcia';
        if (o.zdjecia) {
            if (Array.isArray(o.zdjecia) && o.zdjecia.length > 0) {
                fotoUrl = o.zdjecia[0];
            } else if (typeof o.zdjecia === 'string') {
                fotoUrl = o.zdjecia.replace(/[\[\]"']/g, "").split(',')[0];
            }
        }

        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${fotoUrl}" onerror="this.src='https://via.placeholder.com/300x200?text=Błąd+ładowania'">
            <div class="ad-body">
                <div class="ad-price">${o.cena.toLocaleString()} zł</div>
                <div style="font-weight:600">${o.tytul}</div>
                <div style="font-size:12px; color:gray">📍 ${o.lokalizacja}</div>
            </div>
        </div>`;
    }).join('');
}

window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(i => i.id === id);
    const { data: { user } } = await baza.auth.getUser();
    
    let glówneFoto = 'https://via.placeholder.com/600x400';
    if (o.zdjecia) {
        glówneFoto = Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia.replace(/[\[\]"']/g, "").split(',')[0];
    }
    
    let kontaktHTML = "";
    if (user) {
        kontaktHTML = `
            <a href="tel:${o.telefon}" style="display:block; text-align:center; background:var(--primary); color:white; padding:15px; border-radius:10px; text-decoration:none; font-weight:800; margin-bottom:10px">ZADZWOŃ: ${o.telefon}</a>
            <button onclick="wyslijWiadomosc('${o.email_autora}')" style="width:100%; padding:15px; border-radius:10px; border:none; background:#111; color:white; font-weight:800; cursor:pointer">NAPISZ WIADOMOŚĆ</button>
        `;
    } else {
        kontaktHTML = `<div style="background:#fff4f4; padding:15px; border-radius:10px; color:#b91c1c; text-align:center; font-weight:bold">Zaloguj się, aby skontaktować się ze sprzedawcą.</div>`;
    }

    document.getElementById('view-content').innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div style="display:grid; grid-template-columns: minmax(300px, 1fr) 350px; gap:25px;">
            <div style="text-align:center">
                <img src="${glówneFoto}" style="max-width:100%; border-radius:15px; cursor:zoom-in" onclick="window.open('${glówneFoto}', '_blank')">
                <p style="font-size:12px; color:gray">Kliknij zdjęcie, aby otworzyć w pełnym rozmiarze</p>
            </div>
            <div>
                <h1 style="margin-top:0">${o.tytul}</h1>
                <div style="font-size:32px; font-weight:800; color:var(--primary); margin:15px 0">${o.cena.toLocaleString()} zł</div>
                <div style="background:#f3f4f7; padding:20px; border-radius:15px; margin-bottom:20px; min-height:100px; line-height:1.6">${o.opis}</div>
                <div style="margin-bottom:20px">📍 Lokalizacja: <b>${o.lokalizacja}</b></div>
                ${kontaktHTML}
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Musisz być zalogowany!");
    
    const btn = document.getElementById('btn-save');
    btn.innerText = "Wysyłanie..."; btn.disabled = true;
    
    const pliki = document.getElementById('f-plik').files;
    const urls = [];
    for (let i = 0; i < pliki.length; i++) {
        const path = `img_${Date.now()}_${i}.jpg`;
        await baza.storage.from('zdjecia').upload(path, pliki[i]);
        urls.push(baza.storage.from('zdjecia').getPublicUrl(path).data.publicUrl);
    }

    await baza.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        cena: parseInt(document.getElementById('f-cena').value),
        opis: document.getElementById('f-opis').value,
        lokalizacja: document.getElementById('f-lok').value,
        telefon: document.getElementById('f-tel').value,
        zdjecia: urls, 
        email_autora: user.email,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value
    }]);
    location.reload();
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';

// Poprawione zamykanie
function zamknijModal() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}
window.zamknijModal = zamknijModal;

// Zamykanie kliknięciem w tło
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) { zamknijModal(); }
    });
});

window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA_KATEGORII[k]) MAPA_KATEGORII[k].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
};
window.toggleSubcats = (k) => {
    const panel = document.getElementById('subcat-panel');
    render(daneOgloszen.filter(o => o.kategoria === k));
    panel.innerHTML = MAPA_KATEGORII[k].map(s => `<div class="sub-pill" onclick="render(daneOgloszen.filter(o=>o.podkategoria==='${s}'))">${s}</div>`).join('') + `<button onclick="location.reload()" style="background:#eee; border:none; padding:8px; border-radius:20px; cursor:pointer">X</button>`;
    panel.style.display = 'flex';
};

sprawdzUzytkownika();
pobierz();
