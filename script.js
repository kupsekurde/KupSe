const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

let daneOgloszen = [];
const MAPA_KATEGORII = {
    "Motoryzacja": ["Samochody", "Motocykle", "Części"],
    "Dom": ["Mieszkania", "Domy", "Działki"],
    "Elektronika": ["Telefony", "Laptopy", "RTV"],
    "Ogród": ["Narzędzia", "Meble", "Rośliny"],
    "Moda": ["Odzież", "Obuwie", "Dodatki"],
    "Rolnictwo": ["Maszyny", "Ciągniki"],
    "Zwierzęta": ["Psy", "Koty", "Akcesoria"],
    "Dzieci": ["Zabawki", "Ubranka"],
    "Sport": ["Rowery", "Siłownia"],
    "Nauka": ["Książki", "Instrumenty"],
    "Usługi": ["Remonty", "Transport"],
    "Praca": ["Stała", "Dodatkowa"],
    "Inne": ["Różne"]
};

// --- KOMPRESYJA ---
async function zmniejszZdjecie(plik) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(plik);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > 1200) { h *= 1200 / w; w = 1200; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
            };
        };
    });
}

// --- POBIERANIE (LIMIT 12) ---
async function init() { await checkUser(); await pobierz(); }

async function pobierz() {
    const { data, error } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false }).limit(12);
    if(error) console.error(error);
    daneOgloszen = data || [];
    render(daneOgloszen);
}

// --- WYSZUKIWARKA ---
window.filtruj = () => {
    const txt = document.getElementById('find-text').value.toLowerCase();
    const wynik = daneOgloszen.filter(o => o.tytul.toLowerCase().includes(txt) || o.opis.toLowerCase().includes(txt));
    render(wynik);
};

