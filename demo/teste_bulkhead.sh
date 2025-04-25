#!/bin/bash

set +H  # Desabilita expansão de histórico ("!") no bash

# Configuração dos endpoints de acordo com seu controller
URL_PROTEGIDO="http://localhost:8080/demo/pagamento-protegido"
URL_LIVRE="http://localhost:8080/demo/pagamento-livre"
QTD_PARALELAS=600

echo "Teste BulkheadRateLimit - $QTD_PARALELAS simultâneas"
echo "Endpoint protegido:   $URL_PROTEGIDO"
echo "Endpoint sem proteção: $URL_LIVRE"
echo

## Função para requisição e log
faz_requisicao() {
  local endpoint="$1"
  local tipo="$2"
  local id="$3"

  resposta=$(curl -s -w " [id:$id] [código:%{http_code}] [tempo:%{time_total}s]\n" "$endpoint" -o /dev/null)
  echo "$tipo$resposta"
}

echo "###################"
echo "# Teste PROTEGIDO #"
echo "###################"
echo '(Aguarde todas saírem. Status >=500 ou ==429 é bloqueio.)'
echo

: > resultado_protegido.log

# Dispara as requisições em paralelo e aguarda o término
for i in $(seq 1 $QTD_PARALELAS); do
  faz_requisicao "$URL_PROTEGIDO" "PROTEGIDO:" "$i" >> resultado_protegido.log &
done
wait

cat resultado_protegido.log
echo

# Resumo do protegido
OKS=$(grep -c "código:200" resultado_protegido.log)
BLOCKS=$(grep -E -c "código:(503|429|5[0-9][0-9])" resultado_protegido.log)

echo ">>>> PROTEGIDO: $OKS sucesso(s), $BLOCKS bloqueada(s)"
echo

echo "##################"
echo "# Teste SEM LIMITE #"
echo "##################"
echo

: > resultado_livre.log

for i in $(seq 1 $QTD_PARALELAS); do
  faz_requisicao "$URL_LIVRE" "LIVRE:" "$i" >> resultado_livre.log &
done
wait

cat resultado_livre.log
echo

OKS2=$(grep -c "código:200" resultado_livre.log)
BLOCKS2=$(grep -E -c "código:(503|429|5[0-9][0-9])" resultado_livre.log)

echo ">>>> SEM LIMITE: $OKS2 sucesso(s), $BLOCKS2 bloqueada(s)"
echo

echo "===================="
echo "Resumo Final"
echo "--------------------"
echo "Protegido:      OK=$OKS   bloqueado=$BLOCKS"
echo "Sem Proteção:   OK=$OKS2  bloqueado=$BLOCKS2"
echo "===================="

echo
echo "Dica: Observe o tempo de resposta das requisições bloqueadas (é normalmente muito curto para requests rejeitadas imediatamente)"
