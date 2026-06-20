// --- USTALENIE LIMITU ZDJĘĆ (Przeniesione na górę, aby zapobiec błędom undefined) ---
window.dajLimitZdjec = () => {
    const kat = document.getElementById('f-kat')?.value;
    const podkat = document.getElementById('f-podkat')?.value;
    
    if (kat === 'Nieruchomości' || (kat === 'Motoryzacja' && podkat === 'Samochody osobowe')) {
        return 7;
    }
    return 5;
};

window.updateCounter = (id, countId, max) => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.value.length;
    document.getElementById(countId).innerText = `zostało: ${max - val}`;
};

window.togglePhoneRequired = () => {
    const isChecked = document.getElementById('f-no-tel').checked;
    const telInput = document.getElementById('f-tel');
    if (!telInput) return;
    if (isChecked) {
        telInput.required = false;
        telInput.disabled = true;
        telInput.value = '';
        telInput.style.opacity = '0.4';
    } else {
        telInput.required = true;
        telInput.disabled = false;
        telInput.style.opacity = '1';
    }
};

// Ta funkcja zamienia "Suzuki Grand Vitara!" na "suzuki-grand-vitara"
const zrobLadnyTytul = (t) => {
    return t.toLowerCase()
        .replace(/[ąàáâãäå]/g, 'a').replace(/[ć]/g, 'c').replace(/[ęèéêë]/g, 'e')
        .replace(/[ł]/g, 'l').replace(/[ń]/g, 'n').replace(/[óòôõö]/g, 'o')
        .replace(/[ś]/g, 's').replace(/[źż]/g, 'z')
        .replace(/[^a-z0-9 ]/g, '') // usuwa znaki specjalne
        .replace(/\s+/g, '-')       // zamienia spacje na minusy
        .trim();
};

// FUNKCJA BEZPIECZEŃSTWA: Czyści tekst z groźnych znaków < > itp.
const bezpiecznyTekst = (t) => {
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
};

window.toggleSubcats = (kat) => {
    const p = document.getElementById('subcat-panel');
    if (!p) return;
    if (p.dataset.activeKat === kat && p.style.display === 'flex') {
        p.style.display = 'none'; p.dataset.activeKat = ''; return;
    }
    p.style.display = 'flex';
    p.dataset.activeKat = kat;
    p.innerHTML = (SUB_DATA[kat] || []).map(s => `
        <div class="sub-pill" onclick="window.otworzFiltry('${kat}', '${s}')">${s}</div>
    `).join('');
};

const dajNazwe = (e) => { 
    if(!e) return "Użytkownik";
    let n = e.split('@')[0]; 
    return n.charAt(0).toUpperCase() + n.slice(1); 
};

const URL_S = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const KEY_S = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';
const baza = window.supabase.createClient(URL_S, KEY_S);

// --- DANE KATEGORII ---
const SUB_DATA = {
    'Motoryzacja': ['Samochody osobowe', 'Dostawcze', 'Motocykle', 'Skutery', 'Części samochodowe', 'Pozostałe'],
    'Nieruchomości': ['Mieszkania', 'Domy', 'Garaże', 'Działki', 'Lokale', 'Pozostałe'],
    'Elektronika': ['Telefony', 'Laptopy i komputery', 'Konsole i gry', 'Telewizory', 'Audio', 'Pozostałe'],
    'Ogród': ['Narzędzia', 'Rośliny', 'Meble ogrodowe', 'Grille', 'Nawadnianie', 'Pozostałe'],
    'Moda': ['Ubrania damskie', 'Ubrania męskie', 'Buty', 'Dodatki', 'Biżuteria', 'Pozostałe'],
    'Rolnictwo': ['Ciągniki', 'Maszyny rolnicze', 'Zwierzęta hodowlane', 'Pasze i ziarno', 'Opony rolnicze', 'Pozostałe'],
    'Zwierzęta': ['Psy', 'Koty', 'Ptaki', 'Akwarystyka', 'Akcesoria', 'Pozostałe'],
    'Dzieci': ['Zabawki', 'Wózki i foteliki', 'Ubranka', 'Akcesoria dla niemowląt', 'Meble dziecięce', 'Pozostałe'],
    'Sport': ['Rowery', 'Siłownia i fitness', 'Turystyka', 'Sporty wodne', 'Sporty zimowe', 'Pozostałe'],
    'Nauka': ['Książki i podręczniki', 'Instrumenty muzyczne', 'Korepetycje', 'Artykuły biurowe', 'Kursy i szkolenia', 'Pozostałe'],
    'Usługi': ['Budowlane', 'Transport i przeprowadzki', 'Naprawa elektroniki', 'Uroda i zdrowie', 'Finanse i prawo', 'Pozostałe'],
    'Praca': ['Budowa / Remonty', 'Kierowca / Logistyka', 'Gastronomia', 'Praca biurowa', 'Sprzedaż / Handel', 'Pozostałe'],
    'Inne': ['Kolekcje', 'Antyki', 'Bilety', 'Oddam za darmo', 'Zamienię', 'Pozostałe']
};

