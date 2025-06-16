import io
import tempfile
import easyocr
import ocrmypdf
import PyPDF2

class OCR:
    def __init__(self, lang="eng", lang_list=None):
        self.lang = lang
        if lang_list is None:
            lang_list = ['en']
        self.reader = easyocr.Reader(lang_list)

    def read(self, pdf_file_data):
        # Validate PDF
        if not isinstance(pdf_file_data, (bytes, bytearray)):
            raise ValueError("Input must be bytes or bytearray.")
        if pdf_file_data[:4] != b'%PDF':
            raise ValueError("File is not a valid PDF.")

        # Use ocrmypdf to OCR the PDF and extract text
        with tempfile.NamedTemporaryFile(suffix=".pdf") as input_pdf, \
             tempfile.NamedTemporaryFile(suffix=".pdf") as output_pdf:
            input_pdf.write(pdf_file_data)
            input_pdf.flush()
            ocrmypdf.ocr(input_pdf.name, output_pdf.name, language=self.lang, force_ocr=True, output_type="pdf")
            output_pdf.seek(0)
            # Optionally, extract text from the OCRed PDF
            reader = PyPDF2.PdfReader(output_pdf)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        return {"text": text}
