# Sistema de Prevenção de Conflitos - Smart Plants

## Visão Geral
Sistema centralizado que impede a coexistência de agendamentos conflitantes no calendário.

## Tipos de Agendamento
1. **Sistema Automático** - Rega automática baseada em frequência semanal
2. **Rega Recorrente** - Rega repetida a cada X dias
3. **Rega Manual** - Rega agendada para uma data específica

## Regras de Conflito

### ❌ NUNCA PODEM COEXISTIR:
- Sistema Automático + Recorrência no mesmo dia
- Sistema Automático + Rega Manual no mesmo dia
- Recorrência + Rega Manual no mesmo dia
- Recorrência + Recorrência no mesmo dia

### ✅ Princípio: **UM TIPO DE REGA POR DIA**

## Pontos de Verificação

### 1. Calendário (`calendario.js`)
**Ao adicionar rega manual:**
- Verifica se há sistema automático ativo naquele dia
- Verifica se há recorrência ativa naquele dia
- Mostra modal de conflito se detectado

**Ao criar recorrência:**
- Verifica próximas 10 ocorrências
- Detecta conflitos com sistema automático
- Detecta conflitos com regas manuais existentes
- Mostra modal com todos os conflitos encontrados

### 2. Sistema de Rega (`sistema_rega.js`)
**Ao salvar configuração:**
- Verifica se há regas personalizadas (manuais ou recorrentes)
- Oferece opções:
  - Remover personalizadas e ativar sistema
  - Manter personalizadas e adicionar sistema (dias livres)

### 3. Minhas Plantas (`minhasplantas.js`)
**Ao escolher "Agenda Personalizada":**
- Verifica se há sistema automático ativo
- Se SIM: Oferece desativar sistema ou manter (sem criar recorrência)
- Se NÃO: Prossegue normalmente

**Ao escolher "Sistema Automático":**
- Verifica se há agendas existentes
- Remove todas e materializa 4 regas/semana

## Modal de Resolução de Conflitos

Quando detectado conflito, o usuário vê:

```
⚠️ Conflito de Agendamento

A [tipo de agenda] que está a tentar criar conflita com 
agendas já existentes.

⚠️ X Conflito(s) Detectado(s)
Com: [lista de tipos]

O que deseja fazer?

❌ Cancelar e Manter Agendas Existentes
   Não criar esta agenda e manter todas as agendas atuais

🔄 Substituir Agendas Conflitantes
   Remover agendas que causam conflito e criar esta agenda
```

## Funções Centralizadas

### `hasConflictOnDate(plantId, dateStr, excludeSource)`
Verifica se uma data específica tem conflito

### `checkIrrigationSystemConflicts(plantId, weeklyWatering)`
Verifica conflitos do sistema nos próximos 30 dias

### `checkRecurrenceConflicts(plantId, startDate, intervalDays)`
Verifica conflitos de recorrência nas próximas 10 ocorrências

### `checkManualWateringConflict(plantId, dateStr)`
Verifica se rega manual conflita com agendas existentes

### `showConflictModal(plantId, conflicts, actionType, actionData, onResolve)`
Mostra modal padronizado de resolução de conflitos

### `resolveConflicts(plantId, conflicts)`
Remove automaticamente as agendas conflitantes

## Fluxos Principais

### Fluxo 1: Adicionar Rega Manual
1. Usuário clica em dia vazio
2. Sistema verifica conflitos
3. Se conflito: Modal de resolução
4. Se sem conflito: Adiciona diretamente

### Fluxo 2: Criar Recorrência
1. Usuário define intervalo
2. Sistema calcula próximas ocorrências
3. Verifica cada ocorrência
4. Se conflitos: Modal com lista completa
5. Se sem conflito: Cria recorrência

### Fluxo 3: Ativar Sistema Automático
1. Usuário configura frequência
2. Sistema verifica regas personalizadas
3. Se existem: Modal de conflito
4. Se não existem: Salva configuração

### Fluxo 4: Vindo de Diagnóstico
1. Verifica tipo escolhido
2. Se Personalizada + Sistema ativo: Obriga escolha
3. Se Sistema: Remove tudo e materializa 4/semana
4. Prevenção adicional no calendário

## Garantias do Sistema

✅ **Nunca haverá duas agendas no mesmo dia**
✅ **Usuário sempre é avisado antes de conflito**
✅ **Opções claras de resolução**
✅ **Detecção em tempo real**
✅ **Funciona em todos os pontos de entrada**

## Benefícios

1. **Consistência**: Um único tipo de rega por dia
2. **Transparência**: Usuário sempre sabe o que está acontecendo
3. **Controle**: Usuário decide como resolver conflitos
4. **Prevenção**: Detecta antes de criar
5. **Centralização**: Lógica reutilizável em todo o sistema