const MOTO_DATA = {
  "Abarth": ["500", "595", "695", "124 Spider", "Grande Punto", "Punto Evo", "Pozostałe"],
  "Alfa Romeo": ["145", "146", "147", "155", "156", "159", "164", "166", "4C", "8C", "Brera", "Giulia", "Giulietta", "GT", "GTV", "MiTo", "Spider", "Stelvio", "Tonale", "Pozostałe"],
  "Audi": ["80", "90", "100", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "Allroad", "e-tron", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "S1", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "TT", "TTS", "TT RS", "Pozostałe"],
  "BMW": ["1M", "3GT", "5GT", "6GT", "i3", "i4", "i5", "i7", "i8", "IX", "IX1", "IX2", "IX3", "M2", "M3", "M4", "M5", "M8", "Seria 1", "Seria 2", "Seria 3", "Seria 4", "Seria 5", "Seria 6", "Seria 7", "Seria 8", "X1", "X2", "X3", "X3 M", "X4", "X5", "X5 M", "X6", "X6 M", "X7", "XM", "Z3", "Z4", "Pozostałe"],
  "Chevrolet": ["Aveo", "Camaro", "Captiva", "Corvette", "Cruze", "Epica", "Kalos", "Lacetti", "Malibu", "Orlando", "Spark", "Tahoe", "Trax", "Pozostałe"],
  "Citroen": ["AX", "Berlingo", "BX", "C1", "C2", "C3", "C3 Aircross", "C4", "C4 Cactus", "C4 Picasso", "C5", "C5 Aircross", "C6", "C8", "DS3", "DS4", "DS5", "Jumper", "Jumpy", "Saxo", "Xantia", "Xsara", "Pozostałe"],
  "Cupra": ["Ateca", "Born", "Formentor", "Leon", "Tavascan", "Terramar", "Pozostałe"],
  "Dacia": ["Dokker", "Duster", "Jogger", "Lodgy", "Logan", "Sandero", "Spring", "Pozostałe"],
  "Daewoo": ["Espero", "Kalos", "Lanos", "Leganza", "Matiz", "Nexia", "Nubira", "Tacuma", "Tico", "Pozostałe"],
  "Dodge": ["Caliber", "Challenger", "Charger", "Durango", "Journey", "Nitro", "RAM", "Viper", "Pozostałe"],
  "DS Automobiles": ["DS 3", "DS 4", "DS 5", "DS 7", "DS 9", "Pozostałe"],
  "Fiat": ["500", "500L", "500X", "126", "127", "Bravo", "Brava", "Cinquecento", "Croma", "Doblo", "Ducato", "Fiorino", "Freemont", "Grande Punto", "Linea", "Multipla", "Panda", "Punto", "Punto Evo", "Scudo", "Sedici", "Seicento", "Stilo", "Tipo", "Ulysse", "Pozostałe"],
  "Ford": ["B-Max", "C-Max", "EcoSport", "Edge", "Escape", "Escort", "Explorer", "Fiesta", "Focus", "Fusion", "Galaxy", "Ka", "Kuga", "Maverick", "Mondeo", "Mustang", "Puma", "Ranger", "S-Max", "Tourneo", "Transit", "Pozostałe"],
  "Honda": ["Accord", "CR-V", "Civic", "City", "FR-V", "HR-V", "Insight", "Jazz", "Legend", "Prelude", "S2000", "Pozostałe"],
  "Hyundai": ["Accent", "Atos", "Bayon", "Coupe", "Elantra", "Getz", "H-1", "i10", "i20", "i30", "i40", "IONIQ", "ix20", "ix35", "Kona", "Matrix", "Santa Fe", "Sonata", "Terracan", "Tucson", "Veloster", "Pozostałe"],
  "Infiniti": ["EX", "FX", "G", "M", "Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "Pozostałe"],
  "Isuzu": ["D-Max", "Trooper", "Pozostałe"],
  "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "XE", "XF", "XJ", "XK", "Pozostałe"],
  "Jeep": ["Avenger", "Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Patriot", "Renegade", "Wrangler", "Pozostałe"],
  "Kia": ["Carens", "Carnival", "Ceed", "Cerato", "EV6", "Magentis", "Niro", "Optima", "Picanto", "Proceed", "Rio", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Venga", "XCeed", "Pozostałe"],
  "Lamborghini": ["Aventador", "Gallardo", "Huracan", "Murcielago", "Revuelto", "Urus", "Pozostałe"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar", "Pozostałe"],
  "Lexus": ["CT", "ES", "GS", "IS", "LC", "LS", "LX", "NX", "RC", "RX", "RZ", "UX", "Pozostałe"],
  "Mazda": ["2", "3", "5", "6", "CX-3", "CX-5", "CX-7", "CX-9", "MX-5", "RX-8", "Pozostałe"],
  "Mercedes-Benz": ["Klasa A", "Klasa B", "Klasa C", "Klasa CLA", "Klasa CLK", "Klasa CLS", "Klasa E", "Klasa EQB", "Klasa EQC", "Klasa EQE", "Klasa EQS", "Klasa G", "Klasa GLA", "Klasa GLB", "Klasa GLC", "Klasa GLE", "Klasa GLS", "Klasa M", "Klasa S", "SL", "SLK", "Sprinter", "Vito", "Pozostałe"],
  "Mini": ["Clubman", "Countryman", "Cooper", "Coupe", "Paceman", "Roadster", "Pozostałe"],
  "Mitsubishi": ["ASX", "Carisma", "Colt", "Eclipse Cross", "Galant", "Grandis", "L200", "Lancer", "Outlander", "Pajero", "Space Star", "Pozostałe"],
  "Nissan": ["350Z", "370Z", "Almera", "GT-R", "Juke", "Leaf", "Micra", "Murano", "Navara", "Note", "Pathfinder", "Patrol", "Primera", "Pulsar", "Qashqai", "Terrano", "X-Trail", "Pozostałe"],
  "Opel": ["Adam", "Agila", "Antara", "Astra", "Calibra", "Combo", "Corsa", "Crossland", "Frontera", "Grandland", "Insignia", "Meriva", "Mokka", "Omega", "Signum", "Tigra", "Vectra", "Vivaro", "Zafira", "Pozostałe"],
  "Peugeot": ["1007", "106", "107", "108", "2008", "206", "207", "208", "3008", "301", "307", "308", "4007", "407", "408", "5008", "508", "607", "807", "Boxer", "Expert", "Partner", "RCZ", "Pozostałe"],
  "Porsche": ["718 Boxster", "718 Cayman", "911", "Cayenne", "Macan", "Panamera", "Taycan", "Pozostałe"],
  "Renault": ["Captur", "Clio", "Espace", "Fluence", "Grand Scenic", "Kadjar", "Kangoo", "Koleos", "Laguna", "Master", "Megane", "Modus", "Scenic", "Talisman", "Thalia", "Trafic", "Twingo", "Vel Satis", "Zoe", "Pozostałe"],
  "Seat": ["Alhambra", "Altea", "Arona", "Ateca", "Cordoba", "Exeo", "Ibiza", "Leon", "Mii", "Tarraco", "Toledo", "Pozostałe"],
  "Skoda": ["Citigo", "Fabia", "Favorit", "Felicia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Rapid", "Roomster", "Scala", "Superb", "Yeti", "Pozostałe"],
  "Subaru": ["Forester", "Impreza", "Legacy", "Levorg", "Outback", "Tribeca", "WRX", "XV", "Pozostałe"],
  "Suzuki": ["Across", "Alto", "Baleno", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "S-Cross", "Splash", "Swift", "SX4", "Vitara", "Pozostałe"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster", "Pozostałe"],
  "Toyota": ["Auris", "Avensis", "Aygo", "bZ4X", "C-HR", "Camry", "Celica", "Corolla", "GR86", "Hilux", "Highlander", "Land Cruiser", "MR2", "Prius", "Proace", "RAV4", "Supra", "Verso", "Yaris", "Pozostałe"],
  "Volkswagen": ["Amarok", "Arteon", "Beetle", "Bora", "Caddy", "California", "Caravelle", "CC", "Crafter", "EOS", "Fox", "Golf", "ID.3", "ID.4", "ID.5", "ID.7", "Jetta", "Multivan", "Passat", "Phaeton", "Polo", "Scirocco", "Sharan", "T-Cross", "T-Roc", "Taigo", "Tiguan", "Touareg", "Touran", "Transporter", "Up", "Pozostałe"],
  "Volvo": ["C30", "C40", "S40", "S60", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90", "Pozostałe"],
  "Pozostałe": ["Pozostałe"]
};

const formatujDate = (d) => {
    const dataObj = new Date(d);
    const dzien = String(dataObj.getDate()).padStart(2, '0');
    const miesiac = String(dataObj.getMonth() + 1).padStart(2, '0');
    const rok = dataObj.getFullYear();
    const h = String(dataObj.getHours()).padStart(2, '0');
    const m = String(dataObj.getMinutes()).padStart(2, '0');
    return `${dzien}.${miesiac}.${rok} ${h}:${m}`;
};

let daneOgloszen = [];
let mojeUlubione = [];
let aktualneZdjecieIndex = 0;
window.obecneOgloszenieId = null; 
let aktualneFotki = [];
let wynikiBazowe = [];
let ostatnieWyniki = [];
let ostatniTytul = "";

window.szukaj = async () => {
    console.log("Start szukania...");

    const p1 = document.getElementById('szukajka-glowna');
    const p2 = document.getElementById('miasto-input');
    
    if (!p1 || !p2) {
        console.error("BŁĄD: Nie znaleziono pól w HTML!");
        return;
    }

    const tekst = p1.value.toLowerCase().trim();
    const loc = p2.value.toLowerCase().trim();
    
    const bezOgonkow = (t) => t.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
        .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z');

    try {
        const data = daneOgloszen.filter(o => {
            const tytulNorm = bezOgonkow(o.tytul || "");
            const lokNorm = bezOgonkow(o.lokalizacja || "");
            return tytulNorm.includes(bezOgonkow(tekst)) && lokNorm.includes(bezOgonkow(loc));
        });

        if (data.length === 0) {
            document.getElementById('lista').innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>Brak wyników dla podanych kryteriów.</p>";
        } else {
            window.renderujOgloszenia(data);
        }

        const title = document.getElementById('grid-title');
        if (title) title.innerText = (tekst || loc) ? "Wyniki wyszukiwania" : "Najnowsze ogłoszenia";

    } catch (err) {
        console.error("Nieoczekiwany błąd skryptu:", err);
    }
};

// --- LOGOWANIE I INTERFEJS ---
window.loguj = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const token = (window.turnstile) ? window.turnstile.getResponse() : "";

    if (!token || token === "") {
        return alert("BŁĄD: Kliknij w okienko weryfikacji 'Nie jestem robotem'!");
    }

    const { data, error } = await baza.auth.signInWithPassword({ 
        email, 
        password,
        options: { captchaToken: token } 
    });

    if (error) {
        let komunikat = error.message;
        if (komunikat === "Invalid login credentials") {
            komunikat = "Nieprawidłowe hasło lub login";
        }
        alert("Błąd: " + komunikat);
        if(window.turnstile) turnstile.reset(); 
    } else {
        location.reload();
    }
};

window.logujSpolecznosciowo = async (dostawca) => {
    const { data, error } = await baza.auth.signInWithOAuth({
        provider: dostawca,
        options: {
            redirectTo: window.location.origin,
            scopes: dostawca === 'facebook' ? 'email,public_profile' : 'email'
        }
    });
    if (error) alert("Błąd logowania: " + error.message);
};

window.zarejestruj = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const zgoda = document.getElementById('reg-zgoda-regulamin').checked;

    if (!email || !password) return alert("Wypełnij email i hasło!");
    
    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passRegex.test(password)) {
        return alert("Hasło nie spełnia wymogów:\n• min. 8 znaków\n• duża litera\n• liczba\n• znak specjalny");
    }

    if (!zgoda) return alert("Musisz zaakceptować regulamin!");

    const token = (window.turnstile) ? window.turnstile.getResponse() : "";

    if (!token || token === "") {
        return alert("Musisz potwierdzić, że nie jesteś robotem!");
    }

    const { data, error } = await baza.auth.signUp({ 
        email, 
        password,
        options: { captchaToken: token }
    });
    if (error) {
        alert("Błąd: " + error.message);
        if(window.turnstile) turnstile.reset();
    } else {
        alert("Konto utworzone! Sprawdź e-mail, aby aktywować konto.");
        location.reload();
    }
};

async function sprawdzUzytkownika() {
    const { data: { user } } = await baza.auth.getUser();
    const nav = document.getElementById('user-nav');
    const authBox = document.getElementById('auth-box');

    if (user) {
        if (authBox) authBox.style.display = 'none';
        const { data: nData } = await baza.from('wiadomosci').select('nadawca').eq('odbiorca', user.email).eq('przeczytane', false);
        const msgCount = nData ? [...new Set(nData.map(m => m.nadawca))].length : 0;
        const { data: uData } = await baza.from('ulubione').select('ogloszenie_id').eq('user_email', user.email);
        mojeUlubione = uData ? uData.map(x => Number(x.ogloszenie_id)) : [];

        nav.innerHTML = `
            <div style="position:relative; display:flex; gap:10px; align-items:center; justify-content:center; flex-wrap:wrap;">
                <span style="font-weight:800; font-size:13px; width:100%; text-align:center; margin-bottom:5px;">Witaj ${dajNazwe(user.email)}</span>
                <button onclick="window.otworzFormularzDodawania()" style="background:#111; color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:13px;">+ Dodaj</button>
                <div style="position:relative;">
                    <button onclick="window.toggleUserMenu(event)" style="background:var(--primary); color:white; border:none; padding:10px 15px; border-radius:10px; cursor:pointer; font-weight:800; font-size:13px; display:flex; align-items:center; gap:5px; position:relative;">
                        Moje Konto ▼
                        ${msgCount > 0 ? `<span id="msg-badge" style="position:absolute; top:-8px; right:-8px; background:red; color:white; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:11px; border:2px solid white; font-weight:bold;">${msgCount}</span>` : ''}
                    </button>
                    <div id="drop-menu" style="display:none; position:absolute; top:110%; left:0; background:white; box-shadow:0 10px 30px rgba(0,0,0,0.2); border-radius:15px; padding:5px; z-index:2001; min-width:210px; border:1px solid #eee;">
                        <div onclick="window.pokazMojeOgloszenia()" style="padding:12px 15px; cursor:pointer; border-bottom:1px solid #f5f5f5; font-size:14px; text-align:left; display:flex; align-items:center; gap:10px;"><span>📝</span> Moje ogłoszenia</div>
                        <div onclick="window.pokazSkrzynke()" style="padding:12px 15px; cursor:pointer; border-bottom:1px solid #f5f5f5; font-size:14px; text-align:left; display:flex; align-items:center; gap:10px;">
                            <span>✉️</span> Wiadomości 
                            ${msgCount > 0 ? `<span style="background:red; color:white; border-radius:10px; padding:2px 8px; font-size:10px; margin-left:auto;">${msgCount}</span>` : ''}
                        </div>
                        <div onclick="window.pokazUlubione()" style="padding:12px 15px; cursor:pointer; border-bottom:1px solid #f5f5f5; font-size:14px; text-align:left; display:flex; align-items:center; gap:10px;">
                            <span>❤️</span> Ulubione
                            ${mojeUlubione.length > 0 ? `<span style="background:#eee; color:#333; border-radius:10px; padding:2px 8px; font-size:10px; margin-left:auto;">${mojeUlubione.length}</span>` : ''}
                        </div>
                        <div onclick="window.wyloguj()" style="padding:12px 15px; cursor:pointer; color:red; font-weight:bold; font-size:14px; text-align:left; display:flex; align-items:center; gap:10px;"><span>🚪</span> Wyloguj</div>
                    </div>
                </div>
            </div>`;
    } else {
        if (authBox) authBox.style.display = 'block';
        nav.innerHTML = `<button onclick="document.getElementById('auth-box').scrollIntoView({behavior:'smooth'})" class="btn-account">Zaloguj się</button>`;
        
        const renderujLogin = () => {
            if (window.turnstile) {
                const box = document.getElementById('bot-login');
                if (box && box.innerHTML === "") {
                    turnstile.render('#bot-login', { 
                        sitekey: '0x4AAAAAADVZBdOrbapzXNUP',
                        theme: 'light' 
                    });
                }
            } else {
                setTimeout(renderujLogin, 500); 
            }
        };
        renderujLogin();
    }
}

// --- WIADOMOŚCI ---
window.pokazSkrzynke = async () => {
    const { data: { user } } = await baza.auth.getUser();
    const { data: msgs } = await baza.from('wiadomosci').select('*').or(`nadawca.eq.${user.email},odbiorca.eq.${user.email}`).order('created_at', { ascending: false });
    const rozmowcy = [...new Set(msgs.map(m => m.nadawca === user.email ? m.odbiorca : m.nadawca))];
    
    const mb = document.querySelector('.modal-box');
    if(mb) mb.style.maxWidth = "350px"; 

    let html = `<button class="close-btn" onclick="window.wrocDoOgloszeniaLubZamknij()">&times;</button>
                <h2 style="text-align:center; margin-bottom:20px;">Wiadomości</h2>
                <div style="display:flex; flex-direction:column; gap:8px;">`;

    rozmowcy.forEach(r => {
        const nowe = msgs.some(m => m.nadawca === r && m.odbiorca === user.email && !m.przeczytane);
        const styl = nowe ? 'font-weight:900; background:#fff4e6; border-left:4px solid var(--primary);' : 'background:#f9f9f9;';
        html += `
            <div style="padding:15px; ${styl} border-radius:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; border:1px solid #eee;" onclick="window.otworzChat('${r}')">
                <span>${dajNazwe(r)}</span>
                <button onclick="event.stopPropagation(); window.usunRozmowe('${r}')" style="background:none; border:none; cursor:pointer; font-size:18px;">🗑️</button>
            </div>`;
    });
    document.getElementById('view-content').innerHTML = html + (rozmowcy.length ? '' : '<p style="text-align:center; color:gray;">Brak wiadomości</p>') + '</div>';
    document.getElementById('modal-view').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.usunRozmowe = async (zKim) => {
    if(!confirm(`Usunąć całą historię z ${dajNazwe(zKim)}?`)) return;
    const { data: { user } } = await baza.auth.getUser();
    await baza.from('wiadomosci').delete().or(`and(nadawca.eq.${user.email},odbiorca.eq.${zKim}),and(nadawca.eq.${zKim},odbiorca.eq.${user.email})`);
    window.pokazSkrzynke();
};

window.otworzChat = async (zKim) => {
    const { data: { user } } = await baza.auth.getUser();
    await baza.from('wiadomosci').update({ przeczytane: true }).eq('odbiorca', user.email).eq('nadawca', zKim);
    await sprawdzUzytkownika(); 
    const { data: msg } = await baza.from('wiadomosci').select('*').or(`and(nadawca.eq.${user.email},odbiorca.eq.${zKim}),and(nadawca.eq.${zKim},odbiorca.eq.${user.email})`).order('created_at', { ascending: true });
    
    const mb = document.querySelector('.modal-box');
    if(mb) mb.style.maxWidth = "350px";

    document.getElementById('view-content').innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px;">
            <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="window.pokazSkrzynke()" style="background:none; border:none; font-size:20px; cursor:pointer;">←</button>
                <h4 style="margin:0;">${dajNazwe(zKim)}</h4>
            </div>
            <button class="close-btn" onclick="window.wrocDoOgloszeniaLubZamknij()" style="position:static; font-size:25px;">&times;</button>
        </div>
        <div id="chat-window" style="height:350px; overflow-y:auto; background:#ffffff; padding:10px; border:1px solid #eee; border-radius:12px; display:flex; flex-direction:column; gap:8px;">
            ${msg.map(m => {
                const moja = m.nadawca === user.email;
                const d = new Date(m.created_at);
                const g = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                const dz = String(d.getDate()).padStart(2, '0');
                const ms = String(d.getMonth() + 1).padStart(2, '0');
                const r = d.getFullYear();
                const czas = `${g}:${min} | ${dz}.${ms}.${r}`;
                return `
                <div style="max-width:85%; align-self: ${moja ? 'flex-end' : 'flex-start'};">
                    <div style="background:${moja ? 'var(--primary)' : '#f0f0f0'}; color:${moja ? 'white' : 'black'}; padding:7px 12px; border-radius:12px; font-size:13px; box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                        ${m.tresc}
                    </div>
                    <div style="font-size:8px; color:gray; text-align:${moja?'right':'left'}; margin-top:2px;">${czas}</div>
                </div>`;
            }).join('')}
        </div>
        <div style="display:flex; gap:5px; margin-top:10px;">
            <input type="text" id="chat-input" placeholder="Napisz..." autocomplete="off" spellcheck="false" style="flex:1; padding:10px; border-radius:20px; border:1px solid #ddd;">
            <button onclick="window.wyslijZChatu('${zKim}')" style="background:var(--primary); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;">➤</button>
        </div>`;
    const win = document.getElementById('chat-window'); win.scrollTop = win.scrollHeight;
    document.getElementById('chat-input').onkeypress = (e) => { if(e.key === 'Enter') window.wyslijZChatu(zKim); };
};

window.wyslijZChatu = async (odbiorca) => {
    const { data: { user } } = await baza.auth.getUser();
    const surowaTresc = document.getElementById('chat-input').value.trim();
    if (!surowaTresc) return;

    const czystaTresc = bezpiecznyTekst(surowaTresc);

    await baza.from('wiadomosci').insert([{ 
        nadawca: user.email, 
        odbiorca, 
        tresc: czystaTresc, 
        przeczytane: false 
    }]);
    
    document.getElementById('chat-input').value = '';
    window.otworzChat(odbiorca);
};

window.wrocDoOgloszeniaLubZamknij = () => {
    if (window.obecneOgloszenieId) {
        window.pokazSzczegoly(window.obecneOgloszenieId);
    } else {
        window.zamknijModal();
    }
};

// --- FUNKCJE SYSTEMOWE ---
window.zamknijModal = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    document.title = "KupSe24 - Twój Portal Ogłoszeniowy";
    document.body.style.overflow = 'auto'; 
    const czystyURL = window.location.pathname;
    window.history.pushState({}, '', czystyURL);
    window.obecneOgloszenieId = null;
    const mb = document.querySelector('.modal-box');
    if(mb) mb.style.maxWidth = "1250px";
};

window.zamknijIResetujModal = () => {
    window.zamknijModal();
};

window.toggleUserMenu = (e) => { 
    e.stopPropagation(); 
    const m = document.getElementById('drop-menu'); 
    if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; 
};

window.wyloguj = async () => { await baza.auth.signOut(); location.reload(); };

// --- SZCZEGÓŁY OGŁOSZENIA ---
window.pokazSzczegoly = async (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;

    o.wyswietlenia = (o.wyswietlenia || 0) + 1;
    baza.from('ogloszenia').update({ wyswietlenia: o.wyswietlenia }).eq('id', id).then();
    
    window.obecneOgloszenieId = id; 
    window.aktualneZdjecieIndex = 0; 

    const ladnyTytul = zrobLadnyTytul(o.tytul);
    const nowyURL = new URL(window.location);
    nowyURL.searchParams.set('ogloszenie', `${ladnyTytul}-${o.id}`);
    window.history.pushState({id: o.id}, '', nowyURL);

    document.title = `${o.tytul} - ${o.cena} zł | KupSe24.pl`;

    let { data: { user } } = await baza.auth.getUser();
    if (!user) {
        const session = await baza.auth.getSession();
        user = session.data?.session?.user || null;
    }

    window.aktualneFotki = Array.isArray(o.zdjecia) ? o.zdjecia : [o.zdjecia];
    const telCzysty = (o.telefon && o.telefon !== 'brak') ? String(o.telefon) : '';
    const telFormat = telCzysty ? telCzysty.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '';
    
    let telefonWidok = "";
    if (!telCzysty) {
        telefonWidok = `<b style="margin-left:8px; color:gray;">Nie podano</b>`;
    } else {
        telefonWidok = user ? `
            <button onclick="this.outerHTML='<b style=&quot;font-size:16px; margin-left:8px; font-weight:800;&quot;>${telFormat}</b>'" 
                    style="background:var(--primary); color:white; border:none; padding:4px 15px; border-radius:8px; font-weight:800; cursor:pointer; font-size:12px; margin-left:8px; vertical-align:middle;">
                Pokaż
            </button>` : `<span style="color:red; font-size:11px; margin-left:8px;">[Zaloguj się]</span>`;
    }
    
    const btnWstecz = ostatnieWyniki.length > 0 
        ? `<button onclick="window.pokazWynikiModal(ostatniTytul, ostatnieWyniki)" style="background:#f5f5f5; border:none; padding:8px 16px; border-radius:20px; cursor:pointer; font-weight:800; display:flex; align-items:center; gap:6px; font-size:13px; color:#111; transition: 0.2s;">⬅ Powrót</button>` 
        : "";

    document.getElementById('view-content').innerHTML = `
        <style>
            .main-split { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
            @media (max-width: 768px) {
                .main-split { display: flex; flex-direction: column; gap: 20px; }
                .main-foto-box { height: 250px !important; }
                .modal-box { padding: 15px !important; }
            }
        </style>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;">
            <div>
                ${btnWstecz}
                <div style="font-size:11px; color:#777; margin-top:8px; font-weight:600; text-transform:uppercase;">
                    ${o.kategoria} <span style="color:#ccc; margin:0 5px;">—</span> ${o.podkategoria} ${o.wojewodztwo ? `<span style="color:#ccc; margin:0 5px;">—</span> Woj. ${o.wojewodztwo}` : ''}
                </div>
            </div>
            <button class="close-btn" onclick="window.zamknijModal()" style="position:static; background:#f5f5f5; border:none; width:35px; height:35px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:22px; color:#333;">&times;</button>
        </div>

        <div class="main-split">
            <div class="foto-column">
                <div class="main-foto-box" style="background:#000; border-radius:15px; height:400px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <img id="mainFoto" src="${window.aktualneFotki[0]}" style="max-width:100%; max-height:100%; object-fit: contain;" onclick="window.otworzFullFoto()">
                </div>
                <div style="display:flex; gap:8px; margin-top:12px; overflow-x:auto; padding-bottom:5px;">
                    ${window.aktualneFotki.map((img, i) => `<img src="${img}" onclick="window.zmienGlowneZdjecie(${i})" class="mini-foto" style="width:70px; height:70px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid ${i===0?'var(--primary)':'transparent'}; flex-shrink:0;">`).join('')}
                </div>
            </div>

            <div class="info-column" style="display:flex; flex-direction:column;">
                <div style="font-size:11px; color:gray;">Dodano: ${formatujDate(o.created_at)}</div>
                <h2 style="font-size:24px; margin:10px 0; color:var(--text); line-height:1.2;">${o.tytul}</h2>
                <h1 style="color:var(--primary); font-size:32px; margin:5px 0;">${o.cena} zł</h1>
                
                <div style="margin-top:15px; font-size:15px; color:#444; display:flex; flex-direction:column; gap:12px;">
                    <span style="display:flex; align-items:center;">📍 Lokalizacja: <b style="margin-left:8px;">${o.lokalizacja} ${o.wojewodztwo ? `(${o.wojewodztwo})` : ''}</b></span>
                    <span style="display:flex; align-items:center;">📞 Telefon: ${telefonWidok}</span>
                </div>
                <div class="action-buttons" style="display:flex; gap:8px; align-items:center; margin-top:25px;">
                    ${(user && user.email !== o.user_email) ? 
                        `<button onclick="event.stopPropagation(); window.otworzChat('${o.user_email}')" style="padding:12px 20px; background:var(--primary); color:white; border:none; border-radius:10px; font-weight:800; cursor:pointer; font-size:14px; display:flex; align-items:center; gap:8px;">✉ Wyślij wiadomość</button>` : 
                        `<span style="font-size:12px; color:gray;">${user ? '' : 'Zaloguj się, aby napisać'}</span>`
                    }
                    <button onclick="window.udostepnijOgloszenie(event, ${o.id})" style="width:44px; height:44px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer; font-size:20px; display:flex; align-items:center; justify-content:center;">🔗</button>
                    <button onclick="window.toggleUlubione(event, ${o.id})" class="fav-btn-${o.id}" style="width:44px; height:44px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer; font-size:20px; display:flex; align-items:center; justify-content:center;">
                        ${mojeUlubione.includes(o.id) ? '❤️' : '🤍'}
                    </button>
                </div>

                <div style="margin-top:20px; padding:15px; background:#fbfbfb; border-radius:12px; border:1px solid #f0f0f0;">
                    <div style="font-size:13px; color:#555; display:flex; align-items:center; gap:6px;">
                        👤 Sprzedający: <b style="color:var(--text);">${dajNazwe(o.user_email)}</b>
                    </div>
                    <a href="javascript:void(0)" onclick="window.pokazOgloszeniaUzytkownika('${o.user_email}')" style="color:var(--primary); text-decoration:none; font-weight:bold; font-size:12px; display:block; margin-top:8px;">
                        (Wszystkie ogłoszenia użytkownika)
                    </a>
                </div>
            </div>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 25px; margin-top:10px;">
            <h3 style="margin-bottom:15px; font-size:18px; font-weight:800;">Opis ogłoszenia</h3>
            <div style="background: #ffffff;">
                <p style="white-space:pre-line; font-size:15px; line-height:1.7; color:#333; margin:0;">${o.opis}</p>
            </div>
            <div style="margin-top: 30px; font-size: 11px; color: #aaa; text-align: right; border-top: 1px solid #f9f9f9; padding-top: 10px;">
                👁️ Wyświetlenia strony: <b>${o.wyswietlenia}</b>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.zmienGlowneZdjecie = (idx) => {
    window.aktualneZdjecieIndex = idx;
    const mainImg = document.getElementById('mainFoto');
    if(mainImg && window.aktualneFotki) {
        mainImg.src = window.aktualneFotki[idx];
    }
    
    const wszystkieMini = document.querySelectorAll('.mini-foto');
    wszystkieMini.forEach((foto, i) => {
        foto.style.border = (i === idx) ? '3px solid var(--primary)' : '2px solid transparent';
        foto.style.opacity = (i === idx) ? '1' : '0.6';
    });
};

window.otworzFullFoto = () => {
    let lb = document.getElementById('lightbox-box');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'lightbox-box';
        lb.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.98); z-index:30000; display:none; align-items:center; justify-content:center; user-select:none; overflow:hidden;";
        document.body.appendChild(lb);
    }
    window.isZoomed = false; 
    window.history.pushState({view: 'lightbox'}, '');

    lb.innerHTML = `
        <button onclick="window.zamknijLightbox()" 
                style="position:absolute; top:20px; right:20px; background:white; border:none; width:45px; height:45px; border-radius:50%; font-size:30px; cursor:pointer; z-index:30010; display:flex; align-items:center; justify-content:center; font-weight:bold; color:black;">&times;</button>
        <button id="lb-prev" onclick="window.navFullFoto(-1)" 
                style="position:absolute; left:10px; background:rgba(0,0,0,0.5); color:white; border:none; width:50px; height:50px; cursor:pointer; font-size:30px; border-radius:50%; z-index:30005; display:flex; align-items:center; justify-content:center;">❮</button>
        <div id="lb-img-container" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:auto;">
            <img id="lb-img" src="${window.aktualneFotki[window.aktualneZdjecieIndex]}" 
                 style="max-width:100%; max-height:100%; object-fit:contain; transition: transform 0.3s ease; cursor: zoom-in;"
                 onclick="window.toggleZoom(this)">
        </div>
        <button id="lb-next" onclick="window.navFullFoto(1)" 
                style="position:absolute; right:10px; background:rgba(0,0,0,0.5); color:white; border:none; width:50px; height:50px; cursor:pointer; font-size:30px; border-radius:50%; z-index:30005; display:flex; align-items:center; justify-content:center;">❯</button>
    `;
    lb.style.display = 'flex';
};

window.zamknijLightbox = () => {
    const lb = document.getElementById('lightbox-box');
    if (lb && lb.style.display === 'flex') {
        window.history.back();
    }
};

window.toggleZoom = (img) => {
    window.isZoomed = !window.isZoomed;
    const prev = document.getElementById('lb-prev');
    const next = document.getElementById('lb-next');
    if (window.isZoomed) {
        img.style.transform = "scale(2.5)"; 
        img.style.cursor = "zoom-out";
        if(prev) prev.style.display = 'none';
        if(next) next.style.display = 'none';
    } else {
        img.style.transform = "scale(1)";
        img.style.cursor = "zoom-in";
        if(prev) prev.style.display = 'flex';
        if(next) next.style.display = 'flex';
    }
};

window.navFullFoto = (kierunek) => {
    if (!window.aktualneFotki || window.aktualneFotki.length <= 1) return;
    window.isZoomed = false;
    const img = document.getElementById('lb-img');
    if(img) { img.style.transform = "scale(1)"; img.style.cursor = "zoom-in"; }
    const prev = document.getElementById('lb-prev');
    const next = document.getElementById('lb-next');
    if(prev) prev.style.display = 'flex';
    if(next) next.style.display = 'flex';
    window.aktualneZdjecieIndex += kierunek;
    if (window.aktualneZdjecieIndex >= window.aktualneFotki.length) window.aktualneZdjecieIndex = 0;
    if (window.aktualneZdjecieIndex < 0) window.aktualneZdjecieIndex = window.aktualneFotki.length - 1;
    if (img) img.src = window.aktualneFotki[window.aktualneZdjecieIndex];
};

window.udostepnijOgloszenie = (e, id) => {
    if(e) e.stopPropagation();
    const link = window.location.origin + window.location.pathname + '?id=' + id;
    
    if (navigator.share) {
        navigator.share({
            title: 'Zobacz to ogłoszenie!',
            url: link
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(link).then(() => {
            alert("Link do ogłoszenia został skopiowany do schowka!");
        });
    }
};

// --- FILTROWANIE SPECJALISTYCZNE ---
window.otworzFiltry = (kat, podkat) => {
    const wyniki = daneOgloszen.filter(o => o.kategoria === kat && o.podkategoria === podkat);
    window.pokazWynikiModal(`${kat} > ${podkat}`, wyniki);
};

window.updateFormSubcats = (p = 'f-') => {
    const katSelect = document.getElementById(`${p}kat`);
    if (!katSelect) return;
    
    const kat = katSelect.value;
    const podkatSelect = document.getElementById(`${p}podkat`);
    const extraFields = document.getElementById(p === 'e-' ? 'extra-fields-edit' : 'extra-fields');
    
    // Zapamiętujemy aktualnie wybraną podkategorię (jeśli jakaś była, np. przy edycji)
    const poprzedniaPodkat = podkatSelect ? podkatSelect.value : '';

    // Aktualizujemy listę podkategorii tylko, jeśli zmieniła się kategoria główna
    if (podkatSelect) {
        // Jeśli pole było puste lub resetujemy, budujemy listę na nowo
        if (!poprzedniaPodkat || Array.from(podkatSelect.options).length <= 1) {
            podkatSelect.innerHTML = '<option value="">Podkategoria</option>' + 
                (SUB_DATA[kat] || []).map(x => `<option value="${x}">${x}</option>`).join('');
        }
    }
    
    if (!extraFields) return;
    extraFields.innerHTML = ''; 

    const wybranaPodkat = podkatSelect ? podkatSelect.value : '';
    const typyPojazdow = ['Samochody osobowe', 'Dostawcze', 'Motocykle', 'Skutery'];

    // Generowanie pól dodatkowych dla Motoryzacji
    if (kat === 'Motoryzacja' && typyPojazdow.includes(wybranaPodkat)) {
        const markiOptions = Object.keys(MOTO_DATA).map(m => `<option value="${m}">${m}</option>`).join('');
        extraFields.innerHTML = `
            <div style="display:grid; gap:10px; margin-bottom:10px;">
                <select id="extra-marka" onchange="window.odswiezModele()" required>
                    <option value="">Wybierz markę</option>
                    ${markiOptions}
                </select>
                <select id="extra-model" required>
                    <option value="">Najpierw wybierz markę</option>
                </select>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <input type="number" id="extra-rok" placeholder="Rok produkcji" required>
                    <input type="number" id="extra-przebieg" placeholder="Przebieg (km)" required>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <input type="text" id="extra-pojemnosc" placeholder="Pojemność (np. 1.9)" required>
                    <input type="number" id="extra-moc" placeholder="Moc (KM)" required>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <select id="extra-paliwo" required>
                        <option value="">Paliwo</option>
                        <option value="Benzyna">Benzyna</option>
                        <option value="LPG">LPG</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hybryda">Hybryda</option>
                        <option value="Elektryczny">Elektryczny</option>
                    </select>
                    <select id="extra-skrzynia" required>
                        <option value="">Skrzynia biegów</option>
                        <option value="Automatyczna">Automatyczna</option>
                        <option value="Manualna">Manualna</option>
                    </select>
                </div>
            </div>`;
    }
    
    // Aktualizacja limitu zdjęć w locie
    const limit = window.dajLimitZdjec();
    const infoTekst = document.querySelector('#foto-container small');
    const inputPlik = document.getElementById('f-plik') || document.getElementById('f-plik-nowe');
    
    if (infoTekst) infoTekst.innerText = `Maksymalnie ${limit} zdjęć`;
    if (inputPlik) {
        inputPlik.onchange = function() {
            const obecne = window.tempZdjeciaEdycja ? window.tempZdjeciaEdycja.length : 0;
            if(this.files.length + obecne > limit) {
                alert(`W tej kategorii limit to ${limit} zdjęć!`);
                this.value = '';
            }
        };
    }
};

window.wyslijOgloszenie = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    if (btn.disabled) return;

    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Musisz być zalogowany!");

    const inputPlik = document.getElementById('f-plik');
    if (!inputPlik || inputPlik.files.length === 0) return alert("Dodaj przynajmniej jedno zdjęcie!");

    btn.disabled = true;
    btn.innerText = "Wysyłanie...";

    const zdjeciaUrls = [];
    const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: false };

    for (const file of inputPlik.files) {
        try {
            let plikDoWyslania = file;
            if (typeof imageCompression !== 'undefined') {
                try {
                    plikDoWyslania = await imageCompression(file, options);
                } catch (e) {
                    console.error("Kompresja nie udała się, wysyłam oryginał:", e);
                }
            }

            const nazwa = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            await baza.storage.from('zdjecia').upload(nazwa, plikDoWyslania);
            const { data: { publicUrl } } = baza.storage.from('zdjecia').getPublicUrl(nazwa);
            zdjeciaUrls.push(publicUrl);
        } catch (err) { 
            console.error("Błąd przesyłania zdjęcia:", err); 
        }
    }

    const tytulVal = document.getElementById('f-tytul').value;
    const opisVal = document.getElementById('f-opis').value;
    const noTel = document.getElementById('f-no-tel').checked;
    const telVal = document.getElementById('f-tel').value;
    const wojVal = document.getElementById('f-woj').value; // DODANE WOJEWÓDZTWO

    if(tytulVal.length < 10) { alert("Tytuł musi mieć min. 10 znaków!"); btn.disabled = false; btn.innerText = "Spróbuj ponownie"; return; }
    if(opisVal.length < 50) { alert("Opis musi mieć min. 50 znaków!"); btn.disabled = false; btn.innerText = "Spróbuj ponownie"; return; }
    if(!noTel && telVal.length !== 9) { alert("Podaj 9-cyfrowy numer lub zaznacz kontakt przez stronę."); btn.disabled = false; btn.innerText = "Spróbuj ponownie"; return; }

    const { error } = await baza.from('ogloszenia').insert([{
        user_email: user.email,
        tytul: tytulVal,
        kategoria: document.getElementById('f-kat').value,
        podkategoria: document.getElementById('f-podkat').value,
        cena: parseFloat(document.getElementById('f-cena').value),
        lokalizacja: document.getElementById('f-lok').value,
        wojewodztwo: wojVal, // ZAPIS WOJEWÓDZTWA DO BAZY
        opis: opisVal,
        zdjecia: zdjeciaUrls,
        telefon: noTel ? 'brak' : telVal
    }]);

    if (error) {
        alert("Błąd: " + error.message);
        btn.disabled = false;
        btn.innerText = "Spróbuj ponownie";
    } else {
        alert("Ogłoszenie dodane!");
        location.reload();
    }
};

// --- MOJE OGŁOSZENIA ---
window.pokazMojeOgloszenia = async (tab = 'aktywne') => {
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return;

    const { data: mojeDane, error } = await baza.from('ogloszenia')
        .select('*')
        .ilike('user_email', user.email.trim())
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Błąd pobierania moich ogłoszeń:", error);
        return;
    }

    const teraz = new Date();
    const limit = 1000 * 60 * 60 * 24 * 30; // 30 dni

    const moje = (mojeDane || []).filter(o => 
        o.user_email && 
        o.user_email.toLowerCase().trim() === user.email.toLowerCase().trim()
    );

    const aktywne = moje.filter(o => {
        const dataOgl = new Date(o.created_at);
        return !isNaN(dataOgl) && (teraz - dataOgl) < limit;
    });

    const zakonczone = moje.filter(o => {
        const dataOgl = new Date(o.created_at);
        return isNaN(dataOgl) || (teraz - dataOgl) >= limit;
    });

    const wyswietlane = tab === 'aktywne' ? aktywne : zakonczone;

    const content = document.getElementById('view-content');
    content.innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        <h2 style="text-align:center; margin-bottom:20px;">Moje ogłoszenia</h2>
        <div style="display:flex; gap:10px; border-bottom:1px solid #eee; margin-bottom:15px; justify-content:center;">
            <div onclick="window.pokazMojeOgloszenia('aktywne')" 
                 style="padding:10px 20px; cursor:pointer; font-weight:800; font-size:14px; border-bottom:3px solid ${tab === 'aktywne' ? 'var(--primary)' : 'transparent'}; color:${tab === 'aktywne' ? 'var(--primary)' : '#666'}">
                 Aktywne (${aktywne.length})
            </div>
            <div onclick="window.pokazMojeOgloszenia('zakonczone')" 
                 style="padding:10px 20px; cursor:pointer; font-weight:800; font-size:14px; border-bottom:3px solid ${tab === 'zakonczone' ? 'var(--primary)' : 'transparent'}; color:${tab === 'zakonczone' ? 'var(--primary)' : '#666'}">
                 Zakończone (${zakonczone.length})
            </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap:15px;">
            ${wyswietlane.map(o => {
                const dataStart = new Date(o.created_at);
                const dataKoniec = new Date(dataStart.getTime() + limit);
                const dniZostalo = Math.ceil((dataKoniec - teraz) / (1000 * 60 * 60 * 24));
                
                const godzina = String(dataKoniec.getHours()).padStart(2, '0');
                const minuta = String(dataKoniec.getMinutes()).padStart(2, '0');
                const formatKoniec = isNaN(dataKoniec) ? "---" : `${String(dataKoniec.getDate()).padStart(2,'0')}.${String(dataKoniec.getMonth()+1).padStart(2,'0')}.${dataKoniec.getFullYear()} ${godzina}:${minuta}`;
                const foto = (o.zdjecia && o.zdjecia.length > 0) ? o.zdjecia[0] : 'https://via.placeholder.com/300x200?text=Brak+zdjecia';

                return `
                <div style="border:1px solid #eee; border-radius:15px; overflow:hidden; background:#fff; display:flex; flex-direction:column; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    <img src="${foto}" style="width:100%; height:110px; object-fit:cover;">
                    <div style="padding:10px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <b style="font-size:14px; color:var(--primary);">${o.cena} zł</b>
                            <div style="font-size:12px; font-weight:600; margin-top:4px; height:32px; overflow:hidden;">${o.tytul}</div>
                            ${tab === 'aktywne' ? `
                                <div style="margin-top:10px; font-size:10px; background:#f0f9ff; padding:6px; border-radius:8px; border:1px solid #e0f2fe;">
                                    ⏳ Pozostało: <b>${dniZostalo > 0 ? dniZostalo : 0} dni</b><br>
                                    📅 Do: ${formatKoniec}
                                </div>
                            ` : `
                                <div style="margin-top:10px; font-size:10px; background:#fff1f2; padding:6px; border-radius:8px; border:1px solid #ffe4e6; color:#be123c;">
                                    ❌ Wygasło: ${formatKoniec}
                                </div>
                            `}
                        </div>
                        <div style="display:flex; gap:5px; margin-top:12px;">
                            ${tab === 'aktywne' ? `
                                <button onclick="window.edytujOgloszenie(${o.id})" style="flex:1; padding:7px; font-size:11px; cursor:pointer; border-radius:8px; border:1px solid #ddd; background:#fff;">Edytuj</button>
                            ` : `
                                <button onclick="window.wznowOgloszenie(${o.id})" style="flex:1; padding:7px; font-size:11px; cursor:pointer; border-radius:8px; border:none; background:#111; color:#fff; font-weight:bold;">Wznów</button>
                            `}
                            <button onclick="window.usunOgloszenie(${o.id})" style="padding:7px; color:red; border:none; background:none; cursor:pointer; font-size:18px;">🗑️</button>
                        </div>
                    </div>
                </div>`;
            }).join('')}
            ${wyswietlane.length === 0 ? '<p style="text-align:center; color:gray; grid-column:1/-1; padding:40px;">Brak ogłoszeń.</p>' : ''}
        </div>`;
    
    document.getElementById('modal-view').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.usunOgloszenie = async (id) => {
    if (!confirm("Czy na pewno chcesz usunąć to ogłoszenie i zdjęcia z serwera?")) return;

    try {
        const o = daneOgloszen.find(x => x.id === id);
        if (o && o.zdjecia && o.zdjecia.length > 0) {
            const plikiDoUsuniecia = o.zdjecia.map(url => url.split('/').pop());
            await baza.storage.from('zdjecia').remove(plikiDoUsuniecia);
        }

        const { error } = await baza.from('ogloszenia').delete().eq('id', id);
        if (error) throw error;

        alert("Usunięto pomyślnie.");
        location.reload();
    } catch (err) {
        alert("Błąd: " + err.message);
    }
};

window.wznowOgloszenie = async (id) => {
    if (!confirm("Czy chcesz wznowić to ogłoszenie? Zostanie ono przedłużone o kolejne 30 dni od dzisiaj.")) return;
    const nowaData = new Date().toISOString();
    const { error } = await baza.from('ogloszenia').update({ created_at: nowaData }).eq('id', id);
    
    if (error) {
        alert("Błąd wznowienia: " + error.message);
    } else {
        alert("Ogłoszenie zostało wznowione!");
        location.reload();
    }
};

// --- PAGINACJA WYNIKÓW ---
window.pokazWynikiModal = (tytul, wyniki, strona = 1) => {
    const OGLOSZENIA_NA_STRONE = 50; 
    if (!tytul.includes("(wyniki)")) { wynikiBazowe = [...wyniki]; ostatniTytul = tytul; }
    ostatnieWyniki = wyniki;
    const content = document.getElementById('view-content');
    const start = (strona - 1) * OGLOSZENIA_NA_STRONE;
    const porcja = wyniki.slice(start, start + OGLOSZENIA_NA_STRONE);
    const sumaStron = Math.ceil(wyniki.length / OGLOSZENIA_NA_STRONE);

    const motoPodkaty = ['Samochody osobowe', 'Dostawcze', 'Motocykle', 'Skutery', 'Pozostałe'];
    const czyMoto = tytul.includes('Motoryzacja') && motoPodkaty.some(p => tytul.includes(p));

    let numeryStronHTML = "";
    for(let i = 1; i <= sumaStron; i++) {
        numeryStronHTML += `<button onclick="window.pokazWynikiModal(ostatniTytul, ostatnieWyniki, ${i})" style="padding:10px 15px; margin:2px; cursor:pointer; border-radius:8px; border:1px solid ${i === strona ? 'var(--primary)' : '#ddd'}; background:${i === strona ? 'var(--primary)' : 'white'}; color:${i === strona ? 'white' : 'black'}; font-weight:bold;">${i}</button>`;
    }

    content.innerHTML = `
        <button class="close-btn" onclick="window.zamknijModal()">&times;</button>
        <h2 style="margin-top:10px;">${tytul}</h2>
        <button id="filter-toggle-btn" onclick="window.toggleMobileFilters()">🔍 Filtruj i Sortuj Wyniki</button>

        <div id="results-layout" style="display:flex; gap:20px;">
            <div class="side-filters" style="display:none; width:260px; background:#f8f9fa; padding:20px; border-radius:15px; border:1px solid #eee; height: fit-content; flex-shrink:0;">
                <h4 style="margin:0 0 15px 0;">Parametry</h4>
                <input type="text" id="side-szukaj" placeholder="Czego szukasz?" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">

                ${czyMoto ? `
                    <select id="sf-marka" onchange="window.odswiezModeleFiltry()" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
                        <option value="">Marka (Wszystkie)</option>
                        ${Object.keys(MOTO_DATA).map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                    <select id="sf-model" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
                        <option value="">Model (Wszystkie)</option>
                    </select>
                    <label style="font-size:10px; font-weight:bold; color:gray;">ROK PRODUKCJI</label>
                    <div style="display:flex; gap:5px; margin-bottom:12px;">
                        <input type="number" id="sf-rok-min" placeholder="Od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                        <input type="number" id="sf-rok-max" placeholder="Do" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    </div>
                    <label style="font-size:10px; font-weight:bold; color:gray;">PRZEBIEG (KM)</label>
                    <div style="display:flex; gap:5px; margin-bottom:12px;">
                        <input type="number" id="sf-przebieg-min" placeholder="Od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                        <input type="number" id="sf-przebieg-max" placeholder="Do" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    </div>
                    <label style="font-size:10px; font-weight:bold; color:gray;">POJEMNOŚĆ / MOC</label>
                    <div style="display:flex; gap:5px; margin-bottom:12px;">
                        <input type="number" id="sf-poj-min" placeholder="Poj. od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                        <input type="number" id="sf-moc-min" placeholder="Moc od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    </div>
                    <select id="sf-paliwo" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd;">
                        <option value="">Paliwo (Wszystkie)</option>
                        <option value="Benzyna">Benzyna</option><option value="LPG">LPG</option><option value="Diesel">Diesel</option><option value="Hybryda">Hybryda</option><option value="Elektryczny">Elektryczny</option>
                    </select>
                ` : ''}

                <div style="display:flex; gap:5px; margin-bottom:12px;">
                    <input type="number" id="side-cena-min" placeholder="Cena od" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                    <input type="number" id="side-cena-max" placeholder="Cena do" style="width:50%; padding:8px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <select id="side-stan" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd;">
                    <option value="">Stan (Wszystkie)</option><option value="Nowy">Nowy</option><option value="Używany">Używany</option><option value="Uszkodzony">Uszkodzony</option>
                </select>
                <input type="text" id="side-lok" placeholder="Lokalizacja" style="width:100%; margin-bottom:12px; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
                <select id="side-sort" style="width:100%; margin-bottom:15px; padding:10px; border-radius:8px; border:1px solid #ddd;">
                    <option value="newest">Najnowsze</option><option value="oldest">Najstarsze</option><option value="price-asc">Najtańsze</option><option value="price-desc">Najdroższe</option>
                </select>
                <button onclick="window.zastosujFiltryBoczne()" style="width:100%; background:var(--primary); color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; font-weight:800;">Zastosuj</button>
            </div>
            <div style="flex:1;">
                <div id="modal-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap:15px;">
                    ${porcja.length ? porcja.map(o => renderCardHTML(o)).join('') : '<p>Brak ogłoszeń.</p>'}
                </div>
                <div style="display:flex; justify-content:center; margin-top:20px;">${numeryStronHTML}</div>
            </div>
        </div>`;
    document.getElementById('modal-view').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.zastosujFiltryBoczne = () => {
    const fraza = document.getElementById('side-szukaj')?.value.toLowerCase().trim() || "";
    const cMin = parseFloat(document.getElementById('side-cena-min')?.value) || 0;
    const cMax = parseFloat(document.getElementById('side-cena-max')?.value) || 99999999;
    const stan = document.getElementById('side-stan')?.value || "";
    const lok = document.getElementById('side-lok')?.value.toLowerCase().trim() || "";
    const sort = document.getElementById('side-sort').value;

    const uproscTekst = (t) => t.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
        .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
        .replace(/[\s-]/g, '');
    const szukanaFrazaUproszczona = uproscTekst(fraza);

    const marka = document.getElementById('sf-marka')?.value.toLowerCase() || "";
    const model = document.getElementById('sf-model')?.value.toLowerCase() || "";
    const rMin = parseInt(document.getElementById('sf-rok-min')?.value) || 0;
    const rMax = parseInt(document.getElementById('sf-rok-max')?.value) || 9999;
    const paliwo = document.getElementById('sf-paliwo')?.value || "";

    let przefiltrowane = wynikiBazowe.filter(o => {
        const tytulOpisUproszczony = uproscTekst(o.tytul + " " + o.opis);
        const tekstOk = fraza === "" || tytulOpisUproszczony.includes(szukanaFrazaUproszczona);
        const cenaOk = o.cena >= cMin && o.cena <= cMax;
        const lokOk = lok === "" || o.lokalizacja.toLowerCase().includes(lok);
        const stanOk = stan === "" || o.opis.includes(stan);
        
        let motoOk = true;
        if(marka && !tytulOpisUproszczony.includes(uproscTekst(marka))) motoOk = false;
        if(model && !tytulOpisUproszczony.includes(uproscTekst(model))) motoOk = false;
        if(paliwo && !o.opis.includes(paliwo)) motoOk = false;
        
        if(rMin > 0 || rMax < 9999) {
            const rokMatch = o.opis.match(/Rok: (\d{4})/);
            const rok = rokMatch ? parseInt(rokMatch[1]) : 0;
            if(rok > 0 && (rok < rMin || rok > rMax)) motoOk = false;
        }
        return tekstOk && cenaOk && lokOk && stanOk && motoOk;
    });

    if (sort === 'price-asc') przefiltrowane.sort((a, b) => a.cena - b.cena);
    else if (sort === 'price-desc') przefiltrowane.sort((a, b) => b.cena - a.cena);
    else if (sort === 'oldest') przefiltrowane.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else przefiltrowane.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    window.pokazWynikiModal(ostatniTytul + " (wyniki)", przefiltrowane);
    const sf = document.querySelector('.side-filters');
    if(sf) sf.style.display = 'none';
    const btn = document.getElementById('filter-toggle-btn');
    if(btn) btn.innerHTML = '🔍 Filtruj i Sortuj Wyniki';
};

function renderCardHTML(o) {
    const isFav = mojeUlubione.includes(o.id);
    const pelnaData = formatujDate(o.created_at);
    const fotoUrl = (o.zdjecia && o.zdjecia.length > 0) ? o.zdjecia[0] : 'https://via.placeholder.com/300x200?text=Brak+zdjęcia';
    
    return `
        <div class="ad-card" onclick="window.pokazSzczegoly(${o.id})" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1); cursor:pointer; position:relative;">
            <div onclick="event.stopPropagation(); window.toggleUlubione(event, ${o.id})" class="fav-btn-${o.id}" style="position:absolute; top:10px; right:10px; z-index:100; background:rgba(255,255,255,0.9); width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 20px;">
                ${isFav ? '❤️' : '🤍'}
            </div>
            <img src="${fotoUrl}" alt="${o.tytul}" width="250" height="150" loading="lazy" style="width:100%; height:150px; object-fit:cover; aspect-ratio: 16/9;">
            <div style="padding:12px;">
                <b style="font-size:16px; color:var(--primary);">${o.cena} zł</b>
                <div style="font-size:13px; margin-top:4px; height:34px; overflow:hidden; color:#333; font-weight:600;">${o.tytul}</div>
                <div style="font-size:11px; color:gray; margin-top:8px; display:flex; justify-content:space-between; align-items: center;">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50%;">📍 ${o.lokalizacja}</span>
                    <span style="font-size:10px; opacity:0.8; text-align: right;">${pelnaData}</span>
                </div>
            </div>
        </div>`;
}

window.renderujOgloszenia = (lista) => {
    const k = document.getElementById('lista');
    if (!k) return;
    k.style.display = 'grid';
    k.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    k.style.gap = '20px';
    k.innerHTML = lista.map(o => renderCardHTML(o)).join('');
};

function renderTop12(lista) {
    const k = document.getElementById('lista');
    if (!k) return;
    const top12 = lista.slice(0, 12);
    k.style.display = 'grid';
    k.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    k.style.gap = '20px';
    k.innerHTML = top12.map(o => renderCardHTML(o)).join('');
}

window.toggleUlubione = async (e, id) => {
    if(e) e.stopPropagation();
    const { data: { user } } = await baza.auth.getUser();
    if (!user) return alert("Zaloguj się!");
    const index = mojeUlubione.indexOf(id);
    if (index > -1) {
        await baza.from('ulubione').delete().eq('user_email', user.email).eq('ogloszenie_id', id);
        mojeUlubione.splice(index, 1);
    } else {
        await baza.from('ulubione').insert([{ user_email: user.email, ogloszenie_id: id }]);
        mojeUlubione.push(id);
    }
    document.querySelectorAll(`.fav-btn-${id}`).forEach(btn => btn.innerText = mojeUlubione.includes(id) ? '❤️' : '🤍');
    await sprawdzUzytkownika(); 
};

window.pokazUlubione = () => {
    const ulubioneLista = daneOgloszen.filter(o => mojeUlubione.includes(o.id));
    window.pokazWynikiModal("Twoje Ulubione", ulubioneLista);
};

window.pokazOgloszeniaUzytkownika = (email) => {
    const wyniki = daneOgloszen.filter(o => o.user_email === email);
    window.pokazWynikiModal(`Ogłoszenia użytkownika: ${dajNazwe(email)}`, wyniki);
};

async function init() {
    try {
        const { data, error } = await baza.from('ogloszenia').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        const teraz = new Date();
        const limit30Dni = 1000 * 60 * 60 * 24 * 30;

        daneOgloszen = (data || []).filter(o => {
            const dataOgloszenia = new Date(o.created_at);
            return (teraz - dataOgloszenia) < limit30Dni;
        });

        renderTop12(daneOgloszen);
        
        const { data: { user } } = await baza.auth.getUser();
        await sprawdzUzytkownika();

        const parametry = new URLSearchParams(window.location.search);
        const ogloszenieZLinku = parametry.get('ogloszenie'); 
        
        if (ogloszenieZLinku) {
            const czesci = ogloszenieZLinku.split('-');
            const realneID = czesci[czesci.length - 1];
            window.pokazSzczegoly(Number(realneID));
        }
        
        if (user) {
            baza.channel('zmiany-wiadomosci')
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'wiadomosci', 
                    filter: `odbiorca=eq.${user.email}` 
                }, () => {
                    sprawdzUzytkownika();
                })
                .subscribe();
        }
    } catch (e) {
        console.error("Błąd podczas ładowania strony:", e);
    }
}

init();

// --- ZAMYKANIE OKIEN KLIKNIĘCIEM POZA NIMI ---
window.addEventListener('mousedown', (e) => {
    const dropMenu = document.getElementById('drop-menu');
    const modalView = document.getElementById('modal-view'); 
    const modalForm = document.getElementById('modal-form'); 

    if (dropMenu && dropMenu.style.display === 'block') {
        if (!dropMenu.contains(e.target) && !e.target.closest('button')) {
            dropMenu.style.display = 'none';
        }
    }
    if (e.target === modalView) {
        window.zamknijModal(); 
    }
    if (e.target === modalForm) {
        modalForm.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

window.edytujOgloszenie = (id) => {
    const o = daneOgloszen.find(x => x.id === id);
    if (!o) return;
    
    const mb = document.querySelector('#modal-form .modal-box');
    if(mb) mb.style.maxWidth = "600px";
    
    document.getElementById('modal-view').style.display = 'none';
    document.getElementById('modal-form').style.display = 'flex';
    document.getElementById('form-title').innerText = "Edytuj ogłoszenie";
    document.body.style.overflow = 'hidden';
    
    window.tempZdjeciaEdycja = Array.isArray(o.zdjecia) ? [...o.zdjecia] : [o.zdjecia];
    
    document.getElementById('f-tytul').value = o.tytul;
    document.getElementById('f-kat').value = o.kategoria;
    window.updateFormSubcats(); 
    document.getElementById('f-podkat').value = o.podkategoria;
    document.getElementById('f-cena').value = o.cena;
    document.getElementById('f-lok').value = o.lokalizacja;
    if(document.getElementById('f-woj') && o.wojewodztwo) {
        document.getElementById('f-woj').value = o.wojewodztwo;
    }
    document.getElementById('f-tel').value = (o.telefon === 'brak') ? "" : o.telefon;
    document.getElementById('f-opis').value = o.opis;
    
    const fotoBox = document.getElementById('foto-container');
    const odswiezZdjecia = () => {
        let h = `<label style="display:block; margin-bottom:10px; font-weight:bold;">Zarządzaj zdjęciami (max 5):</label>`;
        h += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">`;
        window.tempZdjeciaEdycja.forEach((url, i) => {
            h += `<div style="position:relative; width:80px; height:80px; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
                    <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
                    <button type="button" onclick="window.usunFotoZEdycji(${i})" style="position:absolute; top:0; right:0; background:red; color:white; border:none; cursor:pointer; padding:0 5px; font-weight:bold;">X</button>
                  </div>`;
        });
        h += `</div>`;
        h += `<input type="file" id="f-plik-nowe" accept="image/*" multiple onchange="window.limitZdjec(this)" style="font-size:12px;">`;
        const limit = window.dajLimitZdjec();
        h += `<small style="display:block; margin-top:5px; color:gray;">Możesz dodać jeszcze ${limit - window.tempZdjeciaEdycja.length} zdjęć (limit: ${limit}).</small>`;
        fotoBox.innerHTML = h;
    };
    
    window.usunFotoZEdycji = (i) => { window.tempZdjeciaEdycja.splice(i, 1); odswiezZdjecia(); };
    window.limitZdjec = (inp) => { 
        const limit = window.dajLimitZdjec();
        if(inp.files.length + window.tempZdjeciaEdycja.length > limit) { 
            alert(`W tej kategorii limit to ${limit} zdjęć!`); 
            inp.value = ""; 
        } 
    };

    odswiezZdjecia();

    const form = document.getElementById('form-dodaj');
    const btn = document.getElementById('btn-save');
    btn.innerText = "Zapisz zmiany";
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.innerText = "Kompresja i zapis...";

        const nowePliki = Array.from(document.getElementById('f-plik-nowe')?.files || []);
        const noweUrls = [];
        const opt = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: false };

        for (const f of nowePliki) {
            try {
                let plikDoWyslania = f;
                if (typeof imageCompression !== 'undefined') {
                    try {
                        plikDoWyslania = await imageCompression(f, opt);
                    } catch (e) {
                        console.error("Kompresja w edycji nie udała się:", e);
                    }
                }
                const name = `${Date.now()}-${Math.random().toString(36).substr(7)}.jpg`;
                await baza.storage.from('zdziecia').upload(name, plikDoWyslania);
                const { data: { publicUrl } } = baza.storage.from('zdjecia').getPublicUrl(name);
                noweUrls.push(publicUrl);
            } catch(err) { 
                console.error("Błąd zdjęcia w edycji:", err); 
            }
        }

        const { error } = await baza.from('ogloszenia').update({
            tytul: document.getElementById('f-tytul').value,
            cena: parseFloat(document.getElementById('f-cena').value),
            lokalizacja: document.getElementById('f-lok').value,
            wojewodztwo: document.getElementById('f-woj').value, // AKTUALIZACJA WOJEWÓDZTWA W EDYCJI
            opis: document.getElementById('f-opis').value,
            telefon: document.getElementById('f-tel').value || 'brak',
            zdjecia: [...window.tempZdjeciaEdycja, ...noweUrls]
        }).eq('id', o.id);

        if (error) { alert("Błąd: " + error.message); btn.disabled = false; }
        else { alert("Zaktualizowano ogłoszenie!"); location.reload(); }
    };
};

