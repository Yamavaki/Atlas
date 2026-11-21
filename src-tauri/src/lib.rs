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
// troca o código pelo token e renova o token (feito aqui para não depender das regras de CORS do Google)
#[tauri::command]
async fn google_token(campos: Vec<(String, String)>) -> Result<String, String> {
    let cliente = reqwest::Client::new();
    let resp = cliente.post("https://oauth2.googleapis.com/token").form(&campos).send().await.map_err(|e| format!("Sem conexão com o Google: {e}"))?;
    resp.text().await.map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![atualizar, google_entrar, google_token])
        .run(tauri::generate_context!())
        .expect("não foi possível abrir o Atlas");
}
