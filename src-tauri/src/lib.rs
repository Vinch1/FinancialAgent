use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Spawn the backend sidecar
            let shell = app.shell();
            let sidecar_command = shell.sidecar("docsearch-backend").unwrap();

            let (mut _rx, _child) = sidecar_command.spawn().expect("Failed to spawn backend sidecar");

            log::info!("Backend sidecar started successfully");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
