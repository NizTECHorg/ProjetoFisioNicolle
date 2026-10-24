/**
 * Catálogo estático de testes especiais ortopédicos, agrupado por região.
 * Para dar conteúdo a uma nova região, basta acrescentar objetos em `tests`.
 */

export type SpecialTestRegionId =
  | 'coluna'
  | 'ombro'
  | 'cotovelo'
  | 'joelho'
  | 'quadril'
  | 'tornozelo'
  | 'mao'
  | 'fraturas'

export interface SpecialTest {
  readonly id: string
  readonly name: string
  /** Objetivo do teste */
  readonly summary: string
  readonly technique: string
  readonly interpretation: string
}

export interface SpecialTestRegion {
  readonly id: SpecialTestRegionId
  readonly label: string
  readonly tests: readonly SpecialTest[]
}

export interface SpecialTestHit {
  readonly region: SpecialTestRegion
  readonly test: SpecialTest
}

export const SPECIAL_TEST_REGIONS: readonly SpecialTestRegion[] = [
  {
    id: 'coluna',
    label: 'Coluna',
    tests: [
      {
        id: 'lasegue',
        name: 'Teste de Lasègue (Elevação da Perna Reta)',
        summary: 'Avaliar irritação ou compressão das raízes nervosas L4-S1 (nervo ciático).',
        technique:
          'Paciente em decúbito dorsal. O examinador eleva passivamente o membro inferior com o joelho estendido. O teste é realizado lentamente, observando o ângulo em que os sintomas aparecem.',
        interpretation:
          'Positivo: dor irradiada pelo trajeto do nervo ciático entre 30° e 70° de elevação. Dor apenas na região lombar ou posterior da coxa não é considerada positiva. A dorsiflexão do tornozelo no ponto de dor (manobra de Bragard) que intensifica os sintomas reforça o achado.',
      },
      {
        id: 'lasegue-cruzado',
        name: 'Teste de Lasègue Cruzado (Contralateral)',
        summary: 'Identificar hérnia discal extrusiva com compressão radicular significativa.',
        technique:
          'Mesmo posicionamento do Lasègue. Eleva-se o membro inferior assintomático. Observa-se se há reprodução da dor no membro contralateral (sintomático).',
        interpretation:
          'Positivo: dor irradiada para o lado contralateral (sintomático). Alta especificidade para hérnia discal com fragmento extrusivo comprimindo a raiz nervosa.',
      },
      {
        id: 'slump',
        name: 'Teste de Slump',
        summary: 'Avaliar tensão neural adversa em toda a cadeia neuromeníngea posterior.',
        technique:
          'Paciente sentado na borda da maca. Solicita-se flexão torácica e cervical (queixo no peito), extensão do joelho e dorsiflexão do tornozelo. O examinador aplica pressão sobre os ombros para manter a flexão.',
        interpretation:
          'Positivo: reprodução dos sintomas radiculares. A extensão cervical que alivia os sintomas confirma origem neural. Útil quando o Lasègue é negativo mas há suspeita de tensão neural.',
      },
      {
        id: 'spurling',
        name: 'Teste de Spurling',
        summary: 'Avaliar compressão radicular cervical (estreitamento foraminal).',
        technique:
          'Paciente sentado. O examinador posiciona a cervical em extensão, rotação e inclinação lateral para o lado sintomático e aplica compressão axial sobre o topo da cabeça.',
        interpretation:
          'Positivo: reprodução da dor irradiada para o membro superior ipsilateral. Alta especificidade para radiculopatia cervical por estreitamento foraminal.',
      },
      {
        id: 'valsalva',
        name: 'Teste de Valsalva',
        summary: 'Avaliar aumento da pressão intratecal e sua relação com dor radicular.',
        technique:
          "Solicita-se ao paciente que realize manobra de Valsalva (esforço expiratório contra glote fechada, como 'fazer força para evacuar'). Manter por alguns segundos.",
        interpretation:
          'Positivo: reprodução ou exacerbação de dor radicular. Sugere lesão que ocupa espaço no canal medular (hérnia discal, tumor, estenose).',
      },
      {
        id: 'schober',
        name: 'Teste de Schober',
        summary: 'Avaliar a mobilidade da coluna lombar em flexão.',
        technique:
          'Paciente em pé. Marca-se um ponto na linha mediana na altura de S1 e outro 10 cm acima. Solicita-se flexão máxima do tronco e mede-se a nova distância entre os pontos.',
        interpretation:
          'Normal: aumento ≥ 5 cm (distância final ≥ 15 cm). Valores < 15 cm indicam restrição da mobilidade lombar, como visto em espondilite anquilosante ou rigidez muscular importante.',
      },
      {
        id: 'compressao-axial',
        name: 'Teste de Compressão Axial',
        summary: 'Diferenciar dor lombar mecânica de dor por fratura ou lesão discal.',
        technique:
          'Paciente em pé ou sentado. O examinador aplica pressão axial descendente sobre o topo da cabeça ou ombros.',
        interpretation:
          'Positivo: dor lombar reproduzida. Sugere carga axial como mecanismo da dor (fratura por compressão, protrusão discal). Negativo em dores musculares puras.',
      },
      {
        id: 'distracao',
        name: 'Teste de Distração',
        summary: 'Avaliar sinais não orgânicos (Waddell) e componente psicogênico da dor.',
        technique:
          'Realiza-se o teste de elevação da perna reta (Lasègue) de forma distraída: com o paciente sentado, estende-se o joelho como se fosse examinar o joelho, sem que o paciente perceba que é o mesmo teste.',
        interpretation:
          'Positivo para componente não orgânico: se o Lasègue é positivo em supino mas negativo quando distraído sentado. Sugere amplificação de sintomas ou componente psicogênico.',
      },
    ],
  },
  {
    id: 'ombro',
    label: 'Ombro',
    tests: [
      {
        id: 'neer',
        name: 'Teste de Neer',
        summary: 'Avaliar impacto subacromial (compressão das estruturas subacromiais).',
        technique:
          'Paciente sentado ou em pé. O examinador estabiliza a escápula com uma mão e com a outra eleva passivamente o braço em flexão anterior com o antebraço pronado, forçando o tubérculo maior contra o acrômio.',
        interpretation:
          'Positivo: dor na região anterolateral do ombro durante a elevação, sugerindo impacto do manguito rotador ou bursa subacromial contra o acrômio. Especificidade moderada — confirmar com outros testes.',
      },
      {
        id: 'hawkins-kennedy',
        name: 'Teste de Hawkins-Kennedy',
        summary: 'Avaliar impacto subacromial, particularmente do tendão do supraespinhal.',
        technique:
          'Paciente em pé. Ombro e cotovelo flexionados a 90°. O examinador realiza rotação interna passiva do ombro, deprimindo o antebraço.',
        interpretation:
          'Positivo: dor na região anterior/lateral do ombro. Sugere compressão do tendão do supraespinhal entre o tubérculo maior e o ligamento coracoacromial. Sensibilidade alta (>80%).',
      },
      {
        id: 'jobe',
        name: 'Teste de Jobe (Empty Can)',
        summary: 'Avaliar integridade e força do músculo supraespinhal.',
        technique:
          'Braços em abdução de 90° no plano da escápula (30° anterior), rotação interna máxima (polegares para baixo, como esvaziando uma lata). O examinador aplica força para baixo enquanto o paciente resiste.',
        interpretation:
          'Positivo: fraqueza e/ou dor. Fraqueza significativa sugere ruptura do supraespinhal. Dor sem fraqueza sugere tendinopatia. Comparar bilateralmente.',
      },
      {
        id: 'gerber',
        name: 'Teste de Gerber (Lift-off)',
        summary: 'Avaliar integridade do músculo subescapular.',
        technique:
          'Paciente coloca o dorso da mão na região lombar. Solicita-se que afaste a mão das costas (rotação interna contra resistência). Alternativa: belly-press test.',
        interpretation:
          'Positivo: incapacidade de manter a mão afastada das costas, indicando insuficiência do subescapular. Comparar com lado contralateral.',
      },
      {
        id: 'speed',
        name: 'Teste de Speed',
        summary: 'Avaliar patologia do tendão da cabeça longa do bíceps.',
        technique:
          'Paciente com ombro flexionado a 60°, cotovelo estendido e antebraço supinado. O examinador aplica resistência à flexão do ombro.',
        interpretation:
          'Positivo: dor na região anterior do ombro (sulco bicipital). Sugere tendinopatia ou instabilidade do tendão da cabeça longa do bíceps.',
      },
      {
        id: 'yergason',
        name: 'Teste de Yergason',
        summary: 'Avaliar instabilidade do tendão do bíceps no sulco intertubercular.',
        technique:
          'Cotovelo flexionado a 90°, antebraço pronado. O paciente realiza supinação contra resistência do examinador.',
        interpretation:
          'Positivo: dor no sulco bicipital durante supinação resistida. Sugere instabilidade ou subluxação do tendão do bíceps.',
      },
      {
        id: 'apprehension',
        name: 'Teste de Apprehension (Apreensão Anterior)',
        summary: 'Avaliar instabilidade anterior do ombro.',
        technique:
          'Paciente em decúbito dorsal. Ombro em abdução de 90° e rotação externa progressiva. O examinador observa a reação do paciente.',
        interpretation:
          'Positivo: sensação de apreensão ou medo de luxação (não apenas dor). O teste de relocação (pressão posterior na cabeça umeral) que alivia a apreensão confirma instabilidade anterior.',
      },
      {
        id: 'obrien',
        name: "Teste de O'Brien (Active Compression)",
        summary: 'Avaliar lesão do lábio glenoidal superior (SLAP) e patologia acromioclavicular.',
        technique:
          'Braço em flexão de 90° e adução de 10-15°. Primeiro com rotação interna (polegar para baixo): resistência à flexão. Depois com rotação externa (palma para cima): mesma resistência.',
        interpretation:
          'Positivo para SLAP: dor profunda no ombro com polegar para baixo que melhora com palma para cima. Dor na articulação acromioclavicular em ambas posições sugere patologia AC.',
      },
    ],
  },
  {
    id: 'cotovelo',
    label: 'Cotovelo',
    tests: [
      {
        id: 'cozen',
        name: 'Teste de Cozen',
        summary: 'Avaliar epicondilite lateral (cotovelo de tenista).',
        technique:
          'Paciente sentado, cotovelo em extensão, antebraço pronado e punho fechado. O examinador estabiliza o cotovelo com o polegar sobre o epicôndilo lateral e solicita extensão resistida do punho.',
        interpretation:
          'Positivo: dor súbita e intensa no epicôndilo lateral. Sugere tendinopatia dos extensores do punho (especialmente extensor radial curto do carpo). Alta sensibilidade para epicondilite lateral.',
      },
      {
        id: 'mill',
        name: 'Teste de Mill',
        summary: 'Avaliar epicondilite lateral por estresse passivo.',
        technique:
          'Paciente sentado. O examinador palpa o epicôndilo lateral com uma mão e, com a outra, prona o antebraço, flexiona totalmente o punho e estende o cotovelo passivamente, alongando os extensores do punho.',
        interpretation:
          'Positivo: dor no epicôndilo lateral durante o alongamento passivo. Sugere tendinopatia dos extensores do punho (extensor radial curto do carpo). Complementa o teste de Cozen, que usa contração resistida.',
      },
      {
        id: 'maudsley',
        name: 'Teste de Maudsley',
        summary: 'Avaliar epicondilite lateral focada no extensor do dedo médio.',
        technique:
          'Paciente sentado com cotovelo estendido. Solicita-se extensão resistida do 3º dedo (médio) contra resistência do examinador.',
        interpretation:
          'Positivo: dor no epicôndilo lateral durante a resistência. Útil para confirmar epicondilite lateral, pois o extensor radial curto do carpo é tensionado preferencialmente.',
      },
      {
        id: 'golfista',
        name: 'Teste do Golfista (Epicondilite Medial)',
        summary: 'Avaliar epicondilite medial (cotovelo de golfista).',
        technique:
          'Paciente com cotovelo em extensão, antebraço supinado. O examinador estabiliza o cotovelo e realiza flexão passiva do punho ou solicita flexão e pronação resistidas.',
        interpretation:
          'Positivo: dor no epicôndilo medial. Indica tendinopatia dos flexores-pronadores. Pode-se também palpar o epicôndilo medial durante o estresse.',
      },
      {
        id: 'estresse-valgo-cotovelo',
        name: 'Teste de Estresse em Valgo do Cotovelo',
        summary: 'Avaliar integridade do ligamento colateral ulnar (LCU) — banda anterior.',
        technique:
          'Paciente sentado, cotovelo em flexão de 20-30° (para destravar o olécrano). O examinador estabiliza o úmero com uma mão e aplica estresse em valgo na ulna com a outra.',
        interpretation:
          'Positivo: abertura medial excessiva e/ou dor medial. Sugere lesão do LCU — comum em arremessadores e atletas overhead. Comparar com lado contralateral.',
      },
      {
        id: 'estresse-varo-cotovelo',
        name: 'Teste de Estresse em Varo do Cotovelo',
        summary: 'Avaliar integridade do ligamento colateral radial (LCR).',
        technique:
          'Mesmo posicionamento do estresse em valgo (paciente sentado, cotovelo em flexão de 20-30°). O examinador aplica estresse em varo, forçando a abertura lateral da articulação.',
        interpretation:
          'Positivo: abertura lateral excessiva e/ou dor lateral. Sugere lesão do LCR. Menos comum que lesão do LCU.',
      },
      {
        id: 'tinel-cotovelo',
        name: 'Teste de Tinel do Cotovelo (Túnel Cubital)',
        summary: 'Avaliar compressão ou irritação do nervo ulnar no túnel cubital.',
        technique:
          'O examinador percute com o dedo ou martelo de reflexo o trajeto do nervo ulnar no sulco entre o epicôndilo medial e o olécrano.',
        interpretation:
          'Positivo: parestesia ou choque irradiado para o 4º e 5º dedos. Sugere síndrome do túnel cubital (compressão do nervo ulnar).',
      },
      {
        id: 'flexao-cotovelo',
        name: 'Teste de Flexão do Cotovelo (Elbow Flexion Test)',
        summary: 'Avaliar síndrome do túnel cubital pela compressão dinâmica do nervo ulnar.',
        technique:
          'Solicita-se ao paciente que mantenha o cotovelo em flexão máxima com o punho em extensão por 60 segundos (ombro abduzido e ombros relaxados).',
        interpretation:
          'Positivo: parestesia ou dormência no 4º e 5º dedos. Alta sensibilidade para síndrome do túnel cubital — análogo ao Phalen no punho.',
      },
      {
        id: 'pivot-shift-cotovelo',
        name: 'Teste de Pivot Shift do Cotovelo (Instabilidade Posterolateral)',
        summary: 'Avaliar instabilidade rotatória posterolateral do cotovelo (PLRI).',
        technique:
          'Paciente em decúbito dorsal com braço elevado acima da cabeça. O examinador segura o punho, supina o antebraço, aplica valgo + carga axial enquanto flexiona o cotovelo a partir da extensão.',
        interpretation:
          'Positivo: sensação de apreensão, subluxação posterior da cabeça do rádio ou clunk durante a flexão. Indica insuficiência do complexo ligamentar colateral lateral ulnar (LUCL).',
      },
      {
        id: 'chair-push-up',
        name: 'Teste de Chair Push-Up (Apreensão Posterolateral)',
        summary: 'Avaliar instabilidade posterolateral funcional.',
        technique:
          'Solicita-se ao paciente que se levante de uma cadeira empurrando-se com as mãos, com os antebraços supinados e cotovelos afastados do corpo.',
        interpretation:
          'Positivo: apreensão ou dor lateral do cotovelo durante a extensão final. Indica instabilidade posterolateral (PLRI) com falha do LUCL.',
      },
      {
        id: 'bursa-olecraniana',
        name: 'Sinal da Bursa Olecraniana',
        summary: 'Confirmar bursite olecraniana.',
        technique:
          'Inspeção e palpação da face posterior do cotovelo sobre o olécrano. Avaliar flutuação, calor, eritema e dor à compressão.',
        interpretation:
          'Positivo: massa cística flutuante posterior, geralmente indolor (bursite traumática). Calor, eritema intenso e dor severa sugerem bursite séptica — encaminhar urgência.',
      },
    ],
  },
  {
    id: 'joelho',
    label: 'Joelho',
    tests: [
      {
        id: 'lachman',
        name: 'Teste de Lachman',
        summary: 'Avaliar a integridade do ligamento cruzado anterior (LCA).',
        technique:
          'Paciente em decúbito dorsal com joelho flexionado 20-30°. O examinador estabiliza o fêmur distal com uma mão e com a outra aplica força de translação anterior na tíbia proximal.',
        interpretation:
          'Positivo: translação anterior excessiva da tíbia com end-point (parada final) mole ou ausente. É o teste mais sensível para lesão do LCA (sensibilidade >85%). Classificar em graus: I (<5mm), II (5-10mm), III (>10mm).',
      },
      {
        id: 'gaveta-anterior',
        name: 'Teste de Gaveta Anterior',
        summary: 'Avaliar frouxidão do ligamento cruzado anterior.',
        technique:
          'Paciente em decúbito dorsal, quadril flexionado a 45°, joelho a 90°. O examinador senta sobre o pé do paciente e aplica tração anterior na tíbia proximal com ambas as mãos.',
        interpretation:
          'Positivo: deslocamento anterior excessivo da tíbia. Menos sensível que o Lachman na fase aguda (derrame e espasmo muscular limitam). Verificar rotação tibial — gaveta em rotação interna avalia cápsula posterolateral.',
      },
      {
        id: 'gaveta-posterior',
        name: 'Teste de Gaveta Posterior',
        summary: 'Avaliar integridade do ligamento cruzado posterior (LCP).',
        technique:
          'Mesmo posicionamento da gaveta anterior. Antes de aplicar força, observar se há sag posterior (queda posterior da tíbia). Aplicar força posterior na tíbia proximal.',
        interpretation:
          'Positivo: deslocamento posterior excessivo da tíbia. O sinal do sag (queda espontânea da tíbia posteriormente por gravidade) é patognomônico de lesão do LCP.',
      },
      {
        id: 'mcmurray',
        name: 'Teste de McMurray',
        summary: 'Avaliar lesão meniscal medial e lateral.',
        technique:
          'Paciente em decúbito dorsal. Joelho em flexão máxima. Para menisco medial: rotação externa do pé + extensão progressiva com estresse em valgo. Para menisco lateral: rotação interna + extensão com estresse em varo.',
        interpretation:
          'Positivo: estalido palpável ou audível acompanhado de dor na interlinha articular correspondente durante a extensão. Apenas dor sem estalido é menos específico. Sensibilidade moderada (~60-70%).',
      },
      {
        id: 'apley',
        name: 'Teste de Apley (Compressão/Distração)',
        summary: 'Diferenciar lesão meniscal de lesão ligamentar.',
        technique:
          'Paciente em decúbito ventral, joelho a 90°. Compressão: pressionar o calcanhar em direção ao joelho enquanto roda a tíbia. Distração: tracionar o tornozelo para cima enquanto roda.',
        interpretation:
          'Dor na compressão com rotação sugere lesão meniscal. Dor na distração sugere lesão ligamentar ou capsular. A comparação entre compressão e distração ajuda no diagnóstico diferencial.',
      },
      {
        id: 'estresse-valgo-joelho',
        name: 'Teste de Estresse em Valgo',
        summary: 'Avaliar integridade do ligamento colateral medial (LCM).',
        technique:
          'Paciente em decúbito dorsal. Testar com joelho em extensão completa e depois em 30° de flexão. O examinador aplica estresse em valgo (força lateral no joelho) estabilizando o tornozelo.',
        interpretation:
          'Instabilidade em 30° de flexão indica lesão isolada do LCM. Instabilidade em extensão completa sugere lesão do LCM associada a lesão de cruzados ou cápsula posterior. Classificar em graus I, II e III.',
      },
      {
        id: 'estresse-varo-joelho',
        name: 'Teste de Estresse em Varo',
        summary: 'Avaliar integridade do ligamento colateral lateral (LCL).',
        technique:
          'Mesmo posicionamento do estresse em valgo (paciente em decúbito dorsal). O examinador aplica estresse em varo (força medial no joelho), testando em extensão e 30° de flexão.',
        interpretation:
          'Instabilidade em 30° indica lesão do LCL. Instabilidade em extensão sugere lesão combinada (canto posterolateral). Lesão do LCL é menos comum e frequentemente associada a lesões complexas.',
      },
      {
        id: 'clarke',
        name: 'Teste de Clarke (Compressão Patelar)',
        summary: 'Avaliar condromalácia patelar e síndrome patelofemoral.',
        technique:
          'Paciente em decúbito dorsal com joelhos estendidos. O examinador pressiona a patela distalmente enquanto solicita contração do quadríceps.',
        interpretation:
          'Positivo: dor retropatelar e incapacidade de manter a contração. Alta sensibilidade mas baixa especificidade — pode ser positivo em joelhos normais. Usar em conjunto com outros achados clínicos.',
      },
    ],
  },
  {
    id: 'quadril',
    label: 'Quadril',
    tests: [
      {
        id: 'fadir',
        name: 'Teste de FADIR (Flexão-Adução-Rotação Interna)',
        summary: 'Avaliar impacto femoroacetabular e patologia labral do quadril.',
        technique:
          'Paciente em decúbito dorsal. O examinador realiza flexão de 90° do quadril, seguida de adução e rotação interna passiva.',
        interpretation:
          'Positivo: dor na região inguinal profunda. Alta sensibilidade (~95%) mas baixa especificidade. Sugere impacto femoroacetabular tipo cam ou pincer, ou lesão labral. Confirmação por imagem é necessária.',
      },
      {
        id: 'faber',
        name: 'Teste de FABER (Patrick)',
        summary: 'Avaliar patologia do quadril e da articulação sacroilíaca.',
        technique:
          'Paciente em decúbito dorsal. O examinador posiciona o quadril em Flexão, Abdução e Rotação Externa, colocando o tornozelo sobre o joelho contralateral. Pressiona-se o joelho ipsilateral para baixo e a EIAS contralateral.',
        interpretation:
          'Positivo para quadril: dor inguinal durante o posicionamento. Positivo para sacroilíaca: dor na região sacroilíaca posterior. Medir a distância do joelho à maca — assimetria >2 cm é significativa.',
      },
      {
        id: 'thomas',
        name: 'Teste de Thomas',
        summary: 'Avaliar encurtamento do músculo iliopsoas (contratura em flexão do quadril).',
        technique:
          'Paciente em decúbito dorsal na borda da maca. Fletir o quadril contralateral ao máximo (joelho ao peito) para retificar a lordose lombar. Observar o comportamento do membro contralateral que fica livre.',
        interpretation:
          'Positivo: o quadril testado não atinge extensão completa (permanece fletido). O ângulo residual de flexão indica o grau de contratura. Se o joelho estende, o reto femoral também está encurtado.',
      },
      {
        id: 'ober',
        name: 'Teste de Ober',
        summary: 'Avaliar encurtamento do tensor da fáscia lata e banda iliotibial.',
        technique:
          'Paciente em decúbito lateral com o lado testado para cima. O examinador estabiliza a pelve, abduz e estende o quadril e depois solta o membro para verificar se ele aduz passivamente.',
        interpretation:
          'Positivo: o membro permanece abduzido (não cai em adução), indicando retração da banda iliotibial/TFL. Correlacionar com síndrome da banda iliotibial e dor lateral do quadril.',
      },
      {
        id: 'trendelenburg',
        name: 'Teste de Trendelenburg',
        summary: 'Avaliar a função do músculo glúteo médio e estabilidade pélvica.',
        technique:
          'Paciente em pé, apoiado em um só membro inferior. O examinador observa a pelve por trás. O paciente deve manter apoio unipodal por 30 segundos.',
        interpretation:
          'Positivo: queda da hemipelve contralateral ao membro de apoio, indicando insuficiência do glúteo médio do lado apoiado. Pode indicar fraqueza muscular, dor no quadril ou lesão do nervo glúteo superior.',
      },
      {
        id: 'fair',
        name: 'Teste de Piriforme (FAIR)',
        summary: 'Avaliar síndrome do piriforme com compressão do nervo ciático.',
        technique:
          'Paciente em decúbito lateral com lado afetado para cima. Quadril flexionado a 60°, joelho flexionado. O examinador aplica pressão no joelho em direção à maca (adução + rotação interna).',
        interpretation:
          'Positivo: reprodução de dor glútea profunda com irradiação posterior na coxa, reproduzindo os sintomas ciáticos. Comparar com lado assintomático.',
      },
      {
        id: 'log-roll',
        name: 'Teste de Log Roll',
        summary: 'Avaliar patologia intra-articular do quadril de forma isolada.',
        technique:
          'Paciente em decúbito dorsal com membro inferior em extensão. O examinador rola o membro inferior em rotação interna e externa passivamente, sem flexão.',
        interpretation:
          'Positivo: dor inguinal durante a rotação. É o teste mais específico para patologia intra-articular do quadril, pois não estressa estruturas extra-articulares. Dor sugere sinovite, lesão labral ou artrose.',
      },
    ],
  },
  {
    id: 'tornozelo',
    label: 'Tornozelo',
    tests: [
      {
        id: 'gaveta-anterior-tornozelo',
        name: 'Teste de Gaveta Anterior do Tornozelo',
        summary: 'Avaliar integridade do ligamento talofibular anterior (LTFA).',
        technique:
          'Paciente sentado com pé relaxado. O examinador estabiliza a tíbia distal com uma mão e com a outra traciona o calcâneo anteriormente.',
        interpretation:
          'Positivo: translação anterior excessiva do tálus em relação à tíbia, com sulco visível na pele anterior. Deslocamento >4mm ou assimetria >3mm comparado ao lado oposto indica lesão do LTFA.',
      },
      {
        id: 'inclinacao-talar',
        name: 'Teste de Inclinação Talar (Tilt Test)',
        summary: 'Avaliar integridade do ligamento calcaneofibular (LCF).',
        technique:
          'Paciente sentado ou em decúbito lateral. O examinador estabiliza a tíbia e aplica estresse em inversão no calcâneo.',
        interpretation:
          'Positivo: abertura excessiva da articulação tibiofibular lateral (inclinação talar >10° ou assimetria >5° bilateral). Indica lesão do LCF, geralmente associada a lesão prévia do LTFA.',
      },
      {
        id: 'thompson',
        name: 'Teste de Thompson',
        summary: 'Avaliar integridade do tendão de Aquiles (ruptura completa).',
        technique:
          'Paciente em decúbito ventral com pés para fora da maca. O examinador comprime firmemente a panturrilha (ventre muscular do tríceps sural).',
        interpretation:
          'Positivo: ausência de flexão plantar passiva do pé quando a panturrilha é comprimida. Indica ruptura completa do tendão de Aquiles. Teste com sensibilidade >95%. Normal: flexão plantar visível à compressão.',
      },
      {
        id: 'squeeze',
        name: 'Teste de Squeeze (Compressão da Sindesmose)',
        summary: 'Avaliar lesão da sindesmose tibiofibular distal.',
        technique:
          'O examinador comprime a tíbia e fíbula uma contra a outra no terço médio da perna (proximal à lesão).',
        interpretation:
          'Positivo: dor referida na região da sindesmose tibiofibular distal (tornozelo anterolateral). Sugere lesão da sindesmose (entorse alta do tornozelo). Recuperação tipicamente mais longa que entorse lateral.',
      },
      {
        id: 'windlass',
        name: 'Teste de Dorsiflexão-Compressão (Windlass)',
        summary: 'Avaliar fasceíte plantar e mecanismo de Windlass.',
        technique:
          'Paciente sentado. O examinador estabiliza o antepé e realiza dorsiflexão passiva do hálux, tensionando a fáscia plantar.',
        interpretation:
          'Positivo: reprodução da dor na tuberosidade medial do calcâneo e ao longo da fáscia plantar. Confirma o diagnóstico de fasceíte plantar e avalia a integridade funcional do mecanismo de Windlass.',
      },
      {
        id: 'tinel-tibial-posterior',
        name: 'Teste de Tinel (Nervo Tibial Posterior)',
        summary: 'Avaliar síndrome do túnel do tarso (compressão do nervo tibial posterior).',
        technique:
          'O examinador percute com o dedo ou martelo reflexo sobre o trajeto do nervo tibial posterior, posterior e inferior ao maléolo medial.',
        interpretation:
          'Positivo: parestesia ou choque elétrico irradiado para a planta do pé e dedos. Indica compressão ou irritação do nervo tibial posterior no túnel do tarso.',
      },
      {
        id: 'estabilidade-mediope',
        name: 'Teste de Estabilidade do Médiopé',
        summary: 'Avaliar instabilidade tarsometatarsal (articulação de Lisfranc).',
        technique:
          'O examinador estabiliza o tarso com uma mão e com a outra aplica estresse em dorsiflexão-plantiflexão e pronação-supinação nas articulações tarsometatarsais individualmente.',
        interpretation:
          'Positivo: dor e/ou mobilidade excessiva na articulação tarsometatarsal. Sugere lesão ligamentar de Lisfranc. Lesão frequentemente subdiagnosticada — comparar sempre com lado contralateral.',
      },
    ],
  },
  {
    id: 'mao',
    label: 'Mão',
    tests: [
      {
        id: 'phalen',
        name: 'Teste de Phalen',
        summary: 'Avaliar compressão do nervo mediano no túnel do carpo.',
        technique:
          'O paciente posiciona ambos os punhos em flexão máxima (90°), com o dorso das mãos pressionado um contra o outro, mantendo a posição por 60 segundos.',
        interpretation:
          'Positivo: reprodução de parestesia ou dormência no território do nervo mediano (polegar, indicador, médio e metade radial do anelar). Sensibilidade ~75% para síndrome do túnel do carpo.',
      },
      {
        id: 'phalen-reverso',
        name: 'Teste de Phalen Reverso',
        summary: 'Avaliar síndrome do túnel do carpo por extensão do punho.',
        technique:
          'O paciente posiciona os punhos em extensão máxima, com as palmas das mãos unidas (posição de oração), mantendo por 60 segundos.',
        interpretation:
          'Positivo: parestesia no território do mediano. Útil quando o Phalen tradicional é negativo mas há suspeita clínica.',
      },
      {
        id: 'tinel-punho',
        name: 'Teste de Tinel no Punho',
        summary: 'Avaliar irritação do nervo mediano no túnel do carpo.',
        technique:
          'O examinador percute com o dedo indicador ou martelo de reflexo sobre o trajeto do nervo mediano no punho (ligamento transverso do carpo).',
        interpretation:
          'Positivo: sensação de choque ou parestesia irradiada para os dedos (polegar, indicador, médio). Indica irritabilidade do mediano. Especificidade alta, sensibilidade moderada.',
      },
      {
        id: 'finkelstein',
        name: 'Teste de Finkelstein',
        summary: 'Avaliar tenossinovite de De Quervain (tendões abdutor longo e extensor curto do polegar).',
        technique:
          'O paciente flexiona o polegar dentro da palma e fecha os dedos sobre ele. O examinador realiza desvio ulnar passivo do punho.',
        interpretation:
          'Positivo: dor intensa no estiloide radial e ao longo do 1º compartimento extensor. Patognomônico para tenossinovite de De Quervain.',
      },
      {
        id: 'eichhoff',
        name: 'Teste de Eichhoff',
        summary: 'Variação do Finkelstein para tenossinovite de De Quervain.',
        technique:
          'O paciente fecha o punho com o polegar dentro dos outros dedos. O examinador realiza desvio ulnar passivo.',
        interpretation:
          'Positivo: dor no estiloide radial. Versão considerada por alguns autores mais sensível, porém pode gerar mais falso-positivos que o Finkelstein clássico.',
      },
      {
        id: 'dedo-gatilho',
        name: 'Teste do Dedo em Gatilho (Trigger Finger)',
        summary: 'Avaliar tenossinovite estenosante dos flexores dos dedos.',
        technique:
          'O examinador palpa a polia A1 (na cabeça do metacarpo, face palmar) e solicita flexão e extensão ativa do dedo afetado. Pode também palpar nódulo no tendão flexor.',
        interpretation:
          'Positivo: estalido, travamento ou bloqueio durante a flexão/extensão; nódulo palpável no tendão. Confirma tenossinovite estenosante (dedo em gatilho).',
      },
      {
        id: 'bunnell-littler',
        name: 'Teste de Bunnell-Littler',
        summary: 'Diferenciar contratura intrínseca da contratura capsular da articulação interfalângica proximal (IFP).',
        technique:
          'O examinador mantém a metacarpofalângica (MCF) em hiperextensão e tenta flexionar a IFP passivamente. Em seguida, posiciona a MCF em flexão e novamente flexiona a IFP.',
        interpretation:
          'Se a IFP flexiona melhor com MCF fletida → contratura dos intrínsecos (interósseos). Se a flexão da IFP é igualmente limitada em ambas posições → contratura capsular/articular.',
      },
      {
        id: 'allen',
        name: 'Teste de Allen',
        summary: 'Avaliar a permeabilidade das artérias radial e ulnar (vascularização da mão).',
        technique:
          'O paciente fecha o punho enquanto o examinador comprime simultaneamente as artérias radial e ulnar. O paciente abre a mão (palidez evidente). Solta-se uma artéria por vez e observa-se o tempo de reperfusão.',
        interpretation:
          'Normal: reperfusão em até 5–7 segundos. Patológico: reperfusão lenta (>10s) ou ausente sugere obstrução da artéria liberada. Importante antes de procedimentos na artéria radial.',
      },
      {
        id: 'watson',
        name: 'Teste de Watson (Scaphoid Shift)',
        summary: 'Avaliar instabilidade escafossemilunar.',
        technique:
          'Punho em desvio ulnar e leve extensão. O examinador pressiona o tubérculo do escafoide com o polegar (face palmar) enquanto desvia o punho radialmente.',
        interpretation:
          'Positivo: dor e/ou estalido (clunk) no aspecto dorsorradial do punho durante o movimento. Sugere instabilidade do ligamento escafossemilunar.',
      },
      {
        id: 'tabaqueira-anatomica',
        name: 'Teste de Compressão da Tabaqueira Anatômica',
        summary: 'Avaliar suspeita de fratura do escafoide.',
        technique:
          'O examinador palpa a tabaqueira anatômica (entre os tendões do extensor longo e curto do polegar) e aplica pressão axial no polegar (compressão do 1º metacarpo em direção ao escafoide).',
        interpretation:
          'Positivo: dor intensa na tabaqueira anatômica. Alta sensibilidade para fratura do escafoide. Sempre solicitar imagem (RX em incidências específicas; se dúvida, RM ou TC).',
      },
      {
        id: 'grind-polegar',
        name: 'Teste de Grind do Polegar (CMC)',
        summary: 'Avaliar osteoartrite da articulação carpometacarpal (CMC) do polegar (rizartrose).',
        technique:
          'O examinador segura o 1º metacarpo e aplica compressão axial associada a rotação suave (movimento de moedor) sobre a articulação CMC do polegar.',
        interpretation:
          'Positivo: dor, crepitação e/ou estalido na base do polegar. Indica artrose ou sinovite da articulação trapeziometacarpal — muito comum em mulheres acima dos 50 anos.',
      },
    ],
  },
  {
    id: 'fraturas',
    label: 'Fraturas',
    tests: [
      {
        id: 'ottawa-tornozelo',
        name: 'Regras de Ottawa para Tornozelo e Pé',
        summary: 'Identificar necessidade de radiografia em trauma de tornozelo/pé (suspeita de fratura).',
        technique:
          'Após trauma agudo, avaliar: 1) Dor na região maleolar OU mediopé. 2) Dor à palpação na borda posterior dos 6 cm distais do maléolo medial ou lateral, OU na base do 5º metatarso, OU no navicular. 3) Incapacidade de dar 4 passos imediatamente após o trauma e no exame.',
        interpretation:
          'Indicação de radiografia se houver dor na região maleolar + critério 2 ou 3 (tornozelo), ou dor mediopé + critério 2 ou 3 (pé). Sensibilidade > 95% para fraturas clinicamente significativas — alta capacidade de descartar fratura quando negativo.',
      },
      {
        id: 'ottawa-joelho',
        name: 'Regras de Ottawa para Joelho',
        summary: 'Identificar necessidade de radiografia em trauma agudo de joelho.',
        technique:
          'Após trauma, avaliar: 1) Idade ≥ 55 anos. 2) Dor à palpação isolada da patela (sem dor em outro local). 3) Dor à palpação da cabeça da fíbula. 4) Incapacidade de flexionar o joelho a 90°. 5) Incapacidade de descarregar peso (4 passos) imediatamente e no exame.',
        interpretation:
          'Presença de QUALQUER um dos 5 critérios indica radiografia. Alta sensibilidade para fraturas — útil para evitar exames desnecessários em pacientes de baixo risco.',
      },
      {
        id: 'percussao-tap',
        name: 'Teste de Percussão (Tap Test)',
        summary: 'Identificar suspeita de fratura óssea em ossos longos por transmissão de vibração.',
        technique:
          'Aplicar percussão suave (com martelo de reflexo ou dedos) em uma extremidade óssea (ex: maléolo, patela, olécrano). Avaliar se a vibração transmitida ao longo do osso reproduz dor no local suspeito de fratura.',
        interpretation:
          'Positivo: dor intensa no local suspeito ao percutir uma extremidade distante. Sugere descontinuidade óssea (fratura). Sensibilidade moderada — útil como triagem em pré-hospitalar e ambulatório.',
      },
      {
        id: 'diapasao',
        name: 'Teste do Diapasão (Tuning Fork)',
        summary: 'Identificar suspeita de fratura por estresse ou completa de ossos superficiais.',
        technique:
          'Acione um diapasão de 128 Hz e aplique sua base sobre a pele do osso suspeito (ex: tíbia, metatarso, maléolo). Compare com lado contralateral.',
        interpretation:
          'Positivo: dor intensa localizada durante a vibração, geralmente reduzindo após retirada. Sugere fratura (incluindo por estresse). Maior sensibilidade quando combinado com escuta por estetoscópio (sinal auscultatório). Útil em fraturas por estresse onde RX inicial é negativo.',
      },
      {
        id: 'compressao-axial-vertebral',
        name: 'Compressão Axial (Suspeita de Fratura Vertebral)',
        summary: 'Avaliar dor por carga axial em vértebras com suspeita de fratura (compressão osteoporótica).',
        technique:
          'Paciente sentado ou em pé. O examinador aplica pressão axial DESCENDENTE suave sobre o topo da cabeça. Observar reprodução de dor localizada na coluna.',
        interpretation:
          'Positivo: dor focal lombar ou torácica reproduzida no segmento suspeito. Sugere fratura por compressão (especialmente em idosos osteoporóticos). Encaminhar para imagem. ATENÇÃO: não realizar em suspeita de fratura instável.',
      },
      {
        id: 'percussao-espinhosos',
        name: 'Sinal de Percussão dos Processos Espinhosos',
        summary: 'Triagem para fratura vertebral, infecção (espondilodiscite) ou neoplasia óssea.',
        technique:
          'Paciente em pé inclinado à frente ou sentado. O examinador percute com a borda ulnar da mão fechada ou martelo de reflexo cada processo espinhoso de C7 a L5, sequencialmente.',
        interpretation:
          'Positivo: dor focal intensa reproduzida em um segmento específico. Sugere fratura vertebral, espondilodiscite, abscesso epidural ou metástase. Encaminhar para investigação imediata.',
      },
      {
        id: 'coccix',
        name: 'Teste de Cóccix (Palpação Externa)',
        summary: 'Identificar dor coccígea (coccigodínia, fratura ou luxação).',
        technique:
          'Paciente em decúbito lateral ou ventral. Realize palpação direta sobre o cóccix com pressão suave e progressiva. Avaliar dor, mobilidade aumentada (hipermobilidade pós-fratura/luxação) ou deformidade.',
        interpretation:
          'Positivo: dor intensa localizada à palpação coccígea. Mobilidade anormal pode sugerir luxação ou fratura instável. Confirmação por RX (idealmente em ortostatismo e sentado) ou RNM.',
      },
      {
        id: 'galleazi',
        name: 'Teste de Galleazi (Suspeita de Fratura/Luxação de Quadril)',
        summary: 'Identificar discrepância de comprimento dos MMII por fratura de fêmur ou luxação do quadril.',
        technique:
          'Paciente em decúbito dorsal com quadris e joelhos flexionados a 90° e pés apoiados na maca. Observar a altura dos joelhos lateralmente.',
        interpretation:
          'Positivo: assimetria na altura dos joelhos. Joelho mais baixo sugere encurtamento femoral (fratura) ou luxação posterior do quadril. Em fratura aguda, o membro pode estar em rotação externa e encurtado.',
      },
      {
        id: 'apoio-unipodal',
        name: 'Teste de Carga em Apoio Unipodal (Fratura por Estresse)',
        summary: 'Suspeita de fratura por estresse de MMII (tíbia, fíbula, metatarsos, fêmur).',
        technique:
          'Solicitar ao paciente que apoie todo o peso em uma perna (unipodal) e/ou execute um salto unipodal (hop test) leve. Observar dor reproduzida.',
        interpretation:
          'Positivo: dor focal intensa no apoio ou impossibilidade de manter o apoio/salto. Alta suspeita de fratura por estresse — solicitar RNM (mais sensível que RX nos primeiros 14 dias).',
      },
      {
        id: 'sulcus',
        name: 'Teste de Sulcus (Pós-Luxação de Ombro)',
        summary: 'Avaliar instabilidade inferior do ombro pós-luxação ou fratura-luxação de úmero proximal.',
        technique:
          'Paciente sentado com braço relaxado ao lado do corpo. O examinador segura o cotovelo/punho e aplica tração inferior (para baixo). Observar a região subacromial.',
        interpretation:
          'Positivo: aparecimento de sulco/depressão visível abaixo do acrômio > 1 cm. Indica frouxidão capsular inferior ou instabilidade multidirecional, comum em sequela de luxação glenoumeral ou fratura-luxação.',
      },
      {
        id: 'apreensao-anterior-fratura',
        name: 'Teste de Apreensão Anterior do Ombro',
        summary: 'Avaliar instabilidade anterior pós-luxação ou fratura-luxação do ombro.',
        technique:
          'Paciente em decúbito dorsal. O examinador posiciona o ombro a 90° de abdução e 90° de rotação externa, aplicando suave força anterior na cabeça umeral.',
        interpretation:
          'Positivo: paciente refere sensação de \'apreensão\' ou medo de luxação iminente (não apenas dor). Indica instabilidade anterior. Teste de recolocação (Jobe) confirma se a apreensão melhora com pressão posterior.',
      },
      {
        id: 'drop-arm',
        name: 'Sinal do \'Drop Arm\' (Pós-Fratura de Úmero Proximal)',
        summary: 'Avaliar integridade do manguito rotador (especialmente supraespinhal) pós-fratura.',
        technique:
          'Examinador eleva passivamente o braço do paciente a 90° de abdução. Solicita que o paciente baixe LENTAMENTE o braço com controle.',
        interpretation:
          'Positivo: o paciente é incapaz de controlar a descida e o braço \'cai\' subitamente. Sugere ruptura do manguito rotador (supraespinhal), comum em fraturas do tubérculo maior associadas.',
      },
    ],
  },
]

