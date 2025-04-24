import { processTextDocument } from '../DocumentProcessor';

async function testDocumentProcessor() {
  // const currentDir = process.cwd();
  // const filePath = `${currentDir}\\RAG.md`;
  const filePath = `C:\\Users\\Gloria_X\\Downloads\\hongloumeng\\partof-hongloumeng-utf8.txt`;
  // const filePath = `C:\\code\\xsy\\software_design_engineer\\ProgrammingLanguages.md`;


  try {
    await processTextDocument(filePath);
  } catch (error) {
    console.error('processTextDocument error:', error);
  }
}

export { testDocumentProcessor }

