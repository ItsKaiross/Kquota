use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;

struct BackendProcess(Mutex<Option<CommandChild>>);

fn spawn_backend(app: &tauri::App) -> Option<CommandChild> {
    // The backend ships as a self-contained PyInstaller binary registered as a
    // Tauri sidecar (see externalBin in tauri.conf.json), so no system Python
    // or venv is required on the end user's machine.
    let (_rx, child) = app
        .shell()
        .sidecar("kquota-backend")
        .map_err(|e| log::error!("failed to resolve backend sidecar: {e}"))
        .ok()?
        .spawn()
        .map_err(|e| log::error!("failed to spawn backend: {e}"))
        .ok()?;

    Some(child)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .on_window_event(|window, event| {
            if !window.label().starts_with("usage-") {
                return;
            }

            if let tauri::WindowEvent::Moved(position) = event {
                let Ok(Some(monitor)) = window.current_monitor() else { return };
                let Ok(size) = window.outer_size() else { return };
                let area = monitor.work_area();
                let scale = monitor.scale_factor();
                let gap = (10.0 * scale).round() as i32;
                let threshold = (72.0 * scale).round() as i32;
                let left = area.position.x;
                let top = area.position.y;
                let right = left + area.size.width as i32 - size.width as i32;
                let bottom = top + area.size.height as i32 - size.height as i32;
                let mut target = *position;

                // The top edge behaves like a Dynamic Island and centers the card.
                if (position.y - top).abs() <= threshold {
                    target.y = top + gap;
                    target.x = left + (area.size.width as i32 - size.width as i32) / 2;
                } else if (position.x - right).abs() <= threshold {
                    target.x = right - gap;
                    target.y = position.y.clamp(top + gap, bottom - gap);
                } else if (position.x - left).abs() <= threshold {
                    target.x = left + gap;
                    target.y = position.y.clamp(top + gap, bottom - gap);
                }

                if target != *position {
                    let _ = window.set_position(target);
                }
            }
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let child = spawn_backend(app);
            app.manage(BackendProcess(Mutex::new(child)));

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<BackendProcess>() {
                    if let Some(child) = state.0.lock().unwrap().take() {
                        let _ = child.kill();
                    }
                }
            }
        });
}
