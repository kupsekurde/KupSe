// === CONFIG ===
const SUPABASE_URL = 'https://zeymooitrdcbgrrpzhed.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === STATE ===
let listings = [];
let favorites = [];

// === UTILS ===
const escapeHTML = (str = '') =>
  str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pl-PL');
};

// === AUTH ===
async function login(email, password) {
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  location.reload();
}

async function register(email, password) {
  if (password.length < 8) return alert('Min 8 znaków');

  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert(error.message);

  alert('Sprawdź email');
}

async function logout() {
  await supabaseClient.auth.signOut();
  location.reload();
}

// === FETCH LISTINGS (SERVER SIDE FILTER READY) ===
async function fetchListings(query = '') {
  let req = supabaseClient.from('ogloszenia').select('*');

  if (query) {
    req = req.ilike('tytul', `%${query}%`);
  }

  const { data, error } = await req;

  if (error) {
    console.error(error);
    return;
  }

  listings = data;
  renderListings();
}

// === RENDER ===
function renderListings() {
  const container = document.getElementById('listings');

  container.innerHTML = listings.map(o => `
    <div class="card">
      <h3>${escapeHTML(o.tytul)}</h3>
      <p>${escapeHTML(o.lokalizacja)}</p>
      <b>${o.cena} zł</b>
      <button onclick="openDetails(${o.id})">Zobacz</button>
    </div>
  `).join('');
}

// === DETAILS ===
async function openDetails(id) {
  const item = listings.find(x => x.id === id);
  if (!item) return;

  const { data: { user } } = await supabaseClient.auth.getUser();

  const phone = user
    ? escapeHTML(item.telefon || '')
    : '[Zaloguj się aby zobaczyć]';

  document.getElementById('modal').innerHTML = `
    <h2>${escapeHTML(item.tytul)}</h2>
    <p>${escapeHTML(item.opis)}</p>
    <p>${phone}</p>
  `;
}

// === ADD LISTING ===
async function addListing(e) {
  e.preventDefault();

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return alert('Zaloguj się');

  const files = document.getElementById('images').files;

  if (files.length > 10) return alert('Max 10 zdjęć');

  let urls = [];

  for (let f of files) {
    if (!f.type.startsWith('image/')) continue;
    if (f.size > 5 * 1024 * 1024) return alert('Plik za duży');

    const name = `${Date.now()}_${f.name}`;

    const { error } = await supabaseClient.storage
      .from('zdjecia')
      .upload(name, f);

    if (error) return alert(error.message);

    const { data } = supabaseClient.storage
      .from('zdjecia')
      .getPublicUrl(name);

    urls.push(data.publicUrl);
  }

  const payload = {
    tytul: document.getElementById('title').value,
    cena: Number(document.getElementById('price').value),
    lokalizacja: document.getElementById('loc').value,
    opis: document.getElementById('desc').value,
    telefon: document.getElementById('phone').value,
    zdjecia: urls,
    user_email: user.email
  };

  const { error } = await supabaseClient
    .from('ogloszenia')
    .insert([payload]);

  if (error) return alert(error.message);

  location.reload();
}

// === SEARCH (DEBOUNCE) ===
let searchTimeout;
function handleSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchListings(val), 300);
}

// INIT
fetchListings();
