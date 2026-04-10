const S_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const S_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const sb = window.supabase.createClient(S_URL, S_KEY);

// ... (stałe STRUKTURA i IKONY bez zmian)

async function pobierzOgloszenia() {
    try {
        const { data, error } = await sb.from('ogloszenia').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        renderuj(data);
    } catch (err) {
        console.error("Błąd pobierania:", err);
        document.getElementById('ads-list').innerHTML = "<p>Błąd ładowania danych.</p>";
    }
}

function renderuj(lista) {
    const div = document.getElementById('ads-list');
    if (!lista || lista.length === 0) {
        div.innerHTML = "<p style='grid-column: 1/-1; text-align: center; padding: 50px;'>Brak ogłoszeń. Dodaj pierwsze!</p>";
        return;
    }

    div.innerHTML = lista.map(o => {
        // Logika wyboru zdjęcia głównego
        let foto = 'https://via.placeholder.com/300x200?text=Brak+zdjęcia';
        
        if (o.zdjecia) {
            if (Array.isArray(o.zdjecia) && o.zdjecia.length > 0) {
                foto = o.zdjecia[0];
            } else if (typeof o.zdjecia === 'string' && o.zdjecia.startsWith('http')) {
                foto = o.zdjecia;
            }
        }

        return `
        <div class="ad-box" onclick="pokazSzczegoly(${o.id})">
            <img src="${foto}" class="ad-img" onerror="this.src='https://via.placeholder.com/300x200?text=Błąd+obrazu'">
            <div class="ad-info">
                <div class="ad-price">${Number(o.cena).toLocaleString()} zł</div>
                <div class="ad-title">${o.tytul}</div>
                <div style="font-size: 11px; color: #888; margin-top: 5px;">📍 ${o.lokalizacja}</div>
            </div>
        </div>`;
    }).join('');
}

// Funkcja dodawania - upewnij się, że przesyłasz tablicę (linki)
async function dodajOgloszenie(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-pub');
    const pliki = document.getElementById('f-pliki').files;
    
    if(pliki.length > 5) return alert("Max 5 zdjęć!");
    btn.innerText = "Wysyłanie..."; btn.disabled = true;

    let linki = [];
    for(let f of pliki) {
        const ext = f.name.split('.').pop();
        const sciezka = `public/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const { data, error } = await sb.storage.from('ZDJECIA').upload(sciezka, f);
        if (data) {
            const { data: urlData } = sb.storage.from('ZDJECIA').getPublicUrl(sciezka);
            linki.push(urlData.publicUrl);
        }
    }

    await sb.from('ogloszenia').insert([{
        tytul: document.getElementById('f-tytul').value,
        cena: document.getElementById('f-cena').value,
        opis: document.getElementById('f-opis').value,
        lokalizacja: document.getElementById('f-lok').value,
        telefon: document.getElementById('f-tel').value,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        zdjecia: linki // To leci jako JSONB do bazy
    }]);

    location.reload();
}
