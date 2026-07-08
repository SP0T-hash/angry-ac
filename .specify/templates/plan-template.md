# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Summary

[Extrair da spec: requisito principal + abordagem técnica da pesquisa]

## Technical Context

**Language/Version**: [e.g., TypeScript 5.x, C# 12]
**Primary Dependencies**: [e.g., Next.js 16, .NET 8]
**Storage**: [e.g., PostgreSQL, Redis]
**Testing**: [e.g., Vitest, xUnit]
**Target Platform**: [e.g., Vercel, AWS ECS]
**Project Type**: [e.g., Web API, Library]
**Performance Goals**: [e.g., <200ms p95, 1000 req/s]
**Constraints**: [e.g., Conformidade ICP-Brasil]
**Scale/Scope**: [e.g., 1000+ usuários, 10+ endpoints]

## Constitution Check

### Simplicity Gate (Article VII)
- [ ] Usando ≤3 projetos?
- [ ] Sem future-proofing?

### Anti-Abstraction Gate (Article VIII)
- [ ] Usando framework diretamente?
- [ ] Representação única de modelo?

### Integration-First Gate (Article IX)
- [ ] Contratos definidos?
- [ ] Testes de contrato escritos?

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # Este arquivo
├── spec.md              # Especificação da feature
├── data-model.md        # Modelo de dados
├── research.md          # Pesquisa técnica
└── contracts/           # Contratos de API
```

### Source Code (repository root)

```text
src/
├── [caminho/para/codigo]
└── tests/
    └── [caminho/para/testes]
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [necessidade atual] | [por que 3 projetos não bastam] |

## Fases de Implementação

### Fase 1: [Nome da Fase]
- [ ] Tarefa 1
- [ ] Tarefa 2

### Fase 2: [Nome da Fase]
- [ ] Tarefa 1
- [ ] Tarefa 2

## Checklist de Validação

- [ ] Todos os requisitos funcionais são atendidos
- [ ] Testes unitários passam
- [ ] Testes de integração passam
- [ ] Performance atende metas
- [ ] Documentação atualizada
