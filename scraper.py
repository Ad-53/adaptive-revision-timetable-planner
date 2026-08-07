import pdfplumber
import re
import requests
import io

paperPDF = requests.get('https://pmt.physicsandmathstutor.com/download/Computer-Science/A-level/Past-Papers/AQA/Paper-1/June%202017%20QP%20-%20Paper%201%20AQA%20Computer%20Science%20A-level.pdf')
marksPDF = requests.get('https://pmt.physicsandmathstutor.com/download/Computer-Science/A-level/Past-Papers/AQA/Paper-1/June%202017%20MS%20-%20Paper%201%20AQA%20Computer%20Science%20A-level.pdf')


with io.BytesIO(paperPDF.content) as stream:
  with pdfplumber.open(stream) as pdf:
    paperStr = ''
    for i in pdf.pages:
        paperStr += i.extract_text()

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