window.otworzFormularzDodawania = () => {
    const mb = document.querySelector('#modal-form .modal-box');
    if(mb) mb.style.maxWidth = "600px";
    document.getElementById('modal-form').style.display = 'flex';
    document.getElementById('form-title').innerText = "Dodaj nowe ogłoszenie";
    document.getElementById('form-dodaj').reset();

    window.updateCounter('f-tytul', 'count-tytul', 70);
    window.updateCounter('f-opis', 'count-opis', 8000);
    document.getElementById('f-no-tel').checked = false;
    window.togglePhoneRequired();
    
    document.getElementById('foto-container').innerHTML = `
        <label style="display:block; margin-bottom:5px; font-weight:bold;">Zdjęcia:</label>
        <input type="file" id="f-plik" accept="image/*" multiple required 
               onchange="if(this.files.length > 5) { alert('Maksymalnie 5 zdjęć!'); this.value = ''; }">
        <small style="color:red; position:absolute; top:15px; right:15px;">Max 5 zdjec</small>
    `;

    const btn = document.getElementById('btn-save');
    btn.disabled = false;
    btn.innerText = "Dodaj ogłoszenie";
    document.getElementById('form-dodaj').onsubmit = window.wyslijOgloszenie;
};

window.toggleMobileFilters = () => {
    const filters = document.querySelector('.side-filters');
    const btn = document.getElementById('filter-toggle-btn');
    if (!filters) return;

    const obecnieUkryte = (filters.style.display === 'none' || filters.style.display === '');
    filters.style.display = obecnieUkryte ? 'block' : 'none';
    
    if (btn) {
        btn.innerHTML = obecnieUkryte ? '✖ Zamknij filtry' : '🔍 Filtruj i Sortuj Wyniki';
    }
};

