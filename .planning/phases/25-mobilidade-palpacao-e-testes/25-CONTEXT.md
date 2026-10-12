# Phase 25: Mobilidade, palpação e testes - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning
**Source:** Decisões do profissional na invocação de `/gsd-plan-phase` (discuss-phase pulado — intenção explícita e seis imagens de referência)

<domain>
## Phase Boundary

Mudar só o bloco B (Mobilidade) e o bloco E (Palpação / testes / função) da página 04 · Avaliação e plano. A mobilidade deixa de ser linha de texto livre e passa a ser região → movimento. A palpação deixa de ser um texto e passa a ser achado registrado. Os testes clínicos deixam de ser um texto e passam a ser lista pesquisável.

Não reabrir os blocos A, C, D, F e G da página 04. Não reabrir as páginas 01, 02 e 03. O bloco C (Força) continua a tabela que já existe. Não editar `patient-ai-summary`. Sem SQL e sem `supabase db push`. Sem pacote npm novo.

</domain>

<decisions>
## Implementation Decisions

### Mobilidade por região
- O bloco B organiza por região e, dentro dela, pelos movimentos dessa região. Não é uma lista solta de movimentos digitados.
- O profissional escolhe uma região. Os movimentos dessa região aparecem com um checkbox à esquerda. Só o movimento marcado abre a linha de medida. A tela não lista os campos de todos os movimentos de uma vez.
- Dá para acrescentar outra região (`Adicionar outra região`). Cada região escolhida tem o próprio bloco.
- Catálogo de regiões e movimentos, nesta ordem, fechado. Não inventar movimento fora da lista.

### Tipo e comparação
- No topo de cada região, não em três checkboxes globais do bloco:
  - Tipo de avaliação: Ativo, Passivo, Ambos (uma escolha).
  - Comparação: Bilateral, Unilateral (uma escolha).
- Os checkboxes atuais Movimento ativo, Movimento passivo e Comparação bilateral saem. Eles contradizem a escolha por região.
- Bilateral e unilateral não escondem direito nem esquerdo. Os dois lados continuam no mesmo campo.

### Direito, esquerdo e valor
- Direito e esquerdo ficam no mesmo campo do movimento, como D e E. Não são dois formulários.
- O valor não é só número. Aceita graus (exemplo `110°`) ou um destes rótulos: Completo, Limitado, Não avaliado. Grau não é obrigatório.
- A leitura compacta junta os lados. Exemplo: `Flexão  D 110°  E 115°`. Com dor: `Dor E 90°`. Frase de exemplo travada: `Flexão de quadril: ADM 115° → dor inicia aos 90°`.

### Dor do movimento
- A dor não é um texto único nem um checkbox que só diz que doeu.
- No mesmo campo do movimento há D e E. Clicar no lado abre um painel pequeno daquele lado:
  - Início da dor (graus)
  - Dor máxima (`/10`)
  - Observação
- Cada lado tem o próprio painel. Marcar D não preenche E.

### Palpação
- O texto livre Palpação relevante sai. No lugar, um formulário de um achado e, abaixo, a lista dos achados já registrados (editar e remover).
- Campos do achado, nesta ordem: Região, Local/estrutura, Lado, Achado, Dor (0–10), Observação.
- Primeiro a região. Local/estrutura mostra só as opções daquela região, com busca, e Outro para digitar. Instrução visível embaixo do campo: `Primeiro selecione a região. Local/estrutura mostra só as opções dessa região, com busca e Outro para digitar.`
- Lado: Direito, Esquerdo, Bilateral, Central, Não se aplica.
- Achado (uma escolha, chips): Sem alteração, Doloroso, Edema, Tensão aumentada, Crepitação, Alteração de temperatura, Outro.
- A estrutura visual segue a imagem de referência (formulário em cima, tabela de achados embaixo, botão para adicionar outro). As cores são as do Fluxo, não o tema escuro da imagem.
- Teste funcional / medida de desempenho e Resultado inicial permanecem como estão. Não viram catálogo nesta fase.

