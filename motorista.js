import { auth, db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* =========================
   MAPA
========================= */

const map = L.map("map").setView([-17.8, -50.9], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/* =========================
   VARIÁVEIS
========================= */

const listaCorridas = document.getElementById("listaCorridas");

let motoristaUid = null;

let corridaAtual = null;

let minhaLat = null;
let minhaLng = null;

let marcadorMotorista = null;
let marcadorPassageiro = null;
let marcadorDestino = null;

let rotaControl = null;

/* =========================
   LOGIN
========================= */

onAuthStateChanged(auth, (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  motoristaUid = user.uid;

  iniciarGPS();
  carregarCorridas();

});

/* =========================
   GPS MOTORISTA
========================= */

function iniciarGPS() {

  navigator.geolocation.watchPosition(async (pos) => {

    minhaLat = pos.coords.latitude;
    minhaLng = pos.coords.longitude;

    // marcador motorista
    if (!marcadorMotorista) {
      marcadorMotorista = L.marker([minhaLat, minhaLng])
        .addTo(map)
        .bindPopup("Você");
    } else {
      marcadorMotorista.setLatLng([minhaLat, minhaLng]);
    }

    // atualizar corrida ativa
    if (corridaAtual) {
      desenharRota();
    }

    await updateDoc(doc(db, "usuarios", motoristaUid), {
    lat: minhaLat,
    lng: minhaLng,
    online: motoristaOnline
});

  }, console.log, {
    enableHighAccuracy: true
  });
}

/* =========================
   CORRIDAS DISPONÍVEIS
========================= */

function carregarCorridas() {

  const q = query(
    collection(db, "corridas"),
    where("status", "==", "aguardando")
  );

  onSnapshot(q, (snapshot) => {

    listaCorridas.innerHTML = "";

    snapshot.forEach((docSnap) => {

      const corrida = {
        id: docSnap.id,
        ...docSnap.data()
      };

      const div = document.createElement("div");

      div.className = "corrida";

      div.innerHTML = `

<h3>🚖 Nova Corrida</h3>

<p><b>📍 Origem</b></p>
<p>${corrida.origemLat.toFixed(6)}</p>
<p>${corrida.origemLng.toFixed(6)}</p>

<hr>

<p><b>🏁 Destino</b></p>
<p>${corrida.destinoLat.toFixed(6)}</p>
<p>${corrida.destinoLng.toFixed(6)}</p>

<button onclick="verDestino(
${corrida.destinoLat},
${corrida.destinoLng}
)">
🗺 Ver Destino
</button>

<button onclick="aceitarCorrida('${corrida.id}')">
✅ Aceitar
</button>

<button onclick="recusarCorrida('${corrida.id}')">
❌ Recusar
</button>

`;

      listaCorridas.appendChild(div);

      L.marker([corrida.origemLat, corrida.origemLng])
        .addTo(map)
        .bindPopup("Passageiro");

    });

  });
}

/* =========================
   ACEITAR CORRIDA
========================= */

window.aceitarCorrida = async (id) => {

  await updateDoc(doc(db, "corridas", id), {
    status: "aceita",
    motoristaUid
  });

  ouvirCorrida(id);

  alert("Corrida aceita!");
};

window.verDestino = (lat,lng)=>{

    map.setView([lat,lng],18);

    L.popup()
    .setLatLng([lat,lng])
    .setContent("🏁 Destino do passageiro")
    .openOn(map);

}

window.recusarCorrida = async(id)=>{

    const confirmar = confirm("Recusar esta corrida?");

    if(!confirmar) return;

    await updateDoc(doc(db,"corridas",id),{

        status:"recusada"

    });

}

/* =========================
   ESCUTAR CORRIDA ATIVA
========================= */

function ouvirCorrida(id) {

  onSnapshot(doc(db, "corridas", id), (snap) => {

    if (!snap.exists()) return;

    corridaAtual = snap.data();

    atualizarMapa();
  });
}

/* =========================
   MAPA (PASSAGEIRO + DESTINO)
========================= */

function atualizarMapa() {

  if (!corridaAtual) return;

  if (marcadorPassageiro) map.removeLayer(marcadorPassageiro);
  if (marcadorDestino) map.removeLayer(marcadorDestino);

  marcadorPassageiro = L.marker([
    corridaAtual.origemLat,
    corridaAtual.origemLng
  ]).addTo(map).bindPopup("Passageiro");

  marcadorDestino = L.marker([
    corridaAtual.destinoLat,
    corridaAtual.destinoLng
  ]).addTo(map).bindPopup("Destino");

  map.fitBounds([
    [corridaAtual.origemLat, corridaAtual.origemLng],
    [corridaAtual.destinoLat, corridaAtual.destinoLng]
  ]);

  desenharRota();
}

/* =========================
   ROTA (TIPO UBER)
========================= */

function desenharRota() {

  if (!corridaAtual || !minhaLat) return;

  if (rotaControl) {
    map.removeControl(rotaControl);
  }

  rotaControl = L.Routing.control({
    waypoints: [
      L.latLng(minhaLat, minhaLng),
      L.latLng(corridaAtual.origemLat, corridaAtual.origemLng),
      L.latLng(corridaAtual.destinoLat, corridaAtual.destinoLng)
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    createMarker: () => null
  }).addTo(map);
}

/* =========================
   BOTÕES DO PAINEL
========================= */

let motoristaOnline = true;

// CENTRALIZAR MAPA
const btnInicio = document.getElementById("btnInicio");

if (btnInicio) {

  btnInicio.onclick = () => {

    if (minhaLat && minhaLng) {

      map.setView([minhaLat, minhaLng], 18);

    }

  };

}

// MOSTRAR / ESCONDER CORRIDAS
const btnCorridas = document.getElementById("btnCorridas");

if (btnCorridas) {

  btnCorridas.onclick = () => {

    const painel = document.querySelector(".painel");

    if (painel.style.display === "none") {

      painel.style.display = "block";

    } else {

      painel.style.display = "none";

    }

  };

}

// ONLINE / OFFLINE
const btnOffline = document.getElementById("btnOffline");

if (btnOffline) {

  btnOffline.onclick = async () => {

    motoristaOnline = !motoristaOnline;

    await updateDoc(doc(db, "usuarios", motoristaUid), {

      online: motoristaOnline

    });

    btnOffline.innerHTML = motoristaOnline
      ? "🟢 Online"
      : "🔴 Offline";

  };

}

// PERFIL
const btnPerfil = document.getElementById("btnPerfil");

if (btnPerfil) {

  btnPerfil.onclick = () => {

    alert("Perfil do motorista (em desenvolvimento)");

  };

}

// SAIR
const btnSair = document.getElementById("btnSair");

if (btnSair)

  btnSair.onclick = async () => {

    try {

        await updateDoc(doc(db,"usuarios",motoristaUid),{

            online:false

        });

        await signOut(auth);

        location.href="index.html";

    } catch(e){

        console.log(e);

    }

};