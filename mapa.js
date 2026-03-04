import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let map;
let markers = {};
let usuarioAtual = null;
let localSelecionado = null;

onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  usuarioAtual = user;
  iniciarMapa();
  carregarAnuncios();
});

function iniciarMapa() {
  map = L.map("map").setView([-17.79, -50.92], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

  map.on("click", e => {
    localSelecionado = e.latlng;
    alert("Localização selecionada!");
  });
}

function carregarAnuncios() {
  const ref = collection(db, "anuncios");

  onSnapshot(ref, snapshot => {

    snapshot.forEach(docSnap => {

      const d = docSnap.data();
      const id = docSnap.id;

      if (markers[id]) return;

      markers[id] = L.marker([d.lat, d.lng])
        .addTo(map)
        .bindPopup(`
          <strong>${d.titulo}</strong><br>
          ${d.descricao}<br>
          📞 ${d.telefone}
        `);
    });

  });
}

document.getElementById("salvar").onclick = async () => {

  if (!localSelecionado) {
    alert("Clique no mapa primeiro!");
    return;
  }

  try {

    await addDoc(collection(db, "anuncios"), {
      titulo: document.getElementById("titulo").value,
      descricao: document.getElementById("descricao").value,
      telefone: document.getElementById("telefone").value,
      lat: localSelecionado.lat,
      lng: localSelecionado.lng,
      uid: usuarioAtual.uid,
      criadoEm: serverTimestamp()
    });

    alert("Salvo com sucesso!");

    location.reload();

  } catch (error) {
    console.error("Erro real:", error);
    alert("Erro ao salvar.");
  }
};

document.getElementById("btnSair").onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};
const modal = document.getElementById("modal");
const btnAdd = document.getElementById("btnAdd");
const btnFechar = document.getElementById("fechar");

btnAdd.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

btnFechar.addEventListener("click", () => {
  modal.classList.add("hidden");
});
