const SB_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const supabase = window.supabase.createClient(SB_URL, SB_KEY);

const DATA = {
    "Motoryzacja": ["Samochody", "Części"], "Elektronika": ["Telefony", "Laptopy"],
    "Moda": ["Ubrania", "Buty"], "Dom i Ogród": ["Meble", "Ogród"],
    "Zwierzęta": ["Akcesoria", "Karma"], "Dla Dzieci": ["Zabawki", "Wózki"],
    "Sport": ["Rowery", "Siłownia"], "Rolnictwo": ["Maszyny", "Traktory"],
    "Praca": ["Oferty", "Szukam"], "Inne": ["Różne"]
};

const ICONS = { 
    "Motoryzacja":"🚗","Elektronika":"💻","Moda":"👗","Dom i Ogród":"🏡","Zwierzęta":"🐾",
    "Dla Dzieci":"🧸","Sport":"⚽","Rolnictwo":"🚜","Praca":"💼","Inne":"📦" 
};

function init() {
    const cBox = document.getElementById('cat-box');
    const fKat = document.getElementById('f-kat');
    Object.keys(DATA).forEach(k => {
        cBox.innerHTML += `<div class="cat-card" onclick="fetchAds('${k}')"><div class="cat-icon">${ICONS[k]}</div><span>${k}</span></div>`;
        fKat.innerHTML += `<option value="${k}">${k}</option>`;
    });
    fetchAds();
    checkUser();
}

window.loadSubs = () => {
    const k = document.getElementById('f-kat').value;
    const s = document.getElementById('f-podkat');
    s.innerHTML = '<option value="">Podkategoria</option>';
    if(DATA[k]) DATA[k].forEach(p => s.innerHTML += `<option value="${p}">${p}</option>`);
};

async function handleAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) await supabase.auth.signUp({ email, password });
    location.reload();
}

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        document.getElementById('auth-zone').innerHTML = `
            <img src="SprzedajSe.jpg" style="height:50px; cursor:pointer" onclick="document.getElementById('m-add').style.display='flex'">
        `;
    }
}

async function handleUpload(e) {
    e.preventDefault();
    const btn = document.getElementById('sub-btn');
    const files = document.getElementById('f-files').files;
    if(files.length > 5) return alert("Maksymalnie 5 zdjęć!");

    btn.innerText = "Wysyłanie..."; btn.disabled = true;
    let urls = [];

    for(let f of files) {
        if(f.size > 5 * 1024 * 1024) continue;
        const ext = f.name.split('.').pop();
        const path = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        await supabase.storage.from('ZDJECIA').upload(path, f);
        const { data } = supabase.storage.from('ZDJECIA').getPublicUrl(path);
        urls.push(data.publicUrl);
    }

    await supabase.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        cena: document.getElementById('f-cena').value,
        opis: document.getElementById('f-opis').value,
        lokalizacja: document.getElementById('f-lok').value,
        telefon: document.getElementById('f-tel').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        zdjecia: urls // Tablica URLi do kolumny jsonb
    }]);
    location.reload();
}

async function fetchAds(k = null) {
    let q = supabase.from('ogloszenia').select('*').order('created_at', { ascending: false });
    if(k) q = q.eq('kategoria', k);
    const { data } = await q;
    
    document.getElementById('ads-box').innerHTML = data.map(o => {
        const img = (Array.isArray(o.zdjecia) && o.zdjecia.length > 0) ? o.zdjecia[0] : 'https://via.placeholder.com/300x200?text=Brak+zdjęcia';
        return `
        <div class="ad-item" onclick="showFull(${o.id})">
            <img src="${img}" class="ad-img">
            <div class="ad-desc">
                <div class="ad-price">${Number(o.cena).toLocaleString()} zł</div>
                <div class="ad-title">${o.tytul}</div>
                <div class="ad-meta">📍 ${o.lokalizacja}</div>
            </div>
        </div>`;
    }).join('');
}

window.showFull = async (id) => {
    const { data: o } = await supabase.from('ogloszenia').select('*').eq('id', id).single();
    const gal = Array.isArray(o.zdjecia) ? o.zdjecia.map(z => `<img src="${z}" onclick="window.open('${z}')">`).join('') : '';
    document.getElementById('view-content').innerHTML = `
        <div class="gallery-wrap">${gal}</div>
        <h2 style="margin:5px 0">${o.tytul}</h2>
        <h1 style="color:var(--primary); margin:0">${Number(o.cena).toLocaleString()} zł</h1>
        <p style="color:#6b7280; font-size:13px">${o.kategoria} > ${o.podkategoria}</p>
        <div style="background:#f3f4f6; padding:15px; border-radius:12px; margin:15px 0; font-size:14px; line-height:1.5">${o.opis}</div>
        <a href="tel:${o.telefon}" style="display:block; background:black; color:white; padding:16px; text-align:center; border-radius:14px; text-decoration:none; font-weight:900">📞 Zadzwoń: ${o.telefon}</a>
        <button onclick="this.parentElement.parentElement.style.display='none'" style="width:100%; margin-top:15px; background:none; border:none; color:#9ca3af; cursor:pointer; font-weight:700">Zamknij</button>
    `;
    document.getElementById('m-view').style.display = 'flex';
};

init();
