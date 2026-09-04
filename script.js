// 1. CONFIGURACIÓN Y CLAVES
const PIN_CORRECTO = "1234"; // PIN para vendedores
const PIN_ADMIN = "9999";    // PIN para borrar toda la rifa

const firebaseConfig = {
  apiKey: "AIzaSyD0epYhGDU-AIVtcUONhAjTswZ8ijlDAL8",
  authDomain: "rifaapp-e3249.firebaseapp.com",
  databaseURL: "https://rifaapp-e3249-default-rtdb.firebaseio.com",
  projectId: "rifaapp-e3249",
  storageBucket: "rifaapp-e3249.firebasestorage.app",
  messagingSenderId: "695051637372",
  appId: "1:695051637372:web:50194f550614379444eff9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const marksRef = db.ref('markedNumbers');
const titleRef = db.ref('customTitle');

const TOTAL_NUMEROS = 200;
const grid = document.getElementById("grid");
const soldCountEl = document.getElementById("soldCount");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const buyerInput = document.getElementById("buyerInput");
const sellerInput = document.getElementById("sellerInput");
const modalActions = document.getElementById("modalActions");
const pinOverlay = document.getElementById("pinOverlay");
const pinInput = document.getElementById("pinInput");

const cells = {};
let currentSelectedNum = null;
let localData = {};
let currentFilter = 'all';

// 2. VALIDACIÓN DE PIN
if (sessionStorage.getItem("pinValido") === "true") {
  pinOverlay.style.display = "none";
}

function checkPin() {
  if (pinInput.value === PIN_CORRECTO) {
    sessionStorage.setItem("pinValido", "true");
    pinOverlay.style.display = "none";
  } else {
    alert("PIN incorrecto. Intenta de nuevo.");
    pinInput.value = "";
    pinInput.focus();
  }
}

pinInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") checkPin();
});

// 3. GENERAR TABLERO (Del 000 al 199)
for (let i = 0; i <= TOTAL_NUMEROS; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.textContent = i.toString().padStart(3, "0");
  cell.addEventListener("click", () => openModal(i));
  grid.appendChild(cell);
  cells[i] = cell;
}

// 4. MODAL DE VENTAS
function openModal(num) {
  currentSelectedNum = num;
  const formattedNum = num.toString().padStart(3, "0");
  const data = localData[num];

  modalTitle.textContent = `Número #${formattedNum}`;

  if (data) {
    buyerInput.value = data.buyer || "";
    sellerInput.value = data.seller || "";
    buyerInput.disabled = true;
    sellerInput.disabled = true;

    modalActions.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
      <button class="btn btn-danger" onclick="confirmRelease()">Desmarcar / Liberar</button>
    `;
  } else {
    buyerInput.value = "";
    sellerInput.value = "";
    buyerInput.disabled = false;
    sellerInput.disabled = false;

    modalActions.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNumber()">Guardar Venta</button>
    `;
  }

  modalOverlay.classList.add("active");
}

function closeModal() {
  modalOverlay.classList.remove("active");
  currentSelectedNum = null;
}

function saveNumber() {
  if (currentSelectedNum === null) return;
  const buyer = buyerInput.value.trim();
  const seller = sellerInput.value.trim();

  marksRef.child(currentSelectedNum).set({
    buyer: buyer || "Anónimo",
    seller: seller || "Sin asignar",
    timestamp: Date.now()
  });

  closeModal();
}

function confirmRelease() {
  if (currentSelectedNum === null) return;
  const formattedNum = currentSelectedNum.toString().padStart(3, "0");
  if (confirm(`¿Estás seguro de que deseas desmarcar el número #${formattedNum}?`)) {
    marksRef.child(currentSelectedNum).remove();
    closeModal();
  }
}

// 5. FILTROS
function setFilter(filterType, btnEl) {
  currentFilter = filterType;
  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
  btnEl.classList.add('active');
  applyFilter();
}

