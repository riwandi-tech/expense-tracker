// Data kategori untuk expense dan income
const KATEGORI_PENGELUARAN = [
  'Makan',
  'Transport',
  'Belanja',
  'Hiburan',
  'Kesehatan',
  'Pendidikan',
  'Tagihan',
  'Tabungan',
];

const KATEGORI_PEMASUKAN = [
  'Gaji',
  'Freelance',
  'Bonus',
  'Investasi',
  'Lainnya',
];

// Array untuk menyimpan semua transaksi
let transactions = [];

// Cache DOM elements untuk performa (menghindari querySelector berulang)
const form = document.getElementById('transaction-form');
const inputNama = document.getElementById('input-nama');
const inputNominal = document.getElementById('input-nominal');
const inputKategori = document.getElementById('input-kategori');
const inputTipe = document.getElementById('input-tipe');
const inputTanggal = document.getElementById('input-tanggal');
const transactionList = document.getElementById('transaction-list');
const transactionCount = document.getElementById('transaction-count');
const totalBalance = document.getElementById('total-balance');
const totalIncome = document.getElementById('total-income');
const totalExpense = document.getElementById('total-expense');
const searchInput = document.getElementById('search-input');
const filterTipe = document.getElementById('filter-tipe');
const filterKategori = document.getElementById('filter-kategori');
const filterBulan = document.getElementById('filter-bulan');
const ctx = document.getElementById('expense-chart');
const themeToggle = document.querySelector('.theme-toggle');

// Update kategori dropdown berdasarkan tipe transaksi (pemasukan/pengeluaran)
function updateKategori() {
  const tipe = inputTipe.value;
  const kategoriArr =
    tipe === 'pemasukan' ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;

  // Clear kategori options
  inputKategori.replaceChildren();

  const placeholderForm = document.createElement('option');
  placeholderForm.value = '';
  placeholderForm.textContent = 'Pilih Kategori';
  inputKategori.appendChild(placeholderForm);

  kategoriArr.forEach((item) => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    inputKategori.appendChild(option);
  });

  const semuaKategoriUnik = [
    ...new Set([...KATEGORI_PEMASUKAN, ...KATEGORI_PENGELUARAN]),
  ];

  filterKategori.replaceChildren();

  const placeholderFilter = document.createElement('option');
  placeholderFilter.value = '';
  placeholderFilter.textContent = 'Pilih Kategori';
  filterKategori.appendChild(placeholderFilter);

  const allOptionFilter = document.createElement('option');
  allOptionFilter.value = 'all';
  allOptionFilter.textContent = 'Semua Kategori';
  filterKategori.appendChild(allOptionFilter);

  semuaKategoriUnik.forEach((item) => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    filterKategori.appendChild(option);
  });
}

// Tambahkan transaksi baru ke dalam array
function addTransaction(e) {
  e.preventDefault();

  // Ambil nilai dari form
  const nama = inputNama.value.trim();
  const nominal = parseFloat(inputNominal.value);
  const kategori = inputKategori.value;
  const tipe = inputTipe.value;
  const tanggal = inputTanggal.value;

  // Validasi form tidak boleh kosong
  if (
    nama === '' ||
    isNaN(nominal) ||
    kategori === '' ||
    tipe === '' ||
    tanggal === ''
  ) {
    alert('Semua field harus diisi!');
    return;
  }

  // Buat object transaksi baru dengan ID unik (timestamp)
  const transaction = {
    id: Date.now(),
    nama: nama,
    nominal: nominal,
    kategori: kategori,
    tipe: tipe,
    tanggal: tanggal,
  };

  transactions.push(transaction);

  saveToStorage();

  form.reset();

  setDefaultDate();

  updateKategori();

  render();
}

// Render transaksi menjadi HTML element
function createTransactionItem(transaction) {
  const li = document.createElement('li');
  li.classList.add('transaction-item');

  // Tentukan tanda dan warna berdasarkan tipe transaksi
  const tanda = transaction.tipe === 'pemasukan' ? '+' : '-';
  const warna =
    transaction.tipe === 'pemasukan' ? 'var(--positive)' : 'var(--negative)';

  // Format nominal dengan format Indonesia (Rp X.XXX.XXX)
  const nominalFormatted = transaction.nominal.toLocaleString('id-ID');

  li.innerHTML = `
  <div class="transaction-info">
    <span class="transaction-name">${transaction.nama}</span>
    <span class="transaction-meta">${transaction.kategori} • ${transaction.tanggal}</span>
  </div>
  <span class="transaction-amount" style="color: ${warna}">
    ${tanda}Rp ${nominalFormatted}
  </span>
  <div class="transaction-actions">
    <button class="btn-duplicate" data-id="${transaction.id}" title="Duplikat Transaksi">
      <i class="ri-file-copy-line"></i>
    </button>
    <button class="btn-delete" data-id="${transaction.id}" title="Hapus Transaksi">
      <i class="ri-delete-bin-line"></i>
    </button>
  </div>`;

  return li;
}

