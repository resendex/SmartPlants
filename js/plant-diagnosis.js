// @ts-nocheck
// 
// ========================================
// MÓDULO DE DIAGNÓSTICO DE PLANTAS COM IA
// Usa a API Plant.id para análise de saúde
// ========================================

// ⚠️ IMPORTANTE: Substitua pela sua API key do Plant.id
// Obtenha gratuitamente em: https://plant.id
const PLANT_ID_API_KEY = 'f19Jc0xIStDiXVat00mstVBwqTtOehKEatCINkyZXUQjTgjZGA';

// Configuração da API
const PLANT_ID_CONFIG = {
    healthAssessmentUrl: 'https://plant.id/api/v3/health_assessment',
    identificationUrl: 'https://plant.id/api/v3/identification',
    maxImageSize: 1500, // pixels máximos para redimensionar
    jpegQuality: 0.8
};

/**
 * Verifica se a API key foi configurada
 * @returns {boolean}
 */
function isApiKeyConfigured() {
    // A API key está configurada se existir e tiver mais de 10 caracteres
    return PLANT_ID_API_KEY && PLANT_ID_API_KEY.length > 10;
}

/**
 * Redimensiona uma imagem para otimizar o envio para a API
 * @param {string} base64Image - Imagem em base64
 * @returns {Promise<string>} - Imagem redimensionada em base64
 */
async function resizeImageForApi(base64Image) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Redimensionar se necessário
            const maxSize = PLANT_ID_CONFIG.maxImageSize;
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converter para base64 sem o prefixo data:image
            const resized = canvas.toDataURL('image/jpeg', PLANT_ID_CONFIG.jpegQuality);
            resolve(resized.split(',')[1]);
        };
        
        // Se já tem prefixo data:image, usar diretamente
        if (base64Image.startsWith('data:')) {
            img.src = base64Image;
        } else {
            img.src = `data:image/jpeg;base64,${base64Image}`;
        }
    });
}

/**
 * Analisa a saúde de uma planta usando a API Plant.id
 * @param {string} imageBase64 - Imagem da planta em base64
 * @returns {Promise<Object>} - Resultado do diagnóstico
 */
async function analyzePlantHealth(imageBase64) {
    if (!isApiKeyConfigured()) {
        console.warn('API Key do Plant.id não configurada. Usando diagnóstico simulado.');
        return simulateDiagnosis();
    }
    
    try {
        // Redimensionar imagem para otimizar
        const optimizedImage = await resizeImageForApi(imageBase64);
        
        console.log('📤 A enviar imagem para Plant.id API...');
        
        const response = await fetch(PLANT_ID_CONFIG.healthAssessmentUrl, {
            method: 'POST',
            headers: {
                'Api-Key': PLANT_ID_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                images: [optimizedImage],
                health: 'all'
            })
        });
        
        const responseText = await response.text();
        console.log('📥 Resposta da API (status ' + response.status + '):', responseText.substring(0, 500));
        
        if (!response.ok) {
            let errorData = {};
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText };
            }
            
            console.error('❌ Erro na API Plant.id:', response.status, errorData);
            
            if (response.status === 401) {
                throw new Error('API Key inválida. Verifique a sua chave em plant.id');
            } else if (response.status === 429) {
                throw new Error('Limite de requisições excedido. Tente novamente mais tarde.');
            } else if (response.status === 400) {
                throw new Error('Imagem inválida ou formato não suportado.');
            } else if (response.status === 402) {
                throw new Error('Créditos esgotados. Verifique o seu plano em plant.id');
            } else if (response.status === 404) {
                throw new Error('Endpoint da API não encontrado. Verifique a configuração.');
            } else if (response.status >= 500) {
                throw new Error('Servidor Plant.id indisponível. Tente novamente mais tarde.');
            }
            throw new Error(errorData.message || `Erro ${response.status}: ${responseText.substring(0, 100)}`);
        }
        
        const data = JSON.parse(responseText);
        console.log('✅ Análise concluída com sucesso');
        return processApiResponse(data);
        
    } catch (error) {
        console.error('❌ Erro ao analisar planta:', error);
        throw error;
    }
}

/**
 * Dicionário de tradução de doenças/problemas para português
 */