// --- RENDER ---
function render(lista) {
    const div = document.getElementById('lista');
    div.style.display = "grid";
    div.style.gridTemplateColumns = "repeat(4, 1fr)"; // 4 kolumny
    div.style.gap = "20px";
    
    div.innerHTML = lista.map(o => {
        let foto = 'https://via.placeholder.com/300';
        if (o.zdjecia) {
            const arr = Array.isArray(o.zdjecia) ? o.zdjecia : o.zdjecia.replace(/[\[\]"']/g, "").split(',');
            foto = arr[0].trim();
        }
        return `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${foto}">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div style="font-weight:600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${o.tytul}</div>
                <div style="font-size:12px; color:gray">📍 ${o.lokalizacja}</div>
            </div>
        </div>`;
    }).join('');
}

// --- SZCZEGÓŁY (Miniaturki i Zoom) ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(i => i.id === id);
    const { data: { user } } = await baza.auth.getUser();
    let zdjecia = Array.isArray(o.zdjecia) ? o.zdjecia : o.zdjecia.replace(/[\[\]"']/g, "").split(',');
    
    const miniaturyHTML = zdjecia.map(u => `
        <img src="${u.trim()}" style="width:60px; height:60px; object-fit:cover; border-radius:10px; cursor:pointer; border:1px solid #ddd" 
        onclick="event.stopPropagation(); document.getElementById('main-zoom').src='${u.trim()}'">
    `).join('');

    let serce = "gray";
    if(user) {
        const { data } = await baza.from('ulubione').select('*').eq('user_id', user.id).eq('ogloszenie_id', id);
        if(data?.length > 0) serce = "red";
    }

    document.getElementById('view-content').innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div style="display:grid; grid-template-columns: 1fr 350px; gap:25px;">
            <div>
                <img id="main-zoom" src="${zdjecia[0].trim()}" style="width:100%; border-radius:20px; cursor:zoom-in" onclick="window.open(this.src)">
                <div style="display:flex; gap:10px; margin-top:15px; overflow-x:auto; padding-bottom:5px">${miniaturyHTML}</div>
            </div>
            <div>
                <div style="display:flex; justify-content:space-between">
                    <h1 style="margin:0">${o.tytul}</h1>
                    <div onclick="event.stopPropagation(); toggleUlubione(${o.id})" style="font-size:35px; cursor:pointer; color:${serce}">❤</div>
                </div>
                <h2 style="color:var(--primary); font-size:30px; margin:15px 0">${o.cena} zł</h2>
                <div style="background:#f3f4f7; padding:20px; border-radius:15px; margin-bottom:20px">${o.opis}</div>
                <p>📍 Lokalizacja: <b>${o.lokalizacja}</b></p>
                <p>📞 Telefon: <b>${o.telefon}</b></p>
                <button onclick="alert('Zadzwoń: ${o.telefon}')" style="width:100%; padding:15px; background:black; color:white; border-radius:12px; border:none; font-weight:800; cursor:pointer">ZADZWOŃ TERAZ</button>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
};

// --- KONTO I DODAWANIE ---
async function checkUser() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    if (user) {
        const nick = user.user_metadata.display_name || user.email;
        nav.innerHTML = `
            <button onclick="otworzModal()" class="btn-account" style="background:var(--primary); color:white; margin-right:10px">+ Dodaj</button>
            <button class="btn-account" onclick="document.getElementById('drop').classList.toggle('show')">Konto ▾</button>
            <div id="drop" class="dropdown-content">
                <div style="font-weight:800; padding:10px">${nick}</div>
                <button onclick="otworzUlubione()">Ulubione ❤️</button>
                <button onclick="wyloguj()" style="color:red">Wyloguj</button>
            </div>`;
        document.getElementById('auth-box').style.display = 'none';
    }
}

window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA_KATEGORII[k]) MAPA_KATEGORII[k].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const { data: { user } } = await baza.auth.getUser();
    const btn = document.getElementById('btn-save'); btn.innerText = "Przetwarzanie..."; btn.disabled = true;
    try {
        const pliki = document.getElementById('f-plik').files;
        const urls = [];
        for (let i = 0; i < pliki.length; i++) {
            const blob = await zmniejszZdjecie(pliki[i]);
            const path = `img_${Date.now()}_${i}.jpg`;
            await baza.storage.from('zdjecia').upload(path, blob);
            urls.push(baza.storage.from('zdjecia').getPublicUrl(path).data.publicUrl);
        }
        await baza.from('ogloszenia').insert([{
            tytul: document.getElementById('f-tytul').value,
            cena: parseInt(document.getElementById('f-cena').value),
            opis: document.getElementById('f-opis').value,
            lokalizacja: document.getElementById('f-lok').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: urls, email_autora: user.email,
            kategoria: document.getElementById('f-kat').value,
            podkategoria: document.getElementById('f-podkat').value
        }]);
        location.reload();
    } catch (err) { alert(err.message); btn.disabled = false; }
};

window.toggleSubcats = (k) => {
    const panel = document.getElementById('subcat-panel');
    const filtered = daneOgloszen.filter(o => o.kategoria === k);
    render(filtered);
    panel.innerHTML = MAPA_KATEGORII[k].map(s => `<div class="sub-pill" onclick="render(daneOgloszen.filter(o=>o.podkategoria==='${s}'))">${s}</div>`).join('') + `<button onclick="location.reload()" style="border:none; background:none; cursor:pointer; font-weight:bold">✕</button>`;
    panel.style.display = 'flex';
};

window.toggleUlubione = async (id) => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const { data } = await baza.from('ulubione').select('*').eq('user_id', user.id).eq('ogloszenie_id', id);
    if (data?.length > 0) await baza.from('ulubione').delete().eq('user_id', user.id).eq('ogloszenie_id', id);
    else await baza.from('ulubione').insert([{ user_id: user.id, ogloszenie_id: id }]);
    pokazSzczegoly(id);
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };
window.loguj = async () => {
    const { error } = await baza.auth.signInWithPassword({ email: document.getElementById('email').value, password: document.getElementById('pass').value });
    if (error) alert(error.message); else location.reload();
};
window.zarejestruj = async () => {
    const { error } = await baza.auth.signUp({ email: document.getElementById('reg-email').value, password: document.getElementById('reg-pass').value, options: { data: { display_name: document.getElementById('reg-nick').value } } });
    if (error) alert(error.message); else alert("Sprawdź email!");
};

init();