export const DEFAULT_REGION_ID: SpecialTestRegionId = 'coluna'

export function foldText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function isRegionId(value: string | null | undefined): value is SpecialTestRegionId {
  return typeof value === 'string' && SPECIAL_TEST_REGIONS.some((r) => r.id === value)
}

export function findRegion(id: SpecialTestRegionId): SpecialTestRegion {
  return (
    SPECIAL_TEST_REGIONS.find((r) => r.id === id) ??
    SPECIAL_TEST_REGIONS.find((r) => r.id === DEFAULT_REGION_ID) ?? {
      id: DEFAULT_REGION_ID,
      label: 'Coluna',
      tests: [],
    }
  )
}

export function findSpecialTest(id: string | null | undefined): SpecialTestHit | null {
  if (typeof id !== 'string' || id === '') return null
  for (const region of SPECIAL_TEST_REGIONS) {
    const test = region.tests.find((t) => t.id === id)
    if (test) return { region, test }
  }
  return null
}

export function searchSpecialTests(term: string): SpecialTestHit[] {
  const q = foldText(term.trim())
  if (q === '') return []
  const hits: SpecialTestHit[] = []
  for (const region of SPECIAL_TEST_REGIONS) {
    for (const test of region.tests) {
      if (foldText(test.name).includes(q) || foldText(test.summary).includes(q)) {
        hits.push({ region, test })
      }
    }
  }
  return hits
}