const DISEASE_TRANSLATIONS = {
    // Doenças fúngicas
    'rust': 'Ferrugem',
    'leaf rust': 'Ferrugem das folhas',
    'stem rust': 'Ferrugem do caule',
    'powdery mildew': 'Oídio',
    'downy mildew': 'Míldio',
    'black spot': 'Mancha negra',
    'leaf spot': 'Mancha foliar',
    'brown spot': 'Mancha castanha',
    'target spot': 'Mancha alvo',
    'anthracnose': 'Antracnose',
    'blight': 'Queimadura fúngica',
    'leaf blight': 'Queima das folhas',
    'early blight': 'Queima precoce',
    'late blight': 'Queima tardia',
    'root rot': 'Podridão radicular',
    'stem rot': 'Podridão do caule',
    'crown rot': 'Podridão da coroa',
    'gray mold': 'Mofo cinzento (Botrytis)',
    'botrytis': 'Botrytis (mofo cinzento)',
    'white mold': 'Mofo branco',
    'black mold': 'Mofo negro',
    'fusarium': 'Fusariose',
    'fusarium wilt': 'Murcha de Fusarium',
    'verticillium': 'Verticiliose',
    'verticillium wilt': 'Murcha de Verticillium',
    'sooty mold': 'Fumagina',
    'canker': 'Cancro',
    'damping off': 'Tombamento de plântulas',
    'scab': 'Sarna',
    'septoria': 'Septoriose',
    
    // Problemas bacterianos
    'bacterial leaf spot': 'Mancha bacteriana',
    'bacterial wilt': 'Murcha bacteriana',
    'bacterial blight': 'Queima bacteriana',
    'crown gall': 'Galha da coroa',
    'fire blight': 'Fogo bacteriano',
    'soft rot': 'Podridão mole',
    'bacterial canker': 'Cancro bacteriano',
    
    // Problemas virais
    'mosaic virus': 'Vírus do mosaico',
    'mosaic': 'Mosaico viral',
    'leaf curl': 'Enrolamento das folhas',
    'ring spot': 'Mancha anelar',
    'yellow vein': 'Amarelecimento das nervuras',
    'mottle': 'Mosqueado viral',
    
    // Pragas
    'aphids': 'Pulgões',
    'spider mites': 'Ácaros',
    'red spider mite': 'Ácaro vermelho',
    'mealybugs': 'Cochonilhas algodão',
    'scale insects': 'Cochonilhas de escama',
    'scale': 'Cochonilha',
    'whiteflies': 'Moscas brancas',
    'whitefly': 'Mosca branca',
    'thrips': 'Tripes',
    'caterpillars': 'Lagartas',
    'caterpillar': 'Lagarta',
    'leaf miners': 'Minadores de folhas',
    'leaf miner': 'Minador de folhas',
    'fungus gnats': 'Mosquitos de fungos',
    'slugs': 'Lesmas',
    'snails': 'Caracóis',
    'nematodes': 'Nemátodos',
    'weevils': 'Gorgulhos',
    'beetles': 'Escaravelhos',
    'grubs': 'Larvas',
    
    // Deficiências nutricionais
    'nitrogen deficiency': 'Deficiência de nitrogénio',
    'phosphorus deficiency': 'Deficiência de fósforo',
    'potassium deficiency': 'Deficiência de potássio',
    'iron deficiency': 'Clorose férrica (falta de ferro)',
    'iron chlorosis': 'Clorose férrica',
    'magnesium deficiency': 'Deficiência de magnésio',
    'calcium deficiency': 'Deficiência de cálcio',
    'sulfur deficiency': 'Deficiência de enxofre',
    'zinc deficiency': 'Deficiência de zinco',
    'manganese deficiency': 'Deficiência de manganês',
    'boron deficiency': 'Deficiência de boro',
    'copper deficiency': 'Deficiência de cobre',
    'nutrient deficiency': 'Deficiência nutricional',
    'nutrient burn': 'Excesso de nutrientes',
    
    // Problemas ambientais
    'sunburn': 'Queimadura solar',
    'sun scorch': 'Escaldão solar',
    'sunscald': 'Escaldadura solar',
    'heat stress': 'Stress térmico',
    'heat damage': 'Danos por calor',
    'cold damage': 'Danos por frio',
    'cold stress': 'Stress por frio',
    'frost damage': 'Danos por geada',
    'chilling injury': 'Lesão por frio',
    'overwatering': 'Excesso de rega',
    'underwatering': 'Falta de água',
    'water stress': 'Stress hídrico',
    'drought stress': 'Stress por seca',
    'drought': 'Seca',
    'edema': 'Edema (acumulação de água)',
    'oedema': 'Edema foliar',
    'salt damage': 'Danos por sal',
    'salt stress': 'Stress salino',
    'chemical burn': 'Queimadura química',
    'fertilizer burn': 'Queimadura por fertilizante',
    'herbicide damage': 'Danos por herbicida',
    'pesticide damage': 'Danos por pesticida',
    'wind damage': 'Danos por vento',
    'mechanical damage': 'Danos mecânicos',
    'physical damage': 'Danos físicos',
    'transplant shock': 'Choque de transplante',
    'root bound': 'Raízes enroladas (vaso pequeno)',
    'compacted soil': 'Solo compactado',
    'poor drainage': 'Má drenagem',
    'waterlogging': 'Encharcamento',
    'light deficiency': 'Falta de luz',
    'etiolation': 'Estiolamento (falta de luz)',
    'low light': 'Luz insuficiente',
    'excessive light': 'Excesso de luz',
    
    // Estados gerais e envelhecimento
    'healthy': 'Saudável',
    'senescence': 'Envelhecimento natural',
    'leaf senescence': 'Senescência foliar (envelhecimento)',
    'natural senescence': 'Envelhecimento natural das folhas',
    'aging': 'Envelhecimento',
    'old leaves': 'Folhas velhas',
    'wilting': 'Murcha',
    'wilt': 'Murcha',
    'yellowing': 'Amarelecimento',
    'yellow leaves': 'Folhas amarelas',
    'browning': 'Acastanhamento',
    'brown tips': 'Pontas castanhas',
    'brown edges': 'Bordas castanhas',
    'leaf scorch': 'Queima das bordas',
    'tip burn': 'Queimadura das pontas',
    'leaf drop': 'Queda de folhas',
    'defoliation': 'Desfolhação',
    'stunted growth': 'Crescimento atrofiado',
    'poor growth': 'Crescimento deficiente',
    'leggy growth': 'Crescimento espigado',
    'chlorosis': 'Clorose (amarelecimento)',
    'interveinal chlorosis': 'Clorose internerval',
    'necrosis': 'Necrose (tecido morto)',
    'leaf necrosis': 'Necrose foliar',
    'dieback': 'Morte progressiva',
    'decline': 'Declínio geral',
    'stress': 'Stress',
    'environmental stress': 'Stress ambiental',
    'abiotic stress': 'Stress abiótico',
    'biotic stress': 'Stress biótico',
    'general disorder': 'Distúrbio geral',
    'physiological disorder': 'Distúrbio fisiológico',
    'unknown': 'Problema desconhecido',
    'unidentified': 'Não identificado'
};

