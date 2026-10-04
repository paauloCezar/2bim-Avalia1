// script.js
// A pagina nao desenha mais nada: ela envia o numero e o token do Google
// para o servidor (/api/desenho) e mostra o que o servidor responder.

// O Client ID e publico: pode ficar aqui (veja as Orientacoes do PDF).
const CLIENT_ID = "787350836414-ju3i0sbd9hpslqq9kmtrfvk4i0abk1ql.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let token = "";     // id_token que o Google entrega depois do login
let svgAtual = "";  // ultimo desenho recebido do servidor

// Login com Google: quando a pessoa entra, o Google chama esta funcao
// e entrega o id_token em resposta.credential.
google.accounts.id.initialize({
  client_id: CLIENT_ID,
  callback: (resposta) => {
    token = resposta.credential;
    mensagem.textContent = "Login feito. Agora escolha um número e clique em Desenhar.";
  },
});
google.accounts.id.renderButton(document.getElementById("botao-google"), {
  theme: "filled_black",
  size: "large",
});

function mostrarErro(texto) {
  mensagem.textContent = texto;
  area.innerHTML = "";
  botaoBaixar.hidden = true;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "Gerando desenho...";

  const numero = Number(campoNumero.value);

  // Envia o numero no corpo (JSON) e o token no cabecalho Authorization.
  const resposta = await fetch("/api/desenho", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
    body: JSON.stringify({ numero: numero }),
  });

  if (resposta.status === 200) {
    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    mensagem.textContent = "";
    botaoBaixar.hidden = false;
  } else if (resposta.status === 400) {
    mostrarErro("Erro 400: número inválido. Digite um inteiro entre 1 e 100.");
  } else if (resposta.status === 401) {
    mostrarErro("Erro 401: você precisa entrar com o Google (ou o login expirou, entre de novo).");
  } else {
    mostrarErro("Erro " + resposta.status + ": não foi possível gerar o desenho.");
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});