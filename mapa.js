/* =========================
   QMAP MONITORAMENTO
========================= */

/* MAPA */

const map = L.map('map').setView([-10.184, -48.333], 13);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '© OpenStreetMap'
  }
).addTo(map);

/* =========================
   ELEMENTOS
========================= */

const listaVeiculos =
  document.getElementById('listaVeiculos');

const onlineCount =
  document.getElementById('onlineCount');

const veiculosCount =
  document.getElementById('veiculosCount');

const modal =
  document.getElementById('modal');

const btnAbrirModal =
  document.getElementById('abrirModal');

const btnFechar =
  document.getElementById('fechar');

const btnSalvar =
  document.getElementById('salvar');

const btnSair =
  document.getElementById('btnSair');

/* =========================
   MODAL
========================= */

btnAbrirModal.onclick = () => {

  modal.style.display = 'flex';

};

btnFechar.onclick = () => {

  modal.style.display = 'none';

};

/* =========================
   VEICULOS
========================= */

const veiculos = [

  {
    nome: 'Honda Civic',
    placa: 'QWE-2026',
    imei: '864500000001',
    lat: -10.184,
    lng: -48.333,
    velocidade: 60,
    status: 'online'
  },

  {
    nome: 'CG 160 Titan',
    placa: 'ABC-3030',
    imei: '864500000002',
    lat: -10.190,
    lng: -48.320,
    velocidade: 0,
    status: 'offline'
  }

];

/* =========================
   MARCADORES
========================= */

const markers = [];

/* =========================
   RENDERIZAR
========================= */

function renderizarVeiculos() {

  listaVeiculos.innerHTML = '';

  markers.forEach(marker => {
    map.removeLayer(marker);
  });

  markers.length = 0;

  let online = 0;

  veiculos.forEach((v, index) => {

    if (v.status === 'online') {
      online++;
    }

    /* CARD */

    const div =
      document.createElement('div');

    div.className = 'veiculo';

    div.innerHTML = `

      <div class="veiculo-top">

        <strong>${v.nome}</strong>

        <span class="status ${v.status}">
          ${v.status}
        </span>

      </div>

      <div class="info">
        🚘 ${v.placa}
      </div>

      <div class="info">
        📡 IMEI: ${v.imei}
      </div>

      <div class="info">
        ⚡ ${v.velocidade} km/h
      </div>

      <div class="acoes">

        <button
          class="btn-editar"
          onclick="editarVeiculo(${index})">

          ✏️ Editar

        </button>

        <button
          class="btn-excluir"
          onclick="excluirVeiculo(${index})">

          🗑 Excluir

        </button>

      </div>

    `;

    /* CLICAR CARD */

    div.onclick = () => {

      map.setView(
        [v.lat, v.lng],
        16
      );

    };

    listaVeiculos.appendChild(div);

    /* MARKER */

    const marker =
      L.marker([v.lat, v.lng])

      .addTo(map)

      .bindPopup(`

        <strong>${v.nome}</strong><br>

        🚘 ${v.placa}<br>

        ⚡ ${v.velocidade} km/h<br>

        📡 ${v.status}

      `);

    markers.push(marker);

  });

  onlineCount.innerText = online;

  veiculosCount.innerText =
    veiculos.length;

}

/* =========================
   INICIAR
========================= */

renderizarVeiculos();

/* =========================
   SALVAR VEICULO
========================= */

btnSalvar.onclick = () => {

  const nome =
    document.getElementById('nome').value;

  const placa =
    document.getElementById('placa').value;

  const imei =
    document.getElementById('imei').value;

  const status =
    document.getElementById('status').value;

  /* VALIDACAO */

  if (!nome || !placa || !imei) {

    alert('Preencha todos os campos');

    return;

  }

  /* ADICIONAR */

  veiculos.push({

    nome,
    placa,
    imei,
    status,

    velocidade:
      Math.floor(Math.random() * 120),

    lat:
      -10.184 + (Math.random() / 100),

    lng:
      -48.333 + (Math.random() / 100)

  });

  /* RENDER */

  renderizarVeiculos();

  /* FECHAR MODAL */

  modal.style.display = 'none';

  /* LIMPAR */

  document.getElementById('nome').value = '';

  document.getElementById('placa').value = '';

  document.getElementById('imei').value = '';

};

/* =========================
   EDITAR
========================= */

window.editarVeiculo = (index) => {

  const novoNome = prompt(
    'Novo nome do veículo:',
    veiculos[index].nome
  );

  if (!novoNome) return;

  veiculos[index].nome = novoNome;

  renderizarVeiculos();

};

/* =========================
   EXCLUIR
========================= */

window.excluirVeiculo = (index) => {

  const confirmar =
    confirm(
      'Deseja excluir este veículo?'
    );

  if (!confirmar) return;

  veiculos.splice(index, 1);

  renderizarVeiculos();

};

/* =========================
   BOTAO SAIR
========================= */

btnSair.onclick = () => {

  const confirmar =
    confirm(
      'Deseja sair do sistema?'
    );

  if (!confirmar) return;

  window.location.href =
    'index.html';

};

/* =========================
   TEMPO REAL
========================= */

setInterval(() => {

  veiculos.forEach(v => {

    if (v.status === 'online') {

      v.lat +=
        (Math.random() - 0.5) / 1000;

      v.lng +=
        (Math.random() - 0.5) / 1000;

      v.velocidade =
        Math.floor(Math.random() * 120);

    }

  });

  renderizarVeiculos();

}, 5000);
