import { auth, db } from "./firebase.js";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { signInAnonymously, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// LOGIN ANÔNIMO AUTOMÁTICO
signInAnonymously(auth);

let usuarioAtual = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioAtual = user;
    console.log("Logado com UID:", user.uid);
  }
});

let map = L.map("map").setView([-17.8, -50.9], 13);
let marcadorTemporario = null;
let localSelecionado = null;
let markers = {};

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

const modal = document.getElementById("modal");
const btnAdd = document.getElementById("btnAdd");
const btnFechar = document.getElementById("fechar");
const btnSalvar = document.getElementById("salvar");

btnAdd.onclick = () => modal.classList.remove("hidden");
btnFechar.onclick = () => modal.classList.add("hidden");

// Selecionar ponto no mapa
map.on("click", (e) => {

  localSelecionado = e.latlng;

  if (marcadorTemporario) {
    map.removeLayer(marcadorTemporario);
  }

  marcadorTemporario = L.marker(e.latlng).addTo(map);
});

// SALVAR ANÚNCIO
btnSalvar.addEventListener("click", async () => {

  if (!localSelecionado) {
    alert("Clique no mapa primeiro!");
    return;
  }

  if (!usuarioAtual) {
    alert("Usuário ainda não autenticado.");
    return;
  }

  const tipo = document.getElementById("tipo").value;
  const titulo = document.getElementById("titulo").value;
  const descricao = document.getElementById("descricao").value;
  const preco = document.getElementById("preco").value;
  const telefone = document.getElementById("telefone").value;

  try {

    await addDoc(collection(db, "anuncios"), {
      tipo,
      titulo,
      descricao,
      preco,
      telefone,
      lat: localSelecionado.lat,
      lng: localSelecionado.lng,
      uid: usuarioAtual.uid,
      criadoEm: new Date()
    });

    alert("Salvo com sucesso!");
    modal.classList.add("hidden");

  } catch (e) {
    console.error("ERRO AO SALVAR:", e);
  }

});

// CARREGAR ANÚNCIOS
function carregarAnuncios() {

  const ref = collection(db, "anuncios");

  onSnapshot(ref, (snapshot) => {

    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};

    snapshot.forEach((docSnap) => {

      const d = docSnap.data();
      const id = docSnap.id;

      markers[id] = L.marker([d.lat, d.lng])
        .addTo(map)
        .bindPopup(() => {

          let botoes = "";

          if (usuarioAtual && usuarioAtual.uid === d.uid) {
            botoes = `
              <br><br>
              <button onclick="editar('${id}')">✏️ Editar</button>
              <button onclick="excluir('${id}')">🗑 Excluir</button>
            `;
          }

          return `
            <strong>${d.titulo}</strong><br>
            ${d.descricao}<br>
            💰 ${d.preco || "-"}<br>
            📞 ${d.telefone}
            ${botoes}
          `;
        });

    });

  });

}

carregarAnuncios();

// EXCLUIR
window.excluir = async (id) => {

  if (!confirm("Deseja excluir este anúncio?")) return;

  await deleteDoc(doc(db, "anuncios", id));
};

// EDITAR
window.editar = async (id) => {

  const novoTitulo = prompt("Novo título:");
  if (!novoTitulo) return;

  await updateDoc(doc(db, "anuncios", id), {
    titulo: novoTitulo
  });
};
