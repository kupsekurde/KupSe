const S_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const S_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const supabase = window.supabase.createClient(S_URL, S_KEY);

const KATY = {
    "Motoryzacja": ["Samochody", "Części"],
    "Elektronika": ["Telefony", "Laptopy"],
    "Moda": ["Ubrania", "Buty"],
    "Dom i Ogród": ["Meble", "Ogród"],
    "Inne": ["Różne"]
};

const IKONY = { 
    "Motoryzacja":"🚗","Elektronika":"📱","Moda":"👗","Dom i Ogród":"🌿","Inne":"📦"
};

function init() {
    const list = document.getElementById('cat-list');
    const select = document.getElementById('f-kat');
    if(!list || !select) return;

    Object.keys(KATY).forEach(k => {
        list.innerHTML += `<div class="cat-card" onclick="pobierzOgloszenia('${k}')">
            <div class="cat-icon">${IKONY[k]}</div><span>${k}</span>
        </div>`;
        select.innerHTML += `<option value="${k}">${k}</option>`;
    });
    pobierzOgloszenia();
    sprawdzSesje();
}

window.updateSub = () => {
    const k = document.getElementById('f-kat').value;
    const s = document.getElementById('f-podkat');
    s.innerHTML = '<option value="">Wybierz podkategorię</option>';
    if(KATY[k]) KATY[k].forEach(p => s.innerHTML += `<option value="${p}">${p}</option>`);
};

async function autoryzacja() {
    const email = document.getElementById('log-email').value;
    const password = document.getElementById('log-pass').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) await supabase.auth.signUp({ email, password });
    location.reload();
}

async function sprawdzSesje() {
    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        document.getElementById('nav-auth').innerHTML = `
            <img src="SprzedajSe.jpg" style="height:50px; cursor:pointer" onclick="document.getElementById('modal-add').style.display='flex'">
        `;
    }
}

async function dodajOgloszenie(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-pub');
    const pliki = document.getElementById('f-pliki').files;
    
    if(pliki.length > 5) return alert("Max 5 zdjęć!");
    btn.innerText = "Wysyłanie...";
    btn.disabled = true;

    let urls = [];
    for(let f of pliki) {
        const ext = f.name.split('.').pop();
        const path = `${Date.now()}_${Math.random().toString(36).substr(2,9)}.${ext}`;
        const { data, error } = await supabase.storage.from('ZDJECIA').upload(path, f);
        if(data) {
            const { data: publicUrl } = supabase.storage.from('ZDJECIA').getPublicUrl(path);
            urls.push(publicUrl.publicUrl);
        }
    }

    const { error } = await supabase.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        cena: document.getElementById('f-cena').value,
        opis: document.getElementById('f-opis').value,
        lokalizacja: document.getElementById('f-lok').value,
        telefon: document.getElementById('f-tel').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        zdjecia: urls
    }]);

    if(error) alert("Błąd bazy danych!");
    location.reload();
}

async function pobierzOgloszenia(kat = null) {
    let query = supabase.from('ogloszenia').select('*').order('created_at', { ascending: false });
    if(kat) query = query.eq('kategoria', kat);
    const { data } = await query;
    render(data);
}

function render(lista) {
    const div = document.getElementById('ads-list');
    if(!div) return;
    div.innerHTML = (lista || []).map(o => {
        let foto = 'https://via.placeholder.com/300x200?text=Brak+zdjęcia';
        // Nowa logika dla jsonb
        if(Array.isArray(o.zdjecia) && o.zdjecia.length > 0) foto = o.zdjecia[0];
        else if(typeof o.zdjecia === 'string' && o.zdjecia.startsWith('http')) foto = o.zdjecia;

        return `
        <div class="ad-box" onclick="pokaz(${o.id})">
            <img src="${foto}" class="ad-img" onerror="this.src='https://via.placeholder.com/300x200?text=Błąd+obrazu'">
            <div class="ad-info">
                <div class="ad-price">${o.cena} zł</div>
                <div class="ad-title">${o.tytul}</div>
            </div>
        </div>`;
    }).join('');
}

window.pokaz = async (id) => {
    const { data: o } = await supabase.from('ogloszenia').select('*').eq('id', id).single();
    if(!o) return;
    const galeria = Array.isArray(o.zdjecia) ? o.zdjecia.map(z => `<img src="${z}">`).join('') : '';
    
    document.getElementById('view-data').innerHTML = `
        <div class="gallery-preview">${galeria}</div>
        <h2>${o.tytul}</h2>
        <h1 style="color:var(--primary)">${o.cena} zł</h1>
        <p>📍 ${o.lokalizacja} | 📞 ${o.telefon}</p>
        <p style="background:#eee; padding:15px; border-radius:10px">${o.opis}</p>
        <button onclick="this.parentElement.parentElement.style.display='none'" style="width:100%; padding:10px">Zamknij</button>
    `;
    document.getElementById('modal-view').style.display = 'flex';
};

init();
