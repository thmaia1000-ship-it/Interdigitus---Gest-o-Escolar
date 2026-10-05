import re
import json
import os
import sys

CANONICAL_COLUMNS = {
    'tb_cursos': ['ID_curso', 'nome_curso'],
    'tb_cursoLivre': ['ID_curso', 'nome_curso', 'carga_horaria', 'conteudo'],
    'tb_materias': ['ID_materia', 'materia', 'idcurso'],
    'tb_turmas': ['ID_turma', 'turma', 'sala', 'turno', 'status_turma', 'idcurso'],
    'tb_alunos': [
        'ID_aluno', 'nome_aluno', 'email', 'cpf', 'rg', 'orgao_emissor', 'data_emissao', 'datanasc',
        'UF', 'cidade', 'nacionalidade', 'rua', 'bairro', 'cep', 'numero', 'telefone', 'mae',
        'idcurso', 'dias_aula', 'turno', 'ensino_medio', 'ano_conclusao', 'observacao', 'sistec',
        'livro_ata', 'registro', 'pagina', 'codigo', 'inicio_curso', 'fim_curso', 'data_conclusao_curso',
        'carga_horaria', 'status', 'data_gerada', 'usuario'
    ],
    'tb_responsavel_financeiro': ['ID_responsavel_financeiro', 'nome', 'CPF', 'RG', 'idaluno'],
    'tb_notas': ['ID_nota', 'aluno', 'materia', 'nota1', 'nota2', 'media', 'situacao', 'idaluno', 'idcurso', 'idmateria', 'data_gerada', 'usuario'],
    'tb_mensalidades': ['ID_mensalidade', 'entrada', 'n_parcelas', 'valor_total', 'saldo_devedor', 'valor_parcela', 'data_pagar', 'data_inicio', 'data_fim', 'parcelas_pagas', 'data_gerada', 'usuario', 'horario', 'curso', 'idaluno'],
    'tb_caixa': ['ID_caixa', 'valor_total', 'forma', 'tipo_movimentacao', 'descricao', 'usuario', 'data', 'horario', 'nome', 'curso', 'idaluno', 'mensalidades_pagas', 'idmensalidade'],
    'log_caixa': ['ID_log_caixa', 'valor_total', 'forma', 'tipo_movimentacao', 'descricao', 'usuario', 'data', 'horario', 'nome', 'curso', 'idaluno', 'mensalidades_pagas', 'idmensalidade', 'justificativa', 'tipo', 'data_log', 'usuario_log'],
    'tb_despesas': ['ID_despesa', 'tipo', 'descricao', 'valor', 'data', 'observacoes', 'usuario', 'data_gerada'],
    'tb_professores': ['ID_professor', 'nome_professor', 'telefone'],
    'tb_pagamentos': ['ID_pagamento', 'valor_total', 'valor_pendente', 'pagamento', 'professor', 'turma', 'materia', 'carga_horaria', 'idprofessor', 'idmateria', 'idcurso', 'descricao', 'data_inicio', 'data_fim', 'data_pagou', 'usuario', 'data_gerada', 'tipo'],
    'tb_pagamentos_parciais': ['ID_pagamento_parcial', 'valor', 'idpagamento', 'idprofessor', 'usuario', 'data_gerada', 'tipo'],
    'tb_produtos': ['ID_produto', 'produto', 'descricao', 'valor_custo', 'valor_venda', 'estoque', 'data_gerada', 'usuario'],
    'tb_vendas': ['ID_venda', 'produto', 'valor_total', 'quantidade', 'observacao', 'nome', 'idcliente', 'usuario', 'data_gerada', 'codigovenda', 'idproduto'],
    'tb_usuarios': ['ID_usuario', 'nome_usuario', 'username', 'senha', 'nivel_usuario'],
    'tb_contas': ['ID_conta', 'cpf', 'senha', 'idaluno'],
}

def clean_val(val_str):
    s = val_str.strip()
    if not s or s.upper() == 'NULL':
        return None
    if (s.startswith("'") and s.endswith("'")) or (s.startswith('"') and s.endswith('"')):
        inner = s[1:-1]
        # unescape
        inner = inner.replace("\\'", "'").replace('\\"', '"').replace('\\\\', '\\').replace('\\n', '\n').replace('\\r', '\r')
        return inner
    # numeric check
    try:
        if '.' in s:
            return float(s)
        return int(s)
    except ValueError:
        return s

