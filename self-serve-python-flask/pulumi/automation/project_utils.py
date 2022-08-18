import os
import subprocess

def prep_workspace(project_dir: str, language: str):
  if language == "python":
    prep_python_workspace(project_dir, language)

def prep_python_workspace(project_dir: str, language: str):
  print("preparing virtual environment...")
  subprocess.run(["python3", "-m", "venv", "venv"], check=True, cwd=project_dir, capture_output=True)
  subprocess.run([os.path.join("venv", "bin", "python3"), "-m", "pip", "install", "--upgrade", "pip"],
              check=True, cwd=project_dir, capture_output=True)
  subprocess.run([os.path.join("venv", "bin", "pip"), "install", "-r", "requirements.txt"],
              check=True, cwd=project_dir, capture_output=True)
  print("virtual environment is ready!")


  def get_subfolders(base_dir: str):
    subfolders = [ f.path for f in os.scandir(base_dir) if f.is_dir() ]
    return(subfolders)

  def get_project_dirs(base_dir: str):
    # Get all directories under base_dir
    subfolders = get_subfolders(base_dir)
    # Identify project folders by the existence of the Pulumi.yaml file
    workspaces = []
    for folder in subfolders:
      workspace_folder = base_dir + "/" + folder
      if (os.path.isfile(workspace_folder+"/Pulumi.yaml")):
        workspaces.append(workspace_folder)
    return(workspaces)

    