// Update summary cards (total income, expense, balance)
function updateSummary() {
  // Hitung total pemasukan hanya dari transaksi tipe pemasukan
  const income = transactions
    .filter((t) => t.tipe === 'pemasukan')
    .reduce((total, t) => total + t.nominal, 0);

  // Hitung total pengeluaran hanya dari transaksi tipe pengeluaran
  const expense = transactions
    .filter((t) => t.tipe === 'pengeluaran')
    .reduce((total, t) => total + t.nominal, 0);

  // Hitung balance = income - expense
  const balance = income - expense;

  // Update UI dengan format Rp
  totalIncome.textContent = `Rp ${income.toLocaleString('id-ID')}`;
  totalExpense.textContent = `Rp ${expense.toLocaleString('id-ID')}`;
  totalBalance.textContent = `Rp ${balance.toLocaleString('id-ID')}`;

  // Ubah warna balance sesuai kondisi
  if (balance < 0) {
    totalBalance.style.color = 'var(--negative)';
  } else if (balance > 0) {
    totalBalance.style.color = 'var(--positive)';
  } else {
    totalBalance.style.color = 'var(--text-primary)';
  }
}

// Update text counter transaksi
function updateCount() {
  transactionCount.innerText = `${transactions.length} transaksi`;
}

// Update semua tampilan: remove old list → update summary → add filtered transactions
function render() {
  transactionList.innerHTML = '';

  updateSummary();
  updateCount();
  updateChart();

  // Filter transaksi sesuai search dan filter yang dipilih
  const filtered = getFilteredTransactions();
  if (filtered.length === 0) {
    const li = document.createElement('li');
    li.classList.add('transaction-empty');
    li.textContent = 'Belum ada transaksi';
    transactionList.appendChild(li);
    return;
  }

  // Render setiap transaksi yang sudah difilter
  filtered.forEach((transaction) => {
    const li = createTransactionItem(transaction);
    transactionList.appendChild(li);
  });
}

// Set default date ke hari ini saat form dibuka
function setDefaultDate() {
  const now = new Date();
  const dateString = now.toISOString().split('T')[0];
  inputTanggal.value = dateString;
}

// Toggle dark mode: ubah class, simpan ke storage, update icon & chart
function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
  updateChart();
  applyThemeStyles(isDark);
}

// Update icon button sesuai mode (bulan untuk light, matahari untuk dark)
function updateThemeIcon() {
  if (!themeToggle) return;
  const isDark = document.body.classList.contains('dark');
  themeToggle.innerHTML = isDark
    ? '<i class="ri-sun-line"></i>'
    : '<i class="ri-moon-line"></i>';
}

// Apply CSS variables berdasarkan mode (dark/light)
function applyThemeStyles(isDark) {
  const root = document.documentElement;
  if (isDark) {
    root.style.setProperty('--bg-primary', '#0f172a');
    root.style.setProperty('--bg-surface', '#1e293b');
    root.style.setProperty('--text-primary', '#f1f5f9');
    root.style.setProperty('--text-secondary', '#94a3b8');
    root.style.setProperty('--border', '#334155');
    root.style.setProperty('--bg-income', '#0f5132');
    root.style.setProperty('--bg-expense', '#7f1d1d');
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.color = '#f1f5f9';
  } else {
    root.style.setProperty('--bg-primary', '#f8fafc');
    root.style.setProperty('--bg-surface', '#ffffff');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-secondary', '#64748b');
    root.style.setProperty('--border', '#e2e8f0');
    root.style.setProperty('--bg-income', '#f0fdf4');
    root.style.setProperty('--bg-expense', '#fef2f2');
    document.body.style.backgroundColor = '#f8fafc';
    document.body.style.color = '#0f172a';
  }
}

// Simpan array transactions ke localStorage sebagai JSON string
function saveToStorage() {
  const data = JSON.stringify(transactions);
  localStorage.setItem('transactions', data);
}

// Load transactions dari localStorage saat app dibuka
function loadFromStorage() {
  const data = localStorage.getItem('transactions');
  if (data !== null) {
    transactions = JSON.parse(data);
  }
}

// Load tema yang disimpan dari localStorage
function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  }
  updateThemeIcon();
  applyThemeStyles(document.body.classList.contains('dark'));
}