### Testes clínicos
- O texto livre Testes clínicos selecionados sai. O campo Teste é uma lista pesquisável. Dá para marcar vários. Outro fica sempre por último em cada região.
- Não é grade de cards. A imagem de coluna vale como referência de agrupamento e de busca, não como layout de cartão.
- Além do catálogo escrito, entram os testes da imagem de coluna que o texto não repetiu: Lasègue cruzado, Valsalva, Schober, Compressão axial e Distração (sinais não orgânicos / Waddell). Distração de Waddell não é a distração cervical.
- Não inventar aba Fraturas nem testes de fratura. A imagem mostra a aba sem lista.

### Leitura e export
- A leitura da ficha, o catálogo de export e o PDF do bloco B e do bloco E mostram a mesma região, o mesmo movimento com D/E e dor, o mesmo achado e os mesmos testes. Não continuam imprimindo só o texto livre antigo.
- Ficha antiga não perde o que já foi digitado e não copia um valor para todos os movimentos. O que não der para atribuir a um item do catálogo fica como registro anterior.

### Claude's Discretion
- Como gravar no jsonb e como o preprocess reconhece uma linha antiga cujo movimento coincide com o catálogo.
- Se o painel de dor abre inline ou num popover, desde que caiba no campo e mostre início, dor máxima e observação daquele lado.
- O texto curto de resultado de um teste marcado, desde que a lista pesquisável e o Outro existam. Não recriar o parágrafo único de testes.
- Espaçamento e tipografia, desde que sigam o contrato visual da fase quando ele existir.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Ficha atual
- `src/components/patients/evaluation/EvaluationPage04.tsx` — bloco B (`MobilityTable` + checkboxes ativo/passivo/bilateral) e bloco E (cinco textos)
- `src/schemas/evaluationFicha.schema.ts` — `avaliacaoPlano.mobilidade` e `avaliacaoPlano.palpacaoTestes`
- `src/components/patients/evaluation/EvaluationFichaDetail.tsx` — folhas de palpação e testes
- `src/lib/pdfFieldCatalog.ts` — preview de Mobilidade e de Palpação / testes / função
- `src/services/patientAiPdf.service.ts` — frames B e E da página 04

### Fase anterior no mesmo jsonb
- `.planning/phases/24-atividades-avaliacao-capacidade-e-unidade/24-CONTEXT.md` — preprocess de ficha antiga, sem SQL, sem pacote novo, leitura e PDF na mesma frase

### Imagens de referência
- `.cursor/projects/home-artur-rea-de-trabalho-ProjetoFisioNicolle/assets/image-fe6b8d9a-a91a-455a-a233-88ca68406987.png` — região, tabela D/E, dor que abre início / dor máxima / observação
- `.cursor/projects/home-artur-rea-de-trabalho-ProjetoFisioNicolle/assets/image-ba6dcde8-64d4-468e-b693-bb540fc3489c.png` — linha compacta e valor que aceita grau ou Completo / Limitado / Não avaliado
- `.cursor/projects/home-artur-rea-de-trabalho-ProjetoFisioNicolle/assets/image-7ea732c2-bfde-475f-8972-1a2440b95378.png` — checkbox do movimento, tipo de avaliação, comparação
- `.cursor/projects/home-artur-rea-de-trabalho-ProjetoFisioNicolle/assets/image-db67422c-c17d-4950-8391-3db99351372d.png` — só o movimento marcado abre a linha
- `.cursor/projects/home-artur-rea-de-trabalho-ProjetoFisioNicolle/assets/image-2bcddea8-2b78-43db-a5a5-4b75e8f54829.png` — formulário de palpação e tabela de achados
- `.cursor/projects/home-artur-rea-de-trabalho-ProjetoFisioNicolle/assets/image-28bf11f4-52bb-4976-a75a-63be1bb4bae2.jpg` — testes da coluna (busca e agrupamento; não copiar o cartão)

</canonical_refs>

<specifics>
## Specific Ideas

### Catálogo de mobilidade