window.addEventListener('popstate', function(event) {
    const lb = document.getElementById('lightbox-box');
    const modalView = document.getElementById('modal-view');
    const modalForm = document.getElementById('modal-form');

    if (lb && lb.style.display === 'flex') {
        lb.style.display = 'none';
        return; 
    }

    const czyWidacPodglad = modalView && modalView.style.display === 'flex';
    const czyWidacFormularz = modalForm && modalForm.style.display === 'flex';

    if (czyWidacPodglad || czyWidacFormularz) {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.body.style.overflow = 'auto';
        document.title = "KupSe24 - Twój Portal Ogłoszeniowy";
        const czystyURL = window.location.pathname;
        window.history.replaceState({}, '', czystyURL);
    }
});

window.pokazRejestracje = () => {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('register-view').classList.remove('hidden');

    const renderujReg = () => {
        if (window.turnstile) {
            const container = document.getElementById('turnstile-container');
            if (container) {
                container.innerHTML = ''; 
                turnstile.render('#turnstile-container', {
                    sitekey: '0x4AAAAAADVZBdOrbapzXNUP',
                    theme: 'light',
                });
            }
        } else {
            setTimeout(renderujReg, 500);
        }
    };
    renderujReg();
};

window.odswiezModele = () => {
    const marka = document.getElementById('extra-marka').value;
    const modelSelect = document.getElementById('extra-model');
    
    if (MOTO_DATA[marka]) {
        const modele = MOTO_DATA[marka];
        modelSelect.innerHTML = '<option value="">Wybierz model</option>' + 
            modele.map(m => `<option value="${m}">${m}</option>`).join('');
    } else {
        modelSelect.innerHTML = '<option value="Pozostałe">Pozostałe</option>';
    }
};

window.odswiezModeleFiltry = () => {
    const marka = document.getElementById('sf-marka').value;
    const modelSelect = document.getElementById('sf-model');
    
    if (MOTO_DATA[marka]) {
        const modele = MOTO_DATA[marka];
        modelSelect.innerHTML = '<option value="">Model (Wszystkie)</option>' + 
            modele.map(m => `<option value="${m}">${m}</option>`).join('');
    } else {
        modelSelect.innerHTML = '<option value="">Model (Wszystkie)</option>';
    }
};
