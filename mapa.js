/* =========================
   QMAP MONITORAMENTO REALTIME
========================= */

import { auth, db } from "./firebase.js";

import {

  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc

} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {

  onAuthStateChanged,
  signOut

} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* =========================
   AUTENTICACAO
========================= */

let usuarioAtual = null;

onAuthStateChanged(auth, (user)=>{

  if(!user){

    window.location.href = "index.html";

    return;
  }

  usuarioAtual = user;

});

/* =========================
   MAPA
========================= */

const map = L.map('map').setView([-10.184, -48.333], 13);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution:'© OpenStreetMap'
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

btnAbrirModal.onclick = ()=>{

  modal.style.display = 'flex';

};

btnFechar.onclick = ()=>{

  modal.style.display = 'none';

};

/* =========================
   SAIR
========================= */

btnSair.onclick = async ()=>{

  const confirmar =
  confirm('Deseja sair?');

  if(!confirmar) return;

  await signOut(auth);

  window.location.href =
  'index.html';

};

/* =========================
   ARRAY VEICULOS
========================= */

const veiculos = [];

const markers = [];

/* =========================
   REALTIME FIREBASE
========================= */

onSnapshot(

  collection(db,"veiculos"),

  (snapshot)=>{

    veiculos.length = 0;

    snapshot.forEach((docSnap)=>{

      veiculos.push({

        id: docSnap.id,
        ...docSnap.data()

      });

    });

    renderizarVeiculos();

  }

);

/* =========================
   RENDERIZAR
========================= */

function renderizarVeiculos(){

  listaVeiculos.innerHTML = '';

  markers.forEach(marker=>{

    map.removeLayer(marker);

  });

  markers.length = 0;

  let online = 0;

  veiculos.forEach((v,index)=>{

    if(v.status === 'online'){

      online++;

    }

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
        ⚡ ${v.velocidade || 0} km/h
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

    div.onclick = ()=>{

      map.setView(
        [v.lat,v.lng],
        16
      );

    };

    listaVeiculos.appendChild(div);

    const marker = L.marker(
      [v.lat,v.lng]
    )

    .addTo(map)

    .bindPopup(`

      <strong>${v.nome}</strong><br>

      🚘 ${v.placa}<br>

      📡 ${v.status}<br>

      ⚡ ${v.velocidade || 0} km/h

    `);

    markers.push(marker);

  });

  onlineCount.innerText =
  online;

  veiculosCount.innerText =
  veiculos.length;

}

/* =========================
   SALVAR VEICULO
========================= */

btnSalvar.onclick = async ()=>{

  const nome =
  document.getElementById('nome').value;

  const placa =
  document.getElementById('placa').value;

  const imei =
  document.getElementById('imei').value;

  const status =
  document.getElementById('status').value;

  if(!nome || !placa || !imei){

    alert('Preencha todos os campos');

    return;
  }

  try{

    await addDoc(

      collection(db,"veiculos"),

      {

        nome,
        placa,
        imei,
        status,

        velocidade:0,

        lat:
        -10.184 +
        (Math.random()/100),

        lng:
        -48.333 +
        (Math.random()/100),

        uid: usuarioAtual.uid,

        criadoEm:
        new Date()

      }

    );

    modal.style.display = 'none';

    document.getElementById('nome').value = '';

    document.getElementById('placa').value = '';

    document.getElementById('imei').value = '';

  }

  catch(e){

    console.error(e);

    alert('Erro ao salvar');

  }

};

/* =========================
   EDITAR
========================= */

window.editarVeiculo =
async (index)=>{

  const novoNome = prompt(

    'Novo nome:',
    veiculos[index].nome

  );

  if(!novoNome) return;

  try{

    await updateDoc(

      doc(
        db,
        "veiculos",
        veiculos[index].id
      ),

      {

        nome: novoNome

      }

    );

  }

  catch(e){

    console.error(e);

    alert('Erro ao editar');

  }

};

/* =========================
   EXCLUIR
========================= */

window.excluirVeiculo =
async (index)=>{

  const confirmar =
  confirm(
    'Deseja excluir?'
  );

  if(!confirmar) return;

  try{

    await deleteDoc(

      doc(
        db,
        "veiculos",
        veiculos[index].id
      )

    );

  }

  catch(e){

    console.error(e);

    alert('Erro ao excluir');

  }

};

/* =========================
   SIMULADOR TEMPO REAL
========================= */

setInterval(async ()=>{

  veiculos.forEach(async (v)=>{

    if(v.status === 'online'){

      const novaLat =
      v.lat +
      ((Math.random()-0.5)/1000);

      const novaLng =
      v.lng +
      ((Math.random()-0.5)/1000);

      const novaVelocidade =
      Math.floor(
        Math.random()*120
      );

      await updateDoc(

        doc(
          db,
          "veiculos",
          v.id
        ),

        {

          lat: novaLat,
          lng: novaLng,
          velocidade:
          novaVelocidade

        }

      );

    }

  });

},5000);
