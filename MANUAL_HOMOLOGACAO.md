# Manual de Homologação de Estação de Trabalho (AGR) 🛡️💻⚙️

Este guia detalha o procedimento obrigatório para preparar a máquina de um Agente de Registro (AGR) para operar no portal **AC ANGRY**. Siga rigorosamente estes passos para garantir que a autenticação A3 e a emissão de certificados funcionem sem falhas.

## 1. Requisitos de Hardware 🔌
- **Leitora de Cartão Smartcard**: Compatível com padrão PC/SC (ex: Gemalto, SCR3310).
- **Token USB**: Homologado pelo ITI (ex: GD burti, SafeNet).
- **Câmera HD**: Mínimo 720p para videoconferência e fotos de auditoria.

## 2. Instalação de Drivers e Middleware (A3) 💾
Dependendo da marca do seu token/cartão, instale o middleware correspondente:
- **SafeSign IC**: O mais comum para cartões da Soluti, Certisign e Valid.
- **Safenet Authentication Client**: Para tokens SafeNet.
- **Administrador de Token GD**: Para tokens da marca GD.

> [!IMPORTANT]
> Após a instalação, reinicie o computador e verifique se o certificado aparece no "Administrador de Token".

## 3. Cadeia de Raízes ICP-Brasil 🌳
Para que o navegador confie nos certificados, instale a cadeia de raízes mais recente:
1. Acesse o site do [ITI - Repositório](https://www.iti.gov.br/repositorio/cadeias-de-certificados-da-icp-brasil).
2. Baixe e instale a **AC Raiz Brasileira v5, v10 e v11**.
3. Instale no repositório "Autoridades de Certificação Raiz Confiáveis".

## 4. Middleware de Navegador (Instalação Exigida) 🌐
Tokens e Cartões A3 **exigem** um programa de ponte. Se o link principal falhar, use a alternativa:

### Opção A: Lacuna Web PKI (Padrão)
- **Instalador Direto**: [https://get.webpki.com](https://get.webpki.com).
- **Chrome Store**: [Link Direto Web PKI](https://chromewebstore.google.com/detail/lacuna-web-pki/pogmhpgeicmblbepegdifneclbeebnkp).

### Opção B: BRy Assinatura Digital (Alternativa)
- **Chrome Store**: [Link Direto BRy Assinatura](https://chromewebstore.google.com/detail/assinatura-digital-no-nave/gbbjljjifbghdknkpgkibglnccikgngp).
- **Componente Desktop**: Baixe o "BRy Signer" no [Portal de Suporte BRy](https://atendimento.bry.com.br/).

> [!TIP]
> **Quer fugir de instalações?** Use o login **"Acessar via Celular / Nuvem (Vidaas/BirdID)"**. Ele não exige nenhuma extensão ou programa no computador! 📱☁️✅

## 5. Diagnóstico de Conectividade ⚡
Abra a página de login da AC ANGRY e verifique:
- [ ] O ícone do WebPKI na barra de tarefas está **verde**.
- [ ] Ao clicar em "Acessar com Certificado", seu nome aparece na lista.
- [ ] Se o token for removido, a lista deve limpar automaticamente.

---
**EM CASO DE ERROS, CONSULTE O SUPORTE TÉCNICO VEMAPI.** 🦁⚔️
