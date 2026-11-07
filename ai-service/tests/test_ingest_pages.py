"""Regressões de ingestão; não integram nem substituem a V1/V2 histórica."""
import unittest
from unittest.mock import MagicMock, patch

from src.ingest import indexar_documento


class IngestPagesTest(unittest.TestCase):
    def test_pagina_sem_texto_e_informada_sem_renumerar_citacoes(self):
        reader = MagicMock()
        reader.pages = [MagicMock(), MagicMock(), MagicMock()]
        for page, text in zip(reader.pages, ['Primeira página.', None, 'Terceira página.']):
            page.extract_text.return_value = text
        with patch('src.ingest.PdfReader', return_value=reader), patch(
            'src.ingest.sincronizar_documento', return_value=[]
        ) as sync:
            result = indexar_documento('exemplo.pdf', collection=MagicMock())
        self.assertEqual(result['paginas_sem_texto'], [2])
        self.assertEqual([m['pagina'] for m in sync.call_args.kwargs['metadatas']], [1, 3])
        self.assertTrue(result['sucesso'])

    def test_pdf_inteiramente_imagem_nao_substitui_indice_existente(self):
        reader = MagicMock()
        reader.pages = [MagicMock()]
        reader.pages[0].extract_text.return_value = ''
        with patch('src.ingest.PdfReader', return_value=reader), patch(
            'src.ingest.sincronizar_documento'
        ) as sync:
            result = indexar_documento('imagem.pdf', collection=MagicMock())
        self.assertFalse(result['sucesso'])
        self.assertEqual(result['paginas_sem_texto'], [1])
        sync.assert_not_called()
