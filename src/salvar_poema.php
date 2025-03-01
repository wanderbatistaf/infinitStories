<?php
// Permite requisições de qualquer origem
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Verifica se a requisição é POST
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Recebe os dados JSON do poema
    $poemaJson = file_get_contents("php://input");
    $poemaData = json_decode($poemaJson, true);

    // Verifica se os dados do poema foram enviados corretamente
    if (!isset($poemaData['title']) || !isset($poemaData['strophes'])) {
        http_response_code(400); // Retorna erro 400 (Bad Request)
        echo json_encode(["error" => "Dados do poema estão incompletos!"]);
        exit;
    }

    $tituloPoema = $poemaData['title'];
    $caminhoPasta = '_books/poemas/';
    $caminhoArquivo = $caminhoPasta . 'poemas.json';

    // Verifica se a pasta "_books/poemas" existe, se não, cria
    if (!is_dir($caminhoPasta)) {
        mkdir($caminhoPasta, 0777, true);
    }

    // Lê o JSON existente (se houver)
    $poemasExistentes = [];
    if (file_exists($caminhoArquivo)) {
        $conteudoAtual = file_get_contents($caminhoArquivo);
        $poemasExistentes = json_decode($conteudoAtual, true);
    }

    // Garante que a estrutura seja um array
    if (!isset($poemasExistentes['Poemas']) || !is_array($poemasExistentes['Poemas'])) {
        $poemasExistentes['Poemas'] = [];
    }

    // Adiciona o novo poema
    $poemasExistentes['Poemas'][] = [
        "title" => $tituloPoema,
        "strophes" => $poemaData['strophes']
    ];

    // Salva o JSON atualizado no arquivo
    if (file_put_contents($caminhoArquivo, json_encode($poemasExistentes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(["success" => "Poema salvo com sucesso!"]);
    } else {
        http_response_code(500); // Erro interno do servidor
        echo json_encode(["error" => "Erro ao salvar o poema."]);
    }
} else {
    http_response_code(405); // Método não permitido
    echo json_encode(["error" => "Método inválido."]);
}
?>
