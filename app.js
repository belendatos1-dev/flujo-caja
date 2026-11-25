let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let saldosIniciales = JSON.parse(localStorage.getItem("saldosIniciales")) || {
  caja: 0,
  banco: 0
};

function guardar() {
  localStorage.setItem("movimientos", JSON.stringify(movimientos));
  localStorage.setItem("saldosIniciales", JSON.stringify(saldosIniciales));
}

function formatoMoneda(n) {
  return "$" + n.toLocaleString("es-CL", { minimumFractionDigits: 0 });
}

function calcularSaldos() {
  const saldos = { ...saldosIniciales };

  movimientos.forEach(m => {
    const monto = Number(m.monto);
    if (m.tipo === "ingreso")       saldos[m.cuenta] += monto;
    else if (m.tipo === "egreso")   saldos[m.cuenta] -= monto;
    else if (m.tipo === "transferencia") {
      saldos[m.cuenta] -= monto;
      saldos[m.cuentaDestino] += monto;
    }
  });

  return saldos;
}

function mostrarSaldos() {
  const s = calcularSaldos();
  document.getElementById("saldo-caja").textContent  = formatoMoneda(s.caja);
  document.getElementById("saldo-banco").textContent = formatoMoneda(s.banco);
  document.getElementById("saldo-total").textContent = formatoMoneda(s.caja + s.banco);
}

function mostrarMovimientos() {
  const tbody = document.getElementById("tabla-movimientos");
  tbody.innerHTML = "";

  if (movimientos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;">Sin movimientos</td></tr>';
    return;
  }

  const ordenados = [...movimientos].reverse();

  ordenados.forEach(m => {
    const tr = document.createElement("tr");

    let textoCuenta = m.cuenta;
    if (m.tipo === "transferencia") {
      textoCuenta = `${m.cuenta} → ${m.cuentaDestino}`;
    }

    const signo = m.tipo === "egreso" ? "-" : (m.tipo === "ingreso" ? "+" : "");

    tr.innerHTML = `
      <td>${m.fecha}</td>
      <td class="${m.tipo}">${m.tipo}</td>
      <td>${textoCuenta}</td>
      <td>${m.descripcion}</td>
      <td class="${m.tipo}">${signo}${formatoMoneda(Number(m.monto))}</td>
      <td><button class="btn-eliminar" data-id="${m.id}">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarMovimiento(btn.dataset.id));
  });
}

function eliminarMovimiento(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;
  movimientos = movimientos.filter(m => m.id !== id);
  guardar();
  mostrarSaldos();
  mostrarMovimientos();
}

document.getElementById("tipo").addEventListener("change", (e) => {
  const labelDestino = document.getElementById("label-cuenta-destino");
  labelDestino.style.display = e.target.value === "transferencia" ? "block" : "none";
});

document.getElementById("form-movimiento").addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const cuenta = document.getElementById("cuenta").value;
  const cuentaDestino = document.getElementById("cuenta-destino").value;
  const monto = Number(document.getElementById("monto").value);
  const descripcion = document.getElementById("descripcion").value.trim();
  const fecha = document.getElementById("fecha").value;

  if (monto <= 0) { alert("El monto debe ser mayor a 0"); return; }
  if (tipo === "transferencia" && cuenta === cuentaDestino) {
    alert("La cuenta origen y destino deben ser distintas");
    return;
  }

  const saldos = calcularSaldos();
  if (tipo === "egreso" && saldos[cuenta] < monto) {
    alert("Saldo insuficiente en " + cuenta);
    return;
  }
  if (tipo === "transferencia" && saldos[cuenta] < monto) {
    alert("Saldo insuficiente en " + cuenta + " para la transferencia");
    return;
  }

  movimientos.push({
    id: Date.now().toString(),
    tipo,
    cuenta,
    cuentaDestino: tipo === "transferencia" ? cuentaDestino : null,
    monto,
    descripcion,
    fecha
  });

  guardar();
  mostrarSaldos();
  mostrarMovimientos();

  document.getElementById("monto").value = "";
  document.getElementById("descripcion").value = "";
});

document.getElementById("fecha").value = new Date().toISOString().split("T")[0];

mostrarSaldos();
mostrarMovimientos();