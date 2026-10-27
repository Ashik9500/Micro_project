import os
import zipfile

ZIP_NAME = "AssemblyFlow_Project_Ashik_Ameen_2411021061030.zip"
EXCLUDED_DIRS = {
    "node_modules",
    ".git",
    ".gemini",
    "__pycache__",
    ".tempmediaStorage",
    ".system_generated",
    "screenshots",
    "reports"
}
EXCLUDED_FILES = {
    ".DS_Store",
    "Thumbs.db",
    ZIP_NAME,
    "package_submission.py"
}

def create_submission_zip():
    print(f"Creating submission package: {ZIP_NAME}...")
    with zipfile.ZipFile(ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
            for f in files:
                if f in EXCLUDED_FILES or f.endswith(".zip"):
                    continue
                file_path = os.path.join(root, f)
                arcname = os.path.relpath(file_path, ".")
                zipf.write(file_path, arcname)

    size = os.path.getsize(ZIP_NAME)
    size_kb = size / 1024
    size_mb = size / (1024 * 1024)
    print(f"Successfully created {ZIP_NAME}")
    print(f"Archive Size: {size_kb:.2f} KB ({size_mb:.2f} MB)")
    if size < 2 * 1024 * 1024:
        print("[SUCCESS] Package is strictly under the 2 MB submission limit!")
    else:
        print("[WARNING] Package exceeds 2 MB!")

if __name__ == "__main__":
    create_submission_zip()
