// Atlas - app de mesa (Windows). Sem console no Windows em modo release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    atlas_lib::run()
}
