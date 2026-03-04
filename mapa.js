import { auth, db } from "./firebase.js";
import { 
  collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔒 Usuário atual
let usuarioAtual = null;

// 🔐 Proteção de página
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("index.html");
  } else {
    usuarioAtual = user;
    console.log("Logado com UID:", user.uid);
  }
});

// 🚪 Botão sair
const btnSair = document.getElementById("btnSair");
if (btnSair) {
  btnSair.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("index.html");
  });
}

// 🗺 Inicializa mapa somente uma vez
let mapContainer = document.getElementById("map");
if (!mapContainer._leaflet_id) { // evita duplicação
  var map = L.map("map").setView([-17.8, -50.9], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);
}

// Variáveis do mapa
let marcadorTemporario = null;
let localSelecionado = null;
let markers = {};

// Modal e botões
const modal = document.getElementById("modal");
const btnAdd = document.getElementById("btnAdd");
const btnFechar = document.getElementById("fechar");
const btnSalvar = document.getElementById("salvar");
const inputPreco = document.getElementById("preco");
const inputTelefone = document.getElementById("telefone");

btnAdd.onclick = () => modal.classList.remove("hidden");
btnFechar.onclick = () => modal.classList.add("hidden");

// 📍 Selecionar ponto no mapa
map.on("click", (e) => {
  localSelecionado = e.latlng;

  if (marcadorTemporario) map.removeLayer(marcadorTemporario);

  marcadorTemporario = L.marker(e.latlng).addTo(map);
});

// 🔢 Validação: só números
inputPreco.addEventListener("input", () => {
  inputPreco.value = inputPreco.value.replace(/\D/g, "");
});

inputTelefone.addEventListener("input", () => {
  inputTelefone.value = inputTelefone.value.replace(/\D/g, "");
});

// 💾 Salvar anúncio
btnSalvar.addEventListener("click", async () => {
  if (!localSelecionado) {
    alert("Clique no mapa primeiro!");
    return;
  }
  if (!usuarioAtual) {
    alert("Usuário não autenticado.");
    return;
  }

  const tipo = document.getElementById("tipo").value;
  const titulo = document.getElementById("titulo").value;
  const descricao = document.getElementById("descricao").value;
  const preco = inputPreco.value ? Number(inputPreco.value) : null;
  const telefone = inputTelefone.value;

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

    // limpar campos
    document.getElementById("titulo").value = "";
    document.getElementById("descricao").value = "";
    inputPreco.value = "";
    inputTelefone.value = "";
    localSelecionado = null;

  } catch (e) {
    console.error("ERRO AO SALVAR:", e);
  }
});

// 📡 Carregar anúncios
function carregarAnuncios() {
  const ref = collection(db, "anuncios");

  onSnapshot(ref, (snapshot) => {
    // remove markers antigos
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
            💰 ${d.preco ? "R$ " + d.preco.toLocaleString("pt-BR") : "-"}<br>
            📞 ${d.telefone}
            ${botoes}
          `;
        });
    });
  });
}

carregarAnuncios();

// 🗑 Excluir anúncio
window.excluir = async (id) => {
  if (!confirm("Deseja excluir este anúncio?")) return;
  await deleteDoc(doc(db, "anuncios", id));
};

// ✏️ Editar título
window.editar = async (id) => {
  const novoTitulo = prompt("Novo título:");
  if (!novoTitulo) return;
  await updateDoc(doc(db, "anuncios", id), { titulo: novoTitulo });
};
