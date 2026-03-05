import { auth, db } from "./firebase.js";

import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc,
  getDoc,
  deleteDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let usuarioAtual = null;
let coins = 0;
let marcacoesGratis = 0;

/* 🔐 PROTEÇÃO DE PÁGINA */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.replace("index.html");
    return;
  }

  usuarioAtual = user;

  const ref = doc(db,"usuarios",user.uid);
  const snap = await getDoc(ref);

  if(snap.exists()){

    coins = snap.data().coins || 0;
    marcacoesGratis = snap.data().marcacoesGratis || 0;

    atualizarPainel();

  }

});

/* 🪙 PAINEL COINS */
function atualizarPainel(){

  const elCoins = document.getElementById("coins");
  const elGratis = document.getElementById("gratis");

  if(elCoins) elCoins.innerText = coins;
  if(elGratis) elGratis.innerText = marcacoesGratis;

}

/* 🚪 BOTÃO SAIR */
const btnSair = document.getElementById("btnSair");

if (btnSair) {
  btnSair.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("index.html");
  });
}

/* 🗺 MAPA */
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

const inputPreco = document.getElementById("preco");
const inputTelefone = document.getElementById("telefone");

/* 📞 TELEFONE */
inputTelefone.addEventListener("input", () => {

  let numeros = inputTelefone.value.replace(/\D/g, "");
  numeros = numeros.substring(0, 11);

  if (numeros.length > 6) {
    inputTelefone.value =
      numeros.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
  } 
  else if (numeros.length > 2) {
    inputTelefone.value =
      numeros.replace(/(\d{2})(\d+)/, "($1) $2");
  } 
  else {
    inputTelefone.value = numeros;
  }

});

/* 💰 PREÇO */
inputPreco.addEventListener("input", () => {

  let numeros = inputPreco.value.replace(/\D/g, "");
  numeros = numeros.substring(0, 9);

  if (!numeros) {
    inputPreco.value = "";
    return;
  }

  let valor = (numeros / 100).toFixed(2);
  valor = valor.replace(".", ",");
  valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  inputPreco.value = valor;

});

/* 📍 ABRIR MODAL */
btnAdd.onclick = () => modal.classList.remove("hidden");
btnFechar.onclick = () => modal.classList.add("hidden");

/* 📍 CLICAR NO MAPA */
map.on("click", (e) => {

  localSelecionado = e.latlng;

  if (marcadorTemporario) {
    map.removeLayer(marcadorTemporario);
  }

  marcadorTemporario = L.marker(e.latlng).addTo(map);

});

/* 💾 SALVAR ANÚNCIO + SISTEMA DE COINS */
btnSalvar.addEventListener("click", async () => {

  if (!localSelecionado) {
    alert("Clique no mapa primeiro!");
    return;
  }

  if (!usuarioAtual) {
    alert("Usuário não autenticado.");
    return;
  }

  /* 🔒 SISTEMA DE LIMITE */

  if(marcacoesGratis > 0){

    marcacoesGratis--;

  } else {

    if(coins <= 0){
      alert("Você não tem coins!");
      return;
    }

    coins--;

  }

  const tipo = document.getElementById("tipo").value;
  const titulo = document.getElementById("titulo").value;
  const descricao = document.getElementById("descricao").value;

  const precoLimpo = inputPreco.value.replace(/\D/g, "");
  const telefoneLimpo = inputTelefone.value.replace(/\D/g, "");

  try {

    await addDoc(collection(db, "anuncios"), {
      tipo,
      titulo,
      descricao,
      preco: precoLimpo ? Number(precoLimpo) / 100 : null,
      telefone: telefoneLimpo,
      lat: localSelecionado.lat,
      lng: localSelecionado.lng,
      uid: usuarioAtual.uid,
      criadoEm: new Date()
    });

    /* atualizar coins */

    await updateDoc(doc(db,"usuarios",usuarioAtual.uid),{
      coins: coins,
      marcacoesGratis: marcacoesGratis
    });

    atualizarPainel();

    alert("Anúncio criado!");

    modal.classList.add("hidden");

    document.getElementById("titulo").value = "";
    document.getElementById("descricao").value = "";
    inputPreco.value = "";
    inputTelefone.value = "";

    localSelecionado = null;

  } catch (e) {
    console.error("ERRO:", e);
  }

});

/* 📡 CARREGAR ANÚNCIOS */
function carregarAnuncios() {

  const ref = collection(db, "anuncios");

  onSnapshot(ref, (snapshot) => {

    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};

    snapshot.forEach((docSnap) => {

      const d = docSnap.data();
      const id = docSnap.id;

      let precoFormatado = "-";

      if (d.preco) {
        precoFormatado = d.preco.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        });
      }

      let telefoneFormatado = "-";

      if (d.telefone && d.telefone.length === 11) {
        telefoneFormatado =
          `(${d.telefone.slice(0,2)}) ${d.telefone.slice(2,7)}-${d.telefone.slice(7)}`;
      }

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
            💰 ${precoFormatado}<br>
            📞 ${telefoneFormatado}
            ${botoes}
          `;
        });

    });

  });

}

carregarAnuncios();

/* 🗑 EXCLUIR */
window.excluir = async (id) => {
  if (!confirm("Deseja excluir este anúncio?")) return;
  await deleteDoc(doc(db, "anuncios", id));
};

/* ✏️ EDITAR */
window.editar = async (id) => {

  const novoTitulo = prompt("Novo título:");
  if (!novoTitulo) return;

  await updateDoc(doc(db, "anuncios", id), {
    titulo: novoTitulo
  });

};