function applyFilter() {
  for (let i = 0; i <= TOTAL_NUMEROS; i++) {
    const isMarked = !!localData[i];
    const cell = cells[i];

    if (currentFilter === 'all') {
      cell.classList.remove('hidden');
    } else if (currentFilter === 'free') {
      cell.classList.toggle('hidden', isMarked);
    } else if (currentFilter === 'sold') {
      cell.classList.toggle('hidden', !isMarked);
    }
  }
}

// 6. EXPORTAR A EXCEL (CSV)
function exportToCSV() {
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += "Numero,Estado,Comprador,Vendedor\n";

  for (let i = 0; i <= TOTAL_NUMEROS; i++) {
    const numStr = i.toString().padStart(3, "0");
    const data = localData[i];
    if (data) {
      csvContent += `"${numStr}","VENDIDO","${data.buyer || 'Anónimo'}","${data.seller || 'Sin asignar'}"\n`;
    } else {
      csvContent += `"${numStr}","LIBRE","",""\n`;
    }
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `rifa_ventas_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 7. EXPORTAR A PDF / IMPRIMIR
function exportToPDF() {
  const printWindow = window.open('', '_blank');
  const title = document.getElementById("titleInput").value;

  let rows = '';
  for (let i = 0; i <= TOTAL_NUMEROS; i++) {
    const numStr = i.toString().padStart(3, "0");
    const data = localData[i];
    const estado = data ? 'VENDIDO' : 'LIBRE';
    const comprador = data ? (data.buyer || 'Anónimo') : '-';
    const vendedor = data ? (data.seller || 'Sin asignar') : '-';
    const bg = data ? '#e8f5e9' : '#ffffff';

    rows += `
      <tr style="background-color: ${bg};">
        <td style="padding: 6px; border: 1px solid #ccc; text-align: center; font-weight: bold;">${numStr}</td>
        <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">${estado}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${comprador}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${vendedor}</td>
      </tr>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Planilla de Sorteo - ${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; margin-bottom: 5px; }
        p { text-align: center; color: #666; font-size: 0.9rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #4caf50; color: white; padding: 8px; border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Planilla Oficial para el Día del Sorteo - Generado el ${new Date().toLocaleDateString()}</p>
      <table>
        <thead>
          <tr>
            <th>Nº</th>
            <th>Estado</th>
            <th>Comprador</th>
            <th>Vendedor</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <script>
        window.onload = function() { window.print(); }
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// 8. REINICIAR RIFA (PIN ADMIN)
function resetRaffle() {
  const confirmFirst = confirm("⚠️ ¡ATENCIÓN! Estás a punto de borrar TODAS las ventas de la rifa. ¿Deseas continuar?");
  if (!confirmFirst) return;

  const inputPin = prompt("Ingresa el PIN de Administrador para confirmar el borrado:");

  if (inputPin === PIN_ADMIN) {
    const confirmSecond = confirm("¿Estás completamente seguro? Esta acción NO se puede deshacer y liberará todos los números.");
    
    if (confirmSecond) {
      marksRef.remove()
        .then(() => {
          alert("La rifa ha sido reiniciada con éxito. Todos los números están libres.");
        })
        .catch((error) => {
          alert("Error al intentar reiniciar la base de datos: " + error.message);
        });
    }
  } else if (inputPin !== null) {
    alert("PIN de Administrador incorrecto. Operación cancelada.");
  }
}

// 9. ESCUCHAR CAMBIOS Y TÍTULO
marksRef.on('value', (snapshot) => {
  localData = snapshot.val() || {};
  let totalVendidos = 0;

  for (let i = 0; i <= TOTAL_NUMEROS; i++) {
    if (localData[i]) {
      cells[i].classList.add("marked");
      totalVendidos++;
    } else {
      cells[i].classList.remove("marked");
    }
  }

  soldCountEl.textContent = totalVendidos;
  applyFilter();
});

const titleInput = document.getElementById("titleInput");

titleRef.on('value', (snapshot) => {
  const titleVal = snapshot.val();
  if (titleVal !== null) {
    titleInput.value = titleVal;
  }
});

titleInput.addEventListener("input", () => {
  titleRef.set(titleInput.value);
});

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(reg => console.log("Service Worker registrado", reg))
    .catch(err => console.error("Error al registrar el Service Worker", err));
}
