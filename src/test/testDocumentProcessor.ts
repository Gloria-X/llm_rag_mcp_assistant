import { DocumentProcessor } from "../DocumentProcessor";

async function testDocumentProcessor() {
  // const currentDir = process.cwd();
  // const filePath = `${currentDir}\\RAG.md`;
  const filePath = `C:\\code\\xsy\\llm_rag_mcp_assistant\\实训管理平台_paragraphs.md`;
  // const filePath = `C:\\code\\xsy\\software_design_engineer\\ProgrammingLanguages.md`;

  const processor = new DocumentProcessor();

  try {
    const result = await processor.processDocument(filePath);

    console.log(
      `documentId: ${result.documentId}`,
      `segmentCount: ${result.segmentCount}`,
      `totalWords: ${result.totalWords}`
    );
  } catch (error) {
    console.error("processTextDocument error:", error);
  }
}

export { testDocumentProcessor };