/**
 * Traduz o nome de uma doença para português
 * @param {string} diseaseName - Nome da doença em inglês
 * @returns {string} - Nome traduzido ou original se não houver tradução
 */
function translateDiseaseName(diseaseName) {
    if (!diseaseName) return 'Problema não identificado';
    
    const lowerName = diseaseName.toLowerCase().trim();
    
    // Procurar tradução exata
    if (DISEASE_TRANSLATIONS[lowerName]) {
        return DISEASE_TRANSLATIONS[lowerName];
    }
    
    // Procurar tradução parcial
    for (const [eng, pt] of Object.entries(DISEASE_TRANSLATIONS)) {
        if (lowerName.includes(eng) || eng.includes(lowerName)) {
            return pt;
        }
    }
    
    // Retornar original com primeira letra maiúscula
    return diseaseName.charAt(0).toUpperCase() + diseaseName.slice(1);
}

/**
 * Traduz tipos de tratamento para português
 * @param {string} type - Tipo de tratamento em inglês
 * @returns {string} - Tipo traduzido
 */
function translateTreatmentType(type) {
    const translations = {
        'biological': 'Biológico',
        'chemical': 'Químico',
        'prevention': 'Prevenção',
        'cultural': 'Cultural',
        'mechanical': 'Mecânico',
        'organic': 'Orgânico',
        'general': 'Geral',
        'immediate': 'Imediato',
        'long-term': 'Longo prazo'
    };
    
    const lowerType = type.toLowerCase().trim();
    return translations[lowerType] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Base de conhecimento com descrições e tratamentos para doenças comuns
 * Usado quando a API não fornece detalhes suficientes
 */
const DISEASE_KNOWLEDGE_BASE = {
    'rust': {
        description: 'A ferrugem é uma doença fúngica que causa manchas alaranjadas ou acastanhadas nas folhas. Os esporos espalham-se facilmente pelo ar e água, especialmente em condições húmidas.',
        treatments: [
            { type: 'Imediato', methods: ['Remover e descartar as folhas afetadas', 'Isolar a planta de outras para evitar contágio'] },
            { type: 'Biológico', methods: ['Pulverizar com solução de bicarbonato de sódio (1 colher de sopa por litro de água)', 'Aplicar óleo de neem diluído'] },
            { type: 'Químico', methods: ['Aplicar fungicida à base de cobre', 'Usar fungicida sistémico se a infeção for grave'] },
            { type: 'Prevenção', methods: ['Evitar molhar as folhas durante a rega', 'Garantir boa circulação de ar', 'Não deixar água parada no prato'] }
        ]
    },
    'powdery mildew': {
        description: 'O oídio apresenta-se como um pó branco nas folhas. É causado por fungos que prosperam em ambientes secos com pouca circulação de ar.',
        treatments: [
            { type: 'Imediato', methods: ['Limpar as folhas afetadas com pano húmido', 'Aumentar a ventilação à volta da planta'] },
            { type: 'Biológico', methods: ['Pulverizar com leite diluído em água (1:9)', 'Aplicar solução de bicarbonato de sódio'] },
            { type: 'Prevenção', methods: ['Manter boa circulação de ar', 'Evitar excesso de fertilizante azotado', 'Regar pela manhã para as folhas secarem'] }
        ]
    },
    'leaf spot': {
        description: 'As manchas foliares são causadas por fungos ou bactérias, aparecendo como lesões escuras nas folhas. Podem expandir-se e causar queda prematura das folhas.',
        treatments: [
            { type: 'Imediato', methods: ['Remover folhas muito afetadas', 'Limpar folhas caídas do solo'] },
            { type: 'Biológico', methods: ['Aplicar fungicida natural à base de cobre', 'Pulverizar com chá de camomila frio'] },
            { type: 'Prevenção', methods: ['Evitar rega por cima das folhas', 'Não trabalhar nas plantas quando molhadas', 'Desinfetar ferramentas de poda'] }
        ]
    },
    'root rot': {
        description: 'A podridão radicular é causada por excesso de água e má drenagem. As raízes ficam castanhas, moles e com mau cheiro. A planta murcha mesmo com solo húmido.',
        treatments: [
            { type: 'Imediato', methods: ['Retirar a planta do vaso imediatamente', 'Cortar todas as raízes podres (castanhas/moles)', 'Deixar as raízes secar ao ar por algumas horas'] },
            { type: 'Recuperação', methods: ['Replantar em substrato novo e seco', 'Usar vaso com boa drenagem', 'Não regar durante 1 semana após replante'] },
            { type: 'Prevenção', methods: ['Verificar sempre a humidade antes de regar', 'Garantir furos de drenagem no vaso', 'Usar substrato bem drenante'] }
        ]
    },
    'overwatering': {
        description: 'O excesso de rega causa folhas amareladas, moles e por vezes com manchas aquosas. O solo permanece constantemente húmido e pode desenvolver fungos.',
        treatments: [
            { type: 'Imediato', methods: ['Parar de regar imediatamente', 'Colocar a planta em local com boa ventilação', 'Verificar se o vaso tem boa drenagem'] },
            { type: 'Recuperação', methods: ['Deixar o solo secar completamente antes de voltar a regar', 'Considerar replantar se o solo estiver encharcado'] },
            { type: 'Prevenção', methods: ['Usar a regra do dedo: regar apenas quando os primeiros 2-3cm de solo estiverem secos', 'Preferir vasos de terracota que respiram melhor'] }
        ]
    },
    'underwatering': {
        description: 'A falta de água causa folhas murchas, secas nas pontas e bordas acastanhadas. O solo está completamente seco e afastado das paredes do vaso.',
        treatments: [
            { type: 'Imediato', methods: ['Regar abundantemente até a água sair pelo furo de drenagem', 'Se o solo estiver muito seco, mergulhar o vaso em água por 15-20 minutos'] },
            { type: 'Recuperação', methods: ['Cortar as partes secas das folhas', 'Manter solo húmido (não encharcado) nos próximos dias'] },
            { type: 'Prevenção', methods: ['Estabelecer rotina de rega regular', 'Usar app ou lembretes para não esquecer', 'Considerar vasos com auto-rega'] }
        ]
    },
    'sunburn': {
        description: 'A queimadura solar causa manchas brancas ou castanhas nas folhas, especialmente nas áreas expostas diretamente ao sol. As folhas podem ficar crocantes.',
        treatments: [
            { type: 'Imediato', methods: ['Mover a planta para local com luz indireta', 'Não remover as folhas danificadas imediatamente (ainda fazem fotossíntese)'] },
            { type: 'Recuperação', methods: ['Manter boa hidratação', 'Após recuperação, reintroduzir luz solar gradualmente'] },
            { type: 'Prevenção', methods: ['Evitar mudanças bruscas de luminosidade', 'Usar cortinas para filtrar luz direta', 'Aclimatar plantas novas gradualmente'] }
        ]
    },
    'nitrogen deficiency': {
        description: 'A deficiência de nitrogénio causa amarelecimento das folhas mais velhas (na base), crescimento lento e folhas pequenas. O nitrogénio é essencial para o crescimento.',
        treatments: [
            { type: 'Imediato', methods: ['Aplicar fertilizante equilibrado NPK', 'Usar fertilizante líquido para absorção mais rápida'] },
            { type: 'Biológico', methods: ['Adicionar composto orgânico ao solo', 'Usar borra de café diluída (rica em nitrogénio)'] },
            { type: 'Prevenção', methods: ['Fertilizar regularmente durante a época de crescimento', 'Replantar anualmente com substrato fresco'] }
        ]
    },
    'aphids': {
        description: 'Os pulgões são pequenos insetos que se agrupam nos brotos e folhas novas, sugando a seiva. Causam folhas enroladas e deformadas, e secretam uma substância pegajosa.',
        treatments: [
            { type: 'Imediato', methods: ['Lavar a planta com jato de água para remover os pulgões', 'Limpar com pano humedecido em água e sabão neutro'] },
            { type: 'Biológico', methods: ['Pulverizar com água e sabão de potássio', 'Aplicar óleo de neem diluído', 'Introduzir joaninhas (predadores naturais)'] },
            { type: 'Prevenção', methods: ['Inspecionar regularmente as plantas', 'Manter plantas saudáveis (menos vulneráveis)', 'Evitar excesso de fertilizante azotado'] }
        ]
    },
    'spider mites': {
        description: 'Os ácaros são minúsculos e difíceis de ver. Causam pontos amarelos nas folhas e teias finas na parte inferior. Prosperam em ambientes secos e quentes.',
        treatments: [
            { type: 'Imediato', methods: ['Lavar as folhas com água (incluindo a parte inferior)', 'Aumentar a humidade à volta da planta'] },
            { type: 'Biológico', methods: ['Pulverizar com óleo de neem', 'Aplicar sabão inseticida', 'Usar ácaros predadores (controlo biológico)'] },
            { type: 'Prevenção', methods: ['Manter humidade adequada', 'Pulverizar as folhas regularmente com água', 'Isolar plantas novas antes de juntar às outras'] }
        ]
    },
    'mealybugs': {
        description: 'As cochonilhas aparecem como pequenas massas brancas e algodoadas nas folhas e caules. Sugam a seiva e enfraquecem a planta.',
        treatments: [
            { type: 'Imediato', methods: ['Remover manualmente com cotonete embebido em álcool', 'Isolar a planta afetada'] },
            { type: 'Biológico', methods: ['Pulverizar com óleo de neem', 'Aplicar água com sabão de potássio', 'Usar álcool isopropílico diluído (70%)'] },
            { type: 'Prevenção', methods: ['Inspecionar plantas novas antes de comprar', 'Manter plantas saudáveis e bem nutridas', 'Limpar regularmente as folhas'] }
        ]
    }
};

/**
 * Obtém informação detalhada sobre uma doença da base de conhecimento
 * @param {string} diseaseName - Nome da doença em inglês
 * @returns {Object|null} - Informação da doença ou null
 */
function getDiseaseKnowledge(diseaseName) {
    if (!diseaseName) return null;
    
    const lowerName = diseaseName.toLowerCase().trim();
    
    // Procurar correspondência exata
    if (DISEASE_KNOWLEDGE_BASE[lowerName]) {
        return DISEASE_KNOWLEDGE_BASE[lowerName];
    }
    
    // Procurar correspondência parcial
    for (const [key, value] of Object.entries(DISEASE_KNOWLEDGE_BASE)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
            return value;
        }
    }
    
    return null;
}

