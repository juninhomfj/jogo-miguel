import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const raiz = process.cwd();
const erros = [];

const falhar = (mensagem) => {
    erros.push(mensagem);
    console.error(`ERRO: ${mensagem}`);
};

const listar = (diretorio) => {
    if (!existsSync(diretorio)) return [];

    return readdirSync(diretorio).flatMap((nome) => {
        const caminho = join(diretorio, nome);
        return statSync(caminho).isDirectory()
            ? listar(caminho)
            : [caminho];
    });
};

const arquivosJavaScript = listar(join(raiz, 'js'))
    .filter((arquivo) => arquivo.endsWith('.js'));

if (arquivosJavaScript.length === 0) {
    falhar('nenhum arquivo JavaScript encontrado em js/');
}

for (const arquivo of arquivosJavaScript) {
    try {
        execFileSync(
            process.execPath,
            ['--check', arquivo],
            { stdio: 'pipe' }
        );
        console.log(`OK JS: ${relative(raiz, arquivo)}`);
    } catch (erro) {
        falhar(`JavaScript inválido: ${relative(raiz, arquivo)}`);
        if (erro.stderr) console.error(String(erro.stderr));
    }
}

const indexPath = join(raiz, 'index.html');
if (!existsSync(indexPath)) {
    falhar('index.html ausente');
} else {
    const html = readFileSync(indexPath, 'utf8');
    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
        .map((resultado) => resultado[1])
        .filter((origem) => !/^https?:\/\//i.test(origem));

    for (const origem of scripts) {
        const caminhoLimpo = origem.split('?')[0].split('#')[0];
        const caminho = join(raiz, caminhoLimpo);
        if (!existsSync(caminho)) {
            falhar(`script local referenciado e ausente: ${caminhoLimpo}`);
        } else {
            console.log(`OK SCRIPT: ${caminhoLimpo}`);
        }
    }

    const buildIds = [...html.matchAll(/window\.__MIGUEL_BUILD_ID__\s*=\s*['"]([^'"]+)['"]/g)];
    if (buildIds.length !== 1) {
        falhar(`index.html deve possuir exatamente um BUILD_ID; encontrados: ${buildIds.length}`);
    } else {
        console.log(`OK BUILD: ${buildIds[0][1]}`);
    }

    for (const cena of ['Tutorial', 'ResultadoTutorial', 'Fase1']) {
        if (!html.includes(`class ${cena}`)) {
            falhar(`cena obrigatória ausente no index.html: ${cena}`);
        }
    }
}

for (const arquivo of arquivosJavaScript) {
    const conteudo = readFileSync(arquivo, 'utf8');
    const referencias = [...conteudo.matchAll(/['"](assets\/[^'"?#]+)['"]/g)]
        .map((resultado) => resultado[1]);

    for (const referencia of referencias) {
        if (!existsSync(join(raiz, referencia))) {
            falhar(`asset ausente referenciado em ${relative(raiz, arquivo)}: ${referencia}`);
        }
    }
}

const faseConfigPath = join(raiz, 'js', 'phase-config.js');
if (existsSync(faseConfigPath)) {
    const faseConfig = readFileSync(faseConfigPath, 'utf8');
    if (!faseConfig.includes("'js/robot-attack.js'")) {
        falhar('phase-config.js não carrega js/robot-attack.js');
    }
}

if (erros.length > 0) {
    console.error(`\nVALIDAÇÃO REPROVADA: ${erros.length} erro(s).`);
    process.exit(1);
}

console.log(`\nVALIDAÇÃO APROVADA: ${arquivosJavaScript.length} arquivo(s) JavaScript verificado(s).`);
