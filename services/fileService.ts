import mammoth from 'mammoth';
import { FileData } from '../types';

export const parseFile = async (file: File): Promise<FileData> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve({
            inlineData: {
              data: base64Data,
              mimeType: 'application/pdf'
            }
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX handling using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve({
          text: result.value // The raw text
        });
      } else if (file.type === 'text/plain') {
         const text = await file.text();
         resolve({ text });
      } else {
        // Fallback for images or other types supported by Gemini directly
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve({
             inlineData: {
               data: base64Data,
               mimeType: file.type
             }
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    } catch (e) {
      reject(e);
    }
  });
};
