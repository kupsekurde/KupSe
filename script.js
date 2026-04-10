const S_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const S_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const sb = window.supabase.createClient(S_URL, S_KEY);

async function login() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('pass').value;
    const { error } = await sb.auth.signInWithPassword({ email: e, password: p });
    if(error) await sb.auth.signUp({ email: e, password: p });
    location.reload();
}

async function checkUser() {
    const { data: { user } } = await sb.auth.getUser();
    if(user) {
        document.getElementById('auth-ui').innerHTML = `
            <img src="SprzedajSe.jpg" style="height:45px; cursor:pointer" onclick="document.getElementById('m-add').style.display='flex'">
        `;
    }
}

async function upload(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-up');
    const files = document.getElementById('f-pliki').files;
    if(files.length > 5) return alert("Max 5 zdjęć!");

    btn.innerText = "Wysyłam..."; btn.disabled = true;
    let urls = [];

    try {
        for(let f of files) {
            const ext = f.name.split('.').pop();
            const path = `${Date.now()}_${Math.random().toString(36).substr(2,5)}.${ext}`;
            const { data, error } = await sb.storage.from('ZDJECIA').upload(path, f);
            if(data) {
                const { data: pUrl } = sb.storage.from('ZDJECIA').getPublicUrl(path);
                urls.push(pUrl.publicUrl);
            }
        }

        const { error: dbErr } = await sb.from('ogloszenia').insert([{
            tytul: document.getElementById('f-tytul').value,
            cena: document.getElementById('f-cena').value,
            opis: document.getElementById('f-opis').value,
            lokalizacja: document.getElementById('f-lok').value,
            telefon: document.getElementById('f-tel').value,
            zdjecia: urls // TO JEST JSONB
        }]);
        
        if(dbErr) throw dbErr;
        location.reload();
    } catch(err) {
        alert("Błąd: " + err.message);
        btn.disabled = false; btn.innerText = "Dodaj Ogłoszenie";
    }
}

async function getAds() {
    const list = document.getElementById('ads-list');
    try {
        const { data, error } = await sb.from('ogloszenia').select('*').order('created_at', { ascending: false });
        if(error) throw error;

        if(!data || data.length === 0) {
            list.innerHTML = "<p>Brak ogłoszeń.</p>";
            return;
        }

        list.innerHTML = data.map(o => {
            let img = 'https://via.placeholder.com/300x200?text=Brak+foto';
            // Bezpieczne sprawdzanie zdjęć
            if(o.zdjecia && Array.isArray(o.zdjecia) && o.zdjecia.length > 0) {
                img = o.zdjecia[0];
            } else if (typeof o.zdjecia === 'string') {
                img = o.zdjecia;
            }

            return `
            <div class="ad-card">
                <img src="${img}" class="ad-img" onerror="this.src='https://via.placeholder.com/300x200?text=Blad+foto'">
                <div class="ad-info">
                    <div class="ad-price">${o.cena} zł</div>
                    <div style="font-weight:bold; margin-top:5px">${o.tytul}</div>
                    <div style="font-size:12px; color:gray">📍 ${o.lokalizacja}</div>
                </div>
            </div>`;
        }).join('');
    } catch(err) {
        list.innerHTML = "<p>Błąd bazy: " + err.message + "</p>";
    }
}

checkUser();
getAds();
