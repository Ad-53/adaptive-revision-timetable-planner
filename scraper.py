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

with io.BytesIO(marksPDF.content) as stream:
  with pdfplumber.open(stream) as pdf:
    markStr = ''
    for i in pdf.pages:
        marksStr += i.extract_text()
