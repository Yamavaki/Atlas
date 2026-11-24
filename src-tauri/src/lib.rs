// Atlas - casca do app: abre a pasta app/ numa janela com WebView2 (usa a placa de video)
// e liga os plugins de arquivos (pasta do mundo, artes do PC), dialogo (escolher pasta) e links.
use std::io::Write;

// Atualizar agora: baixa o instalador da versao nova (Releases do GitHub), fecha o app,
// roda o instalador sem perguntas e abre o Atlas de novo quando ele termina.
#[tauri::command]
async fn atualizar(app: tauri::AppHandle, url: String) -> Result<(), String> {
    if !url.starts_with("https://github.com/Yamavaki/Atlas/releases/download/") {
        return Err("Endereço de atualização inválido.".into());
    }
    let resp = reqwest::get(&url).await.map_err(|e| format!("Não foi possível baixar a atualização: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("O servidor de atualizações respondeu {}.", resp.status()));
    }
    let bytes = resp.bytes().await.map_err(|e| format!("O download foi interrompido: {e}"))?;
    if bytes.len() < 500_000 {
        return Err("O arquivo baixado não é um instalador válido.".into());
    }
    let dir = std::env::temp_dir().join("atlas-atualizacao");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let setup = dir.join("Atlas-setup.exe");
    {
        let mut f = std::fs::File::create(&setup).map_err(|e| e.to_string())?;
        f.write_all(&bytes).map_err(|e| e.to_string())?;
    }
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    // espera o app fechar (ping de 3 s), instala em modo passivo (/P: so a barra de progresso) e reabre
    // um .bat evita o problema de aspas do cmd (os argumentos do Rust escapam as aspas com \", que o cmd nao entende)
    let bat = dir.join("atualizar-atlas.bat");
    let texto = format!("@echo off\r\nping -n 3 127.0.0.1 >nul\r\nstart \"\" /wait \"{}\" /P\r\nstart \"\" \"{}\"\r\n", setup.display(), exe.display());
    std::fs::write(&bat, texto).map_err(|e| e.to_string())?;
    let mut cmd = std::process::Command::new("cmd");
    #[cfg(windows)] { use std::os::windows::process::CommandExt; cmd.raw_arg(format!("/C \"{}\"", bat.display())); cmd.creation_flags(0x0800_0000); }
    #[cfg(not(windows))] { cmd.arg("/C").arg(&bat); }
    cmd.spawn().map_err(|e| format!("Não foi possível abrir o instalador: {e}"))?;
    app.exit(0);
    Ok(())
}


// ---------- 1.50: atualização da interface sem reinstalar ----------
// A interface (pasta app/) pode vir baixada: os arquivos que mudaram ficam em <dados do app>/web/<versão>/ e são
// servidos no lugar dos que vieram dentro do app; o resto continua vindo de dentro do app. A parte nativa (este
// arquivo, plugins) só muda com um app novo: por isso cada interface diz a "nativa" de que precisa (app/nativo.txt).
// Proteção: a versão baixada que não confirmar a abertura (web_ok) duas vezes seguidas é desligada sozinha.
const NATIVO: u32 = 1;
static WEB_DIR: std::sync::OnceLock<std::path::PathBuf> = std::sync::OnceLock::new();

fn cmp_versao(a: &str, b: &str) -> std::cmp::Ordering {
    let p = |s: &str| s.trim().split('.').map(|x| x.parse::<u64>().unwrap_or(0)).collect::<Vec<_>>();
    let (a, b) = (p(a), p(b));
    for i in 0..3 { let o = a.get(i).unwrap_or(&0).cmp(b.get(i).unwrap_or(&0)); if o != std::cmp::Ordering::Equal { return o; } }
    std::cmp::Ordering::Equal
}
// pasta da interface baixada que está valendo (só se for mais nova que a que veio no app)
fn web_ativa() -> Option<(String, std::path::PathBuf)> {
    let base = WEB_DIR.get()?;
    let v = std::fs::read_to_string(base.join("atual.txt")).ok()?.trim().to_string();
    if v.is_empty() || v.contains('/') || v.contains('\\') || v.contains("..") { return None; }
    if cmp_versao(&v, env!("CARGO_PKG_VERSION")) != std::cmp::Ordering::Greater { return None; }
    let d = base.join(&v);
    if d.is_dir() { Some((v, d)) } else { None }
}

struct AtlasAssets<R: tauri::Runtime> { base: Box<dyn tauri::Assets<R>> }
impl<R: tauri::Runtime> tauri::Assets<R> for AtlasAssets<R> {
    fn setup(&self, app: &tauri::App<R>) { self.base.setup(app) }
    fn get(&self, key: &tauri::utils::assets::AssetKey) -> Option<std::borrow::Cow<'_, [u8]>> {
        if let Some((_, d)) = web_ativa() {
            let rel = key.as_ref().trim_start_matches('/');
            if !rel.is_empty() && !rel.contains("..") {
                if let Ok(b) = std::fs::read(d.join(rel)) { return Some(std::borrow::Cow::Owned(b)); }
            }
        }
        self.base.get(key)
    }
    fn iter(&self) -> Box<tauri::utils::assets::AssetsIter<'_>> { self.base.iter() }
    fn csp_hashes(&self, k: &tauri::utils::assets::AssetKey) -> Box<dyn Iterator<Item = tauri::utils::assets::CspHash<'_>> + '_> { self.base.csp_hashes(k) }
}
struct Vazio;
impl<R: tauri::Runtime> tauri::Assets<R> for Vazio {
    fn get(&self, _: &tauri::utils::assets::AssetKey) -> Option<std::borrow::Cow<'_, [u8]>> { None }
    fn iter(&self) -> Box<tauri::utils::assets::AssetsIter<'_>> { Box::new(std::iter::empty()) }
    fn csp_hashes(&self, _: &tauri::utils::assets::AssetKey) -> Box<dyn Iterator<Item = tauri::utils::assets::CspHash<'_>> + '_> { Box::new(std::iter::empty()) }
}

