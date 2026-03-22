// ========== DATA ==========
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

let transactions = [];

// ========== DOM ELEMENTS ==========
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

// ========== FUNCTIONS ==========
function updateKategori() {
  const tipe = inputTipe.value;
  const kategori =
    tipe === 'pemasukan' ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;

  inputKategori.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Pilih Kategori';
  inputKategori.appendChild(defaultOption);

  kategori.forEach((item) => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    inputKategori.appendChild(option);
  });
}

function addTransaction(e) {
  e.preventDefault();

  // Ambil nilai dari input
  const nama = inputNama.value.trim();
  const nominal = parseFloat(inputNominal.value);
  const kategori = inputKategori.value;
  const tipe = inputTipe.value;
  const tanggal = inputTanggal.value;

  // Validasi input
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

  // Membuat object baru
  const transaction = {
    id: Date.now(),
    nama: nama,
    nominal: nominal,
    kategori: kategori,
    tipe: tipe,
    tanggal: tanggal,
  };

  // Tambahkan ke array
  transactions.push(transaction);

  saveToStorage();

  // Reset form
  form.reset();

  // updateKategori
  updateKategori();

  // Render ulang semua
  render();
}

function createTransactionItem(transaction) {
  const li = document.createElement('li');
  li.classList.add('transaction-item');

  const tanda = transaction.tipe === 'pemasukan' ? '+' : '-';
  const warna =
    transaction.tipe === 'pemasukan' ? 'var(--positive)' : 'var(--negative)';

  const nominalFormatted = transaction.nominal.toLocaleString('id-ID');

  li.innerHTML = `
  <div class="transaction-info">
    <span class="transaction-name">${transaction.nama}</span>
    <span class="transaction-meta">${transaction.kategori} • ${transaction.tanggal}</span>
  </div>
  <span class="transaction-amount" style="color: ${warna}">
    ${tanda}Rp ${nominalFormatted}
  </span>
  <button class="btn-delete" data-id="${transaction.id}">
    <i class="ri-delete-bin-line"></i>
  </button>`;

  return li;
}

function updateSummary() {
  // Hitung Income
  const income = transactions
    .filter((t) => t.tipe === 'pemasukan')
    .reduce((total, t) => total + t.nominal, 0);

  // Hitung Expense
  const expense = transactions
    .filter((t) => t.tipe === 'pengeluaran')
    .reduce((total, t) => total + t.nominal, 0);

  // Hitung Balance
  const balance = income - expense;

  // Tampilkan ke DOM
  totalIncome.textContent = `Rp ${income.toLocaleString('id-ID')}`;
  totalExpense.textContent = `Rp ${expense.toLocaleString('id-ID')}`;
  totalBalance.textContent = `Rp ${balance.toLocaleString('id-ID')}`;
  if (balance < 0) {
    totalBalance.style.color = 'var(--negative)';
  } else if (balance > 0) {
    totalBalance.style.color = 'var(--positive)';
  } else {
    totalBalance.style.color = 'var(--text-primary)';
  }
}

function updateCount() {
  transactionCount.innerText = `${transactions.length} transaksi`;
}

function render() {
  // Kosongkan list
  transactionList.innerHTML = '';

  updateSummary();
  updateCount();

  // Cek transactions
  if (transactions.length === 0) {
    const li = document.createElement('li');
    li.classList.add('transaction-empty');
    li.textContent = 'Belum ada transaksi';
    transactionList.appendChild(li);
    return;
  }

  // Loop semua transactions
  transactions.forEach((transaction) => {
    const li = createTransactionItem(transaction);
    transactionList.appendChild(li);
  });
}

function saveToStorage() {
  const data = JSON.stringify(transactions);
  localStorage.setItem('transactions', data);
}

function loadFromStorage() {
  const data = localStorage.getItem('transactions');
  if (data !== null) {
    transactions = JSON.parse(data);
  }
}

function deleteTransaction(e) {
  const btn = e.target.closest('.btn-delete');

  if (!btn) return;

  const id = btn.dataset.id;
  const idNumber = Number(id);

  transactions = transactions.filter((t) => t.id !== idNumber);
  saveToStorage();
  render();
}

// Event Listener
form.addEventListener('submit', addTransaction);
inputTipe.addEventListener('change', updateKategori);
transactionList.addEventListener('click', deleteTransaction);

// Init
loadFromStorage();
updateKategori();
render();
