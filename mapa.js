import { auth, db } from "./firebase.js";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔒 USUÁRIO
let usuarioAtual = null;

// 🗺️ MAPA
let map;
let markers = {};
let mapaIniciado = false;

const TRACCAR_URL = "http://localhost:8082/api/positions";
const TRACCAR_TOKEN = "RzBFAiEA8J7vap4FCNi2vonXHll3ZT8ZB4PCSmOioy2QY-yKax8CIELvg19O9BeMnmJyMnnjX3iFjM78Lv1mtaFu6-Z7638beyJpIjo0MTExMDQ1MjU3MDU1MTUzNzU3LCJ1IjoxLCJlIjoiMjAyNi0wMi0xNVQwMzowMDowMC4wMDArMDA6MDAifQ"; // depois a gente protege isso

// 🔐 VERIFICAR LOGIN
onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  usuarioAtual = user;
  iniciarMapa();
  listarVeiculos();
});

// 🗺️ INICIAR MAPA
function iniciarMapa() {
  if (mapaIniciado) return;

  map = L.map("map", {
    center: [-23.55, -46.63],
    zoom: 13,
    minZoom: 3,
    worldCopyJump: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true
  }).addTo(map);

  mapaIniciado = true;
  
  map.setMaxBounds([
    [-85, -180],
    [85, 180]
  ]);

  // 🔥 FORÇA O REDIMENSIONAMENTO
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

async function carregarPosicoes() {
  const res = await fetch("http://localhost:8082/api/positions", {
    headers: {
      Authorization: "RzBFAiEA8J7vap4FCNi2vonXHll3ZT8ZB4PCSmOioy2QY-yKax8CIELvg19O9BeMnmJyMnnjX3iFjM78Lv1mtaFu6-Z7638beyJpIjo0MTExMDQ1MjU3MDU1MTUzNzU3LCJ1IjoxLCJlIjoiMjAyNi0wMi0xNVQwMzowMDowMC4wMDArMDA6MDAifQ"
    }
  });

  const dados = await res.json();

  dados.forEach(pos => {
    const { latitude, longitude, deviceId } = pos;

    if (!markers[deviceId]) {
      markers[deviceId] = L.marker([latitude, longitude]).addTo(map);
    } else {
      markers[deviceId].setLatLng([latitude, longitude]);
    }
  });
}

// Atualizar a cada 5 segundos
setInterval(carregarPosicoes, 5000);


// 📋 MODAL
const modal = document.getElementById("modal");
const btnAdd = document.getElementById("btnAdd");
const btnSalvar = document.getElementById("salvar");
const btnFechar = document.getElementById("fechar");

btnAdd.onclick = () => modal.classList.remove("hidden");
btnFechar.onclick = () => modal.classList.add("hidden");

// 💾 SALVAR DISPOSITIVO
btnSalvar.onclick = async () => {
  const imei = document.getElementById("imei").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const placa = document.getElementById("placa").value.trim();

  if (!imei || !nome) {
    alert("Informe IMEI e nome do veículo");
    return;
  }

  await setDoc(doc(db, "dispositivos", imei), {
    uid: usuarioAtual.uid,
    nome,
    placa,
    criadoEm: serverTimestamp()
  });

  modal.classList.add("hidden");
  document.getElementById("imei").value = "";
  document.getElementById("nome").value = "";
  document.getElementById("placa").value = "";
};

// 🚪 BOTÃO SAIR
const btnSair = document.getElementById("btnSair");

btnSair.onclick = async () => {
  const ok = confirm("Deseja realmente sair?");
  if (!ok) return;

  await signOut(auth);
  location.href = "index.html";
};


// 🚗 LISTAR VEÍCULOS
function listarVeiculos() {
  const lista = document.getElementById("listaVeiculos");

  const q = query(
    collection(db, "dispositivos"),
    where("uid", "==", usuarioAtual.uid)
  );

  onSnapshot(q, snapshot => {
    lista.innerHTML = "";

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const imei = docSnap.id;

      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      // 📄 INFO
      const info = document.createElement("span");
      info.textContent = `${d.nome} (${d.placa || "sem placa"})`;
      info.style.cursor = "pointer";
      info.onclick = () => ouvirLocalizacao(imei);

      // 🗑 BOTÃO APAGAR
      const btnDel = document.createElement("button");
      btnDel.textContent = "🗑";
      btnDel.style.background = "transparent";
      btnDel.style.border = "none";
      btnDel.style.cursor = "pointer";
      btnDel.style.fontSize = "16px";

      btnDel.onclick = async (e) => {
        e.stopPropagation();

        const ok = confirm(`Apagar o veículo "${d.nome}"?`);
        if (!ok) return;

        // 🔥 REMOVE DO FIRESTORE
        await deleteDoc(doc(db, "dispositivos", imei));

        // 🗺️ REMOVE MARCADOR
        if (markers[imei]) {
          map.removeLayer(markers[imei]);
          delete markers[imei];
        }
      };

      li.appendChild(info);
      li.appendChild(btnDel);
      lista.appendChild(li);
    });
  });
}


// 📡 OUVIR LOCALIZAÇÃO EM TEMPO REAL
function ouvirLocalizacao(imei) {
  const ref = doc(db, "localizacoes", imei);

  onSnapshot(ref, snap => {
    if (!snap.exists()) return;

    const { lat, lng } = snap.data();

    if (!markers[imei]) {
      markers[imei] = L.marker([lat, lng]).addTo(map);
    } else {
      markers[imei].setLatLng([lat, lng]);
    }

    map.setView([lat, lng], 15);
  });
}
async function carregarPosicoesTraccar() {
  try {
    const res = await fetch(TRACCAR_URL, {
      headers: {
        Authorization: "Bearer " + TRACCAR_TOKEN
      }
    });

    const posicoes = await res.json();

    posicoes.forEach(pos => {
      const { latitude, longitude, deviceId } = pos;

      if (!markers["traccar_" + deviceId]) {
        markers["traccar_" + deviceId] =
          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("Dispositivo Traccar ID: " + deviceId);
      } else {
        markers["traccar_" + deviceId]
          .setLatLng([latitude, longitude]);
      }
    });

  } catch (e) {
    console.error("Erro Traccar:", e);
  }
}
