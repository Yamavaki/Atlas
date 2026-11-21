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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![atualizar])
        .run(tauri::generate_context!())
        .expect("não foi possível abrir o Atlas");
}
