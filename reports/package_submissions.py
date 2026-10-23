import os
import sys
import zipfile

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")
OUTPUT_DIR = os.path.join(ROOT_DIR, "submissions")

os.makedirs(OUTPUT_DIR, exist_ok=True)

SUBJECTS = [
    {
        "code": "FLAT",
        "name": "Formal Languages & Automata Theory",
        "report_md": "FLAT_MicroProject_Report.md",
        "report_pdf": "FLAT_MicroProject_Report.pdf"
    },
    {
        "code": "COA",
        "name": "Computer Organization & Architecture",
        "report_md": "COA_MicroProject_Report.md",
        "report_pdf": "COA_MicroProject_Report.pdf"
    },
    {
        "code": "DAA",
        "name": "Design & Analysis of Algorithms",
        "report_md": "DAA_MicroProject_Report.md",
        "report_pdf": "DAA_MicroProject_Report.pdf"
    }
]

EXCLUDE_DIRS = {"node_modules", ".git", ".gemini", "submissions", "reports"}
EXCLUDE_EXTS = {".zip"}

def should_exclude(rel_path):
    parts = rel_path.replace("\\", "/").split("/")
    for p in parts:
        if p in EXCLUDE_DIRS:
            return True
    _, ext = os.path.splitext(rel_path)
    if ext in EXCLUDE_EXTS:
        return True
    return False

def create_subject_zip(student_name, subject_info):
    sub_code = subject_info["code"]
    zip_filename = f"{student_name}_{sub_code}_MicroProject.zip"
    zip_filepath = os.path.join(OUTPUT_DIR, zip_filename)
    
    print(f"\nCreating submission package: {zip_filename} ...")
    
    with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 1. Add this subject's report prominently at root and inside reports/
        report_md_path = os.path.join(REPORTS_DIR, subject_info["report_md"])
        report_pdf_path = os.path.join(REPORTS_DIR, subject_info["report_pdf"])
        
        if os.path.exists(report_md_path):
            zipf.write(report_md_path, arcname=f"PROJECT_REPORT_{sub_code}.md")
            zipf.write(report_md_path, arcname=f"reports/{subject_info['report_md']}")
            
        if os.path.exists(report_pdf_path):
            zipf.write(report_pdf_path, arcname=f"PROJECT_REPORT_{sub_code}.pdf")
            zipf.write(report_pdf_path, arcname=f"reports/{subject_info['report_pdf']}")
        
        # 2. Add all source project files (excluding node_modules, .git, etc.)
        for root, dirs, files in os.walk(ROOT_DIR):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, ROOT_DIR)
                
                if should_exclude(rel_path):
                    continue
                
                zipf.write(full_path, arcname=rel_path)
                
    file_size_mb = os.path.getsize(zip_filepath) / (1024 * 1024)
    print(f"Created: {zip_filepath} ({file_size_mb:.2f} MB)")
    return zip_filepath

if __name__ == "__main__":
    student_name = sys.argv[1] if len(sys.argv) > 1 else "Ashik_Ameen"
    print(f"Packaging submissions for Student: '{student_name}'")
    
    for sub in SUBJECTS:
        create_subject_zip(student_name, sub)
        
    print("\nAll subject packages created successfully in submissions/ folder!")
