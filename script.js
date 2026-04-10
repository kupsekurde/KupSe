const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);
let wszystkieOgloszenia = []; // Globalna lista do wyszukiwania

// 1. SESJA I AUTH
async function sprawdzSesje() {
    const { data: { user } } = await baza.auth.getUser();
    const authDiv = document.getElementById('auth-status');
    const formDiv = document.getElementById('form-dodawania');

    if (user) {
        authDiv.innerHTML = `<p>Witaj, <b>${user.email}</b>!</p>
            <button onclick="wyloguj()" style="background:#666; width:auto; padding:8px 20px;">Wyloguj się</button>`;
        formDiv.style.display = "block";
    }
}

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    if(!email || !password) return alert("Podaj dane!");

    const { error: logErr } = await baza.auth.signInWithPassword({ email, password });
    if (logErr) {
        const { error: regErr } = await baza.auth.signUp({ email, password });
        if (regErr) alert("Błąd: " + regErr.message);
        else alert("Konto stworzone! Możesz się zalogować.");
    }
    location.reload();
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// 2. KATEGORIE
window.zmienPodkat = () => {
    const kategorie = {
        "Motoryzacja": ["Samochody", "Motocykle", "Części"],
        "Nieruchomości": ["Mieszkania", "Domy", "Działki"],
        "Elektronika": ["Telefony", "Komputery", "RTV"],
        "Dom i Ogród": ["Meble", "Ogród", "Dekoracje"]
    };
    const glowna = document.getElementById('t-kat').value;
    const pod = document.getElementById('t-podkat');
    pod.innerHTML = '<option value="">-- Wybierz podkategorię --</option>';
    if (kategorie[glowna]) {
        kategorie[glowna].forEach(p => pod.innerHTML += `<option value="${p}">${p}</option>`);
    }
};

// 3. DODAWANIE Z WALIDACJĄ
window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-wyslij');
    const tytul = document.getElementById('t-tytul').value.trim();
    const kat = document.getElementById('t-kat').value;
    const podkat = document.getElementById('t-podkat').value;
    const cena = document.getElementById('t-cena').value;
    const opis = document.getElementById('t-opis').value.trim();
    const lok = document.getElementById('t-lok').value.trim();
    const tel = document.getElementById('t-tel').value.trim();
    const plik = document.getElementById('t-plik').files[0];

    if (!tytul || !kat || !podkat || !cena || !opis || !lok || !tel || !plik) {
        return alert("🚨 Wszystkie pola są wymagane!");
    }

    btn.innerText = "Wysyłanie...";
    btn.disabled = true;

    try {
        const nazwaPliku = `${Date.now()}_${plik.name.replace(/\s/g, '_')}`;
        const { error: storageErr } = await baza.storage.from('ZDJECIA').upload(nazwaPliku, plik);
        if (storageErr) throw storageErr;

        const { data: urlData } = baza.storage.from('ZDJECIA').getPublicUrl(nazwaPliku);
        
        const { error: dbErr } = await baza.from('ogloszenia').insert([{
            tytul, kategoria: kat, podkategoria: podkat, cena: parseInt(cena), 
            opis, lokalizacja: lok, telefon: tel, zdjecia: urlData.publicUrl
        }]);

        if (dbErr) throw dbErr;
        alert("✅ Ogłoszenie dodane!");
        location.reload();
    } catch (err) {
        alert("Błąd: " + err.message);
        btn.disabled = false;
        btn.innerText = "Opublikuj ogłoszenie";
    }
};

// 4. ŁADOWANIE I WYSZUKIWANIE
async function ladujOgloszenia() {
    const { data, error } = await baza.from('ogloszenia').select('*').order('id', { ascending: false });
    if (error) return document.getElementById('lista-ogloszen').innerHTML = "Błąd bazy.";
    
    wszystkieOgloszenia = data;
    renderuj(wszystkieOgloszenia);
}

function renderuj(tablica) {
    const lista = document.getElementById('lista-ogloszen');
    if (tablica.length === 0) {
        lista.innerHTML = "<h4>Nie znaleziono ogłoszeń.</h4>";
        return;
    }
    lista.innerHTML = tablica.map(o => `
        <div class="ogloszenie-karta">
            ${o.zdjecia ? `<img src="${o.zdjecia}">` : ''}
            <h3>${o.tytul}</h3>
            <p class="cena">${o.cena} zł</p>
            <p>${o.opis}</p>
            <small>📍 ${o.lokalizacja} | 📞 ${o.telefon} | 📂 ${o.kategoria}</small>
        </div>
    `).join('');
}

window.filtrujOgloszenia = () => {
    const fraza = document.getElementById('wyszukiwarka').value.toLowerCase();
    const wynik = wszystkieOgloszenia.filter(o => 
        o.tytul.toLowerCase().includes(fraza) || o.opis.toLowerCase().includes(fraza)
    );
    renderuj(wynik);
};

sprawdzSesje();
ladujOgloszenia();
