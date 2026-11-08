# 🎓 Chatbot SecGrad — Assistente de Orientação Acadêmica

> **Estado atual:** protótipo Streamlit, orquestrador NestJS e serviço FastAPI/ChromaDB. A rota pública é `POST /api/v1/conversa`. A geração real por LLM ainda não está implementada: o modo `mock` retorna somente um aviso explícito. A UI atualmente prioriza o contexto recuperado e, por isso, não comprova a exibição de uma resposta gerada. Validação da ingestão e pendências atuais: [PPCs e integração](docs/testes/validacao-ppcs/README.md).

### Execução corrigida do serviço de IA

Fechamento do backend em 08/11: `AI_SERVICE_URL` explícita é obrigatória e as seis
regressões de URL foram corrigidas. Comandos PowerShell, resultados correntes e
limites em [fechamento do backend](docs/testes/fechamento-backend-20261108/README.md).
Relatórios mais recentes e pendências acadêmicas: [guia dos PDFs](docs/qualidade/ENTREGA-RELATORIOS.md).

Na raiz, instale `python -m pip install -r ai-service/requirements-dev.txt`; entre em `ai-service`, execute `python -m src.validate_catalog`, `python -m src.ingest_batch` e `python -m uvicorn main:app --reload --port 8000`. Swagger: http://localhost:8000/docs. Para testes: `python -m unittest discover -s tests -v`. A dependência `httpx` é usada nos testes HTTP.

O catálogo canônico é `data/raw/metadata.json`; `ai-service/data/` é legado. Contagens antigas precisam ser medidas novamente após atualizar os documentos. A geração simulada requer `SECGRAD_GENERATION_MODE=mock` e retorna aviso explícito. Sem configuração retorna 503 para contexto não vazio; contexto vazio retorna `resposta: null`.

Assistente conversacional baseado em **RAG (Retrieval-Augmented Generation)**, desenvolvido para responder a dúvidas frequentes sobre procedimentos acadêmicos, normas e requerimentos da Secretaria de Graduação (SecGrad) do Centro de Informática da Universidade Federal de Pernambuco (**CIn-UFPE**).

O protótipo separa interface, orquestração e recuperação vetorial. React, autenticação Keycloak/LDAP e orquestração Docker Compose/Swarm são requisitos gerais ainda pendentes de comprovação nesta versão.

---

## 🎯 Escopo do MVP — Sprint 2

O Produto Mínimo Viável (MVP) contempla as seguintes funcionalidades:

- **Requerimentos Acadêmicos:** orientações sobre dispensa de disciplinas, segunda chamada de prova, revisão de nota e requerimentos gerais da secretaria.

- **Normas de Estágio:** consulta às regras de estágio supervisionado por curso (Ciência da Computação, Engenharia da Computação e Sistemas de Informação) e perfis curriculares.

- **Respostas Auditáveis com Citação:** indicação obrigatória do documento oficial utilizado como referência e do número da página correspondente.

- **Tratamento de Incerteza (Fallback Estruturado):** recusa de respostas sem respaldo documental e geração de um rascunho de e-mail formal para a SecGrad quando não houver informações suficientes na base de conhecimento.

> **Princípio do sistema:** priorizar a confiabilidade das informações acadêmicas, garantindo rastreabilidade das fontes e reduzindo a ocorrência de respostas não fundamentadas.

---

## 🏛️ Arquitetura do Sistema

A solução é organizada em serviços desacoplados, com responsabilidades específicas:

| Serviço | Tecnologias | Responsabilidades |
|---------|-------------|-------------------|
| `app.py`, `src/ui/` | Streamlit, requests | Interface atual; consome o NestJS |
| `backend/` | NestJS 12, Node.js 24 | Contrato HTTP, busca/geração, fallback e rascunho de e-mail |
| `ai-service/` | Python, FastAPI, LangChain, ChromaDB | Ingestão documental, geração de embeddings e recuperação vetorial |
| Planejado | React, Keycloak/LDAP, Docker Compose/Swarm | Stack geral solicitada; não apresentar como pronta |

### 🔍 Funcionamento do RAG

O mecanismo de recuperação aumentada por geração segue o fluxo conceitual:

1. **Ingestão documental:** processamento dos documentos normativos fornecidos pela SecGrad.
2. **Fragmentação (Chunking):** divisão dos documentos em trechos menores, preservando metadados relevantes.
3. **Vetorização (Embeddings):** representação semântica dos trechos para permitir buscas por similaridade.
4. **Armazenamento vetorial:** indexação dos documentos no ChromaDB.
5. **Recuperação semântica:** identificação dos trechos mais relevantes para a pergunta do usuário.
6. **Geração fundamentada:** construção de respostas com base nos documentos recuperados, acompanhadas das respectivas referências.
7. **Fallback:** quando não houver suporte documental suficiente, o sistema evita gerar uma resposta não fundamentada e oferece um rascunho de e-mail para a secretaria.

---

## 👥 Equipe e Responsabilidades

| Integrante | Área | Responsabilidades |
|------------|------|-------------------|
| **Rafael Ramos** | Inteligência Artificial & RAG | Microsserviço de IA (`ai-service`), pipeline RAG, chunking, embeddings e ChromaDB |
| **Eric** | Front-end & QA | Interface de usuário, benchmarks de qualidade e registros de arquitetura |
| **Ricardo** | Engenharia de Conhecimento | Curadoria documental, organização das normas da SecGrad e catálogo de metadados (`metadata.json`) |
| **Victor** | Back-end & Autenticação | Serviço NestJS (`backend`), integração com Keycloak e orquestração de rotas |

---

## 🛠️ Stack Tecnológica

A arquitetura do projeto utiliza as seguintes tecnologias:

| Camada | Tecnologias |
|--------|-------------|
| **Front-end obrigatório (pendente)** | React |
| **Protótipo do MVP** | Streamlit |
| **Back-end atual** | NestJS 12, Node.js 24 |
| **Autenticação obrigatória (pendente)** | Keycloak, LDAP |
| **Microsserviço de IA** | Python 3.11+, FastAPI, Uvicorn |
| **Busca Vetorial & RAG** | ChromaDB, PyPDF, LangChain Text Splitters |
| **Geração atual** | Desabilitada por padrão; simulação explícita por configuração |
| **Infraestrutura obrigatória (pendente)** | Docker Compose ou Swarm |

---

## 🚀 Como Executar o Projeto Localmente

Siga as etapas abaixo para configurar o ambiente de desenvolvimento e executar o MVP.

### 📋 Pré-requisitos

Antes de iniciar, certifique-se de possuir:

- **Python 3.11 ou superior**
- **Node.js 24 / npm** (conforme `backend/package.json`)
- **Git** instalado
- **pip** (gerenciador de pacotes do Python)

### 1. Clonar o Repositório

Clone o repositório e acesse o diretório do projeto:

```bash
git clone https://github.com/rafael-ramos-c/cin-ds-chatbot.git
cd cin-ds-chatbot
```

As instruções completas dos três terminais e a auditoria dos PPCs estão em
[Manual do serviço de IA](docs/manual_desenvolvedor_ia.md).
Os requisitos acadêmicos, relatórios históricos V1/V2 e refatorações estão em
[Consolidação da Sprint 3](docs/testes/CONSOLIDACAO-SPRINT3.md).