/**
 * Processa a resposta da API e converte para formato interno
 * @param {Object} apiResponse - Resposta da API Plant.id
 * @returns {Object} - Diagnóstico processado
 */
function processApiResponse(apiResponse) {
    const result = apiResponse.result || {};
    const healthAssessment = result.disease || result.health_assessment || {};
    const isHealthy = result.is_healthy?.binary ?? true;
    const healthProbability = result.is_healthy?.probability ?? 1;
    
    // Processar doenças/problemas detectados
    const diseases = healthAssessment.suggestions || [];
    const mainIssue = diseases.length > 0 ? diseases[0] : null;
    
    let status = 'healthy';
    let statusText = 'Saudável';
    let diagnosis = '';
    let treatments = [];
    let confidence = healthProbability;
    
    if (!isHealthy && mainIssue) {
        const probability = mainIssue.probability || 0;
        const diseaseName = mainIssue.name || '';
        const translatedName = translateDiseaseName(diseaseName);
        
        if (probability > 0.5) {
            status = 'unhealthy';
            statusText = translatedName;
        } else if (probability > 0.2) {
            status = 'needs-water';
            statusText = 'Atenção necessária';
        }
        
        // Obter informação da nossa base de conhecimento
        const knowledgeBase = getDiseaseKnowledge(diseaseName);
        
        // Construir diagnóstico detalhado
        const details = mainIssue.details || {};
        
        // Usar descrição da API se disponível, senão usar nossa base de conhecimento
        if (details.description) {
            diagnosis = details.description;
        } else if (knowledgeBase) {
            diagnosis = knowledgeBase.description;
        } else {
            diagnosis = `Foi detectado um possível problema: ${translatedName}. ` +
                       `Probabilidade: ${Math.round(probability * 100)}%. ` +
                       `Recomendamos inspecionar a planta cuidadosamente e isolar de outras plantas se necessário.`;
        }
        
        // Tratamentos recomendados - priorizar API, depois base de conhecimento
        if (details.treatment) {
            if (typeof details.treatment === 'object') {
                treatments = Object.entries(details.treatment).map(([type, methods]) => ({
                    type: translateTreatmentType(type),
                    methods: Array.isArray(methods) ? methods : [methods]
                }));
            } else {
                treatments = [{ type: 'Geral', methods: [details.treatment] }];
            }
        } else if (knowledgeBase && knowledgeBase.treatments) {
            // Usar tratamentos da nossa base de conhecimento
            treatments = knowledgeBase.treatments;
        } else {
            // Tratamentos genéricos de fallback
            treatments = [
                { 
                    type: 'Imediato', 
                    methods: [
                        'Isolar a planta de outras para evitar propagação',
                        'Remover partes visivelmente afetadas com tesoura esterilizada'
                    ] 
                },
                { 
                    type: 'Prevenção', 
                    methods: [
                        'Garantir boa circulação de ar à volta da planta',
                        'Evitar excesso de rega e água parada',
                        'Manter a planta em local com luz adequada'
                    ] 
                }
            ];
        }
        
        confidence = probability;
    } else {
        diagnosis = 'A planta apresenta bom estado de saúde. Continue com os cuidados regulares de rega e exposição solar adequada.';
        confidence = healthProbability;
    }
    
    // Identificação da espécie (se disponível)
    let species = null;
    if (result.classification?.suggestions?.length > 0) {
        const topSuggestion = result.classification.suggestions[0];
        species = {
            name: topSuggestion.name,
            commonNames: topSuggestion.details?.common_names || [],
            probability: topSuggestion.probability
        };
    }
    
    return {
        status,
        statusText,
        diagnosis,
        treatments,
        confidence,
        species,
        isHealthy,
        rawDiseases: diseases.slice(0, 3), // Top 3 problemas detectados
        analyzedAt: new Date().toISOString()
    };
}

