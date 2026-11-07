import streamlit as st
import pandas as pd
from src.ui.sidebar import renderizar_sidebar
from src.ui.api_client import enviar_pergunta

# -----------------------------------------------------------------------------
# Configuração da Página
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Assistente - SecGrad CIn",
    page_icon="cin_logo.png",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# Função para Carregar a Planilha de Testes QA (Apenas para atalho de digitação)
# -----------------------------------------------------------------------------
@st.cache_data
def carregar_planilha_qa():
    try:
        df = pd.read_excel('Planilha_QA_Benchmark_Sprint1.xlsx', sheet_name='Benchmark QA - Sprint 1', skiprows=3)
        return df
    except Exception:
        return None

df_qa = carregar_planilha_qa()

# -----------------------------------------------------------------------------
# Estilização CSS Personalizada
# -----------------------------------------------------------------------------
st.markdown("""
    <style>
    .main-header {
        font-size: 2.2rem;
        color: #000000;
        font-weight: bold;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.1rem;
        color: #595959;
        margin-bottom: 1.5rem;
    }
    .disclaimer-box {
        background-color: #f8f9fa;
        border-left: 4px solid #E31B23;
        padding: 0.8rem;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #495057;
        margin-bottom: 1rem;
    }
    </style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Modularização: Renderiza Sidebar e obtém opções do aluno
# -----------------------------------------------------------------------------
curso, perfil = renderizar_sidebar(df_qa)

# -----------------------------------------------------------------------------
# Cabeçalho Principal
# -----------------------------------------------------------------------------
st.markdown('<div class="main-header">🎓 Assistente - SecGrad CIn</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Tire dúvidas sobre estágio, dispensas, 2ª chamada e procedimentos acadêmicos.</div>', unsafe_allow_html=True)

st.markdown("""
    <div class="disclaimer-box">
        <strong>⚠️ Aviso importante:</strong> Este assistente consulta documentos oficiais e resoluções da SecGrad para gerar respostas baseadas em evidências. Para decisões administrativas formais, consulte sempre a documentação oficial ou a secretaria.
    </div>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Inicialização do Estado da Sessão
# -----------------------------------------------------------------------------
mensagem_inicial = f"Olá! Sou o assistente virtual da SecGrad CIn. Estou configurado para o curso de **{curso}** ({perfil}). Como posso ajudar hoje?"

if "messages" not in st.session_state or len(st.session_state.messages) == 0:
    st.session_state.messages = [{"role": "assistant", "content": mensagem_inicial, "sources": []}]
else:
    if st.session_state.messages[0]["role"] == "assistant":
        st.session_state.messages[0]["content"] = mensagem_inicial

# -----------------------------------------------------------------------------
# Exibição do Histórico de Mensagens
# -----------------------------------------------------------------------------
for msg in st.session_state.messages:
    avatar = "cin_logo.png" if msg["role"] == "assistant" else None
    with st.chat_message(msg["role"], avatar=avatar):
        st.markdown(msg["content"])
        if "sources" in msg and msg["sources"]:
            with st.expander("📄 Fontes e Trechos Utilizados"):
                for src in msg["sources"]:
                    doc_nome = str(src.get('documento', 'Documento Não Identificado')).split(' (pág')[0]
                    trecho_txt = src.get('trecho', '')
                    st.markdown(f"- **{doc_nome}**")
                    if trecho_txt:
                        st.caption(f'"{trecho_txt}"')

# -----------------------------------------------------------------------------
# Processamento de Entrada (Caixa de Texto ou Seleção via Callback)
# -----------------------------------------------------------------------------
prompt_input = st.chat_input("Digite a sua dúvida (ex: Como solicito dispensa de disciplina?)")
prompt = prompt_input or st.session_state.get("pergunta_pendente")

if prompt:
    st.session_state.pergunta_pendente = None

    # 1. Adiciona a mensagem do usuário no histórico
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # 2. Chamada Modularizada ao Backend Real (Sem demo silenciosa)
    with st.chat_message("assistant", avatar="cin_logo.png"):
        message_placeholder = st.empty()
        with st.spinner("A consultar resoluções e documentos da SecGrad..."):
            
            # Chama a função do src/ui/api_client.py
            resultado = enviar_pergunta(prompt, curso, perfil)
            
            if resultado.get("sucesso"):
                resposta_texto = resultado.get("resposta")
                fontes = resultado.get("fontes", [])
            else:
                # Exibe mensagem de erro técnico visível (sem mascarar com a planilha local)
                resposta_texto = (
                    f"⚠️ **Não foi possível obter a resposta do servidor.**\n\n"
                    f"*Erro retornado:* `{resultado.get('erro')}`"
                )
                fontes = []

            # Renderiza resposta na tela
            message_placeholder.markdown(resposta_texto)
            if fontes:
                with st.expander("📄 Fontes e Trechos Utilizados"):
                    for src in fontes:
                        doc_nome = str(src.get('documento', 'Documento Oficial')).split(' (pág')[0]
                        trecho_txt = src.get('trecho') or src.get('excerpt', '')
                        st.markdown(f"- **{doc_nome}**")
                        if trecho_txt:
                            st.caption(f'"{trecho_txt}"')

    # 3. Guarda a resposta no histórico da sessão
    st.session_state.messages.append({"role": "assistant", "content": resposta_texto, "sources": fontes})
    st.rerun()