import pdfplumber
import re
import requests
import io

paperPDF = requests.get('https://pmt.physicsandmathstutor.com/download/Computer-Science/A-level/Past-Papers/AQA/Paper-1/June%202017%20QP%20-%20Paper%201%20AQA%20Computer%20Science%20A-level.pdf')
marksPDF = requests.get('https://pmt.physicsandmathstutor.com/download/Computer-Science/A-level/Past-Papers/AQA/Paper-1/June%202017%20MS%20-%20Paper%201%20AQA%20Computer%20Science%20A-level.pdf')

#questions
with io.BytesIO(paperPDF.content) as stream:
    with pdfplumber.open(stream) as pdf:
        paperStr = ''
        for i in pdf.pages[1:]:
            paperStr += i.extract_text() + ' '  # Keep a space between pages

# Replace newlines with spaces so word boundaries remain intact
paperStr = paperStr.replace('\n', ' ')

# UPDATED REGEX EXPLANATION:
# (?:\b|\s)                        -> Starts at a word boundary or whitespace
# (0\s*[1-9]|1\s*[0-2])           -> Restricts main question numbers to 01-12 (with optional internal space)
# (?:\s*\.\s*\d+)?                 -> Optional sub-question dot and digits (e.g., .1 or . 1)
# (?!\s*2\b)                       -> Skips 2D grid headers where 0 1 is followed by 2
# (?=\s+[A-Z\.\d])                 -> Ensures followed by text, dot, or digit
pattern = r'((?:\b|\s)(?:0\s*[1-9]|1\s*[0-2])(?:\s*\.\s*\d+)?(?!\s*2\b)(?=\s+[A-Z\.\d]))'

paperLst = re.split(pattern, paperStr)

# Merge the matched question header with its following text block
i = 0
while i < len(paperLst) - 1:
    # Check if this token is a question header
    if re.match(pattern, paperLst[i]):
        paperLst[i] = paperLst[i].strip() + " " + paperLst[i + 1].strip()
        paperLst.pop(i + 1)
        i += 1
    else:
        i += 1

returnLst = []
for item in paperLst:
    item_clean = item.strip()
    if re.match(pattern, item_clean):
        # Extract normalized question identifier (e.g., '01' or '01.1')
        match = re.match(r'^((?:0\s*[1-9]|1\s*[0-2])(?:\s*\.\s*\d+)?)', item_clean)
        q_identifier = re.sub(r'\s+', '', match.group(1)) if match else ""
        
        # Extract marks if present at the end [X mark(s)]
        marks_match = re.search(r'\[(\d+)\s*marks?\]', item_clean, re.IGNORECASE)
        marks = marks_match.group(1) if marks_match else None
        
        returnLst.append({
            "question": q_identifier,
            "marks": marks,
            "content": item_clean,
            "answer": ''
        })


        



# 1. Extract tables and stringify
marksLst = []
with io.BytesIO(marksPDF.content) as stream:
    with pdfplumber.open(stream) as pdf:
        marksLst = [page.extract_tables() for page in pdf.pages if page.extract_tables()]

marksStr = str(marksLst)
marksStr = (
    marksStr
    .replace('None', '')
    .replace('[', '')
    .replace(']', '')
    .replace("'", '')
    .replace(r'\n', ' ')
    .replace('\n', ' ')
)

# 2. Regex specifically matching the "01, 1," header format from your output
entry_pattern = re.compile(r'(?:\b|^)(\d{2}),\s*(\d+),')

matches = list(entry_pattern.finditer(marksStr))
mark_dict = {}

# 3. Parse entries using match character offsets
for idx, match in enumerate(matches):
    main_q = match.group(1)  # e.g. "01"
    sub_q = match.group(2)   # e.g. "1"
    q_id = f"{main_q}.{sub_q}"
    
    start_pos = match.end()
    end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(marksStr)
    
    raw_block = marksStr[start_pos:end_pos].strip()
    
    # Clean trailing comma if present at the end of the text block
    if raw_block.endswith(','):
        raw_block = raw_block[:-1].strip()
    
    # Extract trailing mark digit (e.g. ", 3" at the end of "One mark per correct row, 3")
    marks_match = re.search(r',\s*(\d+)\s*$', raw_block)
    
    if marks_match:
        extracted_marks = int(marks_match.group(1))
        answer_text = raw_block[:marks_match.start()].strip()
    else:
        extracted_marks = None
        answer_text = raw_block
        
    mark_dict[q_id] = {
        "answer": answer_text,
        "marks": extracted_marks
    }

# 4. Map back to returnLst
for item in returnLst:
    q_key = item.get("question")  # e.g., "01.1", "02.1"
    
    if q_key in mark_dict:
        item["answer"] = mark_dict[q_key]["answer"]
        if item.get("marks") is None or item.get("marks") == '':
            item["marks"] = mark_dict[q_key]["marks"]
    else:
        item["answer"] = "Answer not found in scheme"

for i in returnLst:
    print(i)