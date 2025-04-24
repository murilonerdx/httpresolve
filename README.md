#  Starter de Bulkhead e Rate Limiting para Spring Boot

[![GitHub Version](https://img.shields.io/github/v/tag/murilonerdx/httpresolve?label=Release)](https://github.com/murilonerdx/httpresolve/tags)
[![GitHub License](https://img.shields.io/github/license/murilonerdx/httpresolve)](https://github.com/murilonerdx/httpresolve/blob/main/LICENSE)
[![JitPack](https://jitpack.io/v/murilonerdx/httpresolve.svg)](https://jitpack.io/#murilonerdx/httpresolve)

**httpresolve** é uma biblioteca (Spring Boot Starter) para proteger seus sistemas Java contra sobrecarga e abuso, oferecendo mecanismos robustos de **Bulkhead (barreira de contenção)** e **Rate Limiting (limitação de taxa)**.  
Ideal para microsserviços, APIs públicas, gateways e sistemas de missão crítica.

---

## ✨ Recursos

- **Bulkhead**: Permite configurar limites simultâneos e fila para requisições concorrentes.
- **Rate Limiting**: Limita requisições por janela de tempo configurável.
- **Extremamente configurável via `application.yml`/`properties`**
- Suporte a múltiplas políticas (por recurso, rota, service, etc.).
- **Integração opcional com Micrometer/Actuator** para métricas detalhadas.
- Implementação leve e fácil de integrar.
- Zero boilerplate: basta anotar e usar.

---

## 🚀 Instalação

### Com Maven (via [JitPack](https://jitpack.io/#murilonerdx/httpresolve)):

Adicione o repositório JitPack:

```xml
<repositories>
  <repository>
    <id>jitpack.io</id>
    <url>https://jitpack.io</url>
  </repository>
</repositories>
```
Depois, adicione a dependência:

```xml
<dependency>
  <groupId>com.github.murilonerdx</groupId>
  <artifactId>httpresolve</artifactId>
  <version>v0.1.0</version> <!-- Use a última tag lançada -->
</dependency>
```

🛠️ Como Usar
1. Configure suas políticas no application.yml
   Exemplo:

```yaml
spring:
  main:
    allow-circular-references: true
bulkhead-rate-limit:
  enabled: true
  metrics-enabled: true
  default-policy: default
  policies:
    default:
      bulkhead:
        max-concurrent-calls: 3      # Máximo 3 chamadas simultâneas
        max-queue-size: 2            # Até 2 requisições podem esperar
        queue-timeout: 5000ms        # Timeout de 5 segundos na fila
      rate-limit:
        limit: 5                     # Máximo 5 chamadas
        window: 10s                  # Janela de 10 segundos
```

2. Anote seus métodos ou controllers
   java
   import com.murilo_pereira.httpresolve.annotation.BulkheadRateLimit;

```java
@RestController
@RequestMapping("/demo")
public class DemoController {

    @BulkheadRateLimit("default")
    @GetMapping("/pagamento-protegido")
    public String pagamentoProtegido() throws InterruptedException {
        // Simula processamento
        Thread.sleep(2000L);
        return "Pagamento protegido";
    }

    @BulkheadRateLimit("premium")
    @GetMapping("/pagamento-premium")
    public String pagamentoPremium() throws InterruptedException {
        Thread.sleep(500L);
        return "Pagamento premium protegido";
    }
}
```

3. Teste
   Faça várias requests concorrentes para /pagamento-protegido e veja o bloqueio, a fila e as rejeições
   (verifique o status HTTP 200, 503 ou 429).

⚙️ Propriedades de Configuração

```
bulkhead-rate-limit.enabled	boolean	Habilita/desabilita o starter	true
bulkhead-rate-limit.metrics-enabled	boolean	Habilita integração com Micrometer/Actuator	true
bulkhead-rate-limit.default-policy	string	Nome da política padrão	default
bulkhead-rate-limit.policies.[nome].bulkhead.max-concurrent-calls	int	Máximo de execuções simultâneas	3
bulkhead-rate-limit.policies.[nome].bulkhead.max-queue-size	int	Quantos aguardam na fila	2
bulkhead-rate-limit.policies.[nome].bulkhead.queue-timeout	duração	Timeout na fila em ms, s, etc	5000ms, 2s
bulkhead-rate-limit.policies.[nome].rate-limit.limit	int	Chamadas por janela	5
bulkhead-rate-limit.policies.[nome].rate-limit.window	duração	Duração da janela (ex: 1s, 10s, 2m)	10s
```

🔍 Métricas
Se usar Spring Boot Actuator + Micrometer, esta biblioteca expõe as seguintes métricas por política:
```
bulkhead.rejected{policy=...} — Requisições rejeitadas por bulkhead
ratelimit.rejected{policy=...} — Requisições rejeitadas por rate limit
bulkhead.available{policy=...} — Slots disponíveis
ratelimit.available{policy=...} — Permissões restantes na janela
Acesse em /actuator/metrics e filtre pelas métricas acima.
```

🔐 Exemplo de tratamento customizado de erro
Se quiser retornar códigos HTTP específicos (ex: 503), personalize um handler:

```java
@RestControllerAdvice
public class BulkheadExceptionHandler {

	@ExceptionHandler(BulkheadRateLimitException.class)
    public ResponseEntity<?> handleBulkhead(BulkheadRateLimitException ex) {
        if (ex.getMessage() != null && ex.getMessage().contains("Bulkhead"))
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Serviço ocupado, tente mais tarde.");
	    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Muitas requisições.");
	}
}
```

💡 Casos de uso
```
Proteger APIs públicas contra abuse (crawlers, DDoS)
Isolar recursos internos (ex: integração com um serviço legado instável)
Evitar que um fluxo sobrecarregue a aplicação inteira
Monitorar e ajustar limites baseando-se nas métricas
```