- Cervical: Flexão cervical, Extensão cervical, Inclinação lateral direita, Inclinação lateral esquerda, Rotação direita, Rotação esquerda
- Tronco / coluna: Flexão de tronco, Extensão de tronco / extensão lombar, Inclinação lateral direita, Inclinação lateral esquerda, Rotação direita, Rotação esquerda
- Escápula: Elevação, Depressão, Protração, Retração, Rotação superior, Rotação inferior
- Ombro: Flexão, Extensão, Abdução, Adução, Rotação interna, Rotação externa, Abdução horizontal, Adução horizontal
- Cotovelo: Flexão, Extensão
- Antebraço: Pronação, Supinação
- Punho: Flexão, Extensão, Desvio radial, Desvio ulnar
- Mão / dedos: Flexão dos dedos, Extensão dos dedos, Abdução dos dedos, Adução dos dedos, Preensão palmar, Pinça lateral, Pinça polpa-polpa, Pinça trípode, Oposição do polegar, Abdução do polegar, Adução do polegar, Flexão do polegar, Extensão do polegar
- Quadril: Flexão, Extensão, Abdução, Adução, Rotação interna, Rotação externa
- Joelho: Flexão, Extensão
- Tornozelo: Dorsiflexão, Flexão plantar, Inversão, Eversão
- Pé / dedos: Flexão do hálux, Extensão do hálux, Flexão dos dedos, Extensão dos dedos, Abdução dos dedos, Adução dos dedos
- ATM / mandíbula: Elevação mandibular, Depressão mandibular, Protrusão, Retrusão, Desvio lateral direito, Desvio lateral esquerdo

### Regiões da palpação

ATM / face, Cervical, Ombro / cintura escapular, Braço, Cotovelo, Antebraço, Punho, Mão, Torácica, Tórax / costelas, Lombar, Sacro / região sacroilíaca, Pelve, Quadril, Coxa, Joelho, Perna, Tornozelo, Pé, Outra.

### Local / estrutura por região

- ATM / face: ATM, masseter, temporal, pterigoideo medial, pterigoideo lateral, arco zigomático, mandíbula, região pré-auricular, outro
- Cervical: processos espinhosos, processos transversos, musculatura paravertebral, suboccipitais, trapézio superior, levantador da escápula, esternocleidomastoideo, escalenos, outro
- Ombro / cintura escapular: articulação acromioclavicular, articulação esternoclavicular, acrômio, processo coracoide, tubérculo maior, sulco bicipital, tendão da cabeça longa do bíceps, supraespinal, infraespinal, redondo menor, subescapular, deltoide, trapézio, romboides, borda medial da escápula, outro
- Braço: bíceps braquial, tríceps braquial, braquial, deltoide distal, úmero, outro
- Cotovelo: epicôndilo lateral, epicôndilo medial, olécrano, cabeça do rádio, tendão extensor comum, tendão flexor comum, tendão distal do bíceps, tendão do tríceps, nervo ulnar, outro
- Antebraço: grupo flexor-pronador, grupo extensor-supinador, braquiorradial, pronador redondo, supinador, rádio, ulna, outro
- Punho: estiloide radial, estiloide ulnar, TFCC, túnel do carpo, tendões flexores, tendões extensores, escafoide, semilunar, outro
- Mão: metacarpos, articulações MCP, PIP, DIP, eminência tenar, eminência hipotênar, tendões flexores, tendões extensores, polias digitais, polegar, articulação trapézio-metacarpal, outro
- Torácica: processos espinhosos, processos transversos, musculatura paravertebral, articulações costovertebrais, costotransversas, trapézio médio, trapézio inferior, romboides, outro
- Tórax / costelas: costelas, junções costocondrais, esterno, musculatura intercostal, peitoral maior, peitoral menor, outro
- Lombar: processos espinhosos, processos transversos, musculatura paravertebral, quadrado lombar, multífidos, crista ilíaca, outro
- Sacro / região sacroilíaca: sacro, articulação sacroilíaca, EIPS, ligamentos sacroilíacos posteriores, região sacrotuberosa, outro
- Pelve: EIAS, EIPS, crista ilíaca, sínfise púbica, tuberosidade isquiática, adutores proximais, parede abdominal inferior, outro
- Quadril: trocânter maior, trocânter menor, região anterior do quadril, região glútea, glúteo médio, glúteo mínimo, glúteo máximo, TFL, trato iliotibial proximal, tendão do iliopsoas, tendões glúteos, região piriforme, outro
- Coxa: quadríceps, reto femoral, vasto medial, vasto lateral, vasto intermédio, isquiotibiais, bíceps femoral, semitendíneo, semimembranáceo, adutores, sartório, trato iliotibial, outro
- Joelho: patela, tendão patelar, tendão do quadríceps, polo inferior da patela, interlinha medial, interlinha lateral, LCM, LCL, tuberosidade da tíbia, pata de ganso, cabeça da fíbula, trato iliotibial distal, região poplítea, outro
- Perna: tibial anterior, fibulares, gastrocnêmio medial, gastrocnêmio lateral, sóleo, tibial posterior, tíbia, fíbula, outro
- Tornozelo: maléolo medial, maléolo lateral, ligamento talofibular anterior, ligamento calcaneofibular, ligamento talofibular posterior, ligamento deltoide, sindesmose, tendão de Aquiles, tendões fibulares, tibial posterior, tibial anterior, outro
- Pé: calcâneo, fáscia plantar, tuberosidade do navicular, base do 5º metatarso, metatarsos, cabeças dos metatarsos, articulações metatarsofalângicas, hálux, tendões extensores, tendões flexores, região dos sesamoides, arco medial, arco lateral, outro
- Outra: outro (digitação manual)

