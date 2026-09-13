use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct BackendProcess(Mutex<Option<Child>>);

fn spawn_backend(app: &tauri::App) -> Option<Child> {
    // Dev-mode layout: src-tauri/../backend. Packaged builds will need a
    // bundled sidecar instead (Phase 11 packaging), tracked separately.
    let backend_dir = app
        .path()
        .resource_dir()
        .ok()
        .map(|p| p.join("backend"))
        .filter(|p| p.exists())
        .unwrap_or_else(|| {
            // `cargo run` (via `tauri dev`) has cwd = src-tauri/, so the repo's
            // backend/ lives one level up. CARGO_MANIFEST_DIR pins this to
            // src-tauri/ regardless of the actual invocation cwd.
            std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("..")
                .join("backend")
        });

    let python = if cfg!(windows) {
        backend_dir.join(".venv/Scripts/python.exe")
    } else {
        backend_dir.join(".venv/bin/python")
    };

    if !python.exists() {
        log::warn!("backend venv not found at {:?}; usage data will be unavailable", python);
        return None;
    }

    let mut command = Command::new(python);
    command.arg("main.py").current_dir(&backend_dir);

    #[cfg(windows)]
    {
        // python.exe is a console-subsystem program; without this flag,
        // Windows pops up a visible console window for it even though our
        // own app has none (windows_subsystem = "windows" in main.rs).
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command
        .spawn()
        .map_err(|e| log::error!("failed to spawn backend: {e}"))
        .ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
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
                    if let Some(mut child) = state.0.lock().unwrap().take() {
                        let _ = child.kill();
                    }
                }
            }
        });
}