// Hapus transaksi berdasarkan ID yang diklik
function deleteTransaction(e) {
  const btn = e.target.closest('.btn-delete');

  if (!btn) return;

  const id = btn.dataset.id;
  const idNumber = Number(id);

  // Filter array, hapus transaksi dengan ID yang match
  transactions = transactions.filter((t) => t.id !== idNumber);
  saveToStorage();
  render();
}

// Duplikat transaksi dengan ID baru dan tanggal hari ini
function duplicateTransaction(e) {
  const btn = e.target.closest('.btn-duplicate');

  if (!btn) return;

  const id = btn.dataset.id;
  const idNumber = Number(id);

  const transaction = transactions.find((t) => t.id === idNumber);
  if (!transaction) return;

  // Spread operator (...) untuk copy object, lalu ubah ID dan tanggal
  const duplicated = {
    ...transaction,
    id: Date.now(),
    tanggal: new Date().toISOString().split('T')[0],
  };

  transactions.push(duplicated);
  saveToStorage();
  render();
}

// Filter transaksi berdasarkan search, tipe, kategori, dan bulan
function getFilteredTransactions() {
  const search = searchInput.value.toLowerCase();
  const tipe = filterTipe.value;
  const kategori = filterKategori.value;
  const bulan = filterBulan.value;

  return transactions.filter((t) => {
    // Cek apakah nama transaksi mengandung search text
    const matchSearch = t.nama.toLowerCase().includes(search);
    // Cek apakah tipe sesuai filter (jika '' atau 'all' berarti semua diambil)
    const matchTipe = tipe === '' || tipe === 'all' || t.tipe === tipe;
    const matchKategori =
      kategori === '' || kategori === 'all' || t.kategori === kategori;

    // Extract bulan dari tanggal dan bandingkan dengan filter bulan
    const tDate = new Date(t.tanggal);
    const tMonth = tDate.getMonth() + 1; // getMonth() return 0-11, jadi tambah 1
    const matchBulan =
      bulan === '' || bulan === 'all' || tMonth === Number(bulan);

    // Semua kondisi harus true untuk transaksi dimasukkan ke hasil filter
    return matchSearch && matchTipe && matchKategori && matchBulan;
  });
}

// Render chart doughnut pengeluaran per kategori
let myChart;

function updateChart() {
  // Ambil transaksi yang sudah difilter, lalu filter hanya pengeluaran
  const filteredTransactions = getFilteredTransactions();
  const pengeluaran = filteredTransactions.filter(
    (t) => t.tipe === 'pengeluaran',
  );

  // Hitung total pengeluaran per kategori
  const dataKategori = KATEGORI_PENGELUARAN.map((cat) => {
    return pengeluaran
      .filter((t) => t.kategori === cat)
      .reduce((sum, t) => sum + t.nominal, 0);
  });

  // Cek apakah ada data pengeluaran
  const hasData = dataKategori.some((value) => value > 0);

  // Destroy chart lama sebelum create yang baru
  if (myChart) {
    myChart.destroy();
  }

  // Create chart baru dengan Chart.js
  myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: hasData ? KATEGORI_PENGELUARAN : ['Belum ada pengeluaran'],
      datasets: [
        {
          data: hasData ? dataKategori : [1],
          backgroundColor: hasData
            ? [
                '#10b981',
                '#3b82f6',
                '#f59e0b',
                '#ef4444',
                '#8b5cf6',
                '#ec4899',
                '#06b6d4',
                '#64748b',
              ]
            : ['#e2e8f0'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              family: 'Inter',
              size: 12,
            },
          },
        },
        tooltip: {
          enabled: hasData,
          backgroundColor: document.body.classList.contains('dark')
            ? '#1e293b'
            : '#0f172a',
          padding: 10,
          titleFont: { size: 13 },
          bodyFont: { size: 13 },
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
            },
          },
        },
      },
      cutout: '70%',
      animation: {
        animateScale: true,
        animateRotate: true,
      },
    },
  });
}

// Event listeners (setup interaksi user)
form.addEventListener('submit', addTransaction);
inputTipe.addEventListener('change', updateKategori);
// Event delegation: cek tipe button yang diklik di transaction list
transactionList.addEventListener('click', (e) => {
  if (e.target.closest('.btn-delete')) {
    deleteTransaction(e);
  } else if (e.target.closest('.btn-duplicate')) {
    duplicateTransaction(e);
  }
});
searchInput.addEventListener('input', render);
filterKategori.addEventListener('change', render);
filterTipe.addEventListener('change', render);
filterBulan.addEventListener('change', render);
// Safety check: hanya tambahkan listener jika elemen ada
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// Initialization (jalankan saat page load)
loadFromStorage();
updateKategori();
render();
setDefaultDate();
loadTheme();