/**
 * Simula um diagnóstico quando a API não está disponível
 * Usado para demonstração/testes
 * @returns {Object}
 */
function simulateDiagnosis() {
    const scenarios = [
        {
            status: 'healthy',
            statusText: 'Saudável',
            diagnosis: 'A planta apresenta excelente estado de saúde! As folhas estão vigorosas e com boa coloração. Continue com o regime atual de cuidados.',
            confidence: 0.92,
            isHealthy: true,
            treatments: []
        },
        {
            status: 'needs-water',
            statusText: 'Precisa de água',
            diagnosis: 'Foram detectados sinais de desidratação leve. As folhas mostram ligeira perda de turgidez. Recomenda-se aumentar a frequência de rega.',
            confidence: 0.78,
            isHealthy: false,
            treatments: [
                { type: 'imediato', methods: ['Regar abundantemente até a água sair pelo furo de drenagem'] },
                { type: 'prevenção', methods: ['Estabelecer rotina de rega mais frequente', 'Verificar humidade do solo antes de regar'] }
            ]
        },
        {
            status: 'unhealthy',
            statusText: 'Possível doença fúngica',
            diagnosis: 'Detectadas manchas nas folhas que podem indicar infeção fúngica. A probabilidade é de 73%. Recomenda-se tratamento preventivo.',
            confidence: 0.73,
            isHealthy: false,
            treatments: [
                { type: 'biológico', methods: ['Aplicar fungicida natural à base de bicarbonato de sódio'] },
                { type: 'químico', methods: ['Fungicida sistémico se os sintomas persistirem'] },
                { type: 'prevenção', methods: ['Evitar molhar as folhas durante a rega', 'Melhorar a circulação de ar'] }
            ]
        },
        {
            status: 'needs-water',
            statusText: 'Excesso de sol',
            diagnosis: 'As folhas apresentam sinais de queimadura solar. Algumas áreas mostram descoloração e bordas secas. A planta pode estar exposta a luz solar direta excessiva.',
            confidence: 0.81,
            isHealthy: false,
            treatments: [
                { type: 'imediato', methods: ['Mover para local com luz indireta'] },
                { type: 'recuperação', methods: ['Remover folhas muito danificadas', 'Manter solo húmido durante recuperação'] }
            ]
        },
        {
            status: 'unhealthy',
            statusText: 'Deficiência nutricional',
            diagnosis: 'As folhas amareladas na base sugerem deficiência de nitrogénio. A planta precisa de nutrientes adicionais para recuperar a sua vitalidade.',
            confidence: 0.68,
            isHealthy: false,
            treatments: [
                { type: 'fertilização', methods: ['Aplicar fertilizante equilibrado NPK', 'Considerar fertilizante líquido para absorção rápida'] },
                { type: 'longo prazo', methods: ['Estabelecer rotina de fertilização mensal', 'Verificar pH do solo'] }
            ]
        }
    ];
    
    // Escolher cenário aleatório
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    const scenario = scenarios[randomIndex];
    
    return {
        ...scenario,
        species: null,
        rawDiseases: [],
        analyzedAt: new Date().toISOString(),
        isSimulated: true
    };
}

