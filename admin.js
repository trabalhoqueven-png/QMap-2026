import { auth, db }
from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* =========================
   ELEMENTOS
========================= */

const lista =
document.getElementById("lista");

const btnSair =
document.getElementById("btnSair");

const salvar =
document.getElementById("salvar");

const totalVeiculos =
document.getElementById("totalVeiculos");

const online =
document.getElementById("online");

const usuarios =
document.getElementById("usuarios");

/* =========================
   LOGIN ADMIN
========================= */

onAuthStateChanged(auth,
async(user)=>{

  if(!user){

    location.href =
    "index.html";

    return;
  }

  const userRef =
  doc(db,"usuarios",user.uid);

  const userSnap =
  await getDoc(userRef);

  if(!userSnap.exists()){

    location.href =
    "mapa.html";

    return;
  }

  const dados =
  userSnap.data();

  if(!dados.admin){

    location.href =
    "mapa.html";

    return;
  }

  console.log("ADMIN LOGADO");

});

/* =========================
   SAIR
========================= */

btnSair.onclick = async()=>{

  await signOut(auth);

  location.href =
  "index.html";

};

/* =========================
   SALVAR VEICULO
========================= */

salvar.onclick = async()=>{

  const nomeClienteInput =
  document.getElementById("cliente")
  .value
  .trim();

  const nome =
  document.getElementById("nome")
  .value
  .trim();

  const placa =
  document.getElementById("placa")
  .value
  .trim();

  const imei =
  document.getElementById("imei")
  .value
  .trim();

  const status =
  document.getElementById("status")
  .value;

  if(
    !nomeClienteInput ||
    !nome ||
    !placa ||
    !imei
  ){

    alert("Preencha tudo");

    return;

  }

  try{

    /* =========================
       BUSCAR USUARIO PELO NOME
    ========================= */

    const q =
    query(
      collection(db,"usuarios"),
      where("nome","==",nomeClienteInput)
    );

    const querySnap =
    await getDocs(q);

    if(querySnap.empty){

      alert("Cliente não encontrado");

      return;

    }

    let uid = "";

    let emailCliente = "";

    let nomeCliente = "";

    querySnap.forEach((docSnap)=>{

      const dados =
      docSnap.data();

      /* UID CORRETO */
      uid =
      docSnap.id;

      emailCliente =
      dados.email || "";

      nomeCliente =
      dados.nome || "";

    });

    /* =========================
       SALVAR VEICULO
    ========================= */

    await addDoc(

      collection(db,"veiculos"),

      {

        uid,

        cliente:nomeCliente,

        email:emailCliente,

        nome,

        placa,

        imei,

        status,

        velocidade:0,

        lat:-10.184 + (Math.random()/100),

        lng:-48.333 + (Math.random()/100)

      }

    );

    alert("Veículo salvo");

    document.getElementById("cliente").value = "";

    document.getElementById("nome").value = "";

    document.getElementById("placa").value = "";

    document.getElementById("imei").value = "";

  }

  catch(error){

    console.log(error);

    alert("Erro ao salvar");

  }

};

/* =========================
   LISTA VEICULOS
========================= */

onSnapshot(

  collection(db,"veiculos"),

  (snapshot)=>{

    lista.innerHTML = "";

    let total = 0;

    let totalOnline = 0;

    snapshot.forEach((docSnap)=>{

      total++;

      const v =
      docSnap.data();

      if(v.status === "online"){

        totalOnline++;

      }

      const div =
      document.createElement("div");

      div.className =
      "veiculo";

      div.innerHTML = `

        <div class="veiculo-info">

          <h3>${v.nome}</h3>

          <p>🚘 ${v.placa}</p>

          <p>📡 ${v.imei}</p>

          <p>👤 ${v.cliente}</p>

          <p>📧 ${v.email}</p>

          <p>
            ${v.status === "online"
              ? "🟢 Online"
              : "🔴 Offline"}
          </p>

        </div>

        <button
        onclick="excluir('${docSnap.id}')">

          Excluir

        </button>

      `;

      lista.appendChild(div);

    });

    totalVeiculos.innerText =
    total;

    online.innerText =
    totalOnline;

    usuarios.innerText =
    total;

  }

);

/* =========================
   EXCLUIR
========================= */

window.excluir =
async(id)=>{

  const confirmar =
  confirm("Excluir veículo?");

  if(!confirmar) return;

  await deleteDoc(

    doc(db,"veiculos",id)

  );

};