import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== "POST") {
        return new Response("método não permitido", { status: 405 });
    }

    let corpo;
    try {
        corpo = await request.json();
    } catch {
        return new Response("corpo inválido: envie um JSON", { status: 400 });
    }

    const numero = corpo ? corpo.numero : undefined;
    if (!numeroValido(numero)) {
        return new Response("número inválido: envie um inteiro entre 1 e 100", { status: 400 });
    }

    const autorizacao = request.headers.get("Authorization") || "";
    const token = autorizacao.startsWith("Bearer ") ? autorizacao.slice(7).trim() : "";
    if (token === "") {
        return new Response("faça login com o Google", { status: 401 });
    }

    let dados;
    try {
        const resposta = await fetch(
            "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token)
        );
        if (resposta.status !== 200) {
            return new Response("token inválido ou expirado", { status: 401 });
        }
        dados = await resposta.json();
    } catch {
        return new Response("não foi possível verificar o token", { status: 401 });
    }

    if (dados.aud !== env.GOOGLE_CLIENT_ID) {
        return new Response("token de outro aplicativo", { status: 401 });
    }

    if (dados.email_verified !== "true") {
        return new Response("e-mail não verificado", { status: 401 });
    }

    const svg = gerarDesenho(numero, dados.email);
    return new Response(svg, {
        status: 200,
        headers: { "Content-Type": "image/svg+xml" },
    });
}