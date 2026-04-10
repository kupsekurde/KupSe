// TWOJE DANE KONFIGURACYJNE
const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const baza = window.supabase.createClient(URL_S, KEY_S);

// 1. SPRAWDZANIE SESJI I POKAZYWANIE FORMULARZA
async function sprawdzSesje() {
    const { data: { user } } = await baza.auth.getUser();
    const authDiv = document.getElementById('auth-status');
    const formDiv = document.getElementById('form-dodawania');

    if (user) {
        authDiv.innerHTML = ` Zalogowany jako: <b>${user.email}</b> <br><br>
            <button onclick="wyloguj()" style="background:#ff4d4d; width:auto; padding:5px 15px;">Wyloguj</button>`;
        formDiv.style.display = "block";
    } else {
        formDiv.style.display = "none";
    }
}

// 2. LOGOWANIE I REJESTRACJA
window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;

    if(!email || !password) return alert("Wpisz email i hasło!");

    const { error: logErr } = await baza.auth.signInWithPassword({ email, password });
    
    if (logErr) {
        const { error: regErr } = await baza.auth.signUp({ email, password });
        if (regErr) alert("Błąd: " + regErr.message);
        else alert("Konto utworzone! Zaloguj się teraz.");
    }
    location.reload();
};

window.wyloguj = async () => {
    await baza.auth.signOut();
    location.reload();
};

// 3. OBSŁUGA KATEGORII
window.zmienPodkat = () => {
    const kategorie = {
        "Motoryzacja": ["Samochody", "Motocykle", "Części"],
        "Nieruchomości": ["Mieszkania", "Domy", "Działki"],
        "Elektronika": ["Telefony", "Komputery", "TV"],
        "Dom i Ogród": ["Meble", "Narzędzia", "Rośliny"]
    };
    const glowna = document.getElementById('t-kat').value;
    const pod = document.getElementById('t-podkat');
    
    pod.innerHTML = '<option value="">-- Wybierz podkategorię --</option>';
    if (kategorie[glowna]) {
        kategorie[glowna].forEach(p => {
            pod.innerHTML += `<option value="${p}">${p}</option>`;
        });
    }
};

// 4. DODAWANIE OGŁOSZENIA (Z WALIDACJĄ I ZDJĘCIEM)
window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btn-wyslij');
    const dane = {
        tytul: document.getElementById('t-tytul').value.trim(),
        kat: document.getElementById('t-kat').value,
        podkat: document.getElementById('t-podkat').value,
        cena: document.getElementById('t-cena').value,
        opis: document.getElementById('t-opis').value.trim(),
        lok: document.getElementById('t-lok').value.trim(),
        tel: document.getElementById('t-tel').value.trim(),
        plik: document.getElementById('t-plik').files[0]
    };

    // TWARDA BLOKADA PUSTYCH PÓL
    if (!dane.tytul || !dane.kat || !dane.podkat || !dane.cena || !dane.opis || !dane.lok || !dane.tel || !dane.plik) {
        alert("🚨 Wszystkie pola są wymagane!");
        return;
    }

    btn.innerText = "Wysyłanie...";
    btn.disabled = true;

    try {
        // A. Wgrywanie zdjęcia do bucketu ZDJECIA
        const nazwaPliku = `${Date.now()}_${dane.plik.name.replace(/\s/g, '_')}`;
        const { error: storageErr } = await baza.storage.from('ZDJECIA').upload(nazwaPliku, dane.plik);
        if (storageErr) throw storageErr;

        // B. Pobranie linku
        const { data: urlData } = baza.storage.from('ZDJECIA').getPublicUrl(nazwaPliku);
        const imgURL = urlData.publicUrl;

        // C. Zapis do tabeli
        const { error: dbErr } = await baza.from('ogloszenia').insert([{
            tytul: dane.tytul,
            kategoria: dane.kat,
            podkategoria: dane.podkat,
            cena: parseInt(dane.cena),
            opis: dane.opis,
            lokalizacja: dane.lok,
            telefon: dane.tel,
            zdjecia: imgURL
        }]);

        if (dbErr) throw dbErr;

        alert("✅ Dodano!");
        location.reload();

    } catch (err) {
        alert("Błąd: " + err.message);
        btn.innerText = "Opublikuj ogłoszenie";
        btn.disabled = false;
    }
};

// 5. WYŚWIETLANIE LISTY OGŁOSZEŃ
async function ladujOgloszenia() {
    const { data, error } = await baza.from('ogloszenia').select('*').order('id', { ascending: false });
    const lista = document.getElementById('lista-ogloszen');
    
    if (error) {
        lista.innerHTML = "Błąd ładowania danych.";
        return;
    }

    if (data.length === 0) {
        lista.innerHTML = "Brak ogłoszeń.";
        return;
    }

    lista.innerHTML = data.map(o => `
        <div class="ogloszenie-karta">
            ${o.zdjecia ? `<img src="${o.zdjecia}" alt="foto">` : ''}
            <h3>${o.tytul}</h3>
            <p class="cena">${o.cena} zł</p>
            <p>${o.opis}</p>
            <small>📍 ${o.lokalizacja} | 📞 ${o.telefon} | 📂 ${o.kategoria} (${o.podkategoria})</small>
        </div>
    `).join('');
}

// Start
sprawdzSesje();
ladujOgloszenia();