/**
 * Formata o diagnóstico para exibição
 * @param {Object} diagnosis - Resultado do diagnóstico
 * @returns {string} - HTML formatado
 */
function formatDiagnosisForDisplay(diagnosis) {
    let html = `<p class="diagnosis-text">${diagnosis.diagnosis}</p>`;
    
    // Adicionar confiança
    const confidencePercent = Math.round(diagnosis.confidence * 100);
    html += `<p class="diagnosis-confidence">Confiança da análise: <strong>${confidencePercent}%</strong></p>`;
    
    // Adicionar tratamentos se existirem
    if (diagnosis.treatments && diagnosis.treatments.length > 0) {
        html += '<div class="diagnosis-treatments"><h4>Tratamentos recomendados:</h4><ul>';
        diagnosis.treatments.forEach(treatment => {
            html += `<li><strong>${treatment.type}:</strong><ul>`;
            treatment.methods.forEach(method => {
                html += `<li>${method}</li>`;
            });
            html += '</ul></li>';
        });
        html += '</ul></div>';
    }
    
    // Aviso se é simulado
    if (diagnosis.isSimulated) {
        html += '<p class="diagnosis-simulated">⚠️ Diagnóstico simulado. Configure a API key para análise real.</p>';
    }
    
    return html;
}

/**
 * Mostra modal de loading durante análise
 * @param {string} message - Mensagem a exibir
 * @returns {HTMLElement} - Elemento do modal
 */
