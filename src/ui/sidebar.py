import streamlit as st

def renderizar_sidebar(df_qa=None):
    with st.sidebar:
        st.image("https://www.cin.ufpe.br/~imprensa/marcacinpng/HMP", width=180)
        st.title("Configurações")
        
        st.markdown("### Contexto do Aluno")
        curso = st.selectbox(
            "Selecione o seu curso:",
            ["Ciência da Computação", "Engenharia da Computação", "Inteligência Artificial", "Sistemas de Informação"],
            index=0
        )
        
        opcoes_perfil = ["Único Perfil"] if curso == "Inteligência Artificial" else ["Perfil Novo / Vigente", "Perfil Antigo"]
        perfil = st.selectbox("Perfil Curricular:", opcoes_perfil, index=0)
        
        st.markdown("---")
        
        if df_qa is not None:
            st.markdown("### Suíte de Testes (Planilha QA)")
            lista_perguntas = ["-- Selecionar pergunta de teste --"] + df_qa["Pergunta do Aluno (Input)"].dropna().tolist()
            st.selectbox(
                "Perguntas da Planilha:", 
                lista_perguntas, 
                key="qa_select"
            )

        st.markdown("---")
        if st.button("Limpar Histórico do Chat", use_container_width=True):
            st.session_state.messages = []
            st.session_state.pergunta_pendente = None
            st.rerun()
            
    return curso, perfil