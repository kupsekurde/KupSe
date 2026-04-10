const S_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const S_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleW1vb2l0cmRjYmdycnB6aGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA4MzgsImV4cCI6MjA5MTM3NjgzOH0.dwTF_sCtvkcN5v6fb2vHoThplzgc42ZY-pVx2LySkYo';

const supabase = window.supabase.createClient(S_URL, S_KEY);

const KATEGORIE_DANE = {
    "Nieruchomości": { icon: "🏠", sub: ["Mieszkania", "Domy", "Działki", "Biura", "Garaże"] },
    "Motoryzacja": { icon: "🚗", sub: ["Samochody", "Motocykle", "Dostawcze", "Części", "Opony"] },
    "Dom i Ogród": { icon: "🛋️", sub: ["Meble", "Ogród", "Narzędzia", "Oświetlenie", "Ogrzewanie"] },
    "Elektronika": { icon: "📱", sub: ["Telefony", "Komputery", "RTV", "Konsole", "AGD"] },
    "Moda": { icon: "👕", sub: ["Ubrania damskie", "Ubrania męskie", "Obuwie", "Biżuteria"] },
    "Rolnictwo": { icon: "🚜", sub: ["Maszyny", "Ciągniki", "Produkty rolne", "Zwierzęta"] },
    "Muzyka i Edukacja": { icon: "🎸", sub: ["Instrumenty", "Książki", "Kursy", "Korepetycje"] },
    "Sport i Hobby": { icon: "🏀", sub: ["Fitness", "Rowery", "Turystyka", "Wędkarstwo"] },
    "Dla Dzieci": { icon: "👶", sub: ["Zabawki", "Wózki", "Ubranka", "Artykuły szkolne"] },
    "Zdrowie i Uroda": { icon: "💄", sub: ["Kosmetyki", "Sprzęt medyczny", "Suplementy", "Perfumy"] },
    "Noclegi": { icon: "🏨", sub: ["Hotele", "Apartamenty", "Kwatery"] },
    "Antyki i Kolekcje": { icon: "🎁", sub: ["Monety", "Sztuka", "Vintage"] },
    "Oddam za darmo": { icon: "♻️", sub: ["Rzeczy gratis"] }
};

// --- LOGIKA ---

window.wykonajAuth = async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-haslo').value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message); else { alert("Sukces!"); window.zamknijOkna(); }
};

window.dodajOgloszenieDB = async (e) => {
    e.preventDefault();
    const d = {
        tytul: document.getElementById('t-tytul').value,
        kategoria: document.getElementById('t-kat').value,
        podkategoria: document.getElementById('t-podkat').value,
        cena: parseFloat(document.getElementById('t-cena').value),
        opis: document.getElementById('t-opis').value,
        lokalizacja: document.getElementById('t-lok').value,
        telefon: document.getElementById('t-tel').value
    };

    const { error } = await supabase.from('ogloszenia').insert([d]);
    if (error) alert(error.message); else { alert("Dodano!"); window.zamknijOkna(); ladujOgloszenia(); }
};

async function ladujOgloszenia(kat = null) {
    let q = supabase.from('ogloszenia').select('*').order('id', { ascending: false });
    if (kat) q = q.eq('kategoria', kat);
    const { data } = await q;
    
    document.getElementById('lista-ogloszen').innerHTML = data.map(o => `
        <div class="karta">
            <h3>${o.tytul}</h3>
            <div class="cena">${o.cena} PLN</div>
            <p style="font-size:14px;">${o.opis.substring(0, 100)}...</p>
            <div style="font-size:12px; color:#777;">📍 ${o.lokalizacja} | 📞 ${o.telefon || 'Brak'}</div>
        </div>
    `).join('');
}

// --- UI ---

window.aktualizujPodkat = () => {
    const kat = document.getElementById('t-kat').value;
    const pod = document.getElementById('t-podkat');
    pod.innerHTML = KATEGORIE_DANE[kat].sub.map(s => `<option value="${s}">${s}</option>`).join('');
};

window.pokazOkno = (id) => document.getElementById(id).style.display = 'block';
window.zamknijOkna = () => { 
    document.getElementById('okno-auth').style.display = 'none'; 
    document.getElementById('okno-dodawania').style.display = 'none'; 
};

// Inicjalizacja kategorii w menu i w formularzu
function init() {
    const menu = document.getElementById('menu-kategorii');
    const select = document.getElementById('t-kat');
    
    for (let k in KATEGORIE_DANE) {
        // Dodaj do menu kafelki
        menu.innerHTML += `
            <div class="kat-item" onclick="ladujOgloszenia('${k}')">
                <span class="kat-icon">${KATEGORIE_DANE[k].icon}</span>
                ${k}
            </div>`;
        // Dodaj do listy wyboru w formularzu
        select.innerHTML += `<option value="${k}">${k}</option>`;
    }
    ladujOgloszenia();
}

init();
