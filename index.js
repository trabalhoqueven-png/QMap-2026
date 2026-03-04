import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔹 ELEMENTOS
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const msgEl = document.getElementById("msg");
const btnLogin = document.getElementById("btnLogin");
const btnCadastro = document.getElementById("btnCadastro");

// 🔹 EVENTOS
btnLogin.addEventListener("click", login);
btnCadastro.addEventListener("click", cadastrar);

let deferredPrompt;

// 🔹 FUNÇÃO DE MENSAGEM
function msg(texto, cor) {
  msgEl.innerText = texto;
  msgEl.style.color = cor;
}

// 🔐 LOGIN
async function login() {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      email.value,
      senha.value
    );

    if (!cred.user.emailVerified) {
      await signOut(auth);
      msg("❌ Confirme seu email antes de entrar.", "red");
      return;
    }

    location.replace("mapa.html"); // AQUI

  } catch (e) {
    msg("❌ Email ou senha inválidos.", "red");
  }
}
// 🆕 CADASTRO
async function cadastrar() {
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.value,
      senha.value
    );

    await sendEmailVerification(cred.user);

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      email: cred.user.email,
      criadoEm: serverTimestamp()
    });

    await signOut(auth);

    msg("📧 Cadastro criado! Verifique seu SPAM / GMAIL.", "lime");

  } catch (e) {
    msg(e.message, "red");
  }
}

// 🚧 BLOQUEAR USUÁRIO LOGADO
onAuthStateChanged(auth, user => {
  if (user && user.emailVerified) {
    location.href = "mapa.html";
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("Service Worker registrado"))
    .catch(err => console.log("Erro no SW", err));
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("Pode instalar!");

  const btn = document.createElement("button");
  btn.innerText = "Instalar App";
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.padding = "10px 15px";
  btn.style.background = "#b30000";
  btn.style.color = "#fff";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";

  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    deferredPrompt.prompt();
  });
});
