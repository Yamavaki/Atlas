// Atlas - casca do app: abre a pasta app/ numa janela com WebView2 (usa a placa de video)
// e liga os plugins de arquivos (pasta do mundo, artes do PC), dialogo (escolher pasta) e links.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("não foi possível abrir o Atlas");
}
