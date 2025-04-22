import { processTextDocument } from '../DocumentProcessor';

async function testDocumentProcessor() {
  const currentDir = process.cwd();
  const filePath = `${currentDir}\\ComputerOrganization.md`;

  try {
    await processTextDocument(filePath);
  } catch (error) {
    console.error('processTextDocument error:', error);
  }
}

export { testDocumentProcessor }