// versões: a nativa (do app instalado), a da interface que está valendo e o número da parte nativa
#[tauri::command]
fn web_versao() -> (String, String, u32) {
    let app = env!("CARGO_PKG_VERSION").to_string();
    let web = web_ativa().map(|(v, _)| v).unwrap_or_else(|| app.clone());
    (app, web, NATIVO)
}
// a interface abriu bem: tira a marca de "em teste"
#[tauri::command]
fn web_ok() { if let Some(b) = WEB_DIR.get() { let _ = std::fs::remove_file(b.join("pendente.txt")); } }
// volta para a interface que veio no app
#[tauri::command]
fn web_voltar() { if let Some(b) = WEB_DIR.get() { let _ = std::fs::remove_file(b.join("atual.txt")); let _ = std::fs::remove_file(b.join("pendente.txt")); } }

// baixa a interface de uma versão: lê a lista de arquivos (web.json do Release, com o hash de cada arquivo) e
// baixa só os que mudaram em relação à que está valendo; os outros são copiados ou continuam vindo de dentro do app
#[tauri::command]
async fn web_atualizar(versao: String) -> Result<u32, String> {
    let base = WEB_DIR.get().ok_or("pasta do app indisponível")?.clone();
    if versao.is_empty() || !versao.chars().all(|c| c.is_ascii_digit() || c == '.') { return Err("versão inválida".into()); }
    if cmp_versao(&versao, env!("CARGO_PKG_VERSION")) != std::cmp::Ordering::Greater { return Ok(0); }
    let cli = reqwest::Client::new();
    let lista_url = format!("https://github.com/Yamavaki/Atlas/releases/download/v{versao}/web.json");
    let r = cli.get(&lista_url).send().await.map_err(|e| format!("sem conexão: {e}"))?;
    if !r.status().is_success() { return Err(format!("lista da versão {versao}: {}", r.status())); }
    let novo: serde_json::Value = serde_json::from_slice(&r.bytes().await.map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    let nat = novo.get("nativo").and_then(|x| x.as_u64()).unwrap_or(1) as u32;
    if nat > NATIVO { return Err(format!("APP_NOVO:{nat}")); }
    let arqs = novo.get("arquivos").and_then(|x| x.as_object()).ok_or("lista sem arquivos")?;
    // lista da que vale agora: a baixada, ou a que veio no app (web.json embutido)
    let atual: serde_json::Value = match web_ativa() {
        Some((_, d)) => std::fs::read(d.join("web.json")).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or(serde_json::Value::Null),
        None => serde_json::Value::Null,
    };
    let embut: serde_json::Value = serde_json::from_str(include_str!("../../app/web.json")).unwrap_or(serde_json::Value::Null);
    let velho = if atual.is_null() { &embut } else { &atual };
    let ant = web_ativa().map(|(_, d)| d);
    let dest = base.join(format!("{versao}.tmp"));
    let _ = std::fs::remove_dir_all(&dest);
    std::fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
    let mut baixados = 0u32;
    for (rel, h) in arqs {
        if rel.contains("..") || rel.starts_with('/') || rel.contains('\\') { continue; }
        let h = h.as_str().unwrap_or("");
        let igual_embut = embut.pointer(&format!("/arquivos/{}", rel.replace('~', "~0").replace('/', "~1"))).and_then(|x| x.as_str()) == Some(h);
        let igual_velho = velho.pointer(&format!("/arquivos/{}", rel.replace('~', "~0").replace('/', "~1"))).and_then(|x| x.as_str()) == Some(h);
        let alvo = dest.join(rel);
        if let Some(p) = alvo.parent() { std::fs::create_dir_all(p).map_err(|e| e.to_string())?; }
        if igual_embut { continue; } // vem de dentro do app
        if igual_velho { if let Some(a) = &ant { if std::fs::copy(a.join(rel), &alvo).is_ok() { continue; } } }
        let url = format!("https://raw.githubusercontent.com/Yamavaki/Atlas/v{versao}/app/{rel}");
        let r = cli.get(&url).send().await.map_err(|e| format!("{rel}: {e}"))?;
        if !r.status().is_success() { return Err(format!("{rel}: {}", r.status())); }
        let b = r.bytes().await.map_err(|e| format!("{rel}: {e}"))?;
        std::fs::write(&alvo, &b).map_err(|e| e.to_string())?;
        baixados += 1;
    }
    std::fs::write(dest.join("web.json"), serde_json::to_vec(&novo).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    let fim = base.join(&versao);
    let _ = std::fs::remove_dir_all(&fim);
    std::fs::rename(&dest, &fim).map_err(|e| e.to_string())?;
    std::fs::write(base.join("pendente.txt"), "0").map_err(|e| e.to_string())?;
    std::fs::write(base.join("atual.txt"), &versao).map_err(|e| e.to_string())?;
    // limpa versões velhas baixadas
    if let Ok(rd) = std::fs::read_dir(&base) { for e in rd.flatten() { let n = e.file_name().to_string_lossy().to_string(); if e.path().is_dir() && n != versao { let _ = std::fs::remove_dir_all(e.path()); } } }
    Ok(baixados)
}

// ---------- Google Drive: login pelo navegador do sistema (o Google não permite login dentro do app) ----------
// Abre o login no navegador e espera a volta num endereço local (127.0.0.1) por até 5 minutos.
fn codifica(s: &str) -> String {
    s.bytes().map(|b| match b { b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => (b as char).to_string(), _ => format!("%{:02X}", b) }).collect()
}
fn decodifica(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            if let Ok(v) = u8::from_str_radix(&s[i + 1..i + 3], 16) { out.push(v); i += 3; continue; }
        }
        out.push(if b[i] == b'+' { b' ' } else { b[i] });
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}
fn pagina(titulo: &str, texto: &str) -> String {
    let corpo = format!("<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><title>Atlas</title></head><body style=\"margin:0;min-height:100vh;display:grid;place-items:center;background:#0F0D0A;color:#EDE3CC;font-family:Segoe UI,system-ui,sans-serif\"><div style=\"text-align:center;max-width:420px;padding:24px\"><div style=\"font-size:30px;color:#D4A64A;margin-bottom:8px\">Atlas</div><h1 style=\"font-weight:500;font-size:22px;margin:0 0 8px\">{titulo}</h1><p style=\"color:#B3A486;margin:0\">{texto}</p></div></body></html>");
    format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", corpo.len(), corpo)
}
fn espera_volta(ouvinte: std::net::TcpListener) -> Result<(String, String), String> {
    use std::io::Read;
    ouvinte.set_nonblocking(true).map_err(|e| e.to_string())?;
    let fim = std::time::Instant::now() + std::time::Duration::from_secs(300);
    loop {
        match ouvinte.accept() {
            Ok((mut s, _)) => {
                let _ = s.set_nonblocking(false);
                let _ = s.set_read_timeout(Some(std::time::Duration::from_secs(5)));
                let mut buf = [0u8; 8192];
                let n = s.read(&mut buf).unwrap_or(0);
                let req = String::from_utf8_lossy(&buf[..n]).into_owned();
                let alvo = req.lines().next().unwrap_or("").split_whitespace().nth(1).unwrap_or("/").to_string();
                let consulta = alvo.splitn(2, '?').nth(1).unwrap_or("").to_string();
                let mut codigo = String::new();
                let mut estado = String::new();
                let mut erro = String::new();
                for par in consulta.split('&') {
                    let mut kv = par.splitn(2, '=');
                    let k = kv.next().unwrap_or("");
                    let v = decodifica(kv.next().unwrap_or(""));
                    match k { "code" => codigo = v, "state" => estado = v, "error" => erro = v, _ => {} }
                }
                if codigo.is_empty() && erro.is_empty() {
                    let _ = s.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                    continue;
                }
                if !erro.is_empty() {
                    let _ = s.write_all(pagina("Login cancelado", "Nenhuma permissão foi concedida. Você pode fechar esta aba e voltar ao Atlas.").as_bytes());
                    return Err(if erro == "access_denied" { "O acesso ao Google Drive não foi autorizado.".into() } else { format!("O Google recusou o login ({erro}).") });
                }
                let _ = s.write_all(pagina("Conta conectada", "Pronto. Você pode fechar esta aba e voltar ao Atlas.").as_bytes());
                return Ok((codigo, estado));
            }
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                if std::time::Instant::now() > fim { return Err("O login não foi concluído em 5 minutos. Tente de novo.".into()); }
                std::thread::sleep(std::time::Duration::from_millis(150));
            }
            Err(e) => return Err(e.to_string()),
        }
    }
}
#[tauri::command]
async fn google_entrar(app: tauri::AppHandle, base: String) -> Result<(String, String, String), String> {
    if !base.starts_with("https://accounts.google.com/o/oauth2/v2/auth?") {
        return Err("Endereço de login inválido.".into());
    }
    let ouvinte = std::net::TcpListener::bind("127.0.0.1:0").map_err(|e| format!("Não foi possível preparar o login: {e}"))?;
    let porta = ouvinte.local_addr().map_err(|e| e.to_string())?.port();
    let volta = format!("http://127.0.0.1:{porta}");
    let url = format!("{base}&redirect_uri={}", codifica(&volta));
    {
        use tauri_plugin_opener::OpenerExt;
        app.opener().open_url(url, None::<&str>).map_err(|e| format!("Não foi possível abrir o navegador: {e}"))?;
    }
    let (codigo, estado) = tauri::async_runtime::spawn_blocking(move || espera_volta(ouvinte)).await.map_err(|e| e.to_string())??;
    Ok((codigo, estado, volta))
}
// 1.51.3: login no Android. O navegador volta para "com.yamavaki.atlas:/oauth2redirect?code=..." (cliente do
// tipo Android no Google Cloud, com esquema de URI personalizado). A MainActivity recebe essa volta e grava o
// endereço em atlas-oauth.txt nas pastas do app; aqui esperamos esse arquivo aparecer (até 5 minutos).
#[tauri::command]
async fn google_entrar_android(app: tauri::AppHandle, base: String) -> Result<(String, String, String), String> {
    use tauri::Manager;
    if !base.starts_with("https://accounts.google.com/o/oauth2/v2/auth?") { return Err("Endereço de login inválido.".into()); }
    let volta = "com.yamavaki.atlas:/oauth2redirect".to_string();
    let p = app.path();
    let mut lugares: Vec<std::path::PathBuf> = vec![];
    for d in [p.app_data_dir(), p.app_local_data_dir(), p.app_cache_dir(), p.app_config_dir()].into_iter().flatten() {
        lugares.push(d.join("atlas-oauth.txt"));
        if let Some(pai) = d.parent() { lugares.push(pai.join("atlas-oauth.txt")); lugares.push(pai.join("files").join("atlas-oauth.txt")); }
    }
    lugares.push(std::path::PathBuf::from("/data/data/com.yamavaki.atlas/files/atlas-oauth.txt"));
    for l in &lugares { let _ = std::fs::remove_file(l); }
    let url = format!("{base}&redirect_uri={}", codifica(&volta));
    {
        use tauri_plugin_opener::OpenerExt;
        app.opener().open_url(url, None::<&str>).map_err(|e| format!("Não foi possível abrir o navegador: {e}"))?;
    }
    for _ in 0..600 {
        tokio_espera(500).await;
        for l in &lugares {
            if let Ok(t) = std::fs::read_to_string(l) {
                let _ = std::fs::remove_file(l);
                let q = t.splitn(2, '?').nth(1).unwrap_or("");
                let mut codigo = String::new(); let mut estado = String::new(); let mut erro = String::new();
                for par in q.split('&') {
                    let mut kv = par.splitn(2, '=');
                    let (k, v) = (kv.next().unwrap_or(""), decodifica(kv.next().unwrap_or("")));
                    match k { "code" => codigo = v, "state" => estado = v, "error" => erro = v, _ => {} }
                }
                if !erro.is_empty() { return Err(if erro == "access_denied" { "O acesso ao Drive não foi permitido.".into() } else { format!("O Google recusou o login ({erro}).") }); }
                if codigo.is_empty() { return Err("O login voltou sem o código. Tente de novo.".into()); }
                return Ok((codigo, estado, volta));
            }
        }
    }
    Err("O login demorou demais. Tente de novo.".into())
}
async fn tokio_espera(ms: u64) { let _ = tauri::async_runtime::spawn_blocking(move || std::thread::sleep(std::time::Duration::from_millis(ms))).await; }
// troca o código pelo token e renova o token (feito aqui para não depender das regras de CORS do Google)
#[tauri::command]
async fn google_token(campos: Vec<(String, String)>) -> Result<String, String> {
    let cliente = reqwest::Client::new();
    let resp = cliente.post("https://oauth2.googleapis.com/token").form(&campos).send().await.map_err(|e| format!("Sem conexão com o Google: {e}"))?;
    resp.text().await.map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut ctx = tauri::generate_context!();
    let base = ctx.set_assets(Box::new(Vazio));
    ctx.set_assets(Box::new(AtlasAssets { base }));
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;
            if let Ok(d) = app.path().app_data_dir() {
                let w = d.join("web");
                let _ = std::fs::create_dir_all(&w);
                // interface baixada que já falhou em abrir uma vez sem confirmar: desliga e volta à do app
                let p = w.join("pendente.txt");
                if let Ok(n) = std::fs::read_to_string(&p) {
                    if n.trim().parse::<u32>().unwrap_or(0) >= 1 { let _ = std::fs::remove_file(w.join("atual.txt")); let _ = std::fs::remove_file(&p); }
                    else { let _ = std::fs::write(&p, "1"); }
                }
                let _ = WEB_DIR.set(w);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![atualizar, google_entrar, google_entrar_android, google_token, web_versao, web_ok, web_voltar, web_atualizar])
        .run(ctx)
        .expect("não foi possível abrir o Atlas");
}
