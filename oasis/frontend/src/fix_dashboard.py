import os

file_path = r"c:\Users\Administrador\Downloads\oasis\oasis\frontend\src\components\MyResponsesDashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 1. We need to delete the old currentPatterns block which starts around line 769
# Let's find the first occurrence of "const currentPatterns = useMemo"
first_idx = -1
for i, line in enumerate(lines):
    if "const currentPatterns = useMemo" in line:
        first_idx = i
        break

if first_idx != -1:
    # Find the end of activePattern which follows currentPatterns
    end_idx = -1
    for i in range(first_idx, min(first_idx + 30, len(lines))):
        if "    }, [currentPatterns, selectedPatternId]);" in lines[i]:
            end_idx = i
            break
    
    if end_idx != -1:
        print(f"Deleting lines {first_idx} to {end_idx}")
        del lines[first_idx:end_idx+1]
    else:
        print("Could not find end of activePattern block.")

# 2. Fix the missing nodeChallenges line that the AI tool accidentally deleted around line 864
# We need to find "const saved = localStorage.getItem(`oasis_node_challenges_${user}`);"
challenge_idx = -1
for i, line in enumerate(lines):
    if "const saved = localStorage.getItem(`oasis_node_challenges_${user}`);" in line:
        challenge_idx = i
        break

if challenge_idx != -1:
    # Check if the line before it is the try block
    if "try {" in lines[challenge_idx - 1]:
        # Check if the line before try is missing the useState declaration
        if "useState(() => {" not in lines[challenge_idx - 2]:
            print(f"Inserting nodeChallenges useState at line {challenge_idx - 1}")
            lines.insert(challenge_idx - 1, "    const [nodeChallenges, setNodeChallenges] = useState(() => {\n")

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)
