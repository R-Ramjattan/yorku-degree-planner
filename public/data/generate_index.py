import os
import json

DATA_DIR = os.path.dirname(__file__)
INDEX_PATH = os.path.join(DATA_DIR, 'index.json')

def main():
    # List all .json files in DATA_DIR, excluding index.json itself
    files = [
        f for f in os.listdir(DATA_DIR)
        if f.endswith('.json') and f.lower() != 'index.json'
    ]
    # Strip the .json extension and sort
    departments = sorted(f[:-5] for f in files)

    # Write out index.json
    with open(INDEX_PATH, 'w', encoding='utf-8') as fp:
        json.dump(departments, fp, indent=2)
    print(f"Generated {INDEX_PATH} with {len(departments)} entries.")

if __name__ == '__main__':
    main()