function showAnalysisLoading(message = 'A analisar a sua planta com IA...') {
    const existingModal = document.getElementById('aiAnalysisLoading');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'aiAnalysisLoading';
    modal.className = 'ai-loading-overlay';
    modal.innerHTML = `
        <div class="ai-loading-container">
            <div class="ai-loading-spinner"></div>
            <h3 class="ai-loading-title">🌿 Análise em Progresso</h3>
            <p class="ai-loading-message">${message}</p>
            <div class="ai-loading-steps">
                <div class="ai-step active" data-step="1">📷 A processar imagem...</div>
                <div class="ai-step" data-step="2">🔬 A analisar saúde...</div>
                <div class="ai-step" data-step="3">📋 A gerar diagnóstico...</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animar passos
    let currentStep = 1;
    const stepInterval = setInterval(() => {
        currentStep++;
        if (currentStep <= 3) {
            const steps = modal.querySelectorAll('.ai-step');
            steps.forEach((step, index) => {
                if (index < currentStep) {
                    step.classList.add('active');
                    if (index < currentStep - 1) {
                        step.classList.add('completed');
                    }
                }
            });
        } else {
            clearInterval(stepInterval);
        }
    }, 1000);
    
    modal._stepInterval = stepInterval;
    return modal;
}

/**
 * Remove o modal de loading
 */
function hideAnalysisLoading() {
    const modal = document.getElementById('aiAnalysisLoading');
    if (modal) {
        if (modal._stepInterval) clearInterval(modal._stepInterval);
        modal.classList.add('fade-out');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Mostra resultado do diagnóstico em modal
 * @param {Object} diagnosis - Resultado do diagnóstico
 * @param {Function} onSchedule - Callback para agendar
 * @param {Function} onDismiss - Callback para dispensar
 */
function showDiagnosisResult(diagnosis, onSchedule, onDismiss) {
    const existingModal = document.getElementById('aiDiagnosisResult');
    if (existingModal) existingModal.remove();
    
    const statusColors = {
        'healthy': '#28a745',
        'needs-water': '#ffc107',
        'unhealthy': '#dc3545'
    };
    
    const statusIcons = {
        'healthy': '✅',
        'needs-water': '💧',
        'unhealthy': '⚠️'
    };
    
    const modal = document.createElement('div');
    modal.id = 'aiDiagnosisResult';
    modal.className = 'ai-result-overlay';
    modal.innerHTML = `
        <div class="ai-result-container">
            <button class="ai-result-close" onclick="this.closest('.ai-result-overlay').remove()">✕</button>
            
            <div class="ai-result-header">
                <span class="ai-result-icon">${statusIcons[diagnosis.status] || '🌿'}</span>
                <div class="ai-result-status">
                    <h2 class="ai-result-title">Diagnóstico Completo</h2>
                    <p class="ai-result-status-text" style="color: ${statusColors[diagnosis.status] || '#333'}">${diagnosis.statusText}</p>
                    <span class="ai-badge">Resultados analisados por IA</span>
                </div>
                <div class="ai-result-confidence">
                    <div class="confidence-circle" style="--confidence: ${diagnosis.confidence}">
                        <span>${Math.round(diagnosis.confidence * 100)}%</span>
                    </div>
                    <small>Confiança</small>
                </div>
            </div>
            
            <div class="ai-result-body">
                <div class="ai-diagnosis-section">
                    <h3>📋 Análise</h3>
                    <p>${diagnosis.diagnosis}</p>
                </div>
                
                ${diagnosis.treatments && diagnosis.treatments.length > 0 ? `
                <div class="ai-treatments-section">
                    <h3>💊 Tratamentos Recomendados</h3>
                    ${diagnosis.treatments.map(t => `
                        <div class="ai-treatment-item">
                            <strong>${t.type}:</strong>
                            <ul>
                                ${t.methods.map(m => `<li>${m}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${diagnosis.species ? `
                <div class="ai-species-section">
                    <h3>🌱 Espécie Identificada</h3>
                    <p><strong>${diagnosis.species.name}</strong></p>
                    ${diagnosis.species.commonNames?.length > 0 ? 
                        `<p class="common-names">Nomes comuns: ${diagnosis.species.commonNames.join(', ')}</p>` : ''}
                </div>
                ` : ''}
                
                ${diagnosis.isSimulated ? `
                <div class="ai-simulated-warning">
                    <p>⚠️ Este é um diagnóstico simulado para demonstração.</p>
                    <p>Configure a API key do Plant.id para análise real com IA.</p>
                </div>
                ` : ''}
            </div>
            
            <div class="ai-result-actions">
                <button class="btn-ai-schedule" id="aiScheduleBtn">📅 Agendar Cuidados</button>
                <button class="btn-ai-dismiss" id="aiDismissBtn">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('aiScheduleBtn').addEventListener('click', () => {
        modal.remove();
        if (onSchedule) onSchedule();
    });
    
    document.getElementById('aiDismissBtn').addEventListener('click', () => {
        modal.remove();
        if (onDismiss) onDismiss();
    });
    
    // Fechar com ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// Exportar funções para uso global
window.PlantDiagnosis = {
    analyzePlantHealth,
    simulateDiagnosis,
    formatDiagnosisForDisplay,
    showAnalysisLoading,
    hideAnalysisLoading,
    showDiagnosisResult,
    isApiKeyConfigured
};

console.log('🌿 Módulo de Diagnóstico de Plantas carregado');
