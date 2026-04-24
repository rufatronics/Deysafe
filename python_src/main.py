import flet as ft
import os
import shutil
import threading

class ModelProvider:
    """
    Singleton Model Loader for 2GB RAM devices.
    Ensures only one model is in RAM at a time.
    Moves models from read-only APK assets to internal filesDir for mmap support.
    """
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelProvider, cls).__new__(cls)
                cls._instance.current_model = None
                cls._instance.internal_path = "/data/user/0/com.deysafe.ai/files/models"
                cls._instance.assets_path = "assets/models"
                os.makedirs(cls._instance.internal_path, exist_ok=True)
        return cls._instance

    def prepare_models(self):
        """Prepare models for mmap by copying to internal storage."""
        models = ["bonsai_1.7b_1bit.gguf", "crop_doctor.tflite", "health_scan.tflite"]
        for m in models:
            src = os.path.join(self.assets_path, m)
            dst = os.path.join(self.internal_path, m)
            if not os.path.exists(dst) and os.path.exists(src):
                shutil.copy2(src, dst)

    def load_model(self, model_name):
        """Load a specific model, unloading previous one first."""
        if self.current_model == model_name:
            return True
        
        # Explicitly clear previous model (simulated)
        self.current_model = None
        ft.app.page.clean() # Force garbage collection trigger if needed
        
        # Load logic for 1-bit kernels or TFLite
        path = os.path.join(self.internal_path, model_name)
        print(f"Loading {model_name} from {path}...")
        self.current_model = model_name
        return True

def main(page: ft.Page):
    page.title = "Deysafe AI"
    page.theme_mode = ft.ThemeMode.DARK
    page.padding = 20
    page.window_width = 390
    page.window_height = 844

    provider = ModelProvider()
    provider.prepare_models()

    def navigate(e):
        pillar = e.control.data
        if pillar == "farm":
            provider.load_model("crop_doctor.tflite")
            print("Pillar: Check My Farm loaded")
        elif pillar == "body":
            provider.load_model("health_scan.tflite")
            print("Pillar: Check My Body loaded")
        elif pillar == "ask":
            provider.load_model("bonsai_1.7b_1bit.gguf")
            print("Pillar: Ask AI loaded")

    # PIDGIN UI Dashboard
    page.add(
        ft.Column([
            ft.Text("Deysafe AI", size=32, weight="bold", color="green"),
            ft.Text("Your Offline Intelligence Suite", size=14, color="grey"),
            ft.Divider(),
            
            # 4-Pillar Grid
            ft.ResponsiveRow([
                ft.Container(
                    content=ft.Column([
                        ft.Icon(ft.icons.AGRICULTURE, size=40),
                        ft.Text("Check My Farm", weight="bold"),
                        ft.Text("Crop Doctor", size=10)
                    ], horizontal_alignment="center"),
                    bgcolor=ft.colors.GREEN_900,
                    padding=20,
                    border_radius=10,
                    col={"xs": 6},
                    on_click=navigate,
                    data="farm"
                ),
                ft.Container(
                    content=ft.Column([
                        ft.Icon(ft.icons.HEALTH_AND_SAFETY, size=40),
                        ft.Text("Check My Body", weight="bold"),
                        ft.Text("Health Scan", size=10)
                    ], horizontal_alignment="center"),
                    bgcolor=ft.colors.BLUE_900,
                    padding=20,
                    border_radius=10,
                    col={"xs": 6},
                    on_click=navigate,
                    data="body"
                ),
                ft.Container(
                    content=ft.Column([
                        ft.Icon(ft.icons.CHAT_BUBBLE, size=40),
                        ft.Text("Ask AI", weight="bold"),
                        ft.Text("Reasoning", size=10)
                    ], horizontal_alignment="center"),
                    bgcolor=ft.colors.ORANGE_900,
                    padding=20,
                    border_radius=10,
                    col={"xs": 6},
                    on_click=navigate,
                    data="ask"
                ),
                ft.Container(
                    content=ft.Column([
                        ft.Icon(ft.icons.MAP, size=40),
                        ft.Text("Security Map", weight="bold"),
                        ft.Text("Local Intelligence", size=10)
                    ], horizontal_alignment="center"),
                    bgcolor=ft.colors.RED_900,
                    padding=20,
                    border_radius=10,
                    col={"xs": 6},
                    on_click=navigate,
                    data="security"
                ),
            ], spacing=20),
            
            ft.VerticalDivider(height=40),
            ft.Container(
                content=ft.Text("Deysafe AI dey work for you, offline and secure.", italic=True, size=12),
                alignment=ft.alignment.center
            )
        ])
    )

if __name__ == "__main__":
    ft.app(target=main)
