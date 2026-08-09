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

# REGEX EXPLANATION:
# (?:\b|\s)        -> Starts at a word boundary or whitespace
# (\d\s*\d(?:\s*\.\s*\d+)?) -> Captures '0 1', '01', or sub-questions like '0 1 . 1' or '01.1'
# (?!\s*2\b)       -> NEGATIVE LOOKAHEAD: Ensures '0 1' is NOT immediately followed by '2' (skips grids)
# (?=\s+[A-Z\.\d]) -> POSITIVE LOOKAHEAD: Ensures it's followed by a dot or sentence text
pattern = r'((?:\b|\s)\d\s*\d(?:\s*\.\s*\d+)?(?!\s*2\b)(?=\s+[A-Z\.\d]))'

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
        match = re.match(r'^(\d\s*\d(?:\s*\.\s*\d+)?)', item_clean)
        q_identifier = re.sub(r'\s+', '', match.group(1)) if match else ""
        
        # Extract marks if present at the end [X mark(s)]
        marks_match = re.search(r'\[(\d+)\s*marks?\]', item_clean, re.IGNORECASE)
        marks = marks_match.group(1) if marks_match else None
        
        
        returnLst.append({
            "question": q_identifier,
            "marks": marks,
            "content": item_clean
        })
        for i in returnLst:
            print(i)

        



#marks
marksLst = []
with io.BytesIO(marksPDF.content) as stream:
   with pdfplumber.open(stream) as pdf:
        marksLst = [i.extract_table() for i in pdf.pages if i.extract_table is not None]

marksStr = str(marksLst)
#tidy the new string
marksStr = (
    marksStr
    .replace('None','')
    .replace('[', '')
    .replace(']', '')
    .replace("'", '')
    .replace(r'\n', ' ')  
    .replace('\n', ' ')  
)
markLst = re.split(r'(\b\d{2},\s*\d\b)', marksStr) #regex pattern
markLst.pop(0)


i=0
while i < len(markLst)-1:
    if re.match(r'\b\d{2},\s*\d\b', markLst[i]):
        markLst[i] = markLst[i]+markLst[i+1]
        markLst.pop(i+1)
        i+=1
    else:
       i+=1

formattedMarkLst = []
for i in markLst:
   formattedMarkLst.append({'question':i[:6],
                            'content':i[6:-3],
                            'marks':i[-3:]
                            })