### Testes por região

Outro é o último item de cada grupo.

- ATM / face: Abertura ativa com observação, Desvio mandibular, Deflexão mandibular, Teste de carga da ATM, Teste de compressão, Teste de distração, Teste de protrusão, Teste de lateralidade, Outro
- Cervical: Spurling, Distração cervical, ULTT / neurodinâmico, Flexion-Rotation Test, Sharp-Purser, Alar Ligament Test, Cervical Rotation Lateral Flexion Test, Outro
- Torácica: Spring test, PA central, PA unilateral, Rotação torácica, Rib spring test, Outro
- Lombar: SLR / Lasègue, Lasègue cruzado (contralateral), Slump, Valsalva, Schober, Compressão axial, Distração (sinais não orgânicos / Waddell), Femoral Nerve Stretch, Quadrante lombar, Prone Instability Test, PA central, PA unilateral, Outro
- Ombro / cintura escapular: Hawkins-Kennedy, Neer, Jobe / Empty Can, Full Can, External Rotation Lag Sign, Lift-off, Belly Press, Speed, Yergason, O’Brien, Apprehension, Relocation, Sulcus Sign, Cross-body Adduction, Outro
- Cotovelo: Cozen, Mill, Maudsley, Valgo stress test, Varo stress test, Moving Valgus Stress Test, Tinel cubital, Hook Test, Outro
- Punho / mão: Phalen, Tinel, Finkelstein, Eichhoff, Watson / Scaphoid Shift, Grind Test do polegar, TFCC Load Test, Piano Key Test, Outro
- Quadril: FADIR, FABER, Scour, Log Roll, Thomas, Ober, Trendelenburg, Resisted External Derotation Test, Outro
- Pelve / sacroilíaca: Distraction, Compression, Thigh Thrust, Sacral Thrust, Gaenslen, Active Straight Leg Raise, Outro
- Joelho: Lachman, Gaveta anterior, Gaveta posterior, Pivot Shift, Valgo stress test, Varo stress test, McMurray, Thessaly, Apley, Patellar Apprehension, Patellar Grind, Outro
- Tornozelo / pé: Gaveta anterior, Talar Tilt, Thompson, Squeeze Test, External Rotation Test, Windlass, Navicular Drop, Matles Test, Outro
- Neurológico: SLR, Slump, ULTT mediano, ULTT radial, ULTT ulnar, Femoral Nerve Stretch, Hoffmann, Babinski, Clônus, Reflexos, Sensibilidade, Miotomos, Dermátomos, Outro

</specifics>

<deferred>
## Deferred Ideas

- Aba Fraturas e qualquer teste que a imagem não listou
- Redesenho do bloco C (Força), do bloco D (neurológico como exame) e dos blocos F e G
- Catálogo para Teste funcional / medida de desempenho e Resultado inicial
- Publicar a função de resumo ou gerar SQL

</deferred>

---

*Phase: 25-mobilidade-palpacao-e-testes*
*Context gathered: 2026-10-05*
