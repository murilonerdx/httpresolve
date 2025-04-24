# http-resolve: Biblioteca de Bulkhead e Rate Limiting para Spring Boot

[![GitHub](https://img.shields.io/github/v/tag/SEU_USUARIO/http-resolve?label=Release)](https://github.com/SEU_USUARIO/http-resolve/tags)
[![GitHub License](https://img.shields.io/github/license/SEU_USUARIO/http-resolve)](https://github.com/SEU_USUARIO/http-resolve/blob/main/LICENSE)
[![JitPack](https://jitpack.io/v/SEU_USUARIO/http-resolve.svg)](https://jitpack.io/#SEU_USUARIO/http-resolve)

`http-resolve` é uma biblioteca Spring Boot que fornece funcionalidades de **Bulkhead** e **Rate Limiting** para proteger suas aplicações contra sobrecarga e picos de tráfego.

## Recursos

- **Bulkhead**: Limita o número de requisições que podem ser processadas simultaneamente.
- **Rate Limiting**: Limita o número de requisições que podem ser feitas em um determinado período de tempo.
- **Métricas**: Integração com Micrometer para monitoramento (opcional).

## Como usar

### 1. Adicione a dependência

#### Via JitPack (recomendado)

Adicione o repositório JitPack ao seu `pom.xml`:

```xml
<repositories>
  <repository>
    <id>jitpack.io</id>
    <url>https://jitpack.io</url>
  </repository>
</repositories>
