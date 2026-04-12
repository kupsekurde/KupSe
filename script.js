const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
let aktualneFotki = [];

// --- DANE KATEGORII ---
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

// --- OBSŁUGA FORMULARZA DODAWANIA ---

window.updateFormSubcats = () => {
    const kategoriaGlowna = document.getElementById('f-kat').value;
    const polePodkategorii = document.getElementById('f-podkat');
    if (!polePodkategorii) return;

    const listaPodkategorii = SUB_DATA[kategoriaGlowna] || [];
    polePodkategorii.innerHTML = '<option value="">Wybierz podkategorię</option>' + 
        listaPodkategorii.map(p => `<option value="${p}">${p}</option>`).join('');
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault(); // Zatrzymuje przeładowanie strony
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerText = "Wysyłanie...";

    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się, aby dodać ogłoszenie!");

    const tytul = document.getElementById('f-tytul').value;
    const kategoria = document.getElementById('f-kat').value;
    const podkategoria = document.getElementById('f-podkat').value;
    const cena = document.getElementById('f-cena').value;
    const lokalizacja = document.getElementById('f-lok').value;
    const opis = document.getElementById('f-opis').value;
    const telefon = document.getElementById('f-tel').value;
    const pliki = document.getElementById('f-plik').files;

    let wgraneZdjecia = [];

    // Przesyłanie zdjęć do Storage
    for (let f of pliki) {
        const nazwa = `${Date.now()}_${f.name}`;
        const { data, error } = await baza.storage.from('zdjecia').upload(nazwa, f);
        if (data) {
            const { data: urlData } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            wgraneZdjecia.push(urlData.publicUrl);
        }
    }

    // Jeśli nie udało się wgrać zdjęć, użyj placeholderu
    if (wgraneZdjecia.length === 0) wgraneZdjecia.push('https://via.placeholder.com/600');

    // Zapis do tabeli 'ogloszenia'
    const { error } = await baza.from('ogloszenia').insert([{
        tytul, kategoria, podkategoria, cena: parseFloat(cena),
        lokalizacja, opis, telefon, zdjecia: wgraneZdjecia,
        user_email: user.email
    }]);

    if (error) {
        alert("Błąd: " + error.message);
        btn.disabled = false;
        btn.innerText = "Opublikuj ogłoszenie";
    } else {
        alert("Ogłoszenie dodane pomyślnie!");
        location.reload();
    }
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

                    <div onclick="pokazMojeOgloszenia()" style="padding:10px; cursor:pointer; border-radius:8px;">📝 Moje ogłoszenia</div>
                    <div onclick="alert('Wiadomości')" style="padding:10px; cursor:pointer; border-radius:8px;">✉️ Wiadomości</div>
                    <div onclick="alert('Ulubione')" style="padding:10px; cursor:pointer; border-radius:8px;">❤️ Ulubione (${mojeUlubione.length})</div>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <div onclick="wyloguj()" style="padding:10px; cursor:pointer; color:red; font-weight:bold;">🚪 Wyloguj</div>
                </div>

                <button onclick="document.getElementById('modal-form').style.display='flex'" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">+ Dodaj ogłoszenie</button>
            </div>`;
    }
}
window.toggleUserMenu = (e) => { e.stopPropagation(); const m = document.getElementById('drop-menu'); if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; };

// --- POBIERANIE I RENDEROWANIE (NAJNOWSZE OGŁOSZENIA) ---
async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen, true); // Punkt 1: Pokaż 12 najnowszych
}

function render(lista, czyStronaGlowna = false) {
    const kontener = document.getElementById('lista');
    const tytulSekcji = document.getElementById('grid-title');
    const dane = czyStronaGlowna ? daneOgloszen.slice(0, 12) : lista;
    
    if (tytulSekcji) tytulSekcji.innerText = czyStronaGlowna ? "Najnowsze ogłoszenia" : "Wyniki wyszukiwania";

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

// --- KATEGORIE ---
window.toggleSubcats = (kat) => {
    const panel = document.getElementById('subcat-panel');
    panel.style.display = 'flex';
    panel.innerHTML = (SUB_DATA[kat] || []).map(s => `<div class="sub-pill" onclick="filtrujPoPodkat('${kat}', '${s}')">${s}</div>`).join('');
    render(daneOgloszen.filter(o => o.kategoria === kat), false);
};

window.filtrujPoPodkat = (kat, podkat) => {
    render(daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat), false);
};

// --- SZCZEGÓŁY I GALERIA (MINIATURKI + PRZEŁĄCZANIE) ---
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
            <div style="flex:1.5; min-width:300px;">
                <div style="position:relative; background:#000; border-radius:15px; overflow:hidden;">
                    <img id="mainFoto" src="${aktualneFotki[0]}" style="width:100%; height:400px; object-fit:contain; cursor:pointer;" onclick="window.open(this.src)">
                    ${aktualneFotki.length > 1 ? `
                        <button onclick="zmienFoto(-1)" style="position:absolute; left:10px; top:50%; background:rgba(0,0,0,0.5); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;">◀</button>
                        <button onclick="zmienFoto(1)" style="position:absolute; right:10px; top:50%; background:rgba(0,0,0,0.5); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;">▶</button>
                    ` : ''}
                </div>
                <div style="display:flex; gap:10px; margin-top:10px; overflow-x:auto;">
                    ${aktualneFotki.map((img, i) => `<img src="${img}" onclick="ustawFoto(${i})" class="mini-foto" style="width:60px; height:45px; object-fit:cover; border-radius:5px; cursor:pointer; border:2px solid ${i===0?'orange':'#ddd'}">`).join('')}
                </div>
            </div>

            <div style="flex:1; background:#f9f9f9; padding:20px; border-radius:15px;">
                <h1 style="color:var(--primary);">${o.cena} zł</h1>
                <p>📍 ${o.lokalizacja}</p><hr>
                <div style="margin:15px 0;">📞 <b>${o.telefon || 'Brak numeru'}</b></div>
                <button onclick="wyslijWiadomosc('${o.user_email}', '${o.tytul}')" style="width:100%; padding:15px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Wyślij wiadomość</button>
            </div>
        </div>
        <div style="margin-top:20px;"><h3>Opis</h3><p style="white-space:pre-line;">${o.opis}</p></div>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

window.zmienFoto = (dir) => {
    aktualneZdjecieIndex = (aktualneZdjecieIndex + dir + aktualneFotki.length) % aktualneFotki.length;
    ustawFoto(aktualneZdjecieIndex);
};

window.ustawFoto = (idx) => {
    aktualneZdjecieIndex = idx;
    document.getElementById('mainFoto').src = aktualneFotki[idx];
    document.querySelectorAll('.mini-foto').forEach((m, i) => m.style.borderColor = i === idx ? 'orange' : '#ddd');
};

// --- SYSTEM WIADOMOŚCI (SQL) ---
window.wyslijWiadomosc = async (odbiorca, tytul) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const tresc = prompt(`Wiadomość w sprawie: ${tytul}`, "");
    if (tresc) {
        const { error } = await baza.from('wiadomosci').insert([{ nadawca: user.email, odbiorca, tresc }]);
        if (error) alert("Błąd: " + error.message); else alert("Wysłano wiadomość!");
    }
};

window.zamknijModal = () => { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); };
window.onclick = (e) => { if (e.target.className === 'modal') zamknijModal(); };

init();
// ==========================================
// MOJE OGŁOSZENIA - LOGIKA OKNA I USUWANIA
// ==========================================

window.pokazMojeOgloszenia = async () => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) {
        alert("Musisz być zalogowany!");
        return;
    }

    // Filtrujemy ogłoszenia zalogowanego użytkownika
    const moje = daneOgloszen.filter(o => o.user_email === user.email);
    
    const content = document.getElementById('view-content');
    const modal = document.getElementById('modal-view');
    
    if (moje.length === 0) {
        content.innerHTML = `
            <button class="close-btn" onclick="zamknijModal()">&times;</button>
            <div style="padding:60px 20px; text-align:center;">
                <div style="font-size: 50px; margin-bottom: 20px;">📂</div>
                <h2 style="color:#333; margin-bottom: 10px;">Nie posiadasz ogłoszeń</h2>
                <p style="color: gray; margin-bottom: 25px;">Dodaj coś, aby wyświetlić to tutaj.</p>
                <button onclick="zamknijModal(); document.getElementById('modal-form').style.display='flex'" 
                        style="padding:12px 25px; background:var(--primary); color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">
                    + Dodaj pierwsze ogłoszenie
                </button>
            </div>`;
    } else {
        content.innerHTML = `
            <button class="close-btn" onclick="zamknijModal()">&times;</button>
            <div style="padding:10px;">
                <h2 style="margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                    📝 Moje ogłoszenia <span style="background:#eee; padding:2px 10px; border-radius:15px; font-size:14px;">${moje.length}</span>
                </h2>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:15px; max-height:70vh; overflow-y:auto; padding:5px;">
                    ${moje.map(o => `
                        <div class="ad-card" style="border:1px solid #eee; cursor:default; transform:none;">
                            <img src="${Array.isArray(o.zdjecia) ? o.zdjecia[0] : (o.zdjumia || 'https://via.placeholder.com/300')}" style="width:100%; height:110px; object-fit:cover; border-radius:8px;">
                            <div style="padding:10px;">
                                <b style="display:block; margin-bottom:5px;">${o.cena} zł</b>
                                <div style="font-size:12px; color:#555; height:32px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                                    ${o.tytul}
                                </div>
                                <div style="display:flex; gap:5px; margin-top:10px;">
                                    <button onclick="pokazSzczegoly(${o.id})" style="flex:1; background:#eee; border:none; padding:6px; border-radius:5px; cursor:pointer; font-size:10px;">Podgląd</button>
                                    <button onclick="usunOgloszenie(${o.id})" style="flex:1; background:#ffebeb; color:red; border:1px solid #ffdada; padding:6px; border-radius:5px; cursor:pointer; font-size:10px; font-weight:bold;">Usuń</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }
    
    modal.style.display = 'flex';
};

window.usunOgloszenie = async (id) => {
    if (confirm("Czy na pewno chcesz usunąć to ogłoszenie?")) {
        const { error } = await baza.from('ogloszenia').delete().eq('id', id);
        if (error) {
            alert("Błąd: " + error.message);
        } else {
            alert("Usunięto pomyślnie.");
            location.reload();
        }
    }
};
