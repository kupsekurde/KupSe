const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);
let daneOgloszen = [];

const MAPA = {
    "Motoryzacja": ["Samochody", "Części"], "Nieruchomości": ["Mieszkania", "Domy"],
    "Elektronika": ["Telefony", "Laptopy"], "Dom i Ogród": ["Meble", "Ogród"],
    "Moda": ["Ubrania", "Buty"], "Rolnictwo": ["Maszyny", "Produkty"],
    "Zwierzęta": ["Psy", "Koty"], "Dla Dzieci": ["Zabawki", "Ubranka"],
    "Sport": ["Rowery", "Siłownia"], "Muzyka": ["Instrumenty", "Płyty"],
    "Usługi": ["Remonty", "Uroda"], "Praca": ["Oferty", "Szukam"], "Inne": ["Różne"]
};

// GENEROWANIE KATEGORII
const catBar = document.getElementById('category-bar');
Object.keys(MAPA).forEach(k => {
    catBar.innerHTML += `<div class="cat-item" onclick="toggleSubcats('${k}')"><div class="cat-icon">📁</div><span>${k}</span></div>`;
    document.getElementById('f-kat').innerHTML += `<option value="${k}">${k}</option>`;
});

window.updateFormSubcats = () => {
    const k = document.getElementById('f-kat').value;
    const p = document.getElementById('f-podkat');
    p.innerHTML = '<option value="">Podkategoria</option>';
    if(MAPA[k]) MAPA[k].forEach(s => p.innerHTML += `<option value="${s}">${s}</option>`);
};

window.otworzModal = () => document.getElementById('modal-form').style.display = 'flex';
window.zamknijModal = () => { 
    document.getElementById('modal-form').style.display = 'none'; 
    document.getElementById('modal-view').style.display = 'none'; 
};

// WYSYŁANIE - MAX 3 ZDJĘCIA + LIMIT 5MB
window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    const pliki = document.getElementById('f-pliki').files;
    
    if(pliki.length > 3) return alert("Możesz dodać max 3 zdjęcia!");
    
    btn.innerText = "Wysyłanie..."; btn.disabled = true;
    let urlZdjec = [];

    for(let plik of pliki) {
        if(plik.size > 5 * 1024 * 1024) { 
            alert(`Plik ${plik.name} jest za duży (max 5MB)!`);
            btn.innerText = "Opublikuj"; btn.disabled = false;
            return;
        }
        
        const ext = plik.name.split('.').pop(); // Wszystkie rozszerzenia
        const nazwa = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
        
        await baza.storage.from('ZDJECIA').upload(nazwa, plik);
        const { data } = baza.storage.from('ZDJECIA').getPublicUrl(nazwa);
        urlZdjec.push(data.publicUrl);
    }

    await baza.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        cena: parseInt(document.getElementById('f-cena').value),
        opis: document.getElementById('f-opis').value,
        lokalizacja: document.getElementById('f-lok').value,
        telefon: document.getElementById('f-tel').value,
        zdjecia: urlZdjec // Zapisujemy jako listę w bazie
    }]);
    location.reload();
};

async function pobierz() {
    const { data } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
    daneOgloszen = data || [];
    render(daneOgloszen);
}

function render(lista) {
    document.getElementById('lista').innerHTML = lista.map(o => `
        <div class="ad-card" onclick="pokazSzczegoly(${o.id})">
            <img class="ad-img" src="${Array.isArray(o.zdjecia) ? o.zdjecia[0] : o.zdjecia}">
            <div class="ad-body">
                <div class="ad-price">${o.cena} zł</div>
                <div class="ad-title">${o.tytul}</div>
                <div style="font-size:11px; color:gray">📍 ${o.lokalizacja}</div>
            </div>
        </div>
    `).join('');
}

window.pokazSzczegoly = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    const zdj = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    document.getElementById('view-content').innerHTML = `
        <span class="close-btn" onclick="zamknijModal()">&times;</span>
        <div class="gallery">${zdj.map(z => `<img src="${z}" onclick="window.open('${z}')">`).join('')}</div>
        <h2>${o.tytul}</h2>
        <h3 style="color:var(--primary)">${o.cena} zł</h3>
        <p>${o.opis}</p>
        <a href="tel:${o.telefon}" style="display:block; background:black; color:white; padding:15px; text-align:center; border-radius:10px; text-decoration:none; font-weight:bold">Zadzwoń: ${o.telefon}</a>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    if (user) {
        document.getElementById('user-nav').innerHTML = `
            <img src="SprzedajSe.jpg" class="btn-add-ad" onclick="otworzModal()">
            <button onclick="wyloguj()" style="background:none; border:none; color:red; cursor:pointer">Wyloguj</button>
        `;
    } else {
        document.getElementById('auth-box').classList.remove('hidden');
    }
}

window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    await baza.auth.signInWithPassword({ email, password });
    location.reload();
};
window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

sprawdzUzytkownika();
pobierz();
