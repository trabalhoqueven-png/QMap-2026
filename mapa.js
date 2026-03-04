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

// 🔐 LOGIN
onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  usuarioAtual = user;
  iniciarMapa();
  carregarAnuncios();
});

// 🗺️ INICIAR MAPA
function iniciarMapa() {

  map = L.map("map").setView([-17.79, -50.92], 13); // Rio Verde

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

  map.on("click", e => {
    localSelecionado = e.latlng;
    alert("Localização selecionada!");
  });
}

// 🎨 ÍCONES
const iconePerdido = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/565/565547.png",
  iconSize: [35, 35]
});

const iconeCasa = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
  iconSize: [35, 35]
});

// 📡 CARREGAR ANÚNCIOS
function carregarAnuncios() {

  const ref = collection(db, "anuncios");

  onSnapshot(ref, snapshot => {

    snapshot.forEach(docSnap => {

      const d = docSnap.data();
      const id = docSnap.id;

      if (markers[id]) return;

      const icone = d.tipo === "perdido"
        ? iconePerdido
        : iconeCasa;

      markers[id] = L.marker([d.lat, d.lng], { icon: icone })
        .addTo(map)
        .bindPopup(`
          <strong>${d.titulo}</strong><br>
          ${d.descricao}<br>
          ${d.preco ? "💰 R$ " + d.preco + "<br>" : ""}
          📞 ${d.telefone}
        `);
    });

  });
}

// ➕ MODAL
const modal = document.getElementById("modal");
document.getElementById("btnAdd").onclick =
  () => modal.classList.remove("hidden");

document.getElementById("fechar").onclick =
  () => modal.classList.add("hidden");

// 💾 SALVAR ANÚNCIO
document.getElementById("salvar").onclick = async () => {

  console.log("Tentando salvar...");

  try {

    const docRef = await addDoc(collection(db, "teste"), {
      nome: "Teste",
      data: serverTimestamp()
    });

    console.log("SALVO COM ID:", docRef.id);

  } catch (error) {
    console.error("ERRO:", error);
  }

};
// 🚪 SAIR
document.getElementById("btnSair").onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};
console.log("DB:", db);
