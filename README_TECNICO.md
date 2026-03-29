# AC ANGRY - Plataforma de Emissão Digital (Modernização 2026) 🛡️🔐⚡

Este repositório contém o core da plataforma **AC ANGRY**, um sistema de emissão de certificados digitais de nível profissional com foco total em segurança, auditabilidade e conformidade regulatória (ICP-Brasil/ABNT/LGPD).

## 🚀 Arquitetura e Fluxo de Trabalho

O sistema orquestra o atendimento de Agentes de Registro (AGR) através de um pipeline de validação rigoroso:

1.  **Fila de Protocolos**: Listagem centralizada de solicitações.
2.  **Assunção de Pedido (Cadeado)**: Mecanismo de concorrência que impede que dois AGRs atendam o mesmo cliente simultaneamente.
3.  **Videoconferência / Presencial**: Captura de evidências (foto/vídeo) gravadas localmente seguindo ISO/IEC 27001.
4.  **Validação Biométrica (PSBIO)**: Comparação facial automática (atualmente mockada para sucesso/pendência).
5.  **Emissão & Dossiê**: Geração do Dossiê Reservado (PF/PJ) e emissão do certificado via Cloud PKI.

---

## 🛠️ Lógicas Críticas (Engine Interna)

### 1. Sistema de Travamento (Locker Logic) & Governança
- **O que é**: O `isLocked` e `lockedBy` no `ProtocolViewer.tsx`, integrados ao **Termo de Assunção**.
- **Por que**: Garantir integridade dos dados e evitar conflitos.
- **Rito de Assunção**: O Agente (AGR) deve aceitar formalmente a responsabilidade pela integridade dos documentos antes de liberar as abas operacionais (Documentos, Vídeo, SAF).
- **Barreira de Colisão**: Se o protocolo estiver bloqueado por outro AGR (`lockedBy !== currentUser`), a interface será vedada com uma tela de aviso, impedindo qualquer acesso ou intervenção simultânea.
- **Regra**: Toda ação realizada com o cadeado fechado é carimbada com a identidade do AGR e timestamp na trilha de auditoria.

### 2. Dossiê Reservado & LGPD (ABNT NBR)
- **Conteúdo**: O dossiê deve conter Nome, CPF/CNPJ, Protocolo, Código de Emissão, Data/Hora e link de download.
- **Identificação**: Deve sempre citar a **AR VEMAPI (ANGRY)** e a **AC ANGRY**.
- **Segurança**: Dados sensíveis são armazenados em blocos de auditoria (`auditLogs`) e podem ser entregues ao cliente via e-mail ou retidos para conferência interna.

### 3. Emissão Condicional
- O sistema permite ao AGR decidir se entrega o **Código de Emissão** diretamente ao titular ou se o retém para emissão centralizada.
- **Atenção**: O e-mail automático só é enviado se a opção "Entregar ao Cliente" for selecionada.

---

## 📡 Integração de APIs (Frontend -> Backend)

As chamadas estão localizadas principalmente no `ProtocolViewer.tsx`:
- `/api/ac/sign`: Solicita a assinatura do CSR à AC.
- `/api/saf`: Consulta listas de antifraude e características físicas.
- `/api/protocols/details`: Recupera os metadados do protocolo.
- `/api/ac/persist-certificate`: Salva o certificado emitido e seus metadados de auditoria.

> [!IMPORTANT]
> Atualmente, os retornos são simulados para homologação de interface. Substitua os `fetch` de mocks pelas URL's de produção do Cloud PKI/Midas/Syngular quando as credenciais estiverem disponíveis.

---

## 🚫 O que NÃO deve acontecer (Anti-Patterns)

- **Emissão sem Biometria**: Nunca habilite o botão de emissão final se a biometria não for coletada e validada.
- **Troca de AGR sem Desbloqueio**: Um AGR não pode "roubar" um protocolo bloqueado por outro sem uma auditoria de sistema (Admin Reset).
- **Alteração de Dados sem Log**: Toda edição em campos sensíveis (E-mail, CPF, Nome) deve gerar uma entrada no `Histórico`.

---

## 🎨 Design System
- **Cores**: Emerald (Primário/Sucesso), Slate (Neutro/Segurança), Amber (Atenção/Bloqueio).
- **Efeito**: Glassmorphism (backdrop-blur-xl) em modais e sidebars.
- **Ícones**: Lucide Icons (sempre importar antes de usar).

---
**Desenvolvido por Antigravity (Google DeepMind) para VEMAPI SITE.** ⚔️🚀