def parse_tuple(t_str):
    vals = []
    curr = []
    in_quote = False
    quote_char = ''
    i = 0
    n = len(t_str)
    while i < n:
        ch = t_str[i]
        prev_ch = t_str[i - 1] if i > 0 else ''
        
        if (ch == "'" or ch == '"') and prev_ch != '\\':
            if not in_quote:
                in_quote = True
                quote_char = ch
                curr.append(ch)
            elif quote_char == ch:
                in_quote = False
                curr.append(ch)
            else:
                curr.append(ch)
        elif ch == ',' and not in_quote:
            vals.append(clean_val(''.join(curr)))
            curr = []
        else:
            curr.append(ch)
        i += 1
    if curr:
        vals.append(clean_val(''.join(curr)))
    return vals

def parse_tuples_from_block(block):
    tuples = []
    curr = []
    in_tuple = False
    in_quote = False
    quote_char = ''
    i = 0
    n = len(block)
    while i < n:
        ch = block[i]
        prev_ch = block[i - 1] if i > 0 else ''
        if (ch == "'" or ch == '"') and prev_ch != '\\':
            if not in_quote:
                in_quote = True
                quote_char = ch
            elif quote_char == ch:
                in_quote = False
        if not in_quote:
            if ch == '(' and not in_tuple:
                in_tuple = True
                curr = []
                i += 1
                continue
            elif ch == ')' and in_tuple:
                in_tuple = False
                tuples.append(''.join(curr))
                curr = []
                i += 1
                continue
        if in_tuple:
            curr.append(ch)
        i += 1
    return tuples

def run_import(sql_path, json_dest):
    print(f"Lendo {sql_path}...")
    db_data = {k: [] for k in CANONICAL_COLUMNS.keys()}
    
    with open(sql_path, 'r', encoding='latin1') as f:
        content = f.read()
    
    print(f"Tamanho do arquivo: {len(content) / 1024 / 1024:.2f} MB")
    
    # Process by INSERT statements
    insert_pattern = re.compile(
        r'INSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?\s*(?:\(([^)]+)\))?\s*VALUES\s*([\s\S]+?);',
        re.IGNORECASE
    )
    
    match_count = 0
    total_records = 0
    
    for match in insert_pattern.finditer(content):
        match_count += 1
        raw_tbl = match.group(1)
        tbl = raw_tbl
        if tbl.lower() == 'tb_cursolivre':
            tbl = 'tb_cursoLivre'
        
        if tbl not in db_data:
            continue
        
        cols_raw = match.group(2)
        values_raw = match.group(3)
        
        if cols_raw:
            columns = [c.strip('`"\' ') for c in cols_raw.split(',')]
        else:
            columns = CANONICAL_COLUMNS.get(tbl, [])
            
        tuple_strs = parse_tuples_from_block(values_raw)
        
        for t_str in tuple_strs:
            values = parse_tuple(t_str)
            if not values:
                continue
            rec = {}
            for idx, c in enumerate(columns):
                if idx < len(values):
                    rec[c] = values[idx]
                else:
                    rec[c] = None
            db_data[tbl].append(rec)
            total_records += 1
    
    print(f"Total de INSERTs processados: {match_count}")
    print(f"Total de registros importados: {total_records}")
    print("\nResumo das tabelas:")
    for k, v in db_data.items():
        print(f"  - {k}: {len(v)} registros")
        
    print(f"\nSalvando em {json_dest}...")
    with open(json_dest, 'w', encoding='utf-8') as out:
        json.dump(db_data, out, ensure_ascii=False, indent=2)
    print("Concluído com sucesso!")

if __name__ == '__main__':
    sql_path = sys.argv[1] if len(sys.argv) > 1 else '/Users/thiagomaia/Downloads/dbinterdigitus.sql'
    json_dest = sys.argv[2] if len(sys.argv) > 2 else '/Users/thiagomaia/Documents/antigravity/lively-bell/data_interdigitus.json'
    run_import(sql_path, json_dest)
